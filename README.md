# Speranza Quest Atlas

**[speranzaquestmap.us](https://speranzaquestmap.us/)** · An unofficial, fan-made quest
map for Arc Raiders. Every quest on one pan-and-zoom map, linked by prerequisite, with
walkthroughs, progress tracking and share links. No account, no tracking.

Not affiliated with, endorsed by, or sponsored by Embark Studios. Arc Raiders is a
trademark of Embark Studios AB.

## Run it locally

```sh
npm install
npm run serve     # builds dist-web/ and serves it at http://localhost:8080
```

## Deploying

Pushing to `main` deploys the site through `.github/workflows/deploy-site.yml`
(GitHub Actions → Cloudflare Worker `speranza-atlas`, configured in `wrangler.jsonc`).
Any other branch gets a preview URL instead. Each run's result is written to the
`deploy-status` branch, and the live site serves `/version.json` with the commit it
was built from.

## Updating quest data after a patch

Edit `www/data/quests.json`, bump `version` and `label`, push. See `CLAUDE.md` for the
data format and sourcing rules.

The earlier iPhone app version is on the `ios-app` branch.
