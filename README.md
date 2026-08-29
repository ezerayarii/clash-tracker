# Clash Tracker (v1)

Express app that tracks Clash Royale players and shows win rate per deck.
The poller runs inside the server on a timer — no cron needed.

## Local
```
npm install
cp .env.example .env      # fill in DATABASE_URL + CLASH_API_TOKEN
npm run poll -- '#QCJ88VJV'   # one-shot test: creates tables, pulls your battles
npm run dev               # http://localhost:3000
```

## Setup
1. **Supabase** (free): new project → Settings → Database → copy the URI connection string → `DATABASE_URL`.
2. **API key**: developer.clashroyale.com → create key → allowed IP `45.79.218.79` (RoyaleAPI proxy) → `CLASH_API_TOKEN`.
3. **Hostinger**: Deploy Web App → Import Git repository → framework Express, entry `src/server.js`, start `npm start`. Add the three env vars in the panel.

## Notes
- Battle log only returns ~25 battles; the timer (default 20 min) keeps history from rolling off.
- `raw` stores the full battle JSON so you can add columns later without re-fetching.
- Hostinger may restart the process; the scheduler polls on boot so nothing is lost across restarts.
