/* DEMO CONTENT ONLY. Placeholder text so you can preview the layout of every
   members' page without a database (add ?dev=1 to any page address and pick a
   plan with the switcher). None of this is real: the real material lives in the
   database and is never stored in the website's files.

   This file is loaded only when the database connection is switched off (demo
   mode). Once js/config.js has allowDev:false it is never used, and you can
   delete it. */
window.ENYO_DEMO_CONTENT = {
  "techpacks.categories": { min_tier: 1, payload: { categories: [{ id: "sets", label: "Sets" }, { id: "tees", label: "T-shirts" }] } },
  "techpacks.demo-set": { min_tier: 1, payload: { id: "demo-set", category: "sets", status: "live", order: 0, title: "Demo template: two-piece set", tag: "Demo | Sample only", blurb: "Placeholder card so you can see the layout. The real templates load from the database.", canva: "", pdf: "" } },
  "techpacks.demo-soon": { min_tier: 1, payload: { id: "demo-soon", category: "tees", status: "soon", order: 1, title: "Demo template: coming soon" } },

  "manufacturers.snapshot": { min_tier: 1, payload: { snapshotDate: "Demo", categories: [{ id: "demo", label: "Demo category" }], items: [
    { name: "Demo Factory One", category: "demo", place: "Demo City", moq: "50 pieces" },
    { name: "Demo Factory Two", category: "demo", place: "Demo City", moq: "100 pieces" }] } },
  "manufacturers.directory": { min_tier: 2, payload: { categories: [{ id: "demo", label: "Demo category" }], items: [
    { name: "Demo Factory One", category: "demo", place: "Demo City", moq: "50 pieces", url: "", badges: [], checked: "" },
    { name: "Demo Factory Two", category: "demo", place: "Demo City", moq: "100 pieces", url: "", badges: ["Demo badge"], checked: "Demo" }] } },
  "manufacturers.guide": { min_tier: 2, payload: {
    types: [{ title: "Demo type", chip: "Sample", text: "Placeholder text for the layout." }],
    framework: [{ title: "Demo step", open: true, paras: ["Placeholder paragraph with **bold** text."] }],
    protip: { lead: "Demo tip.", text: "Placeholder tip text." },
    find: [{ title: "Demo step one", text: "Placeholder instructions." }],
    outreach: "Subject: Demo\n\nHi [Factory Name],\n\nThis is placeholder text.",
    checklist: [{ title: "Demo group", why: "Placeholder explanation.", items: [{ k: "fab1", text: "Demo check item one" }, { k: "fab2", text: "Demo check item two" }] }]
  } },

  "roadmap": { min_tier: 2, payload: { sections: [
    { id: "brand-foundation", title: "Demo section one", items: [{ id: "bf1", text: "Demo milestone one" }, { id: "bf2", text: "Demo milestone two" }] },
    { id: "product-development", title: "Demo section two", items: [{ id: "pd3", text: "Demo tech pack milestone", phase: "Tech Pack" }, { id: "pd4", text: "Demo sourcing milestone", phase: "Sourcing Manufacturers" }, { id: "pd5", text: "Demo sampling milestone", phase: "Sampling" }] }
  ] } },

  "learn": { min_tier: 1, payload: { items: [
    { id: "l1", title: "Demo class one", blurb: "Placeholder description.", status: "soon", url: "" },
    { id: "l2", title: "Demo class two", blurb: "Placeholder description.", status: "soon", url: "" }] } }
};
