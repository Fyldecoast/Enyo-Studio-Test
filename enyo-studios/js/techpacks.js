/* Tech pack gallery: filter tabs + search. The templates themselves (and their
   Canva links) are loaded from the members' database after login. */
(function () {
  "use strict";
  var data = { categories: [], items: [] };
  var cat = "all", q = "";
  var tabs = document.getElementById("tpTabs");
  var grid = document.getElementById("tpGrid");
  var empty = document.getElementById("tpEmpty");
  var noteEl = document.getElementById("planNote");

  function renderTabs() {
    var all = [{ id: "all", label: "All templates" }].concat(data.categories);
    tabs.innerHTML = all.map(function (c) {
      return '<button type="button" class="tab" data-cat="' + ENYO.esc(c.id) + '" aria-pressed="' + (c.id === cat) + '">' + ENYO.esc(c.label) + "</button>";
    }).join("");
  }

  function card(it) {
    if (it.status !== "live") {
      return '<article class="card tp-card"><div class="tp-thumb is-soon"><span class="soon">Coming soon</span></div>' +
        '<div class="tp-body"><h3>' + ENYO.esc(it.title) + '</h3><p class="small muted" style="margin:0">This template is in the works. It will appear here when it&rsquo;s ready.</p></div></article>';
    }
    return '<article class="card tp-card"><div class="tp-thumb"><img src="assets/img/flats.png" alt="" loading="lazy" width="499" height="611"></div>' +
      '<div class="tp-body"><span class="chip" style="align-self:flex-start">' + ENYO.esc(it.tag || "") + "</span>" +
      "<h3>" + ENYO.esc(it.title) + "</h3>" +
      '<p class="small" style="margin:0;color:#3b3a37">' + ENYO.esc(it.blurb || "") + "</p>" +
      '<div class="actions">' +
      (/^https:\/\//.test(it.canva || "") ? '<a class="btn btn--sm" href="' + ENYO.esc(it.canva) + '" target="_blank" rel="noopener noreferrer">Open in Canva ' + ENYO.icon("external") + "</a>" : "") +
      (it.pdf ? '<button type="button" class="btn btn--ghost btn--sm" data-pdf="' + ENYO.esc(it.pdf) + '">PDF ' + ENYO.icon("download") + "</button>" : "") +
      "</div></div></article>";
  }

  function render() {
    var term = q.trim().toLowerCase();
    var items = data.items.filter(function (it) {
      if (cat !== "all" && it.category !== cat) return false;
      if (!term) return true;
      return [it.title, it.tag, it.blurb].join(" ").toLowerCase().indexOf(term) > -1;
    });
    grid.innerHTML = items.map(card).join("");
    empty.hidden = items.length > 0;
  }

  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (!b) return;
    cat = b.dataset.cat; renderTabs(); render();
  });
  document.getElementById("tpSearch").addEventListener("input", function (e) { q = e.target.value; render(); });

  /* PDF: a short-lived link from the private file store (only works for plans that cover that file) */
  grid.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pdf]"); if (!b) return;
    var win = window.open("about:blank", "_blank");     // opened now so pop-up blockers allow it
    ENYO.content.fileUrl(b.getAttribute("data-pdf")).then(function (r) {
      if (!r.ok) { if (win) win.close(); ENYO.toast(r.error); return; }
      if (win) { win.opener = null; win.location.href = r.url; } else location.href = r.url;
    });
  });

  /* Locked (sneak peek) or still loading: grey placeholders only */
  grid.innerHTML = ENYO.content.skeleton(6);
  if (ENYO.locked) return;

  /* What this plan includes (the Independent Founder gets up to 3 templates) */
  var tier = ENYO.tier();
  function notice(title, text) {
    noteEl.innerHTML = '<div class="notice" role="status"><span data-icon="grid"></span><div><b>' + ENYO.esc(title) + "</b><p>" + ENYO.esc(text) + "</p></div></div>";
  }
  if (tier === 1) notice("Your plan includes up to 3 tech pack templates", "The Studio Pro unlocks the entire expanded library, plus priority access to new drops.");
  else if (tier >= 2) notice("Full library unlocked", "You have unlimited access to every template, and priority access to new drops as they land.");

  ENYO.content.load(["techpacks."]).then(function (res) {
    var cats = res.rows["techpacks.categories"];
    if (!res.ok || !cats) { ENYO.content.notice(grid, res.ok ? "none" : res.reason); document.querySelector(".toolbar").hidden = true; return; }
    data.categories = cats.categories || [];
    data.items = Object.keys(res.rows).filter(function (k) { return k !== "techpacks.categories"; })
      .map(function (k) { return res.rows[k]; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    renderTabs(); render();
    ENYO.hydrateIcons(document);
  });
  ENYO.hydrateIcons(document);
})();
