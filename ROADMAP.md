# Roadmap — ideas for speranzaquestmap.us

Rough priority order. Each item lists what it is, why, and notes for whoever builds it.
Follow CLAUDE.md for testing and the preview → OK → ship flow. When an item ships,
move it to "Done" with the date.

## Next up

### 1. Sync progress from the game (via ArcTracker) — Ross deciding
- Embark has no public sign-in or API for third-party sites (design director, Oct 2025:
  no current plans). Direct Embark login would mean holding players' game tokens and
  calling private endpoints: not worth the risk for this site.
- Workable route: ArcTracker's developer API. A player who uses ARC Tracker Link creates
  a personal key in ArcTracker with `quests:read` and pastes it here; the site calls
  `GET /api/v2/user/quests` and marks completed quests done. Needs an ArcTracker app
  key (`X-App-Key`), which must stay secret, so add a Worker `/api` route as a
  pass-through (first server code; update About privacy wording in the same change).
  Keep the user key only in the visitor's browser. Match quests by name: some ids
  differ (our `off-the-raider` = Off The Radar, `esr-analyzer` = A Reveal in Ruins).
- Check ArcTracker's Terms of Service for third-party apps first. Only helps PC players
  who use ARC Tracker Link.
- Effort: medium.

### 2. Tag the three map-condition quests
- Boarding the Frigate, Disrupting the Frigate, Nothing Gained have no `m` yet (they
  need a live map condition). The arcmaps.com event feed used by the companion
  Project's arc_timers.py lists which maps host each condition; one more source would
  let them be tagged. See research/quest-maps.md.
- Effort: small.

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
- "Changed in the last update" badge on quests the weekly data check edited (optional
  `upd` date field per quest).
- Manual light/dark toggle (the site follows the system setting today).

## Housekeeping
- Merged preview branches `phone-ux`, `reward-search`, `install-app`, `items`, `map-links`, `raid-by-map` and `raid-plan` can be deleted
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
- 2026-10-18: Items update: "Needed for" search, "Items to keep" checklist with have-it ticks (`speranza-atlas-have`). Totals add up across quests because quests consume the items (confirmed by Ross).
- 2026-10-18: Map-specific links in quest drawers (map named in quest name or objectives → MetaForge map; 37 of 123 quests). Quests that only name a POI get the per-quest map field in "Plan a raid by map".
- 2026-10-18: Frozen Trail quest chains re-checked against 2.0.2 and 2.1.0 (no order changes found)
- 2026-10-19: Plan a raid by map: `m` map tags on 120 of 123 quests (two sources each, research/quest-maps.md), "Raid on" map picker with per-map up-next counts, drawer map links from the tags, label "Updated for 2.1 · Oct 18"
- 2026-10-19: Raid plan drawer (pick a map: up-next quests, this map's steps, bring list, mark done), objective checkboxes (`speranza-atlas-steps`), remembered filters (`speranza-atlas-filters`), "/" search shortcut
