// Minúsculas y sin tildes, para búsquedas que no dependan de cómo se escriba el nombre.
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
