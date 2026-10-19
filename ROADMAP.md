# Roadmap — ideas for speranzaquestmap.us

Rough priority order. Each item lists what it is, why, and notes for whoever builds it.
Follow CLAUDE.md for testing and the preview → OK → ship flow. When an item ships,
move it to "Done" with the date.

## Next up

### 1. Map-specific links in quest drawers
- Many objectives start "On Dam Battlegrounds…", "On Buried City…" and so on. Detect
  map names in `o` and show a link per map, instead of the single generic
  "Interactive map" link.
- Maps: Dam Battlegrounds, Buried City, Spaceport, Blue Gate, Stella Montis,
  Riven Tides, Pendola Pass. Look up and verify MetaForge's per-map URLs before linking.
  Keep the generic link when no map is named.
- Effort: small.

### 2. Plan a raid by map
- Pick a map and see which of your up-next quests can be done there in one trip.
- Needs a new per-quest field, e.g. `m: ["Dam Battlegrounds", ...]` (empty = any map).
  That's a research pass over all quests, using the CLAUDE.md sourcing rules (two
  sources). Update the data-format section of CLAUDE.md and the workflow's data check.
- UI idea: a map picker in the Filters area that dims everything else, plus a count per map.
- Effort: medium (mostly research).

## Later

### 3. Squad mode
- Squadmates join with a short code and see overlapping progress: quests everyone has
  up next, who is behind on a chain.
- First server feature: add a Worker script (`main` in wrangler.jsonc) with an `/api`
  route, plus KV or D1 storage. Keep static assets as they are.
- Must update the About screen's privacy wording in the same change (CLAUDE.md product
  rules). No accounts: squad code plus a per-device name.
- Effort: large.

### 4. Visitor counts
- Cloudflare Web Analytics (free, cookie-free) to see whether people besides Ross's
  squad use the site. Change the About "no tracking" line to something like
  "anonymous visit counts, no personal data".
- Ross needs to turn it on in the Cloudflare dashboard (or provide a beacon token).
- Effort: small.

## Small polish (any time)
- Remember trader / "good rewards" / "up next" filter choices between visits (localStorage).
- "/" keyboard shortcut to focus search on desktop.
- "Changed in the last update" badge on quests the weekly data check edited (optional
  `upd` date field per quest).
- Manual light/dark toggle (the site follows the system setting today).

## Housekeeping
- Merged preview branches `phone-ux`, `reward-search` and `install-app` can be deleted
  in GitHub (sessions here can't delete branches). Keep `ios-app` (the old iPhone app)
  and `deploy-status` (the deploy reports).

## Done
- 2026-10-18: Quest chains verified for 2.0; Nomadic Envoy label
- 2026-10-18: Website deploy pipeline (GitHub Actions → Cloudflare Worker), deploy reports, /version.json
- 2026-10-18: Data version in header; Wiki and map link fixes
- 2026-10-18: Phone header, starting view on up-next quests, progress share links
- 2026-10-18: Link previews (Open Graph image)
- 2026-10-18: Website-only cleanup; CLAUDE.md rewrite; weekly quest-data check
- 2026-10-18: Reward search with path to the reward
- 2026-10-18: Install like an app (home screen, offline)
- 2026-10-18: Items update: "Needed for" search, "Items to keep" checklist with have-it ticks (`speranza-atlas-have`). Open question: totals add quantities across quests; switch to the largest single need if quest items turn out not to be consumed.
