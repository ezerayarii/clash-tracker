// Manual run: npm run poll -- '#QCJ88VJV'
import "dotenv/config";
import { migrate, pool } from "./db.js";
import { trackPlayer, pollPlayer } from "./poller.js";

const tag = process.argv[2];
if (!tag) { console.error("usage: npm run poll -- '#TAG'"); process.exit(1); }

await migrate();
const t = await trackPlayer(tag);
console.log(`${t}: +${await pollPlayer(t)} new battles`);
await pool.end();
