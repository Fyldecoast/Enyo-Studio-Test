/* ==========================================================================
   MEMBER CONTENT: fetches the paid material (templates, factory list,
   guides, roadmap) from the database AFTER the member has logged in.
   --------------------------------------------------------------------------
   Nothing paid is stored in this website's files any more. The database
   (public.member_content, see enyo-private/database/schema.sql) checks the
   member's plan on every request and simply returns nothing to anyone whose
   plan is too low, so editing this file or the page gets a visitor nowhere.

   ENYO.content.load(["roadmap", "techpacks."])
       exact keys, or a prefix ending in a dot ("techpacks." = every key that
       starts with it). Resolves to { ok, reason, rows: { key: payload } }
       where reason is one of: "login" | "offline" | "none" | "unavailable".
   ENYO.content.fileUrl("t1/guide.pdf")   short-lived download link (private bucket)
   ENYO.content.md("**bold** and [link](https://...)")   safe inline text
   ENYO.content.notice(el, reason)        friendly message in place of content
   ENYO.content.skeleton(n)               grey placeholder cards
   ========================================================================== */
(function () {
  "use strict";
  var ENYO = window.ENYO;
  var C = (ENYO.content = {});

  /* Text from the database is never trusted as HTML. Everything is escaped;
     only **bold** and [text](https://link) are turned into markup. */
  C.md = function (s) {
    var t = ENYO.esc(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return t;
  };

  function matches(name, key) { return name.slice(-1) === "." ? key.indexOf(name) === 0 : key === name; }

  /* ---------- demo mode: no database, so show clearly-fake sample content ---------- */
  function demo(names) {
    return new Promise(function (resolve) {
      if (window.ENYO_DEMO_CONTENT) return resolve(window.ENYO_DEMO_CONTENT);
      var s = document.createElement("script");
      s.src = "js/demo-content.js";
      s.onload = function () { resolve(window.ENYO_DEMO_CONTENT || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    }).then(function (all) {
      if (!all) return { ok: false, reason: "unavailable", rows: {} };
      var tier = ENYO.tier(), rows = {}, any = false;
      Object.keys(all).forEach(function (k) {
        if (all[k].min_tier > tier) return;
        if (names.some(function (n) { return matches(n, k); })) { rows[k] = all[k].payload; any = true; }
      });
      return any ? { ok: true, reason: "", rows: rows, demo: true } : { ok: false, reason: "none", rows: {} };
    });
  }

  C.load = function (names) {
    names = [].concat(names);
    if (!ENYO.backendOn()) return demo(names);
    var B = ENYO.backend;
    return B.ready.then(function () {
      if (!B.enabled) return { ok: false, reason: "offline", rows: {} };
      if (!B.user) return { ok: false, reason: "login", rows: {} };
      var q = B.client.from("member_content");
      var exact = names.filter(function (n) { return n.slice(-1) !== "."; });
      var jobs = [];
      if (exact.length) jobs.push(q.select("key,payload").in("key", exact));
      names.filter(function (n) { return n.slice(-1) === "."; }).forEach(function (p) {
        jobs.push(B.client.from("member_content").select("key,payload").like("key", p + "%"));
      });
      return Promise.all(jobs).then(function (results) {
        var rows = {}, n = 0;
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          if (r.error) {
            var auth = r.status === 401 || r.status === 403 || /jwt/i.test(String(r.error.message || ""));
            return { ok: false, reason: auth ? "login" : "offline", rows: {} };
          }
          (r.data || []).forEach(function (row) { rows[row.key] = row.payload; n++; });
        }
        return n ? { ok: true, reason: "", rows: rows } : { ok: false, reason: "none", rows: {} };
      });
    }).catch(function () { return { ok: false, reason: "offline", rows: {} }; });
  };

  /* ---------- private PDF downloads ---------- */
  C.fileUrl = function (path) {
    if (!ENYO.backendOn()) return Promise.resolve({ ok: false, error: "Downloads need the members' database, which isn't connected on this copy of the site." });
    return ENYO.backend.ready.then(function () {
      if (!ENYO.backend.enabled || !ENYO.backend.user) return { ok: false, error: "Please log in to download this." };
      return ENYO.backend.client.storage.from("member-files").createSignedUrl(String(path), 120).then(function (r) {
        if (r.error || !r.data || !r.data.signedUrl) return { ok: false, error: "That file isn't available on your plan, or it hasn't been uploaded yet." };
        return { ok: true, url: r.data.signedUrl };
      });
    }).catch(function () { return { ok: false, error: "Couldn't reach the downloads right now. Please try again." }; });
  };

  /* ---------- what to show when content didn't arrive ---------- */
  var COPY = {
    login: ["Please log in to see this", "This part of the site loads from the members' database after you log in."],
    offline: ["We couldn't reach the members' database", "Check your connection and refresh the page. Nothing is wrong with your plan."],
    none: ["Nothing came back for your plan", "If you have just bought or upgraded, plans are switched on by hand, so please allow a little time. Your plan is linked to the email you log in with."],
    unavailable: ["The members' database isn't connected here", "This copy of the site has no database connection, so the members' content can't load."]
  };
  C.notice = function (el, reason) {
    var c = COPY[reason] || COPY.offline;
    var login = reason === "login"
      ? '<p><a class="btn btn--sm" href="login.html?next=' + encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html") + '">Log in</a></p>' : "";
    el.innerHTML = '<div class="notice" role="status"><span data-icon="lock"></span><div><b>' + ENYO.esc(c[0]) + "</b><p>" + ENYO.esc(c[1]) + "</p>" + login + "</div></div>";
    ENYO.hydrateIcons(el);
  };

  /* ---------- placeholders (loading, and the locked sneak peek) ---------- */
  C.skeleton = function (n) {
    var one = '<article class="card skel-card" aria-hidden="true"><span class="skel skel-w40"></span><span class="skel skel-lg"></span><span class="skel"></span><span class="skel skel-w80"></span></article>';
    return new Array((n || 3) + 1).join(one);
  };
})();
