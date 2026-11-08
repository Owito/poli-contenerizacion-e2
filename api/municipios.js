// FR-09: búsqueda por nombre, departamento y tipo, con paginación.
import { consultar } from '../lib/db.js';
import { ErrorEntrada, json, manejar } from '../lib/http.js';
import { normalizar } from '../lib/texto.js';

function entero(valor, porDefecto, min, max, nombre) {
  if (valor === null || valor === '') return porDefecto;
  if (!/^\d+$/.test(valor) || Number(valor) < min || Number(valor) > max) {
    throw new ErrorEntrada(`"${nombre}" debe ser un número entero entre ${min} y ${max}.`);
  }
  return Number(valor);
}

export function leerFiltros(url) {
  const p = new URL(url).searchParams;
  const q = normalizar(p.get('q') ?? '');
  if (q.length > 60) throw new ErrorEntrada('"q" admite máximo 60 caracteres.');
  const departamento = p.get('departamento') ?? '';
  if (departamento && !/^\d{2}$/.test(departamento)) {
    throw new ErrorEntrada('"departamento" debe ser un código de dos dígitos, por ejemplo 05.');
  }
  const tipo = (p.get('tipo') ?? '').trim();
  if (tipo.length > 60) throw new ErrorEntrada('"tipo" admite máximo 60 caracteres.');
  return {
    q,
    departamento,
    tipo,
    pagina: entero(p.get('pagina'), 1, 1, 10_000, 'pagina'),
    porPagina: entero(p.get('por_pagina'), 25, 1, 200, 'por_pagina'),
  };
}

export const GET = manejar(async (request) => {
  const f = leerFiltros(request.url);
  // Los comodines de LIKE que escriba el usuario se escapan: "%" busca un "%" literal.
  const q = f.q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const patron = `%${q}%`;
  // El código (ID principal) se busca por su inicio: "11001" encuentra un único municipio.
  const prefijoCodigo = `${q}%`;
  const filas = await consultar(
    `SELECT m.codigo, m.nombre, m.tipo, m.longitud::float AS longitud, m.latitud::float AS latitud,
            m.departamento_codigo, d.nombre AS departamento,
            count(*) OVER ()::int AS total
       FROM municipio m
       JOIN departamento d ON d.codigo = m.departamento_codigo
      WHERE ($1 = '' OR m.nombre_busqueda LIKE $2 OR m.codigo LIKE $7)
        AND ($3 = '' OR m.departamento_codigo = $3)
        AND ($4 = '' OR m.tipo = $4)
      ORDER BY d.nombre, m.nombre
      LIMIT $5 OFFSET $6`,
    [f.q, patron, f.departamento, f.tipo, f.porPagina, (f.pagina - 1) * f.porPagina, prefijoCodigo],
  );
  const total = filas[0]?.total ?? 0;
  const resultados = filas.map(({ total: _t, ...m }) => m);
  return json({ total, pagina: f.pagina, porPagina: f.porPagina, resultados }, 200,
    'public, s-maxage=60, stale-while-revalidate=300');
});
