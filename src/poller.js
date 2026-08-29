import { pool } from "./db.js";
import { getPlayer, getBattleLog, normalizeTag } from "./clash-api.js";

// "20260828T010203.000Z" -> ISO
function parseBattleTime(s) {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/);
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${m[7]}Z`;
}

const deckHash = (cards = []) => cards.map((c) => c.id).sort().join("-");
const slimDeck = (cards = []) => cards.map((c) => ({ id: c.id, name: c.name, level: c.level ?? null }));

export async function trackPlayer(tag) {
  tag = normalizeTag(tag);
  await pool.query(
    `INSERT INTO tracked_players (tag) VALUES ($1) ON CONFLICT (tag) DO NOTHING`, [tag]
  );
  return tag;
}

export async function pollPlayer(tag) {
  const profile = await getPlayer(tag);
  await pool.query(
    `UPDATE tracked_players SET name=$2, trophies=$3, last_polled_at=now() WHERE tag=$1`,
    [tag, profile.name, profile.trophies]
  );

  const log = await getBattleLog(tag);
  let added = 0;

  for (const b of log) {
    const me = b.team?.[0], opp = b.opponent?.[0];
    if (!me || !opp) continue;

    const { rowCount } = await pool.query(
      `INSERT INTO battles
         (player_tag, battle_time, type, game_mode, arena, crowns, opponent_crowns, won,
          trophy_change, deck_hash, deck, opponent_tag, opponent_deck_hash, opponent_deck, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (player_tag, battle_time) DO NOTHING`,
      [
        tag, parseBattleTime(b.battleTime), b.type ?? "unknown",
        b.gameMode?.name ?? null, b.arena?.name ?? null,
        me.crowns ?? 0, opp.crowns ?? 0, (me.crowns ?? 0) > (opp.crowns ?? 0),
        me.trophyChange ?? null,
        deckHash(me.cards), JSON.stringify(slimDeck(me.cards)),
        opp.tag ?? null, deckHash(opp.cards), JSON.stringify(slimDeck(opp.cards)),
        JSON.stringify(b),
      ]
    );
    added += rowCount;
  }
  return added;
}

export async function pollAll() {
  const { rows } = await pool.query(`SELECT tag FROM tracked_players`);
  for (const { tag } of rows) {
    try {
      const n = await pollPlayer(tag);
      console.log(`[poll] ${tag}: +${n}`);
    } catch (e) {
      console.error(`[poll] ${tag}: ${e.message}`);
    }
  }
}

export function startScheduler() {
  const minutes = Number(process.env.POLL_EVERY_MINUTES || 20);
  console.log(`[poll] scheduler every ${minutes} min`);
  pollAll();                                   // run once on boot
  setInterval(pollAll, minutes * 60 * 1000);   // then on a timer
}
