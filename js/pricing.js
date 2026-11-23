/* Pricing page: renders plan cards + comparison table from data/plans.js.
   Buttons go to the checkout link for each plan (see js/config.js > checkout). */
(function () {
  "use strict";
  var plans = window.ENYO_PLANS || [];

  document.getElementById("plans").innerHTML = plans.map(function (p) {
    var cls = p.tier === 2 ? " plan--featured" : p.tier === 3 ? " plan--top" : "";
    var url = ENYO.checkoutUrl(p.tier);
    var per = p.billing === "oneoff" ? "one-off" : "/ month";
    var label = (p.cta || "Choose plan").replace("{amt}", ENYO.fmtGBP(p.price));
    return (
      '<article class="plan' + cls + '">' +
      (p.badge ? '<span class="chip chip--dark plan-badge">' + ENYO.esc(p.badge) + "</span>" : "") +
      '<div class="plan-head">' +
        '<div class="plan-title">' +
          (p.kind ? '<span class="chip chip--outline plan-kind">' + ENYO.esc(p.kind) + "</span>" : "") +
          "<h3>" + ENYO.esc(p.name) + '</h3><p class="plan-for">' + ENYO.esc(p.forWho) + "</p>" +
        "</div>" +
        (p.art ? '<img class="plan-art" src="' + ENYO.esc(p.art) + '" alt="" width="340" height="506" loading="lazy">' : "") +
      "</div>" +
      '<div class="plan-price"><span class="amt">' + ENYO.fmtGBP(p.price) + '</span><span class="per">' + per + "</span></div>" +
      (p.priceNote ? '<p class="plan-note">' + ENYO.esc(p.priceNote) + "</p>" : "") +
      (p.inherits ? '<p class="plan-inherits"><b>Includes: ' + ENYO.esc(p.inherits) + "</b></p>" : "") +
      '<ul class="plan-feats">' + p.features.map(function (f) {
        return "<li>" + ENYO.icon("check") + "<span><b>" + ENYO.esc(f.b) + "</b>" + (f.t ? " " + ENYO.esc(f.t) : "") + "</span></li>";
      }).join("") + "</ul>" +
      '<a class="btn btn--block" data-tier="' + p.tier + '" href="' + (url ? ENYO.esc(url) : "#") + '"' +
        (url ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + ENYO.esc(label) + "</a>" +
      "</article>"
    );
  }).join("");

  document.getElementById("plans").addEventListener("click", function (e) {
    var a = e.target.closest("a[data-tier]");
    if (a) ENYO.goCheckout(parseInt(a.dataset.tier, 10), e);
  });

  var yes = '<span class="yes" role="img" aria-label="Included">' + ENYO.icon("check") + "</span>";
  var no = '<span class="no" role="img" aria-label="Not included">&ndash;</span>';
  function cell(v) {
    if (typeof v === "string") return '<span class="txt">' + ENYO.esc(v) + "</span>";
    return v ? yes : no;
  }
  var head = "<thead><tr><th scope=\"col\">Platform features &amp; deliverables</th>" + plans.map(function (p) {
    return '<th scope="col">' + ENYO.esc(p.name) + "<br>" + ENYO.esc(ENYO.priceLabel(p)) + "</th>";
  }).join("") + "</tr></thead>";
  var body = "<tbody>" + (window.ENYO_MATRIX || []).map(function (r) {
    return '<tr><th scope="row" style="font-weight:500;text-align:left">' + ENYO.esc(r[0]) + "</th>" +
      [1, 2, 3].map(function (i) { return "<td>" + cell(r[i]) + "</td>"; }).join("") + "</tr>";
  }).join("") + "</tbody>";
  document.getElementById("matrix").insertAdjacentHTML("beforeend", head + body);
})();
