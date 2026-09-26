# Municipios de Colombia: base de datos en la nube y aplicación serverless

Trabajo para **Contenerización de Aplicaciones de Software** (Maestría en Arquitectura de
Software, Politécnico Grancolombiano), Unidad 4, Actividad de entrega 2.

- **Aplicación en producción:** <https://poli-contenerizacion-e2.vercel.app>
- **Dataset:** DIVIPOLA, códigos de municipios, publicado en
  [datos.gov.co](https://www.datos.gov.co/d/gdxc-w37w) (1.122 filas al 26-sep-2026).
- **Especificación:** carpeta [`docs/`](docs/) (visión, requisitos, modelo, casos de uso y
  decisiones). Los cambios entran por la especificación antes que por el código.

## Arquitectura

```mermaid
flowchart LR
    U["Navegador"] -- "HTTPS" --> CDN
    subgraph Vercel["Vercel (serverless)"]
        CDN["CDN: public/<br/>index.html, app.js, estilos.css"]
        F1["Función /api/resumen"]
        F2["Función /api/departamentos"]
        F3["Función /api/municipios"]
        F4["Función /api/salud<br/>(no toca la base)"]
    end
    CDN -. "fetch /api/*" .-> F1 & F2 & F3 & F4
    subgraph Neon["Neon (PostgreSQL serverless)"]
        DB[("departamento · municipio · carga")]
    end
    F1 & F2 & F3 -- "SQL con parámetros, TLS" --> DB
    C["Cargador<br/>npm run cargar"] -- "descarga CSV" --> G["datos.gov.co"]
    C -- "transacción única" --> DB
```

| Componente | Qué es | Por qué |
|---|---|---|
| `public/` | HTML, CSS y JS estáticos | Los sirve la CDN sin ejecutar código: rápido y sin costo por petición |
| `api/*.js` | Una función por archivo (`export function GET(request)`) | Patrón serverless: cada petición ejecuta la función bajo demanda y se escala sola; no hay servidor encendido que administrar |
| `lib/` | Conexión, validación, CSV y cargador | Código compartido; no se publica como función |
| Neon | PostgreSQL gestionado y serverless | Servidor de base de datos en la nube que se suspende sin uso (capa gratuita) |
| `db/esquema.sql` | Tablas, llaves, restricciones e índices | La "estructura" que pide la rúbrica, versionada |
| `carga` | Tabla con cada ejecución del cargador | Evidencia de que se cargó el 100 % del dataset, visible en la app |

Las respuestas de consulta llevan `Cache-Control: s-maxage`, así que la CDN atiende las
repetidas sin invocar la función ni tocar la base.

## Correrlo en local

Requisitos: Node.js 22 y Docker Desktop.

```powershell
npm ci
npm run db:local                      # PostgreSQL 16 en 127.0.0.1:55432
$env:DATABASE_URL = "postgres://municipios:solo-local@127.0.0.1:55432/municipios"
npm run cargar                        # descarga DIVIPOLA y la carga completa
npm test                              # 21 pruebas (unitarias + integración)
npm run dev                           # http://localhost:3005
```

## Cargar el dataset en la nube

1. Desconectar Proton VPN (bloquea las conexiones a Neon).
2. Traer la cadena de conexión del proyecto: `vercel env pull .env.local`.
3. Cargar:

   ```powershell
   $env:DATABASE_URL = (Get-Content .env.local | Select-String '^DATABASE_URL=').Line.Split('=',2)[1].Trim('"')
   npm run cargar
   ```

   La salida termina con `OK: la base tiene el 100 % de las filas de la fuente (1122 de 1122).`
   Si los conteos no coinciden, el cargador revierte todo y termina con error.

⚠ `npm test` vacía las tablas: las pruebas de integración solo corren si `DATABASE_URL` apunta
a la base local (`127.0.0.1:55432`), nunca contra la nube.

## Desplegar

```powershell
vercel deploy --prod
```

Vercel detecta `public/` como salida estática y cada archivo de `api/` como función de Node.js.
La única configuración es la variable `DATABASE_URL`, que la integración de Neon crea en el
proyecto.

## Correspondencia con la rúbrica

| Criterio | Dónde se evidencia |
|---|---|
| Carga de información a base de datos en la nube (100) | `db/esquema.sql`, `npm run cargar` contra Neon, tabla `carga`, tarjeta "Última carga" de la app |
| Despliegue de aplicaciones serverless (100) | `api/`, `public/`, esta sección de arquitectura, `vercel deploy --prod` y la URL de producción |
| Análisis de lo realizado (50) | Video (pendiente) apoyado en `docs/decisiones.md` |
