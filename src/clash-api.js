const BASE  = process.env.CLASH_API_BASE || "https://proxy.royaleapi.dev/v1";
const TOKEN = process.env.CLASH_API_TOKEN;

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}: ${await res.text()}`);
  return res.json();
}

export const normalizeTag = (t) => "#" + t.trim().replace(/^#/, "").toUpperCase();
const enc = (tag) => encodeURIComponent(tag); // '#' -> '%23'

export const getPlayer    = (tag) => get(`/players/${enc(tag)}`);
export const getBattleLog = (tag) => get(`/players/${enc(tag)}/battlelog`);
