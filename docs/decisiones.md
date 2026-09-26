# Decisiones

| ID | Decisión | Estado | Por qué |
|---|---|---|---|
| D1 | Dataset: DIVIPOLA municipios (datos.gov.co `gdxc-w37w`) | **Provisional** | El enunciado de la E2 no está publicado (la actividad abre el 7-nov; al 26-sep Canvas solo tiene material de la U1). Si el enunciado fija otro dataset, se cambian `lib/dataset.js`, `db/esquema.sql` y las consultas; el resto se conserva. |
| D2 | Nube: Neon (PostgreSQL serverless) para la base y Vercel Functions para la app | **Por confirmar con Carlos** | Capa gratuita sin tarjeta. Neon es un servidor PostgreSQL gestionado en la nube; Vercel ejecuta cada `api/*.js` como función bajo demanda. Alternativas si el enunciado exige un hiperescalador: AWS (RDS + Lambda) o Azure (Database for PostgreSQL + Functions). |
| D3 | Driver `pg` con un pool por instancia | Tomada | Funciona igual contra el PostgreSQL local en Docker y contra Neon (con SSL), así que las pruebas locales valen para la nube. |
| D4 | Carga en una sola transacción, vaciando y recargando | Tomada | Garantiza el "todo o nada" (FR-03) y hace el cargador repetible (FR-05). Con 1.122 filas no hace falta carga incremental. |
| D5 | `/api/salud` no consulta la base | Tomada | Lección propia: un health check que toca la base despierta o agota la base serverless. |
