/* ==========================================================================
   ENYO STUDIOS — CORE
   Shared on every page: storage, icons, header + footer, dropdown, popovers,
   tier preview + lock panels, toast, AI chat shell, roadmap progress helper.
   Page-specific code lives in its own file (calculator.js, roadmap.js ...).
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.ENYO_CONFIG || {};
  var ENYO = (window.ENYO = { cfg: CFG });

  /* ---------- Tiny helpers ---------- */
  ENYO.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
  ENYO.fmtGBP = function (n) { return gbp.format(isFinite(n) ? n : 0); };
  ENYO.$ = function (sel, root) { return (root || document).querySelector(sel); };
  ENYO.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  ENYO.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

  /* ---------- Storage (localStorage, with in-memory fallback) ----------
     Everything members save (to-dos, notes, roadmap ticks, calendar posts)
     is stored in THEIR browser only. (With the database on, the display name
     is saved to the member's profile instead.) */
  var PREFIX = "enyo.v1.";
  var mem = {};
  var canStore = (function () {
    try { localStorage.setItem("__enyo_t", "1"); localStorage.removeItem("__enyo_t"); return true; }
    catch (e) { return false; }
  })();
  ENYO.store = {
    get: function (key, fallback) {
      try {
        var raw = canStore ? localStorage.getItem(PREFIX + key) : mem[key];
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, val) {
      var raw = JSON.stringify(val);
      try { if (canStore) localStorage.setItem(PREFIX + key, raw); else mem[key] = raw; } catch (e) { mem[key] = raw; }
    },
    remove: function (key) {
      try { if (canStore) localStorage.removeItem(PREFIX + key); } catch (e) {}
      delete mem[key];
    }
  };

  /* ---------- Preview (dev) switch + backend switch ----------
     ?dev=1 turns on the plan switcher (stays on in this browser; ?dev=0 turns it
     off). It is a demo tool: while it is on the site ignores the database and
     pretends to be whichever plan you pick. Set allowDev:false in config.js
     before launch and it can no longer be switched on at all. */
  (function () {
    if (CFG.allowDev === false) return;
    var q = new URLSearchParams(location.search);
    if (q.get("dev") === "1") ENYO.store.set("dev", true);
    if (q.get("dev") === "0") ENYO.store.set("dev", false);
  })();
  ENYO.devOn = function () { return CFG.allowDev !== false && !!ENYO.store.get("dev", false); };

  /* A secret key must never sit in front-end code. If one is pasted into
     config.js by mistake we refuse to use it and say so loudly. */
  function keyProblem(b) {
    if (!b || !b.url || !b.key) return "";
    if (!/^https:\/\/[a-z0-9.-]+$/i.test(String(b.url).replace(/\/+$/, ""))) return "The backend URL in js/config.js must start with https://";
    var k = String(b.key).trim();
    if (/^sb_secret_/i.test(k)) return "The key in js/config.js is a SECRET key.";
    try {
      var part = k.split(".")[1];
      if (part) {
        var payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
        if (payload && payload.role === "service_role") return "The key in js/config.js is the service_role (secret) key.";
      }
    } catch (e) { /* not a JWT-style key: fine */ }
    return "";
  }
  ENYO.backendProblem = keyProblem(CFG.backend);
  ENYO.backendConfigured = function () { var b = CFG.backend || {}; return !!(b.url && b.key) && !ENYO.backendProblem; };
  /* True when real login + database is in use (configured, and not in demo mode). */
  ENYO.backendOn = function () { return ENYO.backendConfigured() && !ENYO.devOn(); };
  /* What we last learned about the signed-in member (cache for first paint;
     backend.js refreshes it from the database on every page load). */
  ENYO.account = function () { return ENYO.backendOn() ? ENYO.store.get("acct", null) : null; };

  /* ---------- Icons ---------- */
  var ICONS = {
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    map: '<path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zm0 0A2 2 0 0 0 6 21h13"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9.5V15"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    star: '<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.2 6.3 20.3l1.1-6.3L2.8 9.5l6.4-.9z"/>'
  };
  ENYO.icon = function (name, extra) {
    var p = ICONS[name] || "";
    return '<span class="ico ' + (extra || "") + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg></span>";
  };
  ENYO.hydrateIcons = function (root) {
    ENYO.$$("[data-icon]", root).forEach(function (el) {
      if (el.dataset.done) return;
      var name = el.getAttribute("data-icon");
      el.classList.add("ico");
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
      el.dataset.done = "1";
    });
  };

  /* ---------- Toast ---------- */
  var toastEl, toastT;
  ENYO.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3600);
  };

  /* ---------- Tier ----------
     With the database switched on, the plan comes from the member's account
     (cached here for the first paint, re-checked from the database on every
     page load). Without it, this is the demo plan (see config.js / ?dev=1). */
  ENYO.tier = function () {
    if (ENYO.backendOn()) {
      var a = ENYO.account();
      var bt = a ? parseInt(a.tier, 10) : 0;
      return [0, 1, 2, 3].indexOf(bt) > -1 ? bt : 0;
    }
    var d = parseInt(CFG.defaultTier, 10);
    if (isNaN(d)) d = 0;
    var t = parseInt(ENYO.store.get("tier", d), 10);
    return [0, 1, 2, 3].indexOf(t) > -1 ? t : 0;   // 0 = no plan yet
  };
  ENYO.setTier = function (n) { ENYO.store.set("tier", n); location.reload(); };
  ENYO.plan = function (n) {
    var plans = window.ENYO_PLANS || [];
    for (var i = 0; i < plans.length; i++) if (plans[i].tier === n) return plans[i];
    return null;
  };
  /* "£29.99 one-off" or "£59.99 / month" */
  ENYO.priceLabel = function (plan) {
    if (!plan) return "";
    return ENYO.fmtGBP(plan.price) + (plan.billing === "oneoff" ? " one-off" : " / month");
  };

  /* ---------- Checkout hand-off (Stan Store) ----------
     A plan's own link wins; otherwise the button opens the store page. */
  var CK = CFG.checkout || CFG.stripe || {};
  ENYO.checkoutUrl = function (tier) { return CK["tier" + tier] || CK.storeUrl || ""; };
  ENYO.goCheckout = function (tier, ev) {
    var url = ENYO.checkoutUrl(tier);
    if (url) return true; // let the link work normally
    if (ev) ev.preventDefault();
    ENYO.toast("Checkout isn't switched on yet. Add your Stan Store link in js/config.js.");
    return false;
  };

  /* ---------- Navigation model ---------- */
  var RES = [
    { id: "tech-packs", href: "tech-packs.html", icon: "grid", label: "Tech Pack Gallery" },
    { id: "content-planner", href: "content-planner.html", icon: "calendar", label: "Content Planner" },
    { id: "calculator", href: "calculator.html", icon: "calculator", label: "Pricing Calculator" },
    "hr",
    { id: "roadmap", href: "roadmap.html", icon: "map", label: "Brand Launch Roadmap" },
    { id: "manufacturers", href: "manufacturers.html", icon: "book", label: "Manufacturer Vetting Guide" },
    { id: "learn", href: "learn.html", icon: "cap", label: "Learn" }
  ];

  /* Top of the account menu: login prompt, or who you are + your plan. */
  function accountTop(acct, myPlan) {
    var planLine = '<p class="small muted" style="margin:-.2rem 0 .8rem">Your plan: <b>' + ENYO.esc(myPlan ? myPlan.name : "none yet") + "</b></p>";
    if (!ENYO.backendOn()) return planLine;
    if (!acct) {
      return '<p class="small muted" style="margin:-.2rem 0 .8rem">Members log in with a code sent to their email.</p>' +
        '<p style="margin:0 0 .8rem"><a class="btn btn--sm" href="login.html?next=' + encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html") + '">Log in</a></p>';
    }
    return '<p class="small muted" style="margin:-.2rem 0 .2rem">Signed in as <b>' + ENYO.esc(acct.email || "") + "</b></p>" + planLine;
  }

  function headerHTML() {
    var nav = document.body.getAttribute("data-nav") || "";
    var page = document.body.getAttribute("data-page") || "";
    var cur = function (k) { return nav === k ? ' aria-current="page"' : ""; };
    var items = RES.map(function (r) {
      if (r === "hr") return "<hr>";
      return '<a role="menuitem" href="' + r.href + '"' + (page === r.id ? ' aria-current="page"' : "") + ">" + ENYO.icon(r.icon) + "<span>" + r.label + "</span></a>";
    }).join("");
    var acct = ENYO.account();
    var name = ENYO.store.get("name", "");
    var portal = CK.manageUrl || CK.customerPortal || "";
    var myPlan = ENYO.plan(ENYO.tier());
    var showNameForm = !ENYO.backendOn() || !!acct;   // signed-out visitors have no name to set
    return (
      '<header class="site-header" id="siteHeader"><div class="container header-inner">' +
      '<a class="brand" href="index.html" aria-label="' + ENYO.esc(CFG.brandName) + ' home"><img src="assets/img/logo.png" alt="" width="76" height="68"></a>' +
      '<nav class="main-nav" id="mainNav" aria-label="Main"><div class="nav-links">' +
      '<a href="dashboard.html"' + cur("dashboard") + ">dashboard</a>" +
      '<a href="community.html"' + cur("community") + ">community</a>" +
      '<div class="nav-dd' + (nav === "resources" ? " is-current" : "") + '">' +
      '<button type="button" id="resBtn" aria-haspopup="true" aria-expanded="false">resources ' + ENYO.icon("chevronDown") + "</button>" +
      '<div class="dd-menu" role="menu" aria-labelledby="resBtn">' + items + "</div></div>" +
      "</div></nav>" +
      '<div class="header-tools">' +
      '<div class="tools-wrap"><button type="button" class="icon-btn" data-pop="popBell" aria-label="Notifications" aria-expanded="false" aria-controls="popBell">' + ENYO.icon("bell") + "</button>" +
      '<div class="popover" id="popBell"><h3>Notifications</h3><p class="pop-empty">You\'re all caught up. New template drops and updates will show here.</p></div></div>' +
      '<div class="tools-wrap"><button type="button" class="icon-btn" data-pop="popUser" aria-label="Your account" aria-expanded="false" aria-controls="popUser">' + ENYO.icon("user") + "</button>" +
      '<div class="popover" id="popUser"><h3>Your account</h3>' +
      accountTop(acct, myPlan) +
      (showNameForm ? '<form id="nameForm" class="field" style="margin-bottom:.8rem"><label class="small muted" for="nameInput">Display name</label>' +
      '<div style="display:flex;gap:8px"><input class="input" id="nameInput" autocomplete="given-name" placeholder="Your name" value="' + ENYO.esc(name) + '" maxlength="40"><button class="btn btn--sm" type="submit">Save</button></div></form>' : "") +
      '<a class="pop-link" href="dashboard.html">' + ENYO.icon("grid") + " Dashboard</a>" +
      '<a class="pop-link" href="pricing.html">' + ENYO.icon("star") + " Membership plans</a>" +
      (portal ? '<a class="pop-link" href="' + ENYO.esc(portal) + '" target="_blank" rel="noopener noreferrer">' + ENYO.icon("external") + " Manage billing</a>" : "") +
      (ENYO.backendOn() && acct ? '<a class="pop-link" href="#" id="logoutBtn">' + ENYO.icon("x") + " Log out</a>" : "") +
      "</div></div>" +
      '<button type="button" class="icon-btn nav-toggle" id="navToggle" aria-label="Menu" aria-expanded="false" aria-controls="mainNav">' + ENYO.icon("menu") + "</button>" +
      "</div></div></header>"
    );
  }

  var SOCIALS = [
    ["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["pinterest", "Pinterest"], ["youtube", "YouTube"]
  ];
  function socialHTML() {
    var icons = window.ENYO_SOCIAL_ICONS || {};
    return '<div class="social">' + SOCIALS.map(function (s) {
      var url = (CFG.social && CFG.social[s[0]]) || "";
      var svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (icons[s[0]] || "") + '"/></svg>';
      return url
        ? '<a href="' + ENYO.esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + s[1] + '">' + svg + "</a>"
        : '<a href="#" class="is-unset" data-unset="' + s[1] + '" aria-label="' + s[1] + ' (link not added yet)">' + svg + "</a>";
    }).join("") + "</div>";
  }

  function footerHTML() {
    var legal = CFG.legal || {};
    var legalLinks = [["Terms", legal.terms], ["Privacy", legal.privacy], ["Refunds", legal.refunds]]
      .filter(function (l) { return l[1]; })
      .map(function (l) { return '<a href="' + ENYO.esc(l[1]) + '">' + l[0] + "</a>"; }).join(" · ");
    return (
      '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div class="footer-brand"><img src="assets/img/logo.png" alt="' + ENYO.esc(CFG.brandName) + '" width="82" height="74">' +
      "<p>Production blueprints, vetted manufacturers and hands-on mentorship for independent fashion founders.</p></div>" +
      "<div><h4>Explore</h4><ul>" +
      '<li><a href="pricing.html">Membership</a></li><li><a href="tech-packs.html">Tech pack gallery</a></li><li><a href="calculator.html">Pricing calculator</a></li><li><a href="roadmap.html">Brand launch roadmap</a></li><li><a href="manufacturers.html">Manufacturer vetting guide</a></li></ul></div>' +
      "<div><h4>Members</h4><ul>" +
      '<li><a href="dashboard.html">Dashboard</a></li><li><a href="community.html">Community</a></li><li><a href="content-planner.html">Content planner</a></li><li><a href="learn.html">Learn</a></li>' +
      (ENYO.backendOn() && !ENYO.account() ? '<li><a href="login.html">Member log in</a></li>' : "") + "</ul></div>" +
      "<div><h4>Follow</h4>" + socialHTML() +
      (CFG.contactEmail ? '<p style="margin-top:1rem"><a href="mailto:' + ENYO.esc(CFG.contactEmail) + '">' + ENYO.esc(CFG.contactEmail) + "</a></p>" : "") +
      "</div></div>" +
      '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " " + ENYO.esc(CFG.brandName) + ".</span><span>" + legalLinks + "</span></div>" +
      "</div></footer>"
    );
  }

  /* ---------- Mount header + footer ---------- */
  function mountLayout() {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.outerHTML = headerHTML();
    if (f) f.outerHTML = footerHTML();
    ENYO.hydrateIcons(document);

    var header = document.getElementById("siteHeader");
    if (!header) return;
    var dd = header.querySelector(".nav-dd");
    var ddBtn = header.querySelector("#resBtn");
    var toggle = header.querySelector("#navToggle");

    function closeDD() { dd.classList.remove("is-open"); ddBtn.setAttribute("aria-expanded", "false"); }
    function closePops() {
      ENYO.$$(".popover.is-open", header).forEach(function (p) { p.classList.remove("is-open"); });
      ENYO.$$("[data-pop]", header).forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    }
    // "Resources" only opens the menu — it is not a page.
    ddBtn.addEventListener("click", function () {
      var open = !dd.classList.contains("is-open");
      closePops();
      dd.classList.toggle("is-open", open);
      ddBtn.setAttribute("aria-expanded", String(open));
    });
    ENYO.$$("[data-pop]", header).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pop = document.getElementById(btn.getAttribute("data-pop"));
        var open = !pop.classList.contains("is-open");
        closePops(); closeDD();
        pop.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open) { var i = pop.querySelector("input"); if (i) i.focus(); }
      });
    });
    toggle.addEventListener("click", function () {
      var open = !header.classList.contains("nav-open");
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav-dd")) closeDD();
      if (!e.target.closest(".tools-wrap")) closePops();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDD(); closePops(); header.classList.remove("nav-open"); }
    });

    var nameForm = document.getElementById("nameForm");
    if (nameForm) nameForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = document.getElementById("nameInput").value.trim();
      if (ENYO.backendOn() && ENYO.account()) {
        if (!ENYO.backend) { ENYO.toast("Still connecting. Try again in a moment."); return; }
        ENYO.backend.saveName(v).then(function (res) {
          if (!res.ok) { ENYO.toast(res.error); return; }
          closePops();
          document.dispatchEvent(new CustomEvent("enyo:name", { detail: res.name }));
          ENYO.toast(res.name ? "Saved. Hi, " + res.name + "." : "Name cleared.");
        });
        return;
      }
      ENYO.store.set("name", v);
      closePops();
      document.dispatchEvent(new CustomEvent("enyo:name", { detail: v }));
      ENYO.toast(v ? "Saved. Hi, " + v + "." : "Name cleared.");
    });
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!ENYO.backend) { ENYO.store.remove("acct"); location.href = "index.html"; return; }
      ENYO.backend.signOut().then(function () { location.href = "index.html"; });
    });
    ENYO.openUserMenu = function () {
      var b = header.querySelector('[data-pop="popUser"]');
      if (b) b.click();
    };

    ENYO.$$("a[data-unset]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        ENYO.toast("Add your " + a.getAttribute("data-unset") + " link in js/config.js.");
      });
    });
  }

  /* ---------- Plan locks ----------
     With the database on, the plan is the member's real plan from their account.
     These locks still only change what the page SHOWS (the tools and templates
     ship inside the page). What the database truly protects is the community.
     1. Whole page: <body data-min-tier="2">. If the visitor's plan is lower
        (or they have no plan yet) the page becomes a non-interactive
        "sneak peek" with a prompt to pick a plan.
     2. One part of a page: <div data-tier-gate="2">. That block is swapped
        for an upgrade card when the plan is lower.
     This only changes what the page SHOWS. Anyone can read the page source,
     so anything that must stay private has to be served from the database. */
  function lockCopy(min) {
    var plan = ENYO.plan(min);
    var tier = ENYO.tier();
    var name = plan ? plan.name : "a higher plan";
    var acct = ENYO.account();
    if (tier === 0 && ENYO.backendOn() && acct) {
      return { title: "No plan is linked to " + (acct.email || "this email") + " yet", text: "Pick a plan to use this. If you have already bought one, it is switched on by hand, so please allow a little time. Make sure you bought with this same email address." };
    }
    if (tier === 0) {
      return { title: "Pick a plan to use this", text: "This is a preview. It opens up with " + name + (min < 3 ? " or higher" : "") + (plan ? " (" + ENYO.priceLabel(plan) + ")" : "") + "." };
    }
    return { title: "This is part of " + name, text: "Upgrade to " + name + (plan ? " (" + ENYO.priceLabel(plan) + ")" : "") + " to unlock it." };
  }

  function applyTierLock() {
    var main = document.getElementById("main");
    if (!main) return;
    var tier = ENYO.tier();
    var min = parseInt(document.body.getAttribute("data-min-tier") || "0", 10);

    if (tier < min) {
      // Sneak peek: keep the page visible but frozen, fade it out, prompt to pick a plan.
      ENYO.$$("[data-tier-gate]", main).forEach(function (el) { el.hidden = true; });
      var peek = document.createElement("div");
      peek.className = "peek";
      peek.setAttribute("inert", "");
      peek.setAttribute("aria-hidden", "true");
      while (main.firstChild) peek.appendChild(main.firstChild);
      main.appendChild(peek);
      var c = lockCopy(min);
      var cta = document.createElement("section");
      cta.className = "container peek-cta";
      cta.innerHTML =
        '<div class="peek-card">' + ENYO.icon("lock") +
        '<p class="eyebrow">Sneak peek</p>' +
        '<h2 class="h2">' + ENYO.esc(c.title) + "</h2>" +
        '<p class="lede" style="margin-inline:auto">' + ENYO.esc(c.text) + "</p>" +
        '<p><a class="btn" href="pricing.html">See membership plans</a></p>' +
        (ENYO.backendOn() && !ENYO.account()
          ? '<p class="small muted" style="margin:.6rem 0 0">Already a member? <a href="login.html?next=' + encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html") + '">Log in</a></p>' : "") +
        "</div>";
      main.appendChild(cta);
      ENYO.locked = true;
      return;
    }

    ENYO.$$("[data-tier-gate]", main).forEach(function (el) {
      var need = parseInt(el.getAttribute("data-tier-gate"), 10);
      if (tier >= need) return;
      var c = lockCopy(need);
      var card = document.createElement("section");
      card.className = "container gate-wrap";
      card.innerHTML =
        '<div class="gate-card">' + ENYO.icon("lock") +
        '<div><h2 class="h3">' + ENYO.esc(el.getAttribute("data-gate-title") || c.title) + "</h2>" +
        "<p>" + ENYO.esc(el.getAttribute("data-gate-text") || c.text) + "</p></div>" +
        '<a class="btn" href="pricing.html">See membership plans</a></div>';
      el.parentNode.insertBefore(card, el);
      el.hidden = true;
    });
  }

  /* ---------- Dev tier switcher: add ?dev=1 to any URL ---------- */
  function devBar() {
    if (!ENYO.devOn()) return;
    var bar = document.createElement("div");
    bar.className = "devbar";
    bar.innerHTML = "<span>Preview plan:</span>" + [0, 1, 2, 3].map(function (n) {
      return '<button type="button" data-t="' + n + '" class="' + (ENYO.tier() === n ? "on" : "") + '">' + (n === 0 ? "none" : n) + "</button>";
    }).join("") + '<button type="button" data-off="1">hide</button>';
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.off) { ENYO.store.set("dev", false); bar.remove(); return; }
      ENYO.setTier(parseInt(b.dataset.t, 10));
    });
    document.body.appendChild(bar);
  }

  /* ---------- AI hand-off (used by chat + content planner) ----------
     Contract is documented in README.md. With no endpoint set, we say so
     plainly instead of pretending. */
  ENYO.aiConnected = function () { return !!CFG.aiEndpoint; };
  ENYO.askAI = function (payload) {
    if (!CFG.aiEndpoint) {
      return Promise.resolve({ ok: false, reply: "The AI brand advisor isn't switched on yet. It will be available here soon." });
    }
    return fetch(CFG.aiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { return { ok: true, reply: String(d.reply || "").trim() || "No answer came back. Please try again." }; })
      .catch(function () { return { ok: false, reply: "Sorry, the advisor couldn't be reached just now. Please try again in a moment." }; });
  };

  /* ---------- AI chat shell ---------- */
  function initChat() {
    if (!document.body.hasAttribute("data-chat") || ENYO.tier() < 2 || ENYO.locked) return;
    var fab = document.createElement("button");
    fab.type = "button"; fab.className = "chat-fab"; fab.setAttribute("aria-haspopup", "dialog");
    fab.innerHTML = ENYO.icon("sparkle") + "<span>Ask Enya</span>";
    var panel = document.createElement("section");
    panel.className = "chat-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ask Enya Studios AI brand advisor");
    panel.innerHTML =
      '<div class="chat-head"><div><b>Ask Enya Studios</b><small>AI brand advisor</small></div><button type="button" class="icon-btn" aria-label="Close chat" style="width:38px;height:38px">' + ENYO.icon("x") + "</button></div>" +
      '<div class="chat-msgs" aria-live="polite"></div>' +
      '<div class="chat-suggest"></div>' +
      '<form class="chat-form"><label class="sr-only" for="chatInput">Your question</label><input class="input" id="chatInput" placeholder="Ask about tech packs, factories, pricing..." autocomplete="off" maxlength="600"><button class="btn btn--sm" type="submit" aria-label="Send">' + ENYO.icon("send") + "</button></form>";
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var msgs = panel.querySelector(".chat-msgs");
    var suggest = panel.querySelector(".chat-suggest");
    var form = panel.querySelector(".chat-form");
    var input = panel.querySelector("#chatInput");
    var history = [];

    function add(role, text) {
      var d = document.createElement("div");
      d.className = "msg " + role; d.textContent = text;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
      return d;
    }
    add("bot", "Hi, I'm the Enya Studios brand advisor. Ask me about tech packs, manufacturers, pricing, or planning your launch.");
    if (!ENYO.aiConnected()) add("note", "Preview mode: the advisor isn't connected yet, so replies are placeholders.");

    ["How do I find a manufacturer?", "What goes in a tech pack?", "How should I price my first drop?"].forEach(function (q) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = q;
      b.addEventListener("click", function () { send(q); });
      suggest.appendChild(b);
    });

    function send(text) {
      text = (text || "").trim(); if (!text) return;
      suggest.hidden = true;
      add("me", text); history.push({ role: "user", content: text });
      var wait = add("bot", "Thinking...");
      ENYO.askAI({ task: "chat", messages: history.slice(-12), page: document.body.getAttribute("data-page") || "" }).then(function (res) {
        wait.textContent = res.reply;
        if (res.ok) history.push({ role: "assistant", content: res.reply });
        msgs.scrollTop = msgs.scrollHeight;
      });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });
    function open(o) {
      panel.classList.toggle("is-open", o); fab.hidden = o;
      if (o) input.focus(); else fab.focus();
    }
    fab.addEventListener("click", function () { open(true); });
    panel.querySelector(".chat-head .icon-btn").addEventListener("click", function () { open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("is-open")) open(false); });
  }

  /* ---------- Roadmap progress helper (used by dashboard + roadmap) ---------- */
  ENYO.roadmap = {
    data: [],   // the milestones; loaded from the members' database by roadmap.js / dashboard.js
    state: function () { return ENYO.store.get("roadmap", {}); },
    set: function (id, val) {
      var s = this.state();
      if (val) s[id] = true; else delete s[id];
      ENYO.store.set("roadmap", s);
    },
    stats: function () {
      var data = this.data || [];
      var st = this.state(), total = 0, done = 0, next = null;
      data.forEach(function (sec) {
        sec.items.forEach(function (it) {
          total++;
          if (st[it.id]) done++; else if (!next) next = { item: it, section: sec.title };
        });
      });
      return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0, next: next, state: st };
    }
  };

  /* ---------- Boot ---------- */
  mountLayout();
  applyTierLock();
  devBar();
  initChat();
  ENYO.hydrateIcons(document);
})();
