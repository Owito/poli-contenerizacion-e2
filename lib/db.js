// Conexión a PostgreSQL (decisión D3). Un pool pequeño por instancia de la función: se
// reutiliza mientras la instancia siga viva y no guarda estado de la aplicación (NFR-01).
import pg from 'pg';

let pool;

export function obtenerPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Falta la variable de entorno DATABASE_URL.');
    pool = new pg.Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

export async function consultar(sql, parametros = []) {
  const { rows } = await obtenerPool().query(sql, parametros);
  return rows;
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
