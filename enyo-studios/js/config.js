/* ==========================================================================
   ENYA STUDIOS — SITE CONFIG
   --------------------------------------------------------------------------
   Everything you are likely to change lives in this one file.
   Leave a value as "" until you have it. Empty links are safe: the site
   shows the button but nothing breaks.
   ========================================================================== */
window.ENYO_CONFIG = {
  /* Names */
  brandName: "Enya Studios",   // the membership site
  parentBrand: "Enya",         // the clothing brand

  /* ---- Checkout (Stan Store) ----------------------------------------------
     This site never handles payments. The plan buttons just send people to
     your Stan Store. Until you add a link for a specific plan, its button
     opens the store page (storeUrl). Once each product exists in Stan Store,
     paste its direct link into tier1 / tier2 / tier3 so the button goes
     straight to the right product. */
  checkout: {
    storeUrl: "https://stan.store/enyaauk",
    tier1: "https://stan.store/enyaauk/p/the-independent-founder-",   // The Independent Founder — £29.99 one-off
    tier2: "",          // The Studio Pro — £59.99 / month
    tier3: "",          // Enya Mentorship & Build Studio — £150.00 / month
    manageUrl: ""       // optional: where members manage / cancel (shows "Manage billing" in the account menu)
  },

  /* ---- Booking -----------------------------------------------------------
     Calendly / Cal.com / similar link for the 1-on-1 calls (Tier 3 = 4 a month). */
  bookingUrl: "",
  callsPerMonthTier3: 4,

  /* ---- Social links -------------------------------------------------------
     Full URLs, e.g. "https://www.instagram.com/yourhandle". Blank ones show
     greyed-out in the footer until you fill them in. */
  social: {
    instagram: "",
    tiktok: "",
    facebook: "",
    pinterest: "",
    youtube: ""
  },

  /* ---- Contact / legal ---------------------------------------------------- */
  contactEmail: "",
  legal: { terms: "terms.html", privacy: "privacy.html", refunds: "terms.html#refunds" },

  /* ---- AI brand advisor + AI content strategist ---------------------------
     Leave "" for now. When the AI is built it will live behind a small
     server function (the API key must NEVER go in front-end code like this
     file). Paste that function's URL here and the chat + "Generate Content"
     button start working. See README.md for the request / response format. */
  aiEndpoint: "",

  /* ---- Calendar ------------------------------------------------------------ */
  calendarWeekStartsOn: 1,     // 1 = Monday (UK), 0 = Sunday

  /* ---- Member login + shared community (Supabase) -------------------------
     Both values are PUBLIC by design. They are safe to leave in this file
     because the database itself decides who may see what (see enyo-private/database/).
     NEVER paste the "secret" or "service_role" key here. The site refuses to
     run if you do, and shows a red warning.
     Remove this block (or leave url/key empty) to go back to the demo mode
     where nobody can log in and posts stay in the visitor's own browser. */
  backend: {
    url: "https://ofqbfhmvwlfgruemgupg.supabase.co",
    key: "sb_publishable_RVo4zxcNdyA2ul8YOe1E7w_UMFihUdI"
  },

  /* ---- The ?dev=1 demo switch ----------------------------------------------
     true  = adding ?dev=1 to any page address turns on a small plan switcher
             and makes the site PRETEND to be on any plan, ignoring the
             database. Handy for a client demo. It only changes what that one
             browser shows. It cannot read or write the community.
     false = the switch cannot be turned on at all.
     SET THIS TO false BEFORE YOU LAUNCH. */
  allowDev: true,

  /* ---- Plan shown in demo mode only ----------------------------------------
     Used only when no database is configured, or while ?dev=1 is on.
     0 = no plan yet (every tool shows a "sneak peek"); 1, 2, 3 = pretend to be
     on that plan. With the database switched on, a member's plan comes from
     their account instead and this value is ignored.

     Be clear about what the locks are: the tools, templates and manufacturer
     list ship inside the page, so a technical visitor can still read them.
     The locks control what the page SHOWS. The only part the database truly
     protects is the community (posts, replies and member names). */
  defaultTier: 0
};
