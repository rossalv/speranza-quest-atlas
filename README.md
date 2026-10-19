# Speranza Quest Atlas

An unofficial, fan-made quest tracker for Arc Raiders, built as an iPhone app with
[Capacitor](https://capacitorjs.com). Every quest on one pan-and-zoom map, linked by
prerequisite, with walkthroughs and progress tracking. Works offline. No account.

Not affiliated with, endorsed by, or sponsored by Embark Studios. Arc Raiders is a
trademark of Embark Studios AB.

## Run it

```sh
npm install
npm run serve     # browser preview at http://localhost:8080
npm run ios       # sync into the iOS project and open Xcode (macOS only)
```

## Website (speranzaquestmap.us)

Pushing to `main` deploys the site automatically through
`.github/workflows/deploy-site.yml` (GitHub Actions → the Cloudflare Worker
`speranza-atlas`, configured in `wrangler.jsonc`). Pushing any other branch makes a
preview URL instead. The workflow needs two secrets; the setup is at the top of
that file. Each run's result is written to the `deploy-status` branch, and the live
site serves `/version.json` with the commit it was built from.

`npm run web` builds the same site locally into `dist-web/` and
`speranza-quest-atlas-web.zip` (manual drag-and-drop fallback).

## Update quest data after a patch

1. Edit `www/data/quests.json` and bump `version` (e.g. `2026-11-02`).
2. Upload the same file to the URL in `www/config.js` → `dataUrl`.
   Installed apps pick it up on their next launch.
3. Run `npm run sync` so the next App Store build bundles it too.

See `CLAUDE.md` for the project layout and the remaining App Store steps, and
`docs/app-store-listing.md` for the listing copy.
