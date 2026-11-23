/* Community ("Enya Studio Circle"): channels, posts and replies.

   TWO MODES (the page picks one by itself):

   1. SHARED (real): when the database is switched on in js/config.js
      (backend: { url, key }) and the visitor is logged in on The Studio Pro or
      higher, posts are read from and written to the Supabase database, so all
      members see the same posts. Who may read or post is decided by the
      database (enyo-private/database/schema.sql), NOT by this file. Anyone can copy or edit
      this file and still only gets what the database allows them.

   2. LOCAL (demo): with no database configured, or while the ?dev=1 demo
      switch is on, posts are saved in the visitor's own browser only. Nobody
      else can see them. The page says so.

   The rest of the file does not care which mode it is in: it only talks to an
   "adapter" (localAdapter / remoteAdapter below), and every adapter method
   returns a promise.

   Channels, sample posts and the founder directory come from data/community.js.
   NOTE: a channel must also exist in the database. See database/SETUP.md. */
(function () {
  "use strict";
  var $ = ENYO.$;
  var data = window.ENYO_COMMUNITY || { channels: [], samples: [], directory: [] };
  var channels = data.channels || [];
  if (!channels.length) return;

  var remote = ENYO.backendOn();
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var LOAD_FAIL = "The community couldn't be reached just now. Check your connection and refresh the page.";
  var adapter = null;
  var counts = null;                 // { channelId: number } once known
  var currentChannel = channels[0].id;
  var seq = 0;                       // lets a slow answer be ignored if the visitor has moved on

  /* ---- Small helpers ---- */
  function chan(id) { for (var i = 0; i < channels.length; i++) if (channels[i].id === id) return channels[i]; return null; }
  function ago(ts) {
    var s = (Date.now() - ts) / 1000;
    if (!(s >= 0)) return "just now";
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    var d = Math.floor(s / 86400);
    if (d < 30) return d + " d ago";
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function excerpt(t) { t = String(t || ""); return t.length > 150 ? t.slice(0, 150).trim() + "..." : t; }
  function repliesLabel(n) { return n === 1 ? "1 reply" : n + " replies"; }
  function Fail(msg) { var e = new Error(msg); e.friendly = true; return e; }
  function msgOf(err) { return err && err.friendly ? err.message : LOAD_FAIL; }

  /* ======================================================================
     ADAPTER 1: LOCAL (this browser only)
     ====================================================================== */
  function localAdapter() {
    var state = ENYO.store.get("community", { posts: [], samplesLoaded: false });
    if (!state || !state.posts) state = { posts: [], samplesLoaded: !!(state && state.samplesLoaded) };
    function save() { ENYO.store.set("community", state); }
    function find(id) { for (var i = 0; i < state.posts.length; i++) if (state.posts[i].id === id) return state.posts[i]; return null; }
    function me() { return ENYO.store.get("name", "") || "Member"; }
    function view(p) {
      return { id: p.id, channel: p.channel, title: p.title, body: p.body, author: p.author, ts: p.ts, sample: !!p.sample, replyCount: p.replies.length, canDelete: true };
    }
    return {
      mode: "local",
      counts: function () {
        var c = {};
        state.posts.forEach(function (p) { c[p.channel] = (c[p.channel] || 0) + 1; });
        return Promise.resolve(c);
      },
      feed: function (ch) {
        return Promise.resolve(state.posts.filter(function (p) { return p.channel === ch; })
          .sort(function (a, b) { return b.ts - a.ts; }).map(view));
      },
      thread: function (id) {
        var p = find(id);
        if (!p) return Promise.resolve(null);
        return Promise.resolve({
          post: view(p),
          replies: p.replies.map(function (r) { return { id: r.id, body: r.body, author: r.author, ts: r.ts, canDelete: true }; })
        });
      },
      addPost: function (ch, title, body) {
        var p = { id: ENYO.uid(), channel: ch, title: title, body: body, author: me(), ts: Date.now(), replies: [] };
        state.posts.push(p); save();
        return Promise.resolve({ ok: true, id: p.id });
      },
      addReply: function (postId, body) {
        var p = find(postId);
        if (!p) return Promise.resolve({ ok: false, error: "That post is no longer here." });
        p.replies.push({ id: ENYO.uid(), body: body, author: me(), ts: Date.now() });
        save();
        return Promise.resolve({ ok: true });
      },
      delPost: function (id) {
        state.posts = state.posts.filter(function (p) { return p.id !== id; });
        save();
        return Promise.resolve({ ok: true });
      },
      delReply: function (postId, replyId) {
        var p = find(postId);
        if (p) { p.replies = p.replies.filter(function (r) { return r.id !== replyId; }); save(); }
        return Promise.resolve({ ok: true });
      },
      canLoadSamples: function () { return ENYO.devOn() && !state.samplesLoaded; },
      loadSamples: function () {
        (data.samples || []).forEach(function (s, i) {
          state.posts.push({
            id: ENYO.uid() + i, channel: chan(s.channel) ? s.channel : channels[0].id, title: s.title, body: s.body,
            author: "Sample member", ts: Date.now() - (i + 1) * 3 * 3600 * 1000, sample: true,
            replies: (s.replies || []).map(function (t, j) { return { id: ENYO.uid() + "r" + j, body: t, author: "Sample member", ts: Date.now() - (i + 1) * 2 * 3600 * 1000 }; })
          });
        });
        state.samplesLoaded = true; save();
        return Promise.resolve();
      }
    };
  }

  /* ======================================================================
     ADAPTER 2: REMOTE (the shared Supabase database)
     Every request here is checked by the database against the logged-in
     member's real plan. Nothing in this file can widen what they may see.
     ====================================================================== */
  function remoteAdapter(db, myId, isAdmin) {
    var POST_COLS = "id, channel, title, body, created_at, author_id, profiles(display_name)";
    var REPLY_COLS = "id, body, created_at, author_id, profiles(display_name)";

    function problem(res, fallback) {
      var e = (res && res.error) || {}, msg = String(e.message || "");
      if (res && res.status === 401 || /jwt/i.test(msg)) return "Your login has expired. Please log in again.";
      if (/too quickly/i.test(msg)) return msg;   // our own wording from the database
      if (e.code === "42501") return "Your plan doesn't include this.";
      if (e.code === "23514") return "That's too short or too long. Titles need 3 to 140 characters.";
      return fallback;
    }
    function nameOf(row) {
      var p = row.profiles;
      if (Array.isArray(p)) p = p[0];
      return (p && p.display_name) || "Member";
    }
    function mine(row) { return isAdmin || row.author_id === myId; }
    function mapPost(r) {
      var rc = r.community_replies && r.community_replies[0] ? Number(r.community_replies[0].count) || 0 : 0;
      return { id: r.id, channel: r.channel, title: r.title, body: r.body, author: nameOf(r), ts: Date.parse(r.created_at), replyCount: rc, canDelete: mine(r) };
    }
    function mapReply(r) {
      return { id: r.id, body: r.body, author: nameOf(r), ts: Date.parse(r.created_at), canDelete: mine(r) };
    }
    function deleted(res) {
      if (res.error) return { ok: false, error: problem(res, "Couldn't delete that. Please try again.") };
      if (!res.data || !res.data.length) return { ok: false, error: "That couldn't be deleted. It may already be gone." };
      return { ok: true };
    }

    return {
      mode: "remote",
      counts: function () {
        return db.rpc("community_channel_counts").then(function (res) {
          if (res.error) throw Fail(problem(res, LOAD_FAIL));
          var o = {};
          (res.data || []).forEach(function (r) { o[r.channel] = Number(r.posts) || 0; });
          return o;
        });
      },
      feed: function (ch) {
        return db.from("community_posts").select(POST_COLS + ", community_replies(count)")
          .eq("channel", ch).order("created_at", { ascending: false }).limit(100)
          .then(function (res) {
            if (res.error) throw Fail(problem(res, LOAD_FAIL));
            return (res.data || []).map(mapPost);
          });
      },
      thread: function (id) {
        if (!UUID.test(id)) return Promise.resolve(null);
        return Promise.all([
          db.from("community_posts").select(POST_COLS).eq("id", id).maybeSingle(),
          db.from("community_replies").select(REPLY_COLS).eq("post_id", id).order("created_at", { ascending: true }).limit(500)
        ]).then(function (r) {
          if (r[0].error) throw Fail(problem(r[0], LOAD_FAIL));
          if (!r[0].data) return null;
          if (r[1].error) throw Fail(problem(r[1], LOAD_FAIL));
          return { post: mapPost(r[0].data), replies: (r[1].data || []).map(mapReply) };
        });
      },
      addPost: function (ch, title, body) {
        return db.from("community_posts").insert({ channel: ch, title: title, body: body }).select("id").single()
          .then(function (res) {
            if (res.error || !res.data) return { ok: false, error: problem(res, "Couldn't post that. Please try again.") };
            return { ok: true, id: res.data.id };
          });
      },
      addReply: function (postId, body) {
        return db.from("community_replies").insert({ post_id: postId, body: body }).select("id").single()
          .then(function (res) {
            if (res.error || !res.data) return { ok: false, error: problem(res, "Couldn't send that reply. Please try again.") };
            return { ok: true };
          });
      },
      delPost: function (id) { return db.from("community_posts").delete().eq("id", id).select("id").then(deleted); },
      delReply: function (postId, replyId) { return db.from("community_replies").delete().eq("id", replyId).select("id").then(deleted); }
    };
  }

  /* ======================================================================
     Adapters for "not allowed" and "can't connect": read-only and empty.
     ====================================================================== */
  function lockedAdapter() {
    return {
      mode: "locked", readOnly: true,
      counts: function () { return Promise.resolve({}); },
      feed: function () { return Promise.resolve([]); },
      thread: function () { return Promise.resolve(null); }
    };
  }
  function unavailableAdapter() {
    function no() { return Promise.reject(Fail("The community couldn't connect just now. Check your connection and refresh the page.")); }
    return { mode: "unavailable", readOnly: true, counts: no, feed: no, thread: no };
  }

  function chooseAdapter() {
    if (!remote) return Promise.resolve(localAdapter());
    if (!ENYO.backend || !ENYO.backend.ready) return Promise.resolve(unavailableAdapter());
    return ENYO.backend.ready.then(function (b) {
      if (!b.enabled) return unavailableAdapter();
      var a = b.account;
      if (!a) {
        // Signed out. If we only *think* they're a member (cached) but couldn't confirm it, say we can't connect.
        var cached = ENYO.account();
        return cached && parseInt(cached.tier, 10) >= 2 ? unavailableAdapter() : lockedAdapter();
      }
      if (!(a.tier >= 2) || !b.user) return lockedAdapter();
      return remoteAdapter(b.client, b.user.id, !!a.isAdmin);
    });
  }

  /* ---- The notice under the page title: always tells the truth about the mode ---- */
  function setNotice() {
    var box = $("#previewNote");
    if (!box) return;
    var inner = box.querySelector("div");
    if (!inner) return;
    if (adapter.mode === "remote") {
      var p2 = ENYO.plan(2), p3 = ENYO.plan(3);
      var acct = ENYO.backend && ENYO.backend.account;
      var who = acct && !acct.name
        ? " You're posting as &ldquo;Member&rdquo;: add your name from the account menu at the top of the page."
        : " Your posts show the name on your account.";
      inner.innerHTML = "<b>Members only</b><p>Only members on " + ENYO.esc(p2 ? p2.name : "The Studio Pro") + " and " + ENYO.esc(p3 ? p3.name : "the Mentorship plan") +
        " can read or post here." + who + " Please don&rsquo;t share private contact details or documents.</p>";
    } else if (adapter.mode === "locked") {
      box.hidden = true;
    } else if (adapter.mode === "unavailable") {
      inner.innerHTML = "<b>Can&rsquo;t connect</b><p>The community couldn&rsquo;t connect just now. Check your connection and refresh the page.</p>";
    } else if (ENYO.backendConfigured()) {
      inner.innerHTML = "<b>Demo mode</b><p>The demo switch (?dev=1) is on, so posts are saved in this browser only and other members can&rsquo;t see them. Add ?dev=0 to the page address to use the real, shared community.</p>";
    }
    /* otherwise: keep the default "Preview mode" wording from community.html */
  }

  /* ---- Rendering ---- */
  function renderChannels() {
    $("#channels").innerHTML = channels.map(function (c) {
      var n = counts && counts[c.id] ? counts[c.id] : 0;
      return '<a class="chan" href="#c-' + c.id + '"' + (c.id === currentChannel ? ' aria-current="page"' : "") + ">" +
        "<span>" + ENYO.esc(c.label) + "</span>" + (counts ? '<span class="count">' + n + "</span>" : "") + "</a>";
    }).join("");
  }
  function loadCounts() {
    adapter.counts().then(function (c) { counts = c; renderChannels(); }, function () { /* counts are a nicety: leave them blank */ });
  }

  function route() {
    var h = location.hash.replace("#", "");
    if (h.indexOf("t-") === 0 && /^[A-Za-z0-9-]{1,64}$/.test(h.slice(2))) return { thread: h.slice(2), channel: null };
    if (h.indexOf("c-") === 0 && chan(h.slice(2))) return { thread: null, channel: h.slice(2) };
    return { thread: null, channel: channels[0].id };
  }

  function renderFeed(channelId, mine) {
    var c = chan(channelId);
    currentChannel = channelId;
    renderChannels();
    $("#chName").textContent = c.label;
    $("#chDesc").textContent = c.desc || "";
    $("#feed").innerHTML = '<p class="empty">Loading...</p>';
    adapter.feed(channelId).then(function (posts) {
      if (mine !== seq) return;
      $("#feed").innerHTML = (posts.length ? posts.map(function (p) {
        return '<a class="post" href="#t-' + ENYO.esc(p.id) + '">' +
          '<span class="post-main"><span class="t-title">' + ENYO.esc(p.title) + (p.sample ? ' <span class="chip">Sample</span>' : "") + "</span>" +
          '<span class="post-ex">' + ENYO.esc(excerpt(p.body)) + "</span>" +
          '<span class="small muted">' + ENYO.esc(p.author) + " · " + ago(p.ts) + " · " + repliesLabel(p.replyCount) + "</span></span>" +
          ENYO.icon("chevronRight") + "</a>";
      }).join("") : '<p class="empty">No posts in this channel yet. Start the conversation.</p>') +
        (posts.length >= 100 ? '<p class="small muted">Showing the latest 100 posts.</p>' : "");
    }, function (err) {
      if (mine !== seq) return;
      $("#feed").innerHTML = '<p class="empty" role="alert">' + ENYO.esc(msgOf(err)) + "</p>";
    });
  }

  function renderThread(id, mine) {
    $("#threadView").innerHTML = '<p class="empty">Loading...</p>';
    adapter.thread(id).then(function (t) {
      if (mine !== seq) return;
      if (!t) {
        $("#threadView").innerHTML = '<a class="link-arrow" href="#c-' + currentChannel + '">' + ENYO.icon("chevronLeft") + " Back to channels</a>" +
          '<p class="empty">This post isn&rsquo;t available. It may have been deleted.</p>';
        return;
      }
      var p = t.post, c = chan(p.channel);
      currentChannel = c ? p.channel : currentChannel;
      renderChannels();
      $("#threadView").innerHTML =
        '<a class="link-arrow" href="#c-' + currentChannel + '">' + ENYO.icon("chevronLeft") + " Back to " + ENYO.esc(c ? c.label : "channels") + "</a>" +
        '<article class="thread-post">' +
        '<h2 class="h2">' + ENYO.esc(p.title) + (p.sample ? ' <span class="chip" style="vertical-align:middle">Sample</span>' : "") + "</h2>" +
        '<p class="small muted">' + ENYO.esc(p.author) + " · " + ago(p.ts) + "</p>" +
        '<p class="body-text">' + ENYO.esc(p.body) + "</p>" +
        (p.canDelete ? '<button type="button" class="text-btn" data-del-post="' + ENYO.esc(p.id) + '">Delete post</button>' : "") + "</article>" +
        '<h3 class="h3" style="margin:1.8rem 0 .8rem">' + repliesLabel(t.replies.length) + "</h3>" +
        '<div class="replies">' + t.replies.map(function (r) {
          return '<div class="reply"><p class="small muted" style="margin:0 0 .3rem">' + ENYO.esc(r.author) + " · " + ago(r.ts) + "</p>" +
            '<p class="body-text">' + ENYO.esc(r.body) + "</p>" +
            (r.canDelete ? '<button type="button" class="text-btn" data-del-reply="' + ENYO.esc(r.id) + '">Delete</button>' : "") + "</div>";
        }).join("") + "</div>" +
        '<form class="reply-form" id="replyForm"><label class="sr-only" for="replyBody">Your reply</label>' +
        '<textarea class="textarea" id="replyBody" required maxlength="1500" placeholder="Write a reply..." style="min-height:90px"></textarea>' +
        '<button class="btn btn--sm" type="submit">Reply</button></form>';
    }, function (err) {
      if (mine !== seq) return;
      $("#threadView").innerHTML = '<a class="link-arrow" href="#c-' + currentChannel + '">' + ENYO.icon("chevronLeft") + " Back to channels</a>" +
        '<p class="empty" role="alert">' + ENYO.esc(msgOf(err)) + "</p>";
    });
  }

  function show() {
    var mine = ++seq;
    var r = route();
    if (r.thread) {
      renderChannels();
      $("#feedView").hidden = true;
      $("#threadView").hidden = false;
      renderThread(r.thread, mine);
    } else {
      $("#threadView").hidden = true;
      $("#feedView").hidden = false;
      renderFeed(r.channel, mine);
      loadCounts();
    }
  }

  /* ---- Wiring (runs once we know which adapter we have) ---- */
  function wire() {
    var dlg = $("#postDialog");
    var sel = $("#pdChannel");
    sel.innerHTML = channels.map(function (c) { return '<option value="' + c.id + '">' + ENYO.esc(c.label) + "</option>"; }).join("");

    function openDialog() {
      $("#postForm").reset();
      sel.value = currentChannel;
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      $("#pdTitleInput").focus();
    }
    function closeDialog() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }

    var newBtn = $("#newPost");
    if (adapter.readOnly) {
      newBtn.disabled = true;
      newBtn.title = adapter.mode === "locked" ? "Posting is for Studio Pro members and above." : "Can't connect right now.";
    }
    newBtn.addEventListener("click", openDialog);
    $("#pdCancel").addEventListener("click", closeDialog);

    var posting = false;
    $("#postForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (posting || adapter.readOnly) return;
      var title = $("#pdTitleInput").value.trim(), body = $("#pdBody").value.trim();
      if (title.length < 3) { ENYO.toast("Give your post a title of at least 3 characters."); return; }
      if (!body) return;
      var btn = $("#postForm button[type=submit]");
      posting = true; btn.disabled = true; btn.textContent = "Posting...";
      adapter.addPost(sel.value, title, body).then(function (res) {
        posting = false; btn.disabled = false; btn.textContent = "Post";
        if (!res.ok) { ENYO.toast(res.error); return; }
        closeDialog();
        loadCounts();
        location.hash = "#t-" + res.id;
        ENYO.toast(adapter.mode === "local" ? "Posted. Remember: only you can see it in this browser." : "Posted.");
      }, function () {
        posting = false; btn.disabled = false; btn.textContent = "Post";
        ENYO.toast("Couldn't post that. Please try again.");
      });
    });

    var armed = null, armedT;
    function confirmThen(btn, fn) {
      if (armed === btn) { clearTimeout(armedT); armed = null; fn(); return; }
      armed = btn; var old = btn.textContent; btn.textContent = "Click again to delete";
      clearTimeout(armedT);
      armedT = setTimeout(function () { btn.textContent = old; armed = null; }, 3000);
    }
    function failToast() { ENYO.toast("Couldn't do that. Please try again."); }

    $("#threadView").addEventListener("click", function (e) {
      var dp = e.target.closest("[data-del-post]"), dr = e.target.closest("[data-del-reply]");
      var id = route().thread; if (!id) return;
      if (dp) confirmThen(dp, function () {
        adapter.delPost(id).then(function (res) {
          if (!res.ok) { ENYO.toast(res.error); return; }
          counts = null; renderChannels();
          location.hash = "#c-" + currentChannel;
          ENYO.toast("Post deleted.");
        }, failToast);
      });
      if (dr) confirmThen(dr, function () {
        adapter.delReply(id, dr.getAttribute("data-del-reply")).then(function (res) {
          if (!res.ok) { ENYO.toast(res.error); return; }
          show();
        }, failToast);
      });
    });

    var replying = false;
    $("#threadView").addEventListener("submit", function (e) {
      if (e.target.id !== "replyForm") return;
      e.preventDefault();
      var id = route().thread, body = $("#replyBody").value.trim();
      if (!id || !body || replying || adapter.readOnly) return;
      var btn = e.target.querySelector("button[type=submit]");
      replying = true; btn.disabled = true; btn.textContent = "Sending...";
      adapter.addReply(id, body).then(function (res) {
        replying = false;
        if (!res.ok) { btn.disabled = false; btn.textContent = "Reply"; ENYO.toast(res.error); return; }
        show();
      }, function () {
        replying = false; btn.disabled = false; btn.textContent = "Reply";
        failToast();
      });
    });

    /* Sample posts for demos: local mode only, and only while the ?dev=1 switch is on */
    var loadBtn = $("#loadSamples");
    if (adapter.canLoadSamples && adapter.canLoadSamples()) loadBtn.hidden = false;
    loadBtn.addEventListener("click", function () {
      adapter.loadSamples().then(function () { loadBtn.hidden = true; loadCounts(); show(); });
    });

    /* If the member saves a new display name, update the "posting as" hint straight away */
    document.addEventListener("enyo:name", function () { setNotice(); });

    window.addEventListener("hashchange", function () {
      show();
      var top = $(".circle").getBoundingClientRect().top;
      if (top < 0) window.scrollTo(0, window.scrollY + top - 90);
    });

    /* Shared mode: pick up other members' new posts when the member comes back to the tab */
    var hiddenAt = 0;
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (adapter.mode === "remote" && hiddenAt && Date.now() - hiddenAt > 30000 && !route().thread && !dlg.open) show();
    });
  }

  /* ---- Founder directory (optional list from data/community.js) ---- */
  var dir = data.directory || [];
  $("#directory").innerHTML = dir.length
    ? dir.map(function (m) {
        var inner = '<span><span class="t-title">' + ENYO.esc(m.name) + (m.brand ? " · " + ENYO.esc(m.brand) : "") + "</span>" + (m.focus ? '<br><span class="small muted">' + ENYO.esc(m.focus) + "</span>" : "") + "</span>";
        return m.url ? '<a class="thread" href="' + ENYO.esc(m.url) + '" target="_blank" rel="noopener noreferrer">' + inner + ENYO.icon("external") + "</a>" : '<div class="thread">' + inner + "</div>";
      }).join("")
    : '<p class="empty">The founder directory is coming soon.</p>';

  /* ---- Go ---- */
  renderChannels();
  $("#feed").innerHTML = '<p class="empty">Loading...</p>';
  chooseAdapter().then(function (a) {
    adapter = a;
    setNotice();
    wire();
    show();
  });
})();
