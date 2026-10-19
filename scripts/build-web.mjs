// Builds the plain website version (no Capacitor) into dist-web/,
// ready to drag into Cloudflare Pages ("Upload assets").
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

rmSync("dist-web", { recursive: true, force: true });
cpSync("www", "dist-web", { recursive: true });
for (const f of ["capacitor.js", "haptics.js", "browser.js", "preferences.js"]) {
  rmSync(`dist-web/vendor/${f}`, { force: true });
}

let html = readFileSync("dist-web/index.html", "utf8");
html = html.replace(/<script src="vendor\/(capacitor|preferences|haptics|browser)\.js"><\/script>\n/g, "");
html = html.replace(
  '<link rel="stylesheet" href="atlas.css">',
  '<link rel="stylesheet" href="atlas.css">\n' +
  '<meta name="description" content="Every Arc Raiders quest on one map, linked by prerequisite. Unofficial fan-made tracker.">\n' +
  '<link rel="icon" type="image/png" href="icon-192.png">\n' +
  '<link rel="apple-touch-icon" href="icon-180.png">'
);
writeFileSync("dist-web/index.html", html);
for (const f of ["icon-180.png", "icon-192.png"]) copyFileSync(`assets/web/${f}`, `dist-web/${f}`);

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
