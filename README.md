# Enya Studios — members website

Plain HTML, CSS and JavaScript. No build step, no installs.

**To run it:** open the folder in VS Code and either double-click `index.html`, or use the *Live Server* extension (right-click `index.html` → *Open with Live Server*).

## Folders: what you upload and what you never do

This download has two folders next to each other:

- **`enyo-studios/`** is the website. This is the ONLY folder you upload to your host.
- **`enyo-private/`** is for you alone: the database files, your admin commands, and the source files for the paid content (factory list, Canva links, guides). **Never upload it, never put it inside the website folder, never commit it to a public repository.** The whole point of moving the paid content out of the website is defeated if it sits beside it.

## Login, plans and the shared community (read `../enyo-private/database/SETUP.md` first)

Members **log in with a 6-digit code emailed to them** (no passwords). Their plan is stored in your Supabase database and is switched on by you from the SQL editor after you see their payment in Stan Store (`enyo-private/database/admin.sql` has the one-line commands). A visitor with no login, or with no plan on their email, sees every member tool as a faded "sneak peek" with a *Pick a plan* button.

**The community and the paid content are genuinely protected.** Posts, replies and member names live in the database, and so does the paid material: the tech pack templates (with their Canva links), the manufacturer list, the vetting guide, outreach email, sample checklist, roadmap and class list. The database itself only hands each piece to a logged-in member whose plan covers it, and a visitor who is not logged in, a logged-in member on a lower plan, or someone who edits the website files gets nothing. See "What protection means" below for the honest limits.

**Before it works for real members** you must do the Supabase dashboard steps in `enyo-private/database/SETUP.md` (your own email sender, and the code-style email templates). Until you do, only people on your own Supabase team can receive a login code.

### Showing it to the client (demo mode)

Add `?dev=1` to any page address once (e.g. `dashboard.html?dev=1`). A small bar appears (none / 1 / 2 / 3) so you can preview each plan with no login. While it is on, the site ignores the database, community posts are saved in that browser only (the page says "Demo mode"), and the members' pages show clearly-fake placeholder content from `js/demo-content.js`. It **stays on in that browser** until you press *hide* (or add `?dev=0`). **Before launch set `allowDev: false` in `js/config.js`** so the switch cannot be turned on at all.

---

## Plans (from the payment-plan slide)

| Plan | Price | Opens |
|---|---|---|
| Tier 1 — The Independent Founder | £29.99 one-off | Tech Pack Gallery, dashboard, **Core Manufacturer Snapshot** (downloadable list, fixed) |
| Tier 2 — The Studio Pro | £59.99 / month | Everything in Tier 1 + live manufacturer directory, vetting guide and outreach template, calculator, roadmap, content planner, AI chat, community |
| Tier 3 — Enya Mentorship & Build Studio | £150.00 / month | Everything in Tier 2 + mock-up help, 1-on-1 audits, strategy and web coaching (4 calls a month), VIP support |

Edit names, prices and bullets in `data/plans.js`. Which page needs which plan is set on each page's `<body data-min-tier="N">`; one section inside a page uses `<div data-tier-gate="N">` (the live directory on `manufacturers.html`).

### What protection means (read this)

The locks on the pages (`data-min-tier`, `data-tier-gate`) still only decide what the page *shows*, and anyone can read the page source. What makes the paid material safe is that **it is not in the page files at all**. It is fetched from the database after login, and the database checks the plan on every request (`public.member_content`, one row per piece, each with the lowest plan allowed to read it).

What that stops: anyone who is not logged in, anyone whose email has no plan, a Tier 1 member reading Tier 2 content (for example the full factory directory with its profile links), and anyone editing the site files or browser storage to pretend to be a higher plan.

