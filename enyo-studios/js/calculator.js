/* Pricing calculator.

   True cost per unit =
       cost per unit + labelling per unit + marketing per unit
     + (import duties + freight + polymailer + thank-you card + sticker + tissue + other packaging) / order quantity

   For each markup (2x, 2.5x, 3x):
       retail price  = true cost x markup
       PROFIT        = retail price - true cost
       PROFIT MARGIN = profit / retail price   (margin is measured on the SELLING price, not on cost)

   Wholesale (if a % is entered):
       wholesale price  = retail price x wholesale %
       WHOLESALE MARGIN = (wholesale price - true cost) / wholesale price

   Note: a 2x markup is a 50% margin and a 3x markup is about 66.7%.
   Not included (yet): VAT, payment processing fees, returns allowance. */
(function () {
  "use strict";
  var MARKUPS = [2, 2.5, 3];
  var PER_UNIT = ["cost", "label", "mkt"];
  var TOTALS = ["duties", "freight", "poly", "card", "sticker", "tissue", "extra"];
  var ALL = PER_UNIT.concat(TOTALS, ["qty", "ws"]);
  var WS_DEFAULT = "50";

  function num(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isFinite(v) && v > 0 ? v : 0;
  }

  function compute() {
    var qty = Math.floor(num("qty"));
    var perUnit = PER_UNIT.reduce(function (a, k) { return a + num(k); }, 0);
    var totals = TOTALS.reduce(function (a, k) { return a + num(k); }, 0);
    var spread = qty > 0 ? totals / qty : 0;
    var trueCost = perUnit + spread;
    var wsRaw = parseFloat(document.getElementById("ws").value);
    var ws = isFinite(wsRaw) && wsRaw > 0 ? Math.min(wsRaw, 100) : 0;   // 0 = hide wholesale
    return {
      qty: qty, totals: totals, trueCost: trueCost, ws: ws,
      needsQty: qty === 0 && totals > 0,
      rows: MARKUPS.map(function (m) {
        var price = trueCost * m, profit = price - trueCost;
        var wprice = price * (ws / 100);
        return {
          m: m, price: price, profit: profit, margin: price > 0 ? (profit / price) * 100 : 0,
          wprice: wprice, wmargin: wprice > 0 ? ((wprice - trueCost) / wprice) * 100 : 0
        };
      })
    };
  }

  function render() {
    var r = compute();
    document.getElementById("trueCost").textContent = ENYO.fmtGBP(r.trueCost);
    document.getElementById("markups").innerHTML = r.rows.map(function (x) {
      return '<div class="markup"><div class="m">' + x.m + "X markup</div>" +
        '<div class="price">' + ENYO.fmtGBP(x.price) + "</div>" +
        '<div class="row">Profit <b>' + ENYO.fmtGBP(x.profit) + "</b></div>" +
        '<div class="row">Margin <b>' + x.margin.toFixed(1) + "%</b></div>" +
        (r.ws ? '<div class="row">Wholesale price <b>' + ENYO.fmtGBP(x.wprice) + "</b></div>" +
                '<div class="row">Wholesale margin <b>' + x.wmargin.toFixed(1) + "%</b></div>" : "") +
        "</div>";
    }).join("");
    document.getElementById("calcNote").textContent = (r.needsQty
      ? "Enter your bulk order quantity so total-order costs (duties, freight, packaging) can be spread across each unit. They are not included yet."
      : "Margin is calculated on the selling price. VAT, payment fees and returns aren't included.") +
      (r.ws ? " Wholesale figures assume stockists pay " + r.ws + "% of your retail price." : "");
  }

  function save() {
    var data = {};
    ALL.forEach(function (id) { data[id] = document.getElementById(id).value; });
    ENYO.store.set("calc", data);
  }

  // Restore last inputs on this device
  var saved = ENYO.store.get("calc", {});
  ALL.forEach(function (id) { if (saved[id] != null) document.getElementById(id).value = saved[id]; });
  if (saved.ws == null) document.getElementById("ws").value = WS_DEFAULT;

  document.getElementById("calcForm").addEventListener("input", function () { render(); save(); });
  document.getElementById("calcForm").addEventListener("submit", function (e) { e.preventDefault(); });
  document.getElementById("calcReset").addEventListener("click", function () {
    ALL.forEach(function (id) { document.getElementById(id).value = id === "ws" ? WS_DEFAULT : ""; });
    ENYO.store.remove("calc"); render();
  });
  render();
})();
