import "dotenv/config";
import express from "express";
import { pool, migrate } from "./db.js";
import { normalizeTag } from "./clash-api.js";
import { trackPlayer, pollPlayer, startScheduler } from "./poller.js";

const app = express();
app.use(express.static("public"));

// Type a tag -> we start tracking it, poll it immediately, return stats.
app.get("/api/player/:tag", async (req, res) => {
  try {
    const tag = await trackPlayer(req.params.tag);
    await pollPlayer(tag).catch((e) => console.error(e.message)); // fresh data, but don't fail the request

    const [{ rows: [player] }, { rows: decks }, { rows: recent }] = await Promise.all([
      pool.query(`SELECT tag, name, trophies, last_polled_at FROM tracked_players WHERE tag=$1`, [tag]),
      pool.query(
        `SELECT deck_hash,
                (array_agg(deck ORDER BY battle_time DESC))[1] AS deck,
                COUNT(*)::int AS games,
                SUM(won::int)::int AS wins,
                ROUND(100.0 * SUM(won::int) / COUNT(*), 1)::float AS win_pct
         FROM battles WHERE player_tag=$1
         GROUP BY deck_hash ORDER BY games DESC`, [tag]),
      pool.query(
        `SELECT battle_time, type, game_mode, crowns, opponent_crowns, won, trophy_change, deck, opponent_deck
         FROM battles WHERE player_tag=$1 ORDER BY battle_time DESC LIMIT 25`, [tag]),
    ]);

    if (!player) return res.status(404).json({ error: "player not found" });
    res.json({ player, decks, recent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

await migrate();
startScheduler();
app.listen(process.env.PORT || 3000, () => console.log("up"));
