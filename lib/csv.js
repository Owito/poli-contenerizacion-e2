// Lector de CSV (RFC 4180): comillas dobles, comillas escapadas (""), comas y saltos de
// línea dentro de un campo, fin de línea LF o CRLF y marca BOM al inicio.

export function leerCsv(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;
  let i = texto.charCodeAt(0) === 0xfeff ? 1 : 0;

  for (; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (entreComillas) throw new Error('CSV mal formado: una comilla quedó sin cerrar.');
  if (campo !== '' || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  // Una línea vacía al final no es una fila de datos.
  return filas.filter((f) => !(f.length === 1 && f[0] === ''));
}
