// Cliente de la página: cada fetch a /api/* invoca una función serverless.
const $ = (id) => document.getElementById(id);
const formato = new Intl.NumberFormat('es-CO');
const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' });
const estado = { pagina: 1, porPagina: 25, total: 0 };

async function api(ruta) {
  const respuesta = await fetch(ruta, { headers: { accept: 'application/json' } });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? `Error ${respuesta.status}`);
  return datos;
}

function avisar(texto, esError = false) {
  const el = $('estado');
  el.textContent = texto;
  el.classList.toggle('estado--error', esError);
}

function celda(texto, clase) {
  const td = document.createElement('td');
  if (clase) td.className = clase;
  td.textContent = texto;
  return td;
}

async function cargarResumen() {
  const caja = $('resumen');
  try {
    const r = await api('/api/resumen');
    caja.querySelector('[data-campo="departamentos"]').textContent = formato.format(r.departamentos);
    caja.querySelector('[data-campo="municipios"]').textContent = formato.format(r.municipios);
    caja.querySelector('[data-campo="carga"]').textContent = r.ultimaCarga
      ? `${fecha.format(new Date(r.ultimaCarga.cargado_en))} · ${formato.format(r.ultimaCarga.filas_cargadas)} de ${formato.format(r.ultimaCarga.filas_fuente)} filas`
      : 'Sin cargas registradas';
    const tipo = $('tipo');
    for (const t of r.tipos) tipo.add(new Option(`${t.tipo} (${formato.format(t.municipios)})`, t.tipo));
  } catch (error) {
    caja.querySelector('[data-campo="carga"]').textContent = error.message;
  } finally {
    caja.setAttribute('aria-busy', 'false');
  }
}

async function cargarDepartamentos() {
  const { departamentos } = await api('/api/departamentos');
  const select = $('departamento');
  for (const d of departamentos) select.add(new Option(`${d.nombre} (${d.municipios})`, d.codigo));
}

async function buscar() {
  const form = new FormData($('filtros'));
  const parametros = new URLSearchParams({ pagina: estado.pagina, por_pagina: estado.porPagina });
  for (const campo of ['q', 'departamento', 'tipo']) {
    const valor = String(form.get(campo) ?? '').trim();
    if (valor) parametros.set(campo, valor);
  }
  avisar('Consultando…');
  try {
    const r = await api(`/api/municipios?${parametros}`);
    estado.total = r.total;
    const filas = r.resultados.map((m) => {
      const tr = document.createElement('tr');
      const tipo = document.createElement('td');
      const etiqueta = document.createElement('span');
      etiqueta.className = 'etiqueta';
      etiqueta.textContent = m.tipo;
      tipo.append(etiqueta);
      tr.append(celda(m.codigo), celda(m.nombre), celda(m.departamento), tipo,
        celda(m.latitud.toFixed(4), 'num'), celda(m.longitud.toFixed(4), 'num'));
      return tr;
    });
    $('filas').replaceChildren(...filas);
    const paginas = Math.max(1, Math.ceil(r.total / estado.porPagina));
    $('pagina').textContent = `Página ${estado.pagina} de ${paginas}`;
    $('anterior').disabled = estado.pagina <= 1;
    $('siguiente').disabled = estado.pagina >= paginas;
    avisar(r.total === 0 ? 'Sin resultados para esos filtros.' : `${formato.format(r.total)} ${r.total === 1 ? 'resultado' : 'resultados'}`);
  } catch (error) {
    $('filas').replaceChildren();
    avisar(error.message, true);
  }
}

$('filtros').addEventListener('submit', (e) => {
  e.preventDefault();
  estado.pagina = 1;
  buscar();
});
for (const id of ['departamento', 'tipo']) {
  $(id).addEventListener('change', () => { estado.pagina = 1; buscar(); });
}
$('anterior').addEventListener('click', () => { estado.pagina -= 1; buscar(); });
$('siguiente').addEventListener('click', () => { estado.pagina += 1; buscar(); });

cargarResumen();
cargarDepartamentos().catch((error) => avisar(error.message, true));
buscar();
