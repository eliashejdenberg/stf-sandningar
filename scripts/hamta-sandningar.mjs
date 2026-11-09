// Hämtar Tyngdlyftnings-TV:s sändningar från Solidsport och sparar dem i sandningar.json.
// Körs av GitHub Actions (se .github/workflows/hamta-sandningar.yml). Kräver Node 20 eller senare (arbetsflödet använder Node 24).
import { readFile, writeFile } from "node:fs/promises";

const CHANNEL = process.env.SOLIDSPORT_CHANNEL || "tyngdlyftningstv";
const API = "https://solidsport.com/api/play_v1/";
const OUTPUT = "sandningar.json";
const PER_PAGE = 50, MAX_PAGES = 10;

// Kommande/pågående sändningar och tidigare sändningar ligger i olika listor.
const COLLECTIONS = [
  { path: "timeline_objects/collections/livestreams", extra: { include_games_and_livestreams: "true" } },
  { path: "timeline_objects/collections/videos_and_replays", extra: {} }
];

async function fetchPage(path, params) {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "stf-sandningar (GitHub Actions)" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} från ${url}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`Oväntat svar från ${url}`);
  return data;
}

async function fetchCollection({ path, extra }) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = await fetchPage(path, { company: CHANNEL, page, per_page: PER_PAGE, ...extra });
    all.push(...items);
    if (items.length < PER_PAGE) break;
  }
  return all;
}

const iso = s => (typeof s === "number" && s > 0 ? new Date(s * 1000).toISOString() : null);

function simplify(item) {
  return {
    title: String(item.title || "").trim(),
    slug: item.slug,
    url: `https://solidsport.com/${CHANNEL}/watch/${item.slug}`,
    start: iso(item.live_start_at ?? item.start_at),
    end: iso(item.live_end_at ?? item.end_at),
    thumbnail: item.thumbnail || null,
    categories: (item.categories || []).map(c => c.name).filter(Boolean),
    description: String(item.description || "").replace(/\r/g, "").trim()
  };
}

const bySlug = new Map();
for (const collection of COLLECTIONS) {
  for (const item of await fetchCollection(collection)) {
    if (item?.slug && !bySlug.has(item.slug)) bySlug.set(item.slug, simplify(item));
  }
}
const streams = [...bySlug.values()].sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.title.localeCompare(b.title, "sv"));

// Skriv bara filen när sändningarna har ändrats, så att GitHub inte får en ny version varje timme.
let previous = null;
try { previous = JSON.parse(await readFile(OUTPUT, "utf8")); } catch { /* första körningen */ }
if (previous && JSON.stringify(previous.streams) === JSON.stringify(streams)) {
  console.log(`Inga ändringar (${streams.length} sändningar).`);
} else {
  const output = { channel: CHANNEL, updated: new Date().toISOString(), streams };
  await writeFile(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Sparade ${streams.length} sändningar i ${OUTPUT}.`);
}
