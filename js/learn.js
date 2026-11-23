/* Learn page: class cards. The classes (and their video links) load from the
   members' database after login, so a paid link is never in the page files. */
(function () {
  "use strict";
  var el = document.getElementById("courses");
  el.innerHTML = ENYO.content.skeleton(6);
  if (ENYO.locked) return;

  ENYO.content.load(["learn"]).then(function (res) {
    var r = res.rows.learn;
    if (!res.ok || !r || !r.items) { ENYO.content.notice(el, res.ok ? "none" : res.reason); return; }
    el.innerHTML = r.items.map(function (c, i) {
      var live = c.status === "live" && /^https:\/\//.test(c.url || "");
      var n = String(i + 1).padStart(2, "0");
      return '<article class="card course"><span class="num">' + n + "</span>" +
        "<h3>" + ENYO.esc(c.title) + "</h3>" +
        '<p class="small" style="margin:0;color:#3b3a37">' + ENYO.esc(c.blurb || "") + "</p>" +
        '<div class="foot">' + (live
          ? '<a class="btn btn--sm" href="' + ENYO.esc(c.url) + '" target="_blank" rel="noopener noreferrer">Start learning ' + ENYO.icon("arrowRight") + "</a>"
          : '<span class="chip">Coming soon</span>') + "</div></article>";
    }).join("");
  });
})();
