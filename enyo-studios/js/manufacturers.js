/* Manufacturer Vetting Guide. Everything paid (the factory list, the vetting
   guide, the outreach email, the checklist) loads from the members' database
   after login. This file only draws it and wires up the buttons. */
(function () {
  "use strict";
  var $ = ENYO.$, $$ = ENYO.$$, C = ENYO.content;
  var tier = ENYO.tier();
  var snap = $("#snapshot");
  var SNAP_SKEL = '<span class="skel skel-lg"></span><span class="skel"></span><span class="skel skel-w80"></span><span class="skel"></span>';

  /* ---------- buttons that exist from the start ---------- */
  var toggleAll = $("#toggleAll");
  toggleAll.addEventListener("click", function () {
    var open = toggleAll.dataset.open !== "true";
    $$("#framework details").forEach(function (d) { d.open = open; });
    toggleAll.dataset.open = String(open);
    toggleAll.textContent = open ? "Collapse all" : "Expand all";
  });

  var copyBtn = $("#copyBtn");
  copyBtn.disabled = true;
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  copyBtn.addEventListener("click", function () {
    var text = $("#outreach").textContent;
    if (!text) return;
    function done(ok) {
      copyBtn.textContent = ok ? "Copied" : "Press Ctrl/Cmd+C";
      ENYO.toast(ok ? "Outreach template copied." : "Couldn't copy automatically. Select the text and copy it.");
      setTimeout(function () { copyBtn.textContent = "Copy template"; }, 2200);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else done(fallbackCopy(text));
  });

  /* Sample checklist: ticks are saved on this device (the items load from the database) */
  var checks = ENYO.store.get("evalchecks", {});
  $("#evalGrid").addEventListener("change", function (e) {
    var cb = e.target.closest("input[data-k]"); if (!cb) return;
    if (cb.checked) checks[cb.dataset.k] = true; else delete checks[cb.dataset.k];
    ENYO.store.set("evalchecks", checks);
  });
  $("#evalReset").addEventListener("click", function () {
    checks = {}; ENYO.store.set("evalchecks", checks);
    $$("#evalGrid input[data-k]").forEach(function (cb) { cb.checked = false; });
  });

  /* ---------- drawing the guide (Studio Pro and above) ---------- */
  var TICK = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  function renderGuide(g) {
    $("#mfTypes").innerHTML = (g.types || []).map(function (t) {
      return '<article class="card type-card"><h3>' + ENYO.esc(t.title) + ' <span class="chip">' + ENYO.esc(t.chip) + "</span></h3><p>" + C.md(t.text) + "</p></article>";
    }).join("");
    $("#framework").innerHTML = (g.framework || []).map(function (f) {
      return "<details" + (f.open ? " open" : "") + "><summary>" + ENYO.esc(f.title) + ' <span data-icon="chevronDown"></span></summary><div class="acc-body">' +
        (f.paras || []).map(function (p) { return "<p>" + C.md(p) + "</p>"; }).join("") + "</div></details>";
    }).join("");
    var tip = $("#vetNote");
    if (g.protip) { tip.innerHTML = "<strong>" + C.md(g.protip.lead) + "</strong> " + C.md(g.protip.text); tip.hidden = false; }
    $("#findSteps").innerHTML = (g.find || []).map(function (s, i) {
      return '<li><span class="n">' + (i + 1) + "</span><div><b>" + C.md(s.title) + "</b><span>" + C.md(s.text) + "</span></div></li>";
    }).join("");
    $("#outreach").textContent = g.outreach || "";
    copyBtn.disabled = !g.outreach;
    $("#evalGrid").innerHTML = (g.checklist || []).map(function (c) {
      return '<section class="card"><h3>' + ENYO.esc(c.title) + '</h3><p class="why">' + C.md(c.why) + "</p>" +
        (c.items || []).map(function (it) {
          return '<label class="check"><input type="checkbox" data-k="' + ENYO.esc(it.k) + '"' + (checks[it.k] ? " checked" : "") + '><span class="box">' + TICK + '</span><span class="check-text">' + ENYO.esc(it.text) + "</span></label>";
        }).join("") + "</section>";
    }).join("");
    ENYO.hydrateIcons($("#framework"));
  }

  /* ---------- the live directory (Studio Pro and above) ---------- */
  function renderDirectory(data) {
    var cat = "all";
    var tabs = $("#mfTabs"), grid = $("#mfGrid");
    function renderTabs() {
      tabs.innerHTML = [{ id: "all", label: "All" }].concat(data.categories || []).map(function (c) {
        return '<button type="button" class="tab" data-cat="' + ENYO.esc(c.id) + '" aria-pressed="' + (c.id === cat) + '">' + ENYO.esc(c.label) + "</button>";
      }).join("");
    }
    function catLabel(id) {
      var cs = data.categories || [];
      for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return cs[i].label;
      return id;
    }
    function renderGrid() {
      var items = (data.items || []).filter(function (m) { return cat === "all" || m.category === cat; });
      grid.innerHTML = items.length ? items.map(function (m) {
        return '<article class="card mf"><div class="meta"><span class="chip">' + ENYO.esc(catLabel(m.category)) + '</span><span class="chip chip--outline">MOQ: ' + ENYO.esc(m.moq) + "</span></div>" +
          "<h3>" + ENYO.esc(m.name) + "</h3>" +
          '<div class="loc">' + ENYO.esc(m.place) + "</div>" +
          ((m.badges && m.badges.length) ? '<div class="meta">' + m.badges.map(function (b) { return '<span class="chip">' + ENYO.esc(b) + "</span>"; }).join("") + "</div>" : "") +
          '<div class="foot"><span>' + (m.checked ? "Last checked: " + ENYO.esc(m.checked) : "") + "</span>" +
          (/^https:\/\//.test(m.url || "") ? '<a class="btn btn--ghost btn--sm" href="' + ENYO.esc(m.url) + '" target="_blank" rel="noopener noreferrer">View on Alibaba ' + ENYO.icon("external") + "</a>" : "") +
          "</div></article>";
      }).join("") : '<p class="empty">No factories in this category yet.</p>';
    }
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      cat = b.dataset.cat; renderTabs(); renderGrid();
    });
    renderTabs(); renderGrid();
  }

  /* ---------- the starter snapshot (The Independent Founder): a plain list + CSV.
     No profile links on purpose: factory contacts are part of The Studio Pro. ---------- */
  function renderSnapshot(data) {
    var cats = data.categories || [];
    function catLabel(id) { for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i].label; return id; }
    var rows = (data.items || []).map(function (m) { return [m.name, catLabel(m.category), m.place, m.moq]; });
    $("#snapTable").insertAdjacentHTML("beforeend",
      "<thead><tr><th scope=\"col\">Factory</th><th scope=\"col\">Category</th><th scope=\"col\">Location</th><th scope=\"col\">MOQ</th></tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return (i === 0 ? '<th scope="row">' : "<td>") + ENYO.esc(c) + (i === 0 ? "</th>" : "</td>"); }).join("") + "</tr>"; }).join("") + "</tbody>");
    $("#snapDate").textContent = data.snapshotDate ? "Snapshot as of " + data.snapshotDate : "";
    $("#snapDownload").addEventListener("click", function () {
      function q(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }
      var csv = "﻿" + [["Factory", "Category", "Location", "MOQ"]].concat(rows).map(function (r) { return r.map(q).join(","); }).join("\r\n");
      try {
        var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        var a = document.createElement("a");
        a.href = url; a.download = "enya-studios-manufacturer-snapshot.csv";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      } catch (e) { ENYO.toast("Couldn't start the download. Try a different browser."); }
    });
  }

  /* ---------- what to load, for which plan ---------- */
  function showSnapshotShell() {
    snap.hidden = false;
    $("#snapTable").innerHTML = '<caption class="sr-only">Starter list of vetted apparel factories</caption>';
  }

  if (ENYO.locked) {                     // sneak peek: placeholders only
    showSnapshotShell();
    $("#snapTable").insertAdjacentHTML("afterend", '<div class="skel-card" aria-hidden="true">' + SNAP_SKEL + "</div>");
    return;
  }

  if (tier >= 2) {
    $("#mfTypes").innerHTML = C.skeleton(4);
    $("#mfGrid").innerHTML = C.skeleton(6);
    C.load(["manufacturers.directory", "manufacturers.guide"]).then(function (res) {
      var dir = res.rows["manufacturers.directory"], guide = res.rows["manufacturers.guide"];
      if (!res.ok || (!dir && !guide)) {
        C.notice($("#mfTypes"), res.ok ? "none" : res.reason);
        $$("[data-tier-gate] > section").forEach(function (s, i) { if (i > 0) s.hidden = true; });
        return;
      }
      if (guide) renderGuide(guide); else $("#mfTypes").innerHTML = "";
      if (dir) renderDirectory(dir); else $("#mfGrid").innerHTML = "";
    });
  } else {
    showSnapshotShell();
    $("#snapTable").insertAdjacentHTML("afterend", '<div class="skel-card" id="snapSkel" aria-hidden="true">' + SNAP_SKEL + "</div>");
    C.load(["manufacturers.snapshot"]).then(function (res) {
      var sk = $("#snapSkel"); if (sk) sk.remove();
      var data = res.rows["manufacturers.snapshot"];
      if (!res.ok || !data) { C.notice($("#snapTable").parentNode, res.ok ? "none" : res.reason); $("#snapDownload").disabled = true; return; }
      renderSnapshot(data);
    });
  }
})();
