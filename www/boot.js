// Boot loader: native storage, haptics, external links, and quest data
// (bundled copy, plus an optional newer copy downloaded after a patch).
(function () {
  const cap = window.capacitorExports;
  const isNative = !!(cap && cap.Capacitor && cap.Capacitor.isNativePlatform());
  const Prefs = window.capacitorPreferences && window.capacitorPreferences.Preferences;
  const Haptics = window.capacitorHaptics && window.capacitorHaptics.Haptics;
  const Browser = window.capacitorBrowser && window.capacitorBrowser.Browser;

  const DATA_KEY = "atlas-data-cache";
  const PROGRESS_KEY = "speranza-atlas-done";

  // Synchronous store the atlas reads from; writes persist in the background.
  // On iOS this is backed by native preferences (UserDefaults), which iOS
  // doesn't purge the way it can purge web storage.
  const mem = new Map();
  const Store = {
    async init(keys) {
      for (const key of keys) {
        let value = null;
        try { if (Prefs) value = (await Prefs.get({ key })).value; } catch (e) {}
        if (value == null) { try { value = localStorage.getItem(key); } catch (e) {} }
        if (value != null) mem.set(key, value);
      }
    },
    get(key) { return mem.has(key) ? mem.get(key) : null; },
    set(key, value) {
      mem.set(key, value);
      try { if (Prefs) Prefs.set({ key, value }); } catch (e) {}
      try { localStorage.setItem(key, value); } catch (e) {}
    },
  };

  const Native = {
    isNative,
    tap(kind) {
      if (!Haptics || !isNative) return;
      try {
        if (kind === "success") Haptics.notification({ type: "SUCCESS" });
        else if (kind === "warning") Haptics.notification({ type: "WARNING" });
        else Haptics.impact({ style: "LIGHT" });
      } catch (e) {}
    },
    open(url) {
      if (isNative && Browser) Browser.open({ url });
      else window.open(url, "_blank", "noopener");
    },
    async checkForUpdates(manual) {
      const url = (window.ATLAS_CONFIG || {}).dataUrl;
      if (!url) return manual ? "Update checks aren't set up yet." : null;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status);
        const next = await res.json();
        if (!valid(next)) return manual ? "The update file didn't look right, so it was skipped." : null;
        if (next.version <= window.ATLAS_DATA.version) return manual ? "You have the latest quest data." : null;
        Store.set(DATA_KEY, JSON.stringify(next));
        showToast(`New quest data (${next.version}). Tap to load it.`, () => location.reload());
        return manual ? "New quest data downloaded." : null;
      } catch (e) {
        return manual ? "Couldn't reach the update server. Your saved data still works offline." : null;
      }
    },
  };

  function valid(d) {
    return d && typeof d.version === "string" && Array.isArray(d.quests) && d.quests.length > 0 &&
      d.quests.every(q => q && typeof q.i === "string" && typeof q.n === "string" && typeof q.t === "string" &&
        Array.isArray(q.p) && Array.isArray(q.o) && Array.isArray(q.r));
  }

  function showToast(text, onTap) {
    const t = document.createElement("button");
    t.className = "toast";
    t.textContent = text;
    t.onclick = () => { t.remove(); onTap && onTap(); };
    document.body.appendChild(t);
  }

  // Links that would leave the app open in an in-app Safari sheet instead.
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (!a) return;
    e.preventDefault();
    Native.open(a.href);
  });

  window.Store = Store;
  window.Native = Native;

  async function start() {
    await Store.init([PROGRESS_KEY, DATA_KEY]);
    const bundled = await (await fetch("data/quests.json")).json();
    let data = bundled;
    try {
      const cached = JSON.parse(Store.get(DATA_KEY) || "null");
      if (valid(cached) && cached.version > bundled.version) data = cached;
    } catch (e) {}
    data.source = data === bundled ? "bundled with the app" : "downloaded update";
    window.ATLAS_DATA = data;

    const s = document.createElement("script");
    s.src = "atlas.js";
    s.onload = () => setTimeout(() => Native.checkForUpdates(false), 1500);
    document.body.appendChild(s);
  }

  start().catch(err => {
    document.querySelector(".board").insertAdjacentHTML("beforeend",
      '<div class="err">The quest data didn\'t load. Close and reopen the app to try again.</div>');
    console.error(err);
  });
})();
