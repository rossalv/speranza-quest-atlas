// Boot loader: progress storage, then quest data, then the atlas.
(function () {
  const PROGRESS_KEY = "speranza-atlas-done";

  // Progress lives in this browser's localStorage. Reads are synchronous from
  // memory; access can throw in private windows, so every call is guarded.
  const mem = new Map();
  const Store = {
    init(keys) {
      for (const key of keys) {
        try { const v = localStorage.getItem(key); if (v != null) mem.set(key, v); } catch (e) {}
      }
    },
    get(key) { return mem.has(key) ? mem.get(key) : null; },
    set(key, value) {
      mem.set(key, value);
      try { localStorage.setItem(key, value); } catch (e) {}
    },
  };
  window.Store = Store;

  // Install / offline support. The install prompt (Chrome, Edge, Android) only fires
  // once and early, so keep it for the About screen's "Install app" button.
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); window.__installPrompt = e; });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    });
  }

  async function start() {
    Store.init([PROGRESS_KEY]);
    const res = await fetch("data/quests.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`quests.json ${res.status}`);
    window.ATLAS_DATA = await res.json();
    const s = document.createElement("script");
    s.src = "atlas.js";
    document.body.appendChild(s);
  }

  start().catch(err => {
    document.querySelector(".board").insertAdjacentHTML("beforeend",
      '<div class="err">The quest data didn\'t load. Reload the page to try again.</div>');
    console.error(err);
  });
})();
