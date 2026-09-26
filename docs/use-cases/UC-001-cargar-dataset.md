# UC-001 Cargar el dataset en la base de datos en la nube

**Actor:** operador (Carlos) desde su terminal.
**Requisitos:** FR-01 a FR-05, NFR-02, C-04.

## Flujo principal

1. El operador define `DATABASE_URL` con la cadena de conexión de la base en la nube.
2. Ejecuta `npm run cargar`.
3. El cargador descarga el CSV de la URL oficial.
4. Crea el esquema si no existe (`db/esquema.sql`).
5. En una transacción: vacía las tablas, inserta departamentos y municipios, registra la carga.
6. Consulta los conteos en la base y los compara con la fuente.
7. Imprime un resumen: filas en la fuente, departamentos y municipios cargados, duración.

## Flujos alternos

- **3a.** `--archivo <ruta>`: lee un CSV local en vez de descargarlo.
- **3b.** La descarga falla: termina con código 1 sin tocar la base.
- **5a.** Una fila no se puede interpretar (código vacío, coordenada inválida): se revierte la
  transacción completa y se informa la fila; la base queda como estaba.
- **6a.** Los conteos no coinciden: termina con código 1 y lo informa.

## Criterios de aceptación

```gherkin
Escenario: carga completa
  Dado un CSV de DIVIPOLA con 1122 filas
  Cuando ejecuto el cargador contra una base vacía
  Entonces la tabla municipio tiene 1122 filas
  Y la tabla carga registra filas_fuente = filas_cargadas = 1122

Escenario: carga repetida
  Dado que el dataset ya está cargado
  Cuando ejecuto el cargador otra vez
  Entonces la tabla municipio sigue teniendo 1122 filas

Escenario: fila inválida
  Dado un CSV con una fila sin código de municipio
  Cuando ejecuto el cargador
  Entonces termina con error y la base conserva los datos previos
```
