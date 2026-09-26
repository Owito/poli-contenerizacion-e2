// FR-08: departamentos con su número de municipios.
import { consultar } from '../lib/db.js';
import { json, manejar } from '../lib/http.js';

export const GET = manejar(async () => {
  const departamentos = await consultar(
    `SELECT d.codigo, d.nombre, count(m.codigo)::int AS municipios
       FROM departamento d
       LEFT JOIN municipio m ON m.departamento_codigo = d.codigo
      GROUP BY d.codigo, d.nombre
      ORDER BY d.nombre`,
  );
  return json({ departamentos }, 200, 'public, s-maxage=300, stale-while-revalidate=600');
});
