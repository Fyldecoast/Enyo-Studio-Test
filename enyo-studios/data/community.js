/* Community ("Enya Studio Circle") content.

   channels:  the rooms on the left. Edit labels / descriptions, add or remove.
              `id` must be lowercase letters, numbers or hyphens.
   samples:   example posts that only appear when you press "Load sample posts"
              (a button shown when the dev switcher is on: add ?dev=1 to the page
              address). They are labelled "Sample" on the page. Handy for demos.
   directory: founders who've agreed to be listed.
              Format: { name: "Name", brand: "Brand", focus: "Streetwear", url: "https://instagram.com/..." }

   IMPORTANT: when the database is switched on (js/config.js > backend) posts are
   shared between members. Without it they stay in each visitor's own browser.
   The channel ids below are ALSO stored in the database (table
   community_channels). If you add a channel here, add it there too or posting
   to it will fail. See database/SETUP.md. */
window.ENYO_COMMUNITY = {
  channels: [
    { id: "intros",    label: "Introductions",            desc: "Say hello and tell us about your brand." },
    { id: "general",   label: "General",                  desc: "Anything on your mind as a fashion founder." },
    { id: "techpacks", label: "Tech packs & sampling",    desc: "Questions about specs, samples and fixing what comes back wrong." },
    { id: "sourcing",  label: "Manufacturers & sourcing", desc: "Finding, vetting and working with factories." },
    { id: "content",   label: "Content & marketing",      desc: "Hooks, launches, socials and what's working." },
    { id: "wins",      label: "Wins & launches",          desc: "Share a milestone, a drop or a first sale." },
    { id: "qa",        label: "Weekly Q&A",               desc: "The weekly thread for questions and feedback." }
  ],

  samples: [
    { channel: "intros", title: "Hi, I'm starting a loungewear brand", body: "Just finished my first tech pack and about to approach factories. Excited to learn from everyone here.", replies: ["Welcome! Which factory type are you leaning towards?"] },
    { channel: "techpacks", title: "How many sample rounds is normal?", body: "My first sample came back with the wrong waistband. Is it normal to need three rounds before bulk?", replies: ["Two to three is common. Write the fixes down against the spec each round.", "Always get the pre-production sample approved in writing."] },
    { channel: "sourcing", title: "MOQ of 50 per style: negotiable?", body: "A factory quoted 100 per style but I can only afford 50. Has anyone had luck negotiating it down?", replies: [] },
    { channel: "wins", title: "First sale!", body: "Sold my first piece this morning. Small win but it feels huge.", replies: ["Congratulations!"] }
  ],

  directory: []
};
