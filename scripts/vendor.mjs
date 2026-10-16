// Copies the layout library and fonts out of node_modules into www/
// so the app runs fully offline (no CDN, no Google Fonts).
import { copyFileSync, mkdirSync } from "node:fs";

const files = [
  ["node_modules/@capacitor/core/dist/capacitor.js", "www/vendor/capacitor.js"],
  ["node_modules/@capacitor/haptics/dist/plugin.js", "www/vendor/haptics.js"],
  ["node_modules/@capacitor/browser/dist/plugin.js", "www/vendor/browser.js"],
  ["node_modules/@capacitor/preferences/dist/plugin.js", "www/vendor/preferences.js"],
  ["node_modules/dagre/dist/dagre.min.js", "www/vendor/dagre.min.js"],
  ["node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-500-normal.woff2", "www/fonts/chakra-petch-500.woff2"],
  ["node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2", "www/fonts/chakra-petch-600.woff2"],
  ["node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", "www/fonts/ibm-plex-sans-400.woff2"],
  ["node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", "www/fonts/ibm-plex-sans-500.woff2"],
  ["node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", "www/fonts/ibm-plex-mono-400.woff2"],
  ["node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", "www/fonts/ibm-plex-mono-500.woff2"],
];

mkdirSync("www/vendor", { recursive: true });
mkdirSync("www/fonts", { recursive: true });
for (const [from, to] of files) {
  copyFileSync(from, to);
  console.log(`vendored ${to}`);
}
