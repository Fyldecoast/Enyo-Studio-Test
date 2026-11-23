/* Membership plans. Edit names, prices and bullet points here — the pricing
   page, the "sneak peek" lock panels and the dashboard all read from this file.

   billing: "oneoff"  -> paid once        billing: "month" -> recurring monthly
   art:     small model photo shown on the plan card (remove the line to hide it)
   cta:     button text. {amt} becomes the formatted price, e.g. £59.99

   Source: the "payment plan" slide in your Canva notes (Nov 2026). */
window.ENYO_PLANS = [
  {
    tier: 1,
    id: "independent",
    name: "The Independent Founder",
    kind: "One-time purchase",
    price: 29.99,
    billing: "oneoff",
    priceNote: "Instant digital download. Lifetime access.",
    forWho: "Best for founders needing immediate production spec blueprints.",
    inherits: "",
    art: "assets/img/campaign-1.png",
    cta: "Buy now · {amt}",
    features: [
      { b: "Multi-Style Tech Pack Library (up to 3 templates, Canva + PDF):", t: "Professional spec blueprints built for everything from simple everyday basics to complex, high-detail garments." },
      { b: "Core Manufacturer Snapshot:", t: "A foundational starter list of vetted global apparel factories." },
      { b: "Instant lifetime download access.", t: "" }
    ]
  },
  {
    tier: 2,
    id: "studio-pro",
    name: "The Studio Pro",
    kind: "Platform membership",
    price: 59.99,
    billing: "month",
    priceNote: "Billed monthly. Cancel anytime.",
    badge: "Most popular",
    forWho: "Constantly updated manufacturer list, AI brand planner & pricing tools.",
    inherits: "Everything in The Independent Founder (£29.99 one-off)",
    art: "assets/img/campaign-2.png",
    cta: "Subscribe · {amt} / month",
    features: [
      { b: "Live-updated global manufacturer directory:", t: "Constantly updated factory contacts, MOQs, location tags & cold-outreach templates." },
      { b: "AI Brand Manager & Content Script Planner:", t: "Hooks, video scripts, captions & content calendar." },
      { b: "Garment Pricing Calculator:", t: "Wholesale margins, COGS & retail markups." },
      { b: "Brand Launch Roadmap & milestone tracker.", t: "" },
      { b: "Unlimited tech pack library:", t: "Our entire expanded multi-style library, not just 3 templates." },
      { b: "Priority access to new tech pack drops.", t: "" },
      { b: "Private founder community access.", t: "" }
    ]
  },
  {
    tier: 3,
    id: "mentorship",
    name: "Enya Mentorship & Build Studio",
    kind: "Elite membership",
    price: 150,
    billing: "month",
    priceNote: "Billed monthly. Cancel anytime.",
    forWho: "Full Studio Pro access plus AI mock-up help & 1-on-1 design audits.",
    inherits: "Everything in The Studio Pro (£59.99 / month)",
    art: "assets/img/campaign-3.png",
    cta: "Join Mentorship · {amt} / month",
    features: [
      { b: "AI Garment Mock-Up Generation assistance:", t: "Direct help generating realistic renders from your tech pack specs." },
      { b: "1-on-1 Design & Tech Pack Audits:", t: "Pre-production review of your tech packs before they go to factories, to catch costly sample errors." },
      { b: "1-on-1 Brand Strategy & Web Coaching:", t: "Direct mentorship on collection flow & website launch." },
      { b: "4 one-to-one calls a month:", t: "Book them straight from your dashboard." },
      { b: "VIP priority founder support channel:", t: "A direct line for urgent production & factory roadblocks." }
    ]
  }
];

/* Comparison table rows: [label, tier1, tier2, tier3]
   1 = included, 0 = not included, or a short piece of text to show instead. */
window.ENYO_MATRIX = [
  ["Multi-style tech pack library (Canva + PDF)", "Up to 3 templates", "Unlimited", "Unlimited"],
  ["Manufacturer list", "Starter snapshot", "Live directory", "Live directory"],
  ["Cold-outreach templates & vetting guide", 0, 1, 1],
  ["AI brand manager & content script planner", 0, 1, 1],
  ["Garment pricing calculator (wholesale, COGS, retail)", 0, 1, 1],
  ["Brand launch roadmap & milestone tracker", 0, 1, 1],
  ["Priority access to new tech pack drops", 0, 1, 1],
  ["Private founder community", 0, 1, 1],
  ["AI garment mock-up generation assistance", 0, 0, 1],
  ["1-on-1 design & tech pack audits", 0, 0, 1],
  ["1-on-1 brand strategy & web coaching (4 calls a month)", 0, 0, 1],
  ["VIP priority founder support channel", 0, 0, 1]
];
