# Speranza Quest Atlas — iOS app

Unofficial fan-made quest tracker for the game Arc Raiders, shipped as an iPhone app
with Capacitor 8. The owner (Ross) is a professional developer, but new to iOS. Explain
Xcode and App Store Connect steps plainly, one click at a time.

## What it is
- A pan/zoom map of every quest (123 at bundle time), linked by prerequisite, with a
  walkthrough drawer, trader filters, and "mark done" progress.
- Plain HTML/CSS/JS in `www/`. No bundler, no framework. Don't add one unless asked.
- Capacitor plugins are loaded as plain scripts from `www/vendor/` (copied by
  `npm run vendor`): Preferences (progress storage), Haptics, Browser (external links).

## Files
- `www/index.html` — shell markup and script order
- `www/boot.js` — storage (`Store`), haptics/links (`Native`), loads quest data, then `atlas.js`
- `www/atlas.js` — the map, drawer, filters, About screen
- `www/atlas.css` — all styles, light + dark
- `www/config.js` — `dataUrl` (remote quest data) and `privacyUrl`; both empty to start
- `www/data/quests.json` — bundled quest data `{version, quests:[...]}`
- `assets/` — source icon and splash; `npm run icons` regenerates the iOS sizes
- `docs/privacy.html` — privacy policy to host publicly
- `docs/app-store-listing.md` — App Store Connect copy and checklist
- `ios/` — Xcode project (Swift Package Manager, no CocoaPods)

## Quest data format (compact keys)
`i` id, `n` name, `t` trader, `p` prerequisite ids, `o` objectives, `r` rewards
`[name, qty, rarity, category]`, `q` items to bring, `g` items given on accept,
`x` XP, `one` must be done in one raid.

Data updates after a patch: edit `www/data/quests.json`, bump `version` (ISO date
string, compared as text), host the same file at `config.dataUrl`. The app picks up a
newer version on launch without an App Store update. Never ship code through that
channel — data only (App Store guideline 2.5.2).

## App Store rules this project is designed around
1. **No Embark IP.** No Arc Raiders logo, key art, screenshots, or in-game icons
   anywhere, including the App Store listing. Don't put "Arc Raiders" in the app name
   or subtitle; the description can say it's an unofficial companion for it.
   The About screen carries the not-affiliated disclaimer; keep it.
2. **Not just a website (guideline 4.2).** It works fully offline (fonts and libraries
   are bundled), stores progress natively, uses haptics, and updates its data.
   Keep it that way: no remote page loading via `server.url`.
3. **No accounts in v1.** Progress stays on the device, so no sign-in and no account
   deletion flow are needed. If cloud sync with email magic-link sign-in is added
   later, Apple requires in-app account deletion, and the privacy policy and
   App Privacy answers must be updated.
4. iPhone only (`TARGETED_DEVICE_FAMILY = 1`), so no iPad screenshots are required.
5. `ITSAppUsesNonExemptEncryption = false` is set in Info.plist, so uploads skip the
   export-compliance question.

## Ross's constraints
- His iPhone can't enable Developer Mode (work restrictions). Don't plan on running
  builds on the device straight from Xcode. Test in the Simulator, then install
  through TestFlight, which doesn't need Developer Mode.
- He has a Mac and will enroll in the Apple Developer Program ($99/year).

## Remaining steps (do these with Ross, in order)
1. `npm install`, then `npm run ios` (vendors files, syncs, opens Xcode).
2. Run on an iPhone Simulator. Check: map renders, mark done persists after
   relaunch, About opens, Wiki/Map links open in an in-app Safari sheet, dark mode.
3. In Xcode → App target → Signing & Capabilities: pick Ross's team and confirm the
   bundle ID `com.rossalv.speranzaquestatlas` (change it in `capacitor.config.json`
   too if he wants another one; it can't change after the first upload).
4. Replace `CONTACT_EMAIL` in `docs/privacy.html` with the address Ross wants public,
   host it (his Cloudflare Pages site works) and put its URL in
   `www/config.js`. Optionally host `www/data/quests.json` there and set `dataUrl`.
5. App Store Connect: create the app record with the same bundle ID, fill in the
   listing from `docs/app-store-listing.md`.
6. Xcode → Product → Archive → Distribute App → App Store Connect → Upload.
7. TestFlight: add Ross (and his squad) as testers, install on the phone, test.
8. Take screenshots at the 6.9" iPhone size (largest iPhone Simulator, ⌘S),
   submit for review.

## Commands
- `npm run serve` — quick browser preview at http://localhost:8080
- `npm run sync` — copy `www/` into the iOS project (run after any web change)
- `npm run ios` — sync and open Xcode
- `npm run icons` — regenerate icons/splash from `assets/`