What it cannot stop:
- **A paying member copying what they can legitimately see**, by screenshot, copy-and-paste or saving the page. The content has to reach their screen to be useful.
- **Canva links.** A Canva share link works for anyone who has it. A member can pass it on. Canva has its own sharing settings; use those, or hand out PDFs instead (below).
- **The calculator and content-planner code.** They are small client-side programs (arithmetic and a calendar), so their code is in the page files. There is nothing in them worth stealing beyond the formulas, and the calculator is not paid *content*. If that ever changes, the work would have to move to a server function.
- **Login sharing.** A member can give someone their email and a code. The Terms forbid it and each code works once, but it is not technically prevented.

**PDFs.** Do not put paid PDFs in the website folder: anyone who guesses the address can download them. Upload them in Supabase > Storage > `member-files` instead, into a folder named by plan (`t1/` for Tier 1 and up, `t2/` for Tier 2 and up, `t3/` for Tier 3 only), and put the path (for example `t1/sets-master.pdf`) in the template's `pdf` field. The PDF button then asks the database for a two-minute link, which it only gives to a member whose plan covers that folder.

## What's in here

| Page | File | Notes |
|---|---|---|
| Landing | `index.html` | Opener, capabilities, tech pack teaser, reviews (hidden until real ones exist), FAQ |
| Membership | `pricing.html` | 3 plans + comparison table, read from `data/plans.js`; buttons go to your Stan Store |
| Dashboard | `dashboard.html` | Plan-aware: Tier 1 sees the gallery and snapshot, locked tools show a plan chip |
| Community | `community.html` | In-site channels, posts and replies (see below). Studio Pro and up |
| Tech packs | `tech-packs.html` | Tech Pack Gallery: pick a template and open it in Canva. One live template, five "coming soon" |
| Resources ▾ | | Dropdown only (no `/resources` page). Tech Pack Gallery is the first item |
| – Content Planner | `content-planner.html` | AI Content Strategist + month/list calendar |
| – Pricing Calculator | `calculator.html` | True cost per unit, 2x / 2.5x / 3x markups, **wholesale price and margin** (default 50% of retail, editable) |
| – Brand Launch Roadmap | `roadmap.html` | 28 milestones, progress bar, notes per step |
| – Manufacturer Vetting Guide | `manufacturers.html` | Tier 1: snapshot table + CSV download. Tier 2/3: live directory, guide, outreach template |
| – Learn | `learn.html` | Class cards (loaded from the database; members only) with a "Classes & Guides are loading" notice |
| Legal | `terms.html`, `privacy.html` | Your text, edited on 23 Nov 2026 to match the real plans and the member database; linked in the footer |

## Where to change things

| I want to change... | Edit this |
|---|---|
| Stan Store links, booking link, social links, email | `js/config.js` (`checkout`, `bookingUrl`, `social`, `contactEmail`) |
| Database address + public key, demo switch on/off | `js/config.js` (`backend`, `allowDev`) |
| Give / remove / extend someone's plan, make an admin, moderate | `enyo-private/database/admin.sql` (run in the Supabase SQL editor) |
| Database structure and security rules | `enyo-private/database/schema.sql` (already applied; safe to re-run) |
| Plan names, prices, bullet points, comparison table | `data/plans.js` |
| **Paid content** (roadmap, tech pack templates + Canva links, manufacturer list, vetting guide, outreach email, checklist, classes) | `enyo-private/content/*.json`, then run `build_seed.py` and paste `seed.sql` into the Supabase SQL editor. See `enyo-private/content/README.md`. Keep each roadmap `id` the same once members are ticking things |
| Real member reviews | `data/reviews.js` |
| Community channels / founder directory | `data/community.js` |
| Vetting guide text, FAQ answers, page copy | The `.html` file itself |
| Colours, fonts, spacing | top of `css/styles.css` (`:root`) |
| Navigation / footer | `js/app.js` (`headerHTML`, `footerHTML`) — changes apply to every page |
| Terms / Privacy | Edit the `.html` pages directly |

**Checkout links.** `checkout.storeUrl` is `https://stan.store/enyaauk`. Every buy button goes there until you paste a direct product link into `tier1`, `tier2` or `tier3`. `manageUrl` is the link used for "Manage billing" in the account menu. The site never handles payments.

