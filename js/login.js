/* Login page: email -> 6-digit code -> in. See js/backend.js. */
(function () {
  "use strict";
  var $ = ENYO.$;
  var B = ENYO.backend;

  // Only ever send people on to one of our own pages (never an outside address).
  var next = (function () {
    var n = new URLSearchParams(location.search).get("next") || "";
    return /^[a-z0-9-]+\.html$/i.test(n) && n !== "login.html" ? n : "dashboard.html";
  })();

  var email = "";
  var els = { off: $("#loginOff"), emailForm: $("#emailForm"), codeForm: $("#codeForm"), done: $("#doneBox") };

  function show(which) {
    ["off", "emailForm", "codeForm", "done"].forEach(function (k) { els[k].hidden = k !== which; });
  }
  function say(el, text, ok) { el.textContent = text || ""; el.hidden = !text; el.classList.toggle("is-ok", !!ok); }

  function showDone(acct) {
    var plan = ENYO.plan(acct.tier);
    if (acct.tier >= 1) {
      $("#doneTitle").textContent = "You’re in" + (acct.name ? ", " + acct.name : "") + ".";
      $("#doneText").textContent = "Signed in as " + acct.email + ". Your plan: " + (plan ? plan.name : "active") + ".";
    } else {
      $("#doneTitle").textContent = "You’re logged in, but there’s no plan on this email yet.";
      $("#doneText").textContent = "Signed in as " + acct.email + ". If you’ve just bought a plan, it’s switched on by hand, so please allow a little time. Make sure you bought with this same email address. Otherwise you can pick a plan below.";
      $("#doneGo").textContent = "See membership plans";
      $("#doneGo").setAttribute("href", "pricing.html");
    }
    if (acct.tier >= 1) $("#doneGo").setAttribute("href", next);
    show("done");
  }

  B.ready.then(function () {
    if (!ENYO.backendOn() || !B.enabled) { show("off"); return; }
    if (B.account) { showDone(B.account); return; }
    show("emailForm");
    $("#emailInput").focus();
  });

  $("#emailForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#emailInput").value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { say($("#emailMsg"), "Please enter a valid email address."); return; }
    say($("#emailMsg"), "");
    $("#emailBtn").disabled = true; $("#emailBtn").textContent = "Sending...";
    B.sendCode(v).then(function (res) {
      $("#emailBtn").disabled = false; $("#emailBtn").textContent = "Email me a code";
      if (!res.ok) { say($("#emailMsg"), res.error); return; }
      email = v;
      $("#sentTo").textContent = v;
      say($("#codeMsg"), "");
      $("#codeInput").value = "";
      show("codeForm");
      $("#codeInput").focus();
    });
  });

  $("#codeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = $("#codeInput").value.replace(/\s+/g, "");
    if (!/^[0-9]{6,10}$/.test(code)) { say($("#codeMsg"), "Enter the digits from the email."); return; }
    say($("#codeMsg"), "");
    $("#codeBtn").disabled = true; $("#codeBtn").textContent = "Checking...";
    B.verifyCode(email, code).then(function (res) {
      $("#codeBtn").disabled = false; $("#codeBtn").textContent = "Log in";
      if (!res.ok) { say($("#codeMsg"), res.error); return; }
      showDone(res.account);
    });
  });

  var cool = 0;
  $("#resendBtn").addEventListener("click", function () {
    var btn = this;
    if (btn.disabled) return;
    btn.disabled = true;
    B.sendCode(email).then(function (res) {
      say($("#codeMsg"), res.ok ? "A new code is on its way. Use the newest one." : res.error, res.ok);
      var left = 30; btn.textContent = "Send a new code (" + left + ")";
      clearInterval(cool);
      cool = setInterval(function () {
        left--;
        if (left <= 0) { clearInterval(cool); btn.disabled = false; btn.textContent = "Send a new code"; }
        else btn.textContent = "Send a new code (" + left + ")";
      }, 1000);
    });
  });
  $("#changeBtn").addEventListener("click", function () { show("emailForm"); $("#emailInput").focus(); });
  $("#doneOut").addEventListener("click", function () { B.signOut().then(function () { location.href = "index.html"; }); });
})();
