// Uso:
//   npm run cargar                          descarga el dataset de su URL oficial
//   npm run cargar -- --archivo datos/x.csv  usa un CSV local
// Requiere DATABASE_URL (la base en la nube o la local de Docker).
import { readFile } from 'node:fs/promises';
import { cargar } from '../lib/cargador.js';
import { DATASET } from '../lib/dataset.js';
import { cerrarPool, obtenerPool } from '../lib/db.js';

function destino(url) {
  // Muestra a qué servidor se carga sin imprimir el usuario ni la contraseña.
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(DATABASE_URL no es una URL válida)';
  }
}

async function main() {
  const i = process.argv.indexOf('--archivo');
  const archivo = i > -1 ? process.argv[i + 1] : null;

  console.log(`Dataset: ${DATASET.nombre} (${DATASET.publicador}, ${DATASET.id})`);
  console.log(`Destino: ${destino(process.env.DATABASE_URL ?? '')}`);

  let texto;
  let fuente;
  if (archivo) {
    texto = await readFile(archivo, 'utf8');
    fuente = `archivo ${archivo}`;
  } else {
    console.log(`Descargando ${DATASET.url}`);
    const respuesta = await fetch(DATASET.url);
    if (!respuesta.ok) throw new Error(`La descarga respondió HTTP ${respuesta.status}.`);
    texto = await respuesta.text();
    fuente = DATASET.url;
  }
  console.log(`Descargados ${Buffer.byteLength(texto)} bytes.`);

  const r = await cargar({ texto, fuente, pool: obtenerPool() });
  console.table({
    'Filas en la fuente': r.filasFuente,
    'Departamentos cargados': r.departamentos,
    'Municipios cargados': r.municipios,
    'Duración (ms)': r.duracionMs,
    'Carga n.º': r.carga,
  });
  console.log(`OK: la base tiene el 100 % de las filas de la fuente (${r.municipios} de ${r.filasFuente}).`);
}

main()
  .catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(cerrarPool);
