-- This file is mounted into the Postgres container's init directory.
-- It only runs the FIRST time the data volume is created.
-- (The backend also creates the table defensively, so either path works.)

CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
