/* Dashboard: greeting, roadmap progress, to-dos, notes, support card.
   All saved in the member's own browser (see app.js > ENYO.store). */
(function () {
  "use strict";
  var $ = ENYO.$;
  var tier = ENYO.tier();

  /* Greeting */
  function renderName() {
    var n = ENYO.store.get("name", "");
    $("#who").innerHTML = n ? ", <span class=\"who\">" + ENYO.esc(n) + "</span>" : "";
    $("#addName").textContent = n ? "Change your name" : "Add your name";
  }
  renderName();
  document.addEventListener("enyo:name", renderName);
  $("#addName").addEventListener("click", function () { ENYO.openUserMenu(); });

  /* Roadmap progress */
  function renderRoadmap() {
    var s = ENYO.roadmap.stats();
    $("#rmPct").textContent = s.pct + "%";
    $("#rmBar").setAttribute("aria-valuenow", s.pct);
    $("#rmBar > span").style.width = s.pct + "%";
    $("#rmCount").textContent = s.done + " of " + s.total + " milestones complete";
    $("#rmNext").textContent = s.next ? s.next.item.text : s.total ? "All milestones complete. Time to launch." : "";
    if (s.next) $("#primaryCta").href = "roadmap.html#" + s.next.item.id;

    var phases = [];
    (ENYO.roadmap.data || []).forEach(function (sec) {
      sec.items.forEach(function (it) { if (it.phase) phases.push(it); });
    });
    $("#phases").innerHTML = phases.map(function (p, i) {
      var done = !!s.state[p.id];
      return '<div class="phase' + (done ? " is-done" : "") + '"><span class="p-n">Phase ' + (i + 1) + (done ? " · done" : "") + "</span>" + ENYO.esc(p.phase) + "</div>";
    }).join("");
  }
  if (tier >= 2 && !ENYO.locked) {
    // the milestones come from the members' database; show a quiet placeholder meanwhile
    $("#rmNext").textContent = "Loading your roadmap...";
    ENYO.content.load(["roadmap"]).then(function (res) {
      var r = res.rows.roadmap;
      if (!res.ok || !r || !r.sections) {
        $("#rmCount").textContent = "";
        $("#rmNext").textContent = res.reason === "offline" ? "Couldn't reach the database. Refresh to try again." : "Your roadmap isn't available on this plan.";
        return;
      }
      ENYO.roadmap.data = r.sections;
      renderRoadmap();
    });
  } else {
    var p2 = ENYO.plan(2);
    $("#rmCard").innerHTML =
      '<h2 class="card-title">Brand Launch Roadmap</h2>' +
      '<p class="card-sub">The roadmap and milestone tracker are part of ' + ENYO.esc(p2 ? p2.name : "the Studio Pro") + ". Upgrade to track your launch from concept to production.</p>" +
      '<a class="btn btn--ghost btn--sm" href="pricing.html">See membership plans</a>';
    $("#primaryCta").innerHTML = 'Open the Tech Pack Gallery ' + ENYO.icon("arrowRight");
    $("#primaryCta").href = "tech-packs.html";
  }

  /* Quick links: mark anything the current plan doesn't include */
  if (tier < 2) $("#qlMfr").textContent = "Core Manufacturer Snapshot";
  ENYO.$$("[data-needs]").forEach(function (li) {
    if (tier >= parseInt(li.getAttribute("data-needs"), 10)) return;
    var a = li.querySelector("a"), pl = ENYO.plan(parseInt(li.getAttribute("data-needs"), 10));
    a.href = "pricing.html";
    a.querySelector(".l").insertAdjacentHTML("beforeend", ' <span class="chip">' + ENYO.esc(pl ? pl.name : "Upgrade") + "</span>");
  });

  /* To-dos */
  var todos = ENYO.store.get("todos", []);
  var list = $("#todoList"), empty = $("#todoEmpty");
  function saveTodos() { ENYO.store.set("todos", todos); }
  function renderTodos() {
    empty.hidden = todos.length > 0;
    list.innerHTML = todos.map(function (t) {
      return '<li data-id="' + t.id + '"><label class="check"><input type="checkbox"' + (t.done ? " checked" : "") + '><span class="box"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="check-text">' + ENYO.esc(t.text) + '</span></label><button type="button" class="del" aria-label="Delete task: ' + ENYO.esc(t.text) + '">' + ENYO.icon("trash") + "</button></li>";
    }).join("");
  }
  renderTodos();
  $("#todoForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("#todoInput"), v = input.value.trim();
    if (!v) return;
    todos.unshift({ id: ENYO.uid(), text: v, done: false });
    saveTodos(); renderTodos(); input.value = ""; input.focus();
  });
  list.addEventListener("change", function (e) {
    var li = e.target.closest("li"); if (!li) return;
    todos.forEach(function (t) { if (t.id === li.dataset.id) t.done = e.target.checked; });
    saveTodos();
  });
  list.addEventListener("click", function (e) {
    var del = e.target.closest(".del"); if (!del) return;
    var id = del.closest("li").dataset.id;
    todos = todos.filter(function (t) { return t.id !== id; });
    saveTodos(); renderTodos();
  });

  /* Notes (autosave) */
  var notes = $("#notes"), state = $("#notesState"), timer;
  notes.value = ENYO.store.get("notes", "");
  notes.addEventListener("input", function () {
    state.textContent = "Saving...";
    clearTimeout(timer);
    timer = setTimeout(function () { ENYO.store.set("notes", notes.value); state.textContent = "Saved"; }, 400);
  });

  /* Support card — depends on tier */
  var btn = $("#spBtn"), text = $("#spText");
  var calls = ENYO.cfg.callsPerMonthTier3 || 4;
  if (tier >= 3) {
    text.textContent = "You have " + calls + " one-to-one calls a month with Enya Studios. Book your next session.";
    btn.textContent = "Book a call";
    btn.href = ENYO.cfg.bookingUrl || "#";
    if (ENYO.cfg.bookingUrl) { btn.target = "_blank"; btn.rel = "noopener noreferrer"; }
    btn.addEventListener("click", function (e) {
      if (!ENYO.cfg.bookingUrl) { e.preventDefault(); ENYO.toast("Add your booking link (Calendly, Cal.com...) in js/config.js."); }
    });
  } else {
    var p3 = ENYO.plan(3);
    text.textContent = "One-to-one calls are part of " + (p3 ? p3.name : "the mentorship plan") + ". Upgrade to book time with Enya Studios directly.";
    btn.textContent = "See mentorship";
    btn.href = "pricing.html";
  }
})();
