// UC-001: crea el esquema y carga el 100 % del dataset en una sola transacción.
import { readFile } from 'node:fs/promises';
import { interpretar } from './dataset.js';

const ESQUEMA = new URL('../db/esquema.sql', import.meta.url);

export class ErrorVerificacion extends Error {}

export async function cargar({ texto, fuente, pool }) {
  const inicio = Date.now();
  // Se interpreta y valida todo ANTES de abrir la transacción: si el CSV está mal, la base
  // ni se toca (flujo alterno 5a).
  const { filasFuente, departamentos, municipios } = interpretar(texto);

  const cliente = await pool.connect();
  try {
    await cliente.query(await readFile(ESQUEMA, 'utf8'));
    await cliente.query('BEGIN');
    // Reemplazar en vez de acumular hace el cargador repetible (FR-05).
    await cliente.query('TRUNCATE municipio, departamento');

    const deps = [...departamentos.entries()];
    await cliente.query(
      `INSERT INTO departamento (codigo, nombre)
       SELECT * FROM unnest($1::char(2)[], $2::text[])`,
      [deps.map(([c]) => c), deps.map(([, n]) => n)],
    );

    const col = (k) => municipios.map((m) => m[k]);
    await cliente.query(
      `INSERT INTO municipio
         (codigo, departamento_codigo, nombre, nombre_busqueda, tipo, longitud, latitud)
       SELECT * FROM unnest($1::char(5)[], $2::char(2)[], $3::text[], $4::text[], $5::text[],
                            $6::numeric[], $7::numeric[])`,
      [col('codigo'), col('departamento_codigo'), col('nombre'), col('nombre_busqueda'),
        col('tipo'), col('longitud'), col('latitud')],
    );

    const { rows: [conteo] } = await cliente.query(
      `SELECT (SELECT count(*) FROM departamento)::int AS departamentos,
              (SELECT count(*) FROM municipio)::int    AS municipios`,
    );
    // FR-04: si la base no tiene exactamente las filas de la fuente, no se confirma nada.
    if (conteo.municipios !== filasFuente || conteo.departamentos !== departamentos.size) {
      throw new ErrorVerificacion(
        `Conteos distintos: fuente ${filasFuente} municipios y ${departamentos.size} departamentos; ` +
          `base ${conteo.municipios} y ${conteo.departamentos}.`,
      );
    }

    const duracionMs = Date.now() - inicio;
    const { rows: [registro] } = await cliente.query(
      `INSERT INTO carga (fuente, filas_fuente, filas_cargadas, duracion_ms)
       VALUES ($1, $2, $3, $4) RETURNING id, cargado_en`,
      [fuente, filasFuente, conteo.municipios, duracionMs],
    );
    await cliente.query('COMMIT');

    return {
      carga: registro.id,
      cargadoEn: registro.cargado_en,
      filasFuente,
      departamentos: conteo.departamentos,
      municipios: conteo.municipios,
      duracionMs,
    };
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}
