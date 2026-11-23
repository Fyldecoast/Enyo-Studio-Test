/* Brand Launch Roadmap page: collapsible sections, tick boxes with a live
   progress bar, and a private note per milestone. Ticks and notes are saved in
   this browser; the milestones themselves load from the members' database. */
(function () {
  "use strict";
  var data = [];
  var grid = document.getElementById("rmGrid");
  var notes = ENYO.store.get("roadmap_notes", {});
  var collapsed = ENYO.store.get("roadmap_collapsed", {});
  var tick = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  function sectionHTML(sec) {
    var st = ENYO.roadmap.state();
    var done = sec.items.filter(function (i) { return st[i.id]; }).length;
    return '<section class="card rm-section' + (collapsed[sec.id] ? " is-collapsed" : "") + '" data-sec="' + sec.id + '">' +
      '<button type="button" aria-expanded="' + !collapsed[sec.id] + '"><span>' + ENYO.esc(sec.title) + '</span><span class="count">' + done + "/" + sec.items.length + "</span>" + ENYO.icon("chevronDown") + "</button>" +
      '<ul class="rm-items">' + sec.items.map(function (it) {
        var hasNote = !!notes[it.id];
        return '<li id="' + it.id + '"><div class="rm-row"><label class="check"><input type="checkbox" data-id="' + it.id + '"' + (st[it.id] ? " checked" : "") + '><span class="box">' + tick + '</span><span class="check-text">' + ENYO.esc(it.text) + "</span></label>" +
          '<button type="button" class="more" data-more="' + it.id + '" aria-expanded="' + hasNote + '" aria-label="Notes for: ' + ENYO.esc(it.text) + '">' + ENYO.icon("chevronDown") + "</button></div>" +
          '<div class="rm-note" ' + (hasNote ? "" : "hidden") + '><label class="sr-only" for="n-' + it.id + '">Notes</label><textarea class="textarea" id="n-' + it.id + '" data-note="' + it.id + '" placeholder="Notes, links or supplier names for this step...">' + ENYO.esc(notes[it.id] || "") + "</textarea></div></li>";
      }).join("") + "</ul></section>";
  }

  function updateProgress() {
    var s = ENYO.roadmap.stats();
    document.getElementById("rmPct").textContent = s.pct + "%";
    var bar = document.getElementById("rmBar");
    bar.setAttribute("aria-valuenow", s.pct);
    bar.firstElementChild.style.width = s.pct + "%";
    data.forEach(function (sec) {
      var el = grid.querySelector('[data-sec="' + sec.id + '"] .count');
      if (el) el.textContent = sec.items.filter(function (i) { return s.state[i.id]; }).length + "/" + sec.items.length;
    });
  }

  /* Locked sneak peek, or waiting for the database: grey placeholders only */
  grid.innerHTML = ENYO.content.skeleton(4);
  if (ENYO.locked) return;

  ENYO.content.load(["roadmap"]).then(function (res) {
    var r = res.rows.roadmap;
    if (!res.ok || !r || !r.sections) { ENYO.content.notice(grid, res.ok ? "none" : res.reason); return; }
    data = ENYO.roadmap.data = r.sections;
    grid.innerHTML = data.map(sectionHTML).join("");
    updateProgress();
    jumpToHash();
  });

  grid.addEventListener("change", function (e) {
    var cb = e.target.closest("input[data-id]"); if (!cb) return;
    ENYO.roadmap.set(cb.dataset.id, cb.checked);
    updateProgress();
  });

  grid.addEventListener("click", function (e) {
    var head = e.target.closest(".rm-section > button");
    if (head) {
      var sec = head.parentElement, id = sec.dataset.sec;
      var c = sec.classList.toggle("is-collapsed");
      head.setAttribute("aria-expanded", String(!c));
      if (c) collapsed[id] = true; else delete collapsed[id];
      ENYO.store.set("roadmap_collapsed", collapsed);
      return;
    }
    var more = e.target.closest(".more");
    if (more) {
      var box = more.closest("li").querySelector(".rm-note");
      var open = box.hidden;
      box.hidden = !open;
      more.setAttribute("aria-expanded", String(open));
      if (open) box.querySelector("textarea").focus();
    }
  });

  var t;
  grid.addEventListener("input", function (e) {
    var ta = e.target.closest("textarea[data-note]"); if (!ta) return;
    clearTimeout(t);
    t = setTimeout(function () {
      if (ta.value.trim()) notes[ta.dataset.note] = ta.value; else delete notes[ta.dataset.note];
      ENYO.store.set("roadmap_notes", notes);
    }, 400);
  });

  // Deep link from the dashboard: roadmap.html#pd3 (runs once the milestones have loaded)
  function jumpToHash() {
    if (!location.hash) return;
    var target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    var sec = target.closest(".rm-section");
    if (sec && sec.classList.contains("is-collapsed")) sec.querySelector(":scope > button").click();
    target.scrollIntoView({ block: "center" });
    target.classList.add("is-flash");
  }
})();
