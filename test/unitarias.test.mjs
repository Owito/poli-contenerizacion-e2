import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { leerCsv } from '../lib/csv.js';
import { ErrorDataset, interpretar } from '../lib/dataset.js';
import { normalizar } from '../lib/texto.js';

const FIXTURE = new URL('./fixtures/divipola-2026-09-26.csv', import.meta.url);
const ENCABEZADO =
  'Código Departamento,Nombre Departamento,Código Municipio,Nombre Municipio,' +
  'Tipo: Municipio / Isla / Área no municipalizada,longitud,Latitud';

test('leerCsv: comillas, comas internas, comillas escapadas, CRLF y BOM', () => {
  const texto = '﻿a,b\r\n"x, y","dijo ""hola"""\r\n1,2\n';
  assert.deepEqual(leerCsv(texto), [['a', 'b'], ['x, y', 'dijo "hola"'], ['1', '2']]);
});

test('leerCsv: comilla sin cerrar es un error', () => {
  assert.throws(() => leerCsv('a,"b\n'), /sin cerrar/);
});

test('normalizar quita tildes y pasa a minúsculas', () => {
  assert.equal(normalizar(' BOGOTÁ, D.C. '), 'bogota, d.c.');
});

test('interpretar el CSV real: 1122 municipios, 33 departamentos, coordenadas con coma', async () => {
  const r = interpretar(await readFile(FIXTURE, 'utf8'));
  assert.equal(r.filasFuente, 1122);
  assert.equal(r.municipios.length, 1122);
  assert.equal(r.departamentos.size, 33);
  const medellin = r.municipios.find((m) => m.codigo === '05001');
  assert.equal(medellin.departamento_codigo, '05');
  assert.equal(medellin.latitud, 6.246631);
  assert.equal(medellin.longitud, -75.581775);
});

test('interpretar rechaza una fila sin código de municipio y dice cuál', () => {
  const csv = `${ENCABEZADO}\n05,ANTIOQUIA,05001,MEDELLÍN,Municipio,"-75,58","6,24"\n05,ANTIOQUIA,,BELLO,Municipio,"-75,55","6,33"\n`;
  assert.throws(() => interpretar(csv), (e) => e instanceof ErrorDataset && /Fila 3/.test(e.message));
});

test('interpretar rechaza coordenadas fuera de rango', () => {
  const csv = `${ENCABEZADO}\n05,ANTIOQUIA,05001,MEDELLÍN,Municipio,"-275,58","6,24"\n`;
  assert.throws(() => interpretar(csv), /longitud inválida/);
});

test('interpretar se detiene si cambia la estructura de columnas', () => {
  assert.throws(() => interpretar('a,b,c\n1,2,3\n'), /estructura del CSV cambió/);
});