**Removed from `config.js`:** `communityUrl` (the community is now on the site). `weeklyThreads` is gone from `data/community.js`.

## Fonts

Neue Montreal, Monument Extended, Sackers Gothic and TT Commons Pro are commercial fonts, so they are **not included**. The site uses free look-alikes (Inter Tight, Archivo Expanded, Jost). Once you own **web licences**, drop the `.woff2` files in `assets/fonts/licensed/` and un-comment the matching blocks in `css/fonts.css`. Nothing else needs to change.

## What is real and what is a placeholder

**Real (stored in the Supabase database):** member login, each member's plan, display name, the **community** (channels, posts, replies, deleting your own posts, admin moderation), and **all paid content** (templates, factory list, guides, roadmap, classes, PDFs).

**Saved in the visitor's own browser only:** calculator inputs, roadmap ticks and notes, dashboard to-dos and notes, content calendar posts, sample checklist ticks. These do not sync between devices, and clearing browser data wipes them.

**Not done yet:**
- **Automatic plans.** Stan Store does not tell the website who paid, so you switch plans on by hand (see `enyo-private/database/SETUP.md`, section "How a buyer gets access", which also explains what automating it would take).
- **Booking.** The "Book a call" button opens `bookingUrl` once set.
- **AI brand advisor + AI content strategist.** See below.
- **Manufacturer snapshot.** Tier 1 gets the starter list (no profile links) and a CSV built from it when they click. Set `snapshotDate` in `enyo-private/content/manufacturers.json` to show "Snapshot as of ...".
- **"Up to 3 templates" on Tier 1** is enforced per template, not as a count: each template is its own database row with its own plan. Keep three at plan 1 and give every further template `"min_tier": 2` in `techpacks.json`. Tier 1 members then never receive the rest. (Currently only one is live, so nothing is held back yet.)
- **The AI endpoint.** When you build it, it must check the member's login and plan itself (see below). The database cannot do that for a separate server.

## Switching the AI on (later)

The chat widget and the "Generate content" button both call `aiEndpoint` in `js/config.js`. **Never put an API key in this front-end code.** Build a small server function (Netlify / Vercel / Cloudflare function) that holds the key, checks the member is allowed, rate-limits, calls the model, and returns JSON.

Chat request: `POST { "task": "chat", "messages": [{ "role": "user", "content": "..." }], "page": "dashboard" }`
Content request: `POST { "task": "content", "prompt": "...", "stage": "Pre-launch", "platform": "TikTok", "format": "Talking to camera", "style": "Hook Only" }`
Both expect back: `{ "reply": "text to show the member" }`

API usage is billed per message, separately from a Claude subscription.

## Before going live

- Fill the blanks in `js/config.js` (Stan Store product links, booking, socials, contact email).
- **Change your Stan Store password.** It appeared in a screenshot shared in this project and may be in your Canva design. Remove it from the design and treat it as exposed.
- **Terms and Privacy were edited on 23 Nov 2026** to match the real plans (£29.99 one-off, £59.99 / month, £150.00 / month), the Stan Store / Stripe checkout and the member database. They still need the three highlighted `[ INSERT ... ]` placeholders in `terms.html`, and a solicitor should read both (in particular: "lifetime access" for Tier 1, the 7-day refund rule now covering Tier 1, how a Tier 1 member upgrades, who the data controller is, ICO registration).
- Set `allowDev: false` in `js/config.js` and delete `js/demo-content.js`.
- Check the FAQ answers match what you sell: "any type of clothing" vs one live template.
- Check every manufacturer link and detail in `enyo-private/content/manufacturers.json` (Hubei Hui Li and Qingdao Shuangling have no link; `genhongzuo` appeared twice in your original brief), then rebuild and run `seed.sql`.
- Re-check the Alibaba instalment tip on the vetting guide (Afterpay / Klarna / PayPal Pay Later); it is in `guide.json` under `protip`.
- Only add genuine reviews to `data/reviews.js`.
