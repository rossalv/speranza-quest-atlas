// Builds the website into dist-web/: copies www/, adds link-preview tags,
// icons, cache headers and version.json. Deployed by .github/workflows/deploy-site.yml.
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const SITE = "https://speranzaquestmap.us/";

rmSync("dist-web", { recursive: true, force: true });
cpSync("www", "dist-web", { recursive: true });

let html = readFileSync("dist-web/index.html", "utf8");
html = html.replace(
  '<link rel="stylesheet" href="atlas.css">',
  '<link rel="stylesheet" href="atlas.css">\n' +
  '<meta name="description" content="Every Arc Raiders quest on one map, linked by prerequisite. Unofficial fan-made tracker.">\n' +
  // Link previews (Discord, iMessage, Slack, X). Image is made from assets/web/og-card.html.
  '<meta property="og:type" content="website">\n' +
  '<meta property="og:site_name" content="Speranza Quest Atlas">\n' +
  '<meta property="og:title" content="Speranza Quest Atlas">\n' +
  '<meta property="og:description" content="Every Arc Raiders quest on one map. See what unlocks what, track what you have done, and share progress with your squad.">\n' +
  `<meta property="og:url" content="${SITE}">\n` +
  `<meta property="og:image" content="${SITE}og.png">\n` +
  '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
  '<meta property="og:image:alt" content="Speranza Quest Atlas: a map of linked quest cards">\n' +
  '<meta name="twitter:card" content="summary_large_image">\n' +
  '<meta name="theme-color" content="#131816">\n' +
  '<link rel="icon" type="image/png" href="icon-192.png">\n' +
  '<link rel="apple-touch-icon" href="icon-180.png">'
);
writeFileSync("dist-web/index.html", html);
for (const f of ["icon-180.png", "icon-192.png", "og.png"]) copyFileSync(`assets/web/${f}`, `dist-web/${f}`);

// version.json: which commit the live site was built from (used to confirm deploys).
import { execSync } from "node:child_process";
let commit = process.env.GITHUB_SHA || "";
if (!commit) { try { commit = execSync("git rev-parse HEAD").toString().trim(); } catch (e) {} }
const data = JSON.parse(readFileSync("dist-web/data/quests.json", "utf8"));
writeFileSync("dist-web/version.json", JSON.stringify({
  commit, builtAt: new Date().toISOString(), dataVersion: data.version,
}, null, 2) + "\n");

// Long cache for fonts/libraries, always-fresh quest data.
writeFileSync("dist-web/_headers",
  "/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n" +
  "/vendor/*\n  Cache-Control: public, max-age=604800\n" +
  "/data/*\n  Cache-Control: no-cache\n  Access-Control-Allow-Origin: *\n" +
  "/version.json\n  Cache-Control: no-cache\n");
console.log("built dist-web/");
