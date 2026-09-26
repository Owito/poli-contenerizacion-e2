// FR-07: lo que hay en la base y cuándo se cargó.
import { consultar } from '../lib/db.js';
import { json, manejar } from '../lib/http.js';

export const GET = manejar(async () => {
  const [[totales], tipos, [ultimaCarga]] = await Promise.all([
    consultar(`SELECT (SELECT count(*) FROM departamento)::int AS departamentos,
                      (SELECT count(*) FROM municipio)::int    AS municipios`),
    consultar(`SELECT tipo, count(*)::int AS municipios
                 FROM municipio GROUP BY tipo ORDER BY municipios DESC, tipo`),
    consultar(`SELECT fuente, filas_fuente, filas_cargadas, duracion_ms, cargado_en
                 FROM carga ORDER BY id DESC LIMIT 1`),
  ]);
  return json({ ...totales, tipos, ultimaCarga: ultimaCarga ?? null }, 200,
    'public, s-maxage=300, stale-while-revalidate=600');
});
