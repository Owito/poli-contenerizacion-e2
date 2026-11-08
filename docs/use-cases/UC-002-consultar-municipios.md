# UC-002 Consultar los municipios desde la aplicación serverless

**Actor:** cualquier persona con el enlace de la aplicación.
**Requisitos:** FR-06 a FR-10, NFR-01, NFR-03 a NFR-05.

## Flujo principal

1. El usuario abre la aplicación. La página estática se sirve desde la red de distribución.
2. La página llama a `/api/resumen` y `/api/departamentos`; cada llamada ejecuta una función.
3. El usuario elige un departamento, un tipo o escribe parte de un nombre o el código del municipio.
4. La página llama a `/api/municipios?q=&departamento=&tipo=&pagina=` y pinta la tabla.

## Flujos alternos

- **4a.** Parámetro inválido (departamento que no son dos dígitos, página no numérica):
  la función responde 400 con `{ error }` y la página lo muestra.
- **4b.** La base no responde: la función responde 503 y la página muestra el aviso.

## Criterios de aceptación

```gherkin
Escenario: búsqueda por nombre
  Dado el dataset cargado
  Cuando consulto /api/municipios?q=medell
  Entonces la respuesta incluye el municipio con código 05001

Escenario: búsqueda por código
  Dado el dataset cargado
  Cuando consulto /api/municipios?q=11001
  Entonces la respuesta tiene un solo resultado, con código 11001

Escenario: filtro por departamento
  Cuando consulto /api/municipios?departamento=05&por_pagina=200
  Entonces todos los resultados tienen departamento_codigo = 05

Escenario: parámetro inválido
  Cuando consulto /api/municipios?departamento=abc
  Entonces la respuesta es 400

Escenario: salud sin base
  Cuando consulto /api/salud
  Entonces responde 200 sin abrir conexión a la base
```
