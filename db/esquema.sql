-- Esquema de la base en la nube (FR-02). Idempotente: se puede ejecutar en cada carga.

CREATE TABLE IF NOT EXISTS departamento (
    codigo  char(2) PRIMARY KEY CHECK (codigo ~ '^[0-9]{2}$'),
    nombre  text    NOT NULL CHECK (nombre <> '')
);

CREATE TABLE IF NOT EXISTS municipio (
    codigo              char(5)      PRIMARY KEY CHECK (codigo ~ '^[0-9]{5}$'),
    departamento_codigo char(2)      NOT NULL REFERENCES departamento (codigo),
    nombre              text         NOT NULL CHECK (nombre <> ''),
    -- Nombre en minúsculas y sin tildes: permite buscar "bogota" y encontrar "BOGOTÁ, D.C."
    nombre_busqueda     text         NOT NULL,
    tipo                text         NOT NULL CHECK (tipo <> ''),
    longitud            numeric(9,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    latitud             numeric(8,6) NOT NULL CHECK (latitud BETWEEN -90 AND 90)
);

CREATE INDEX IF NOT EXISTS municipio_departamento_idx ON municipio (departamento_codigo);
CREATE INDEX IF NOT EXISTS municipio_tipo_idx ON municipio (tipo);

-- Registro de cada ejecución del cargador: evidencia de la carga (FR-04, FR-07).
CREATE TABLE IF NOT EXISTS carga (
    id              serial      PRIMARY KEY,
    fuente          text        NOT NULL,
    filas_fuente    integer     NOT NULL,
    filas_cargadas  integer     NOT NULL,
    duracion_ms     integer     NOT NULL,
    cargado_en      timestamptz NOT NULL DEFAULT now()
);
