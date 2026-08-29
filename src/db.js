import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracked_players (
      tag            TEXT PRIMARY KEY,
      name           TEXT,
      trophies       INTEGER,
      last_polled_at TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS battles (
      id                 BIGSERIAL PRIMARY KEY,
      player_tag         TEXT NOT NULL,
      battle_time        TIMESTAMPTZ NOT NULL,
      type               TEXT,
      game_mode          TEXT,
      arena              TEXT,
      crowns             SMALLINT,
      opponent_crowns    SMALLINT,
      won                BOOLEAN,
      trophy_change      SMALLINT,
      deck_hash          TEXT,
      deck               JSONB,
      opponent_tag       TEXT,
      opponent_deck_hash TEXT,
      opponent_deck      JSONB,
      raw                JSONB,
      created_at         TIMESTAMPTZ DEFAULT now(),
      UNIQUE (player_tag, battle_time)        -- dedupe key
    );

    CREATE INDEX IF NOT EXISTS battles_player_idx ON battles (player_tag, battle_time DESC);
    CREATE INDEX IF NOT EXISTS battles_deck_idx   ON battles (player_tag, deck_hash);
  `);
}
