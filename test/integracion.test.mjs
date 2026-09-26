// Criterios de aceptación de UC-001 y UC-002 contra un PostgreSQL real.
// Requiere DATABASE_URL apuntando a la base LOCAL (npm run db:local); sin ella se omite.
// ⚠ Vacía y recarga las tablas: nunca correrla contra la base en la nube.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const url = process.env.DATABASE_URL ?? '';
const esLocal = /@(127\.0\.0\.1|localhost):55432\//.test(url);
const FIXTURE = new URL('./fixtures/divipola-2026-09-26.csv', import.meta.url);

describe('integración con PostgreSQL local', { skip: !esLocal && 'DATABASE_URL no apunta a la base local (127.0.0.1:55432)' }, () => {
  let db;
  let cargar;
  let texto;
  const get = async (nombre, query = '') => {
    const { GET } = await import(`../api/${nombre}.js`);
    const r = await GET(new Request(`http://local/api/${nombre}${query}`));
    return { status: r.status, cuerpo: await r.json(), cache: r.headers.get('cache-control') };
  };

  before(async () => {
    db = await import('../lib/db.js');
    ({ cargar } = await import('../lib/cargador.js'));
    texto = await readFile(FIXTURE, 'utf8');
    await db.consultar('DROP TABLE IF EXISTS municipio, departamento, carga');
  });
  after(() => db.cerrarPool());

  test('UC-001 carga completa: 1122 municipios y carga registrada', async () => {
    const r = await cargar({ texto, fuente: 'prueba', pool: db.obtenerPool() });
    assert.equal(r.municipios, 1122);
    assert.equal(r.departamentos, 33);
    const [c] = await db.consultar('SELECT filas_fuente, filas_cargadas FROM carga ORDER BY id DESC LIMIT 1');
    assert.deepEqual(c, { filas_fuente: 1122, filas_cargadas: 1122 });
  });

  test('UC-001 carga repetida: no duplica', async () => {
    await cargar({ texto, fuente: 'prueba', pool: db.obtenerPool() });
    const [{ n }] = await db.consultar('SELECT count(*)::int AS n FROM municipio');
    assert.equal(n, 1122);
  });

  test('UC-001 fila inválida: error y la base conserva los datos previos', async () => {
    const roto = texto.replace(',05001,', ',,');
    await assert.rejects(cargar({ texto: roto, fuente: 'prueba', pool: db.obtenerPool() }), /código de municipio/);
    const [{ n }] = await db.consultar('SELECT count(*)::int AS n FROM municipio');
    assert.equal(n, 1122);
  });

  test('UC-002 búsqueda por nombre sin tildes encuentra MEDELLÍN (05001)', async () => {
    const { status, cuerpo } = await get('municipios', '?q=medell');
    assert.equal(status, 200);
    assert.ok(cuerpo.resultados.some((m) => m.codigo === '05001'));
  });

  test('UC-002 filtro por departamento: todos del 05 y total coherente', async () => {
    const { cuerpo } = await get('municipios', '?departamento=05&por_pagina=200');
    assert.ok(cuerpo.total > 0);
    assert.equal(cuerpo.resultados.length, cuerpo.total);
    assert.ok(cuerpo.resultados.every((m) => m.departamento_codigo === '05'));
  });

  test('UC-002 los comodines de LIKE se buscan literales', async () => {
    const { cuerpo } = await get('municipios', '?q=%25');
    assert.equal(cuerpo.total, 0);
  });

  test('UC-002 paginación: la página 2 no repite la 1', async () => {
    const p1 = (await get('municipios', '?por_pagina=10&pagina=1')).cuerpo.resultados.map((m) => m.codigo);
    const p2 = (await get('municipios', '?por_pagina=10&pagina=2')).cuerpo.resultados.map((m) => m.codigo);
    assert.equal(p1.length, 10);
    assert.equal(p1.filter((c) => p2.includes(c)).length, 0);
  });

  for (const q of ['?departamento=abc', '?pagina=0', '?por_pagina=500', `?q=${'x'.repeat(61)}`]) {
    test(`UC-002 parámetro inválido ${q.slice(0, 20)} responde 400`, async () => {
      const { status, cuerpo } = await get('municipios', q);
      assert.equal(status, 400);
      assert.ok(cuerpo.error);
    });
  }

  test('FR-07 resumen: conteos, tipos y última carga', async () => {
    const { status, cuerpo, cache } = await get('resumen');
    assert.equal(status, 200);
    assert.equal(cuerpo.municipios, 1122);
    assert.equal(cuerpo.tipos.reduce((s, t) => s + t.municipios, 0), 1122);
    assert.equal(cuerpo.ultimaCarga.filas_cargadas, 1122);
    assert.match(cache, /s-maxage/);
  });

  test('FR-08 departamentos: 33 y la suma de municipios da 1122', async () => {
    const { cuerpo } = await get('departamentos');
    assert.equal(cuerpo.departamentos.length, 33);
    assert.equal(cuerpo.departamentos.reduce((s, d) => s + d.municipios, 0), 1122);
  });
});

test('FR-06 salud responde 200 sin DATABASE_URL (no toca la base)', async () => {
  const guardada = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const { GET } = await import('../api/salud.js');
    const r = await GET();
    assert.equal(r.status, 200);
    assert.equal((await r.json()).estado, 'ok');
  } finally {
    if (guardada !== undefined) process.env.DATABASE_URL = guardada;
  }
});
