# Speranza Quest Atlas — speranzaquestmap.us

Unofficial fan-made quest map for the game Arc Raiders: every quest on one pan/zoom
map, linked by prerequisite, with walkthroughs, filters, "mark done" progress and
progress share links. Plain HTML/CSS/JS, no framework, no bundler. Don't add one
unless asked. Owner: Ross (professional developer, mostly mainframe, so explain
web/Cloudflare specifics briefly).

## Files
- `www/index.html` — page shell and script order
- `www/boot.js` — `Store` (localStorage progress), loads `data/quests.json`, then `atlas.js`
- `www/atlas.js` — map layout (dagre), drawing, drawer, filters, starting view, About, share links
- `www/atlas.css` — all styles, light + dark themes
- `www/data/quests.json` — quest data (format below)
- `www/vendor/`, `www/fonts/` — dagre and fonts, copied from node_modules by `npm run vendor`
- `assets/web/` — favicons, link-preview image `og.png` and its source `og-card.html`
- `scripts/build-web.mjs` — builds `dist-web/`: adds link-preview tags, icons, `_headers`, `version.json`
- `wrangler.jsonc` — the Cloudflare Worker `speranza-atlas` (static assets only)
- `.github/workflows/deploy-site.yml` — build, data check, deploy, status report

## Quest data format (compact keys)
`{version, label, patch, quests:[...]}`. Per quest: `i` id (kebab-case, used in share
links, never rename), `n` name, `t` trader (Shani, Celeste, Apollo, Tian Wen, Lance,
Nomadic Envoy), `p` prerequisite ids, `o` objectives, `r` rewards
`[name, qty, rarity, category]`, `q` items to bring, `g` items given on accept, `x` XP,
`one` must be done in one raid.

When the data changes: bump `version` (ISO date, e.g. `2026-11-04`, add `.1` for a
second change that day), update `label` (shown in the header, e.g.
"Updated for 2.1 · Nov 4") and `patch`. The deploy fails if a prerequisite points at
a missing quest.

Sourcing rules for quest data: Embark patch notes first, then arcraiders.wiki,
ArcTracker (arctracker.io/quests/<slug>), MetaForge, RaiderBuddy. Confirm a change in
two sources before editing. If sources disagree, don't guess: note it for Ross.
The four Nomadic quests are labeled "Nomadic Envoy" because the envoy rotates.

## Deploying (always follow this)
- Push to `main` deploys production at speranzaquestmap.us in about a minute.
- Push to any other branch makes a preview at
  `https://<branch>-speranza-atlas.rfalvine.workers.dev` and leaves production alone.
- Small, low-risk fixes may go straight to `main`. Anything visible or larger: push
  to a branch, send Ross the preview link, merge to `main` only after he OKs it.
- After every push, confirm the result yourself. Don't ask Ross to check GitHub:
  1. `git fetch origin deploy-status && git show FETCH_HEAD:deploy-status/status.json`
     (and `deploy-status/deploy.log`). Wait until `commit` matches your push;
     `result` should be `deployed`.
  2. Fetch `https://speranzaquestmap.us/version.json` (or the preview URL) and check
     `commit` matches.
- This session's git access can push branches but can't delete branches or push tags.
- Cloudflare settings: GitHub secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts → Edit)
  and `CLOUDFLARE_ACCOUNT_ID`. The custom domain is attached in the Cloudflare dashboard,
  not in `wrangler.jsonc`.

## Testing before you push
`npm install && npm run build`, serve `dist-web/` locally, and drive it with Playwright
at phone (393×852) and desktop (1440×900) sizes: map renders, mark done persists after
reload, filters, About, share link round trip (load / replace / add). Look at
screenshots, not just console output.

## Product rules
- No Embark IP: no game logos, key art, screenshots or in-game icons. All visuals are
  original. Keep the not-affiliated disclaimer on the About screen.
- No accounts or tracking. Progress stays in the visitor's browser; share links carry
  progress between devices. If analytics or server features are ever added, update the
  About screen's privacy wording in the same change.
- Share links (`#p=`) list only the furthest done quest in each chain; prerequisites
  are implied. Keep old links working when changing this.
- Keep the localStorage key `speranza-atlas-done` so visitors don't lose progress.

## History
The project started as an iPhone app (Capacitor). Ross switched to website-only on
Oct 18, 2026. The app version is preserved on the `ios-app` branch.
