/* Content planner: AI Content Strategist (needs the AI endpoint) +
   a month / list content calendar. Posts are saved in this browser. */
(function () {
  "use strict";
  var $ = ENYO.$;

  /* ======================= AI CONTENT STRATEGIST ======================= */
  var form = $("#genForm"), btn = $("#genBtn"), out = $("#genOut"), outText = $("#genText"), status = $("#genStatus");
  if (!ENYO.aiConnected()) status.textContent = "AI generation isn't connected yet.";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var prompt = $("#genPrompt").value.trim();
    if (!prompt) { ENYO.toast("Tell me what you need first."); $("#genPrompt").focus(); return; }
    btn.disabled = true; btn.classList.add("is-disabled");
    status.textContent = "Generating...";
    ENYO.askAI({
      task: "content",
      prompt: prompt,
      stage: $("#genStage").value,
      platform: $("#genPlatform").value,
      format: $("#genFormat").value,
      style: $("#genStyle").value
    }).then(function (res) {
      outText.textContent = res.reply;
      out.hidden = false;
      status.textContent = res.ok ? "" : (ENYO.aiConnected() ? "" : "AI generation isn't connected yet.");
      btn.disabled = false; btn.classList.remove("is-disabled");
    });
  });
  $("#genCopy").addEventListener("click", function () {
    var text = outText.textContent;
    var ok = function () { ENYO.toast("Copied."); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { ENYO.toast("Select the text and copy it."); });
    else ENYO.toast("Select the text and copy it.");
  });

  /* ============================ CALENDAR ============================ */
  var PLATFORMS = [
    { id: "instagram", label: "Instagram", color: "#c2487a" },
    { id: "tiktok", label: "TikTok", color: "#1b8f9b" },
    { id: "youtube", label: "YouTube", color: "#c8372d" }
  ];
  var byId = {}; PLATFORMS.forEach(function (p) { byId[p.id] = p; });
  var weekStart = ENYO.cfg.calendarWeekStartsOn === 0 ? 0 : 1;
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var posts = ENYO.store.get("posts", []);
  var state = { view: "month", cursor: firstOfMonth(new Date()), filters: {} };
  PLATFORMS.forEach(function (p) { state.filters[p.id] = true; });

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function firstOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function save() { ENYO.store.set("posts", posts); }
  function visible() { return posts.filter(function (p) { return state.filters[p.platform]; }); }

  /* Filters + legend */
  var filtersEl = $("#calFilters");
  filtersEl.innerHTML = PLATFORMS.map(function (p) {
    return '<button type="button" class="tab is-active" data-p="' + p.id + '" aria-pressed="true">' + p.label + "</button>";
  }).join("");
  filtersEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-p]"); if (!b) return;
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on)); b.classList.toggle("is-active", on);
    state.filters[b.dataset.p] = on; render();
  });
  $("#filterBtn").addEventListener("click", function () {
    var open = filtersEl.hidden;
    filtersEl.hidden = !open;
    this.setAttribute("aria-expanded", String(open));
  });
  $("#calLegend").innerHTML = PLATFORMS.map(function (p) { return '<span><i style="--c:' + p.color + '"></i>' + p.label + "</span>"; }).join("");

  /* View + navigation */
  function setView(v) {
    state.view = v;
    $("#vMonth").setAttribute("aria-pressed", String(v === "month"));
    $("#vList").setAttribute("aria-pressed", String(v === "list"));
    render();
  }
  $("#vMonth").addEventListener("click", function () { setView("month"); });
  $("#vList").addEventListener("click", function () { setView("list"); });
  $("#addPostBtn").addEventListener("click", function () { openDialog(ymd(new Date())); });
  $("#calToday").addEventListener("click", function () { state.cursor = firstOfMonth(new Date()); render(); });
  $("#calPrev").addEventListener("click", function () { state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1); render(); });
  $("#calNext").addEventListener("click", function () { state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1); render(); });

  /* Render */
  var box = $("#calBox");
  function render() {
    $("#calTitle").textContent = state.cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    box.innerHTML = state.view === "month" ? monthHTML() : listHTML();
    ENYO.hydrateIcons(box);
  }

  function pillHTML(p) {
    var pl = byId[p.platform] || PLATFORMS[0];
    return '<button type="button" class="pill" data-post="' + p.id + '" style="--c:' + pl.color + '" title="' + ENYO.esc(pl.label + ": " + p.title) + '"><i></i><span>' + ENYO.esc(p.title) + "</span></button>";
  }

  function monthHTML() {
    var y = state.cursor.getFullYear(), m = state.cursor.getMonth();
    var offset = (new Date(y, m, 1).getDay() - weekStart + 7) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    var cells = Math.ceil((offset + days) / 7) * 7;
    var todayKey = ymd(new Date());
    var vis = visible(), map = {};
    vis.forEach(function (p) { (map[p.date] = map[p.date] || []).push(p); });

    var head = "";
    for (var i = 0; i < 7; i++) head += "<div>" + DOW[(weekStart + i) % 7] + "</div>";
    var out = '<div class="cal-dow">' + head + '</div><div class="cal-days">';
    for (var c = 0; c < cells; c++) {
      var d = new Date(y, m, 1 - offset + c), key = ymd(d);
      var items = map[key] || [];
      var cls = "cal-day" + (d.getMonth() !== m ? " is-out" : "") + (key === todayKey ? " is-today" : "");
      var shown = items.slice(0, 3).map(pillHTML).join("");
      var more = items.length > 3 ? '<span class="pill more">+' + (items.length - 3) + " more</span>" : "";
      out += '<div class="' + cls + '" data-date="' + key + '"><button type="button" class="dn" data-add="' + key + '" aria-label="Add a post on ' + d.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) + '">' + d.getDate() + "</button>" + shown + more + "</div>";
    }
    return out + "</div>";
  }

  function listHTML() {
    var y = state.cursor.getFullYear(), m = state.cursor.getMonth();
    var items = visible().filter(function (p) { var d = parse(p.date); return d.getFullYear() === y && d.getMonth() === m; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    if (!items.length) return '<p class="empty" style="padding:1.4rem">No posts scheduled this month. Press &ldquo;Add post&rdquo; to schedule one.</p>';
    return '<ul class="cal-list">' + items.map(function (p) {
      var pl = byId[p.platform] || PLATFORMS[0];
      return '<li><span class="d">' + parse(p.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + "</span>" +
        "<span><b>" + ENYO.esc(p.title) + "</b>" + (p.notes ? '<br><span class="small muted">' + ENYO.esc(p.notes) + "</span>" : "") + "</span>" +
        '<button type="button" class="pill" data-post="' + p.id + '" style="--c:' + pl.color + ';width:auto"><i></i><span>' + pl.label + "</span></button></li>";
    }).join("") + "</ul>";
  }

  /* Add / edit dialog */
  var dlg = $("#postDialog"), editing = null;
  $("#pPlatform").innerHTML = PLATFORMS.map(function (p) { return '<option value="' + p.id + '">' + p.label + "</option>"; }).join("");

  function openDialog(date, post) {
    editing = post || null;
    $("#dlgTitle").textContent = post ? "Edit post" : "Add post";
    $("#pDate").value = post ? post.date : date;
    $("#pPlatform").value = post ? post.platform : PLATFORMS[0].id;
    $("#pTitle").value = post ? post.title : "";
    $("#pNotes").value = post ? (post.notes || "") : "";
    $("#pDelete").hidden = !post;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    $("#pTitle").focus();
  }
  function closeDialog() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }

  box.addEventListener("click", function (e) {
    var pill = e.target.closest("[data-post]");
    if (pill) {
      var p = posts.filter(function (x) { return x.id === pill.dataset.post; })[0];
      if (p) openDialog(p.date, p);
      return;
    }
    var add = e.target.closest("[data-add]");
    if (add) { openDialog(add.dataset.add); return; }
    var cell = e.target.closest(".cal-day");
    if (cell && !e.target.closest(".pill")) openDialog(cell.dataset.date);
  });

  $("#postForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var rec = { id: editing ? editing.id : ENYO.uid(), date: $("#pDate").value, platform: $("#pPlatform").value, title: $("#pTitle").value.trim(), notes: $("#pNotes").value.trim() };
    if (!rec.date || !rec.title) return;
    if (editing) posts = posts.map(function (p) { return p.id === rec.id ? rec : p; }); else posts.push(rec);
    save(); closeDialog();
    // jump to the month of the saved post so the member sees it
    var d = parse(rec.date); state.cursor = firstOfMonth(d);
    render();
  });
  $("#pCancel").addEventListener("click", closeDialog);
  $("#pDelete").addEventListener("click", function () {
    if (!editing) return;
    posts = posts.filter(function (p) { return p.id !== editing.id; });
    save(); closeDialog(); render();
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });

  render();
})();
