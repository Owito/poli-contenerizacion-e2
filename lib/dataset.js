// Dataset de trabajo (decisión D1, provisional): DIVIPOLA, códigos de municipios.
// Si el enunciado de la E2 fija otro dataset, este es el archivo que cambia.
import { leerCsv } from './csv.js';
import { normalizar } from './texto.js';

export const DATASET = {
  nombre: 'DIVIPOLA - Códigos municipios',
  publicador: 'datos.gov.co',
  id: 'gdxc-w37w',
  url: 'https://www.datos.gov.co/api/views/gdxc-w37w/rows.csv?accessType=DOWNLOAD',
};

// Columnas esperadas, en orden. Se comparan normalizadas para tolerar tildes y mayúsculas;
// si la fuente cambia de estructura, el cargador se detiene en vez de cargar datos corridos.
const COLUMNAS = [
  'codigo departamento',
  'nombre departamento',
  'codigo municipio',
  'nombre municipio',
  'tipo: municipio / isla / area no municipalizada',
  'longitud',
  'latitud',
];

export class ErrorDataset extends Error {}

function coordenada(valor, limite, fila, nombre) {
  const n = Number(String(valor).trim().replace(',', '.'));
  if (valor === '' || !Number.isFinite(n) || Math.abs(n) > limite) {
    throw new ErrorDataset(`Fila ${fila}: ${nombre} inválida ("${valor}").`);
  }
  return n;
}

function requerido(valor, fila, nombre, patron) {
  const v = String(valor ?? '').trim();
  if (!v || (patron && !patron.test(v))) {
    throw new ErrorDataset(`Fila ${fila}: ${nombre} inválido ("${valor ?? ''}").`);
  }
  return v;
}

// Convierte el texto del CSV en departamentos y municipios validados.
// Las filas se numeran como en el archivo: la 1 es el encabezado.
export function interpretar(textoCsv) {
  const [encabezado, ...datos] = leerCsv(textoCsv);
  const recibidas = (encabezado ?? []).map(normalizar);
  if (recibidas.join('|') !== COLUMNAS.join('|')) {
    throw new ErrorDataset(
      `La estructura del CSV cambió. Se esperaba: ${COLUMNAS.join(', ')}. Llegó: ${recibidas.join(', ')}.`,
    );
  }

  const departamentos = new Map();
  const municipios = [];
  const vistos = new Set();

  datos.forEach((c, i) => {
    const fila = i + 2;
    const depCodigo = requerido(c[0], fila, 'código de departamento', /^\d{2}$/);
    const depNombre = requerido(c[1], fila, 'nombre de departamento');
    const codigo = requerido(c[2], fila, 'código de municipio', /^\d{5}$/);
    if (!codigo.startsWith(depCodigo)) {
      throw new ErrorDataset(`Fila ${fila}: el municipio ${codigo} no pertenece al departamento ${depCodigo}.`);
    }
    if (vistos.has(codigo)) throw new ErrorDataset(`Fila ${fila}: código de municipio repetido (${codigo}).`);
    vistos.add(codigo);

    const previo = departamentos.get(depCodigo);
    if (previo && previo !== depNombre) {
      throw new ErrorDataset(`Fila ${fila}: el departamento ${depCodigo} aparece con dos nombres.`);
    }
    departamentos.set(depCodigo, depNombre);

    const nombre = requerido(c[3], fila, 'nombre de municipio');
    municipios.push({
      codigo,
      departamento_codigo: depCodigo,
      nombre,
      nombre_busqueda: normalizar(nombre),
      tipo: requerido(c[4], fila, 'tipo'),
      longitud: coordenada(c[5], 180, fila, 'longitud'),
      latitud: coordenada(c[6], 90, fila, 'latitud'),
    });
  });

  return { filasFuente: datos.length, departamentos, municipios };
}
