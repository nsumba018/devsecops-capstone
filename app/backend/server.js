/**
 * User Registry API
 * ------------------
 * A deliberately small backend for the DevSecOps capstone lab.
 * It exposes two endpoints:
 *   GET  /api/users   -> list all saved users (newest first)
 *   POST /api/users   -> save a new user { name, email }
 * Plus a /api/health endpoint used by Docker / load balancers.
 *
 * Connection details come from environment variables so the same image
 * runs locally, in docker-compose, and on the EC2 host without edits.
 */
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "appsecret",
  database: process.env.DB_NAME || "appdb",
});

// Create the table on first boot (idempotent) and retry until the DB is ready.
async function initDb(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id         SERIAL PRIMARY KEY,
          name       VARCHAR(120) NOT NULL,
          email      VARCHAR(160) NOT NULL,
          created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
      `);
      console.log("[db] schema ready");
      return;
    } catch (err) {
      console.log(`[db] not ready (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("Database never became ready");
}

// Health check — handy for `docker compose ps` and ZAP smoke tests.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// List users, newest first.
app.get("/api/users", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

// Save a user. Uses a parameterised query (no string concatenation)
// so it is safe against SQL injection — ZAP / Semgrep will appreciate it.
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: "Both name and email are required" });
  }
  if (typeof name !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "Invalid field types" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
      [name.trim(), email.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save user" });
  }
});

const PORT = parseInt(process.env.PORT || "3000", 10);
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[fatal]", err.message);
    process.exit(1);
  });
