-- db/schema.sql
-- Extremely lightweight users table for LightningChat
-- Run once to create the table. Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
    user_id       BIGSERIAL       PRIMARY KEY,
    email         VARCHAR(254)    NOT NULL UNIQUE,
    pwd_hash      CHAR(60)        NOT NULL,
    first_name    VARCHAR(100)    NOT NULL,
    last_name     VARCHAR(100)    NOT NULL,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    token_version INTEGER         NOT NULL DEFAULT 0
);