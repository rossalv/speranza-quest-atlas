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

// Long cache for fonts/libraries, always-fresh quest data.
writeFileSync("dist-web/_headers",
  "/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n" +
  "/vendor/*\n  Cache-Control: public, max-age=604800\n" +
  "/data/*\n  Cache-Control: no-cache\n  Access-Control-Allow-Origin: *\n");
console.log("built dist-web/");
