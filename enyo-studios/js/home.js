/* Landing page: render the reviews section only if real reviews exist. */
(function () {
  "use strict";
  var list = (window.ENYO_REVIEWS || []).filter(function (r) { return r && r.text; });
  var section = document.getElementById("reviews");
  if (!section || !list.length) return; // stays hidden

  var grid = document.getElementById("reviewGrid");
  var stars = function (n) {
    var out = "";
    for (var i = 0; i < 5; i++) out += i < n ? ENYO.icon("star") : "";
    return '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">' + out + "</span>";
  };
  grid.innerHTML = list.map(function (r) {
    var n = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
    return '<article class="card review">' + stars(n) +
      "<blockquote>" + ENYO.esc(r.text) + "</blockquote>" +
      "<footer>" + ENYO.esc(r.name || "Member") + (r.date ? " · " + ENYO.esc(r.date) : "") + "</footer></article>";
  }).join("");

  var avg = list.reduce(function (a, r) { return a + (r.rating || 5); }, 0) / list.length;
  document.getElementById("reviewStars").outerHTML = '<div class="small muted">' + avg.toFixed(1) + " / 5 from " + list.length + (list.length === 1 ? " review" : " reviews") + "</div>";
  section.hidden = false;
})();
