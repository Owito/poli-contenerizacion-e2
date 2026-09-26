# Visión

## Problema

La Actividad de entrega 2 de Contenerización de Aplicaciones de Software (Unidad 4, 250 pts,
curso 99546, abre el 7-nov y vence el 10-nov-2026) evalúa tres cosas, según la rúbrica
publicada en Canvas (assignment 614330, leída el 21-sep-2026):

| Criterio | Pts | Qué exige para el nivel Excelente |
|---|---|---|
| Carga de información a base de datos en la nube | 100 | Crear el servidor de base de datos en la nube, mostrar su estructura y evidenciar la creación y la carga de **todos** los datos del dataset |
| Despliegue de aplicaciones serverless | 100 | Una aplicación web con el patrón serverless, explicada, con todos los pasos de creación y el despliegue, sus componentes, por qué esos componentes y su estructura |
| Análisis de lo realizado | 50 | Un video que muestre lo anterior y justifique el servicio y el patrón con los conceptos vistos en clase |

## Qué construye este proyecto

1. Un **cargador** que descarga un dataset público, crea el esquema en una base de datos
   PostgreSQL en la nube y carga el 100 % de las filas, comprobando al final que el número de
   filas en la base coincide con el de la fuente.
2. Una **aplicación web serverless**: páginas estáticas más funciones HTTP que consultan la base.
   No hay servidor propio encendido: cada petición a `/api/*` ejecuta una función bajo demanda.
3. La **evidencia** para el video: comandos, salidas y un guion.

## Fuera de alcance

- Autenticación de usuarios y escritura desde la web (la app es de consulta).
- Contenedores propios en producción: esta entrega es el contraste serverless de la E1, que ya
  cubrió Docker. Docker se usa solo para la base local de desarrollo y pruebas.

## Decisiones abiertas (ver `decisiones.md`)

- **D1. Dataset:** el enunciado de la E2 aún no está publicado. Mientras tanto se usa DIVIPOLA
  (municipios de Colombia) de datos.gov.co. El cargador no depende de ese dataset en su núcleo.
- **D2. Proveedor de nube:** propuesta Neon (PostgreSQL serverless) + Vercel Functions, ambos con
  capa gratuita. Falta confirmación de Carlos y ver si el enunciado obliga a un proveedor.
