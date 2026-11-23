/* ==========================================================================
   BACKEND: member login + the shared database (Supabase)
   --------------------------------------------------------------------------
   Switched on by putting your Supabase URL and PUBLISHABLE key in
   js/config.js (backend: { url, key }). Until then this file does nothing and
   the site runs in the old demo mode.

   What lives here
     - login by emailed code (no passwords to leak or reset)
     - asking the database "who is this, and which plan are they on?"
     - saving the member's display name

   What does NOT live here: any rule about who may read or post. Those rules
   are enforced by the database itself (enyo-private/database/schema.sql), so this file
   can be copied, edited or bypassed by anyone and they still get nothing.
   ========================================================================== */
(function () {
  "use strict";
  var ENYO = window.ENYO;
  var B = (ENYO.cfg && ENYO.cfg.backend) || {};

  var api = (ENYO.backend = {
    enabled: false,   // true once the library is loaded and we are talking to the database
    client: null,     // the Supabase client (used by community.js)
    user: null,       // { id, email } when signed in
    account: null,    // { email, tier, name, isAdmin } when signed in
    error: ""         // set if the library could not load
  });

  /* A secret key pasted into config.js: refuse, and say so on the page. */
  if (ENYO.backendProblem) {
    api.ready = Promise.resolve(api);
    var warn = document.createElement("div");
    warn.setAttribute("role", "alert");
    warn.style.cssText = "background:#b00020;color:#fff;padding:12px 18px;font:600 14px/1.4 system-ui,sans-serif;text-align:center;position:relative;z-index:999";
    warn.textContent = "Security warning: " + ENYO.backendProblem + " Remove it from js/config.js right away and use the PUBLISHABLE (anon) key instead. Login is switched off until you do.";
    document.body.insertBefore(warn, document.body.firstChild);
    return;
  }
  if (!ENYO.backendOn()) { api.ready = Promise.resolve(api); return; }

  /* ---------- load the (self-hosted) Supabase library only when needed ---------- */
  function loadLib() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement("script");
      s.src = "js/vendor/supabase.js";
      s.onload = resolve;
      s.onerror = function () { reject(new Error("The login library could not be loaded.")); };
      document.head.appendChild(s);
    });
  }

  /* ---------- keep the page in step with the real account ---------- */
  function slim(a) { return a ? [a.email, a.tier, a.name, !!a.isAdmin] : null; }

  // Reload at most once per 10 seconds, and never if storage is unavailable
  // (so a bad connection can never trap someone in a reload loop).
  function reloadOnce() {
    var key = "enyo.reloaded", now = Date.now(), last = 0;
    try { last = parseInt(sessionStorage.getItem(key) || "0", 10) || 0; } catch (e) { return; }
    if (now - last < 10000) return;
    try { sessionStorage.setItem(key, String(now)); } catch (e) { return; }
    location.reload();
  }

  function commit(acct, silent) {
    var changed = JSON.stringify(slim(ENYO.store.get("acct", null))) !== JSON.stringify(slim(acct));
    api.account = acct;
    if (acct) {
      ENYO.store.set("acct", acct);
      ENYO.store.set("name", acct.name || "");
    } else {
      ENYO.store.remove("acct");
      ENYO.store.remove("name");
      api.user = null;
    }
    if (changed && !silent) reloadOnce();
    return api;
  }

  function refresh(silent) {
    return api.client.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s) {
        if (r && r.error) return api;      // could not reach the server: keep what we had
        return commit(null, silent);       // genuinely signed out
      }
      api.user = { id: s.user.id, email: s.user.email };
      return api.client.rpc("my_account").then(function (res) {
        if (res.error) {
          var msg = String(res.error.message || "");
          if (res.status === 401 || res.status === 403 || /jwt/i.test(msg)) {
            return api.client.auth.signOut({ scope: "local" }).then(function () { return commit(null, silent); }, function () { return commit(null, silent); });
          }
          return api;                       // network / server hiccup: keep the cache
        }
        var d = res.data || {};
        return commit({
          email: s.user.email,
          tier: Number(d.tier) || 0,
          name: d.display_name && d.display_name !== "Member" ? d.display_name : "",
          isAdmin: !!d.is_admin
        }, silent);
      });
    }).catch(function () { return api; });
  }

  api.ready = loadLib().then(function () {
    api.client = window.supabase.createClient(String(B.url).trim().replace(/\/+$/, ""), String(B.key).trim(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    api.enabled = true;
    return refresh(false);
  }).catch(function (e) {
    api.error = String((e && e.message) || e);
    return api;
  });

  /* ---------- actions used by the login page + account menu ---------- */
  function wait() { return api.ready.then(function () { if (!api.enabled) throw new Error(api.error || "Login is not available right now."); }); }

  api.sendCode = function (email) {
    return wait().then(function () {
      return api.client.auth.signInWithOtp({ email: String(email).trim(), options: { shouldCreateUser: true } });
    }).then(function (res) {
      if (res.error) {
        var limited = res.error.status === 429 || /rate|too many|seconds/i.test(String(res.error.message));
        return { ok: false, error: limited ? "Too many attempts. Please wait a minute and try again." : "We couldn't send a code to that address. Check it and try again." };
      }
      return { ok: true };
    }).catch(function (e) { return { ok: false, error: e.message || "Login is not available right now." }; });
  };

  api.verifyCode = function (email, code) {
    return wait().then(function () {
      return api.client.auth.verifyOtp({ email: String(email).trim(), token: String(code).replace(/\s+/g, ""), type: "email" });
    }).then(function (res) {
      if (res.error || !res.data || !res.data.session) {
        return { ok: false, error: "That code didn't work. It may have expired, so request a new one." };
      }
      return refresh(true).then(function () { return { ok: true, account: api.account }; });
    }).catch(function (e) { return { ok: false, error: e.message || "Login is not available right now." }; });
  };

  api.signOut = function () {
    return api.ready.then(function () {
      return api.client ? api.client.auth.signOut({ scope: "local" }) : null;   // this device only
    }).catch(function () { /* still clear locally below */ }).then(function () {
      ENYO.store.remove("acct");
      ENYO.store.remove("name");
      api.account = null; api.user = null;
    });
  };

  api.saveName = function (raw) {
    var v = String(raw || "").trim();
    if (!v) v = "Member";
    if (v.length < 2 || v.length > 40) return Promise.resolve({ ok: false, error: "Names need 2 to 40 characters." });
    return wait().then(function () {
      if (!api.user) return { ok: false, error: "Please log in first." };
      return api.client.from("profiles").update({ display_name: v }).eq("id", api.user.id).select("display_name").then(function (res) {
        if (res.error || !res.data || !res.data.length) return { ok: false, error: "Couldn't save your name. Please try again." };
        var shown = v === "Member" ? "" : v;
        if (api.account) { api.account.name = shown; ENYO.store.set("acct", api.account); }
        ENYO.store.set("name", shown);
        return { ok: true, name: shown };
      });
    }).catch(function (e) { return { ok: false, error: e.message || "Couldn't save your name." }; });
  };
})();
