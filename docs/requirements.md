# Requisitos

Trazables a la rúbrica de la E2 (ver `vision.md`). FR = funcional, NFR = no funcional,
C = restricción.

## Funcionales

| ID | Requisito | Criterio de la rúbrica |
|---|---|---|
| FR-01 | El cargador descarga el dataset desde su URL oficial, o lo lee de un archivo local si se le indica. | Carga a BD en la nube |
| FR-02 | El cargador crea el esquema (tablas, llaves, índices) si no existe, de forma idempotente. | Carga a BD: "mostrando su estructura" |
| FR-03 | El cargador inserta el 100 % de las filas en una sola transacción: o entran todas o ninguna. | Carga a BD: "todo descargado del dataset" |
| FR-04 | Al terminar, el cargador compara las filas de la fuente con las filas en la base y termina con error si no coinciden. | Carga a BD: evidencia de la carga completa |
| FR-05 | Volver a correr el cargador no duplica datos (reemplaza el contenido). | Evidencia repetible para el video |
| FR-06 | `GET /api/salud` responde sin consultar la base. | Despliegue serverless |
| FR-07 | `GET /api/resumen` devuelve los conteos de la base (departamentos, municipios por tipo) y la última carga. | Despliegue: la app muestra lo cargado |
| FR-08 | `GET /api/departamentos` lista los departamentos con su número de municipios. | Despliegue serverless |
| FR-09 | `GET /api/municipios` busca municipios por nombre, departamento y tipo, con paginación. | Despliegue serverless |
| FR-10 | La interfaz web muestra el resumen, un filtro por departamento, la búsqueda y la tabla de resultados. | Despliegue: aplicación web |

## No funcionales

| ID | Requisito |
|---|---|
| NFR-01 | Las funciones no guardan estado entre invocaciones; la conexión a la base se reutiliza solo mientras la instancia siga viva. |
| NFR-02 | Toda la configuración entra por variables de entorno (`DATABASE_URL`); nada de credenciales en el código ni en el repositorio. |
| NFR-03 | Las consultas usan parámetros, nunca concatenación de texto del usuario. |
| NFR-04 | Los parámetros de entrada se validan; un valor inválido responde 400 con un mensaje claro. |
| NFR-05 | La interfaz es usable en celular (sin desborde horizontal) y accesible por teclado. |
| NFR-06 | Todo se puede probar en local contra un PostgreSQL en Docker con `npm test`. |

## Restricciones

| ID | Restricción |
|---|---|
| C-01 | Sin costo: solo capas gratuitas. |
| C-02 | Node.js 22 y PostgreSQL 16, igual que la E1. |
| C-03 | Sin guiones largos en los textos que firma Carlos; sin menciones a herramientas de IA en el repositorio. |
| C-04 | Proton VPN bloquea las conexiones a Neon: desconectarlo antes de cargar o desplegar. |
