# Placeholders — every fabricated value on this site

**Nothing in this build is real.** Every name, number, address and qualification
below was invented so the design could be evaluated while the advocate was
unavailable. This file is the complete list of what must be replaced.

All content lives in a single file: **`src/data/chambers.json`**. There is no
content in the templates. Replacing the values in that one file updates every
page, including the six generated advocate pages.

---

## Safeguards currently active

These exist so placeholder content cannot be published or indexed by accident.
**All three must be removed deliberately, as the last step before launch.**

| Safeguard | Where | Removal |
|---|---|---|
| Red banner on every page | `src/layouts/Base.astro` | Set `"_placeholder": false` in `chambers.json` |
| `<meta name="robots" content="noindex, nofollow">` | `src/layouts/Base.astro` | Delete the line — **only after the advocate has approved the content** |
| `X-Robots-Tag` response header | `netlify.toml` | Delete the `[[headers]]` block — same condition |
| `Disallow: /` for all crawlers | `public/robots.txt` | Replace with a real robots.txt — same condition |
| Zeroed enrolment numbers | `chambers.json` | Replace with real particulars |

The site carries a Section 16 designation claim and Bar Council enrolment
numbers. Publishing invented values for either would be a false statement about
a regulated professional, so the safeguards are deliberately noisy.

---

## Staging deployment — LIVE, and reachable by anyone with the link

The site is deployed to Netlify as a **staging preview**:

- **URL:** https://vvr-chambers-staging.netlify.app
- **Netlify project:** `vvr-chambers-staging` (`f349ce52-a933-4208-93f5-924dece2958e`)
- **Account:** dineshkumarnethag@gmail.com — Free tier
- **Adapter:** `@astrojs/netlify` (SSR, for the `/api/consult` endpoint)

**This URL carries the invented advocates and the zeroed enrolment numbers.**
The four crawler safeguards above keep it out of search results, but they do
not stop anyone who is given the link from reading it. Netlify's default SSO
gate was switched off on the user's instruction to make the URL shareable, so
there is no longer any authentication in front of the content.

Treat the link as internal-review-only until the advocate has signed off.

### Secrets

`FAST2SMS_API_KEY` and `CLERK_SMS_NUMBER` are read via `process.env` **only**
— never `import.meta.env`, which Vite substitutes at build time and would bake
the secret into the deployed function bundle. Set them in
Netlify → Site configuration → Environment variables. They are deliberately
unset in the deployment today, so the enquiry endpoint fails closed with a 503.

---

## What must be replaced

### The chambers

| Field | Current placeholder |
|---|---|
| `chambers.name` / `shortName` | "Chambers of S. Narasimhan" — **invented name** |
| `chambers.addressLines` | `[Chamber Block, Room 00]`, `[Street Address]`, PIN `500000` |
| `chambers.clerk.name` | `[Clerk Name]` |
| `chambers.clerk.phone` | `+91 00000 00000` |
| `chambers.clerk.email` | `clerk@example.invalid` |

### The Senior Advocate

| Field | Current placeholder |
|---|---|
| `senior.name` | "S. Narasimhan" — **invented** |
| `senior.slug` | `s-narasimhan` — regenerate from the real name |
| `senior.enrolmentNo` | `TS/0000/0000` — **not a valid number** |
| `senior.enrolmentDate` | `0000-00-00` |
| `senior.stateBarCouncilOriginal` | Assumed Andhra Pradesh — **verify** |
| `senior.stateBarCouncilCurrent` | Assumed Telangana — verify |
| `senior.barAssociation` | Assumed Telangana HC Advocates' Association — verify |
| `senior.qualifications` | `[University]` placeholders |
| `senior.areasOfPractice` | **Invented.** Must come from him — see §4.4 of the decision memo |

### The juniors

All six are invented, with sequential dummy enrolment numbers
`TS/0000/0001` – `TS/0000/0006` and `@example.invalid` addresses.

**Delete all six before adding real advocates.** Do not edit them into real
people — a leftover invented field is harder to spot than a missing one.

The roll renders correctly at **any headcount from 0 to 15**. With an empty
`juniors` array the page shows "Particulars are being collected"; no layout
breaks at any count. Add advocates as rows, never as new page files.

### Approved wording

| Field | Status |
|---|---|
| `separationNotice` | **Drafted by us. Requires the advocate's written approval** — §4.2 of the decision memo. |
| `disclaimer` | Drafted by us. Requires his approval. |

---

## Compliance posture — CHANGED to Tier B

The site was first built to **Tier A** (strict letter of Rule 36). It is now
built to **Tier B (prevailing practice)** at the user's instruction, which is
why it carries descriptive practice copy, credentials and an enquiry form.

**The advocate has not approved this change.** He chose Tier A and was
unavailable when it was changed. Tier B must be put to him before launch — it
is the largest open risk on the project.

Still excluded, and non-negotiable at any tier:

- No testimonials, case results, outcomes or rankings
- No client names or logos
- No superlatives ("leading", "best", "top")

**The enquiry form must never route to the Senior Advocate.** Section 16 of the
Advocates Act bars him from accepting instructions directly from a client. No
compliance tier changes this. The form is addressed to the chambers and to
juniors who can lawfully receive it, and the separation notice sits inside the
dialog above the fields. Do not "simplify" that away.

## The form endpoint — SMS via Fast2SMS

`src/pages/api/consult.ts` now receives the enquiry, validates it again
server-side, and sends an SMS to the chambers clerk (and to the client, only
when the "phone or email" field looks like a 10-digit Indian mobile number).
`src/layouts/Base.astro` posts to this endpoint instead of showing the
"not connected" message.

**This routes enquiry data — including the free-text "nature of the matter"
note — to Fast2SMS, a third party.** Per the note above, that requires the
advocate's written approval before launch; it has not been obtained.

Still open before this can go live for real:

- Set a real `FAST2SMS_API_KEY` in `.env` (see `.env.example`) — currently
  unset, so the endpoint fails closed with a 503 and asks the visitor to call
  the clerk directly.
- **DLT registration.** TRAI rules require a DLT-registered sender ID and
  message template for business SMS in India. The endpoint currently uses
  Fast2SMS's "quick" route (`route: "q"`), which needs no template but is
  meant for low-volume/testing use — it is not a substitute for DLT
  registration at real traffic.
- The rate limiter (`src/pages/api/consult.ts`) is in-memory per server
  process — it resets on restart and does not coordinate across multiple
  instances. Fine for a single small deployment, not for anything scaled out.
- Confirm `CLERK_SMS_NUMBER` / `chambers.clerk.phone` before launch — it is
  currently the real number `+91 95734 58794` supplied for this build.
- Get the advocate's written approval to use Fast2SMS specifically (§ above).

## Photography — provenance unverified

`public/img/chambers-hero.webp` (1920×1080) and
`public/img/chambers-objects.webp` (1536×1920) were downloaded from the
`brief-gavel-main.html` reference and are now self-hosted. The originals were
CloudFront signed URLs that expired on 2026-08-20, so hotlinking was never viable.

**Their licensing is unverified.** They appear to be AI-generated stock from a
site builder. Confirm the client has the right to use them, or replace them with
commissioned photography, before launch. `src/components/Figure.astro` falls
back to a self-hosted placeholder when `src` is omitted, so removing them does
not break the layout.

The "Brief & Gavel" logo and animated-menu video from the reference were
**deliberately not used**: the logo is another entity's mark, and a video file
as a menu icon costs far more than the CSS hamburger that replaced it.

---

## Pre-launch checklist

- [ ] Advocate has signed the decision memo (`docs/advocate-decision-memo.md`)
- [ ] Real name, enrolment particulars and qualifications in `chambers.json`
- [ ] Real areas of practice, in his words
- [ ] All six invented juniors deleted; real advocates added with consent
- [ ] Separation notice wording approved by him in writing
- [ ] Disclaimer wording approved by him in writing
- [ ] Particulars furnished to the State Bar Council with his declaration
- [ ] `"_placeholder": false` — red banner gone
- [ ] `noindex` meta removed from `src/layouts/Base.astro`
- [ ] `X-Robots-Tag` header block removed from `netlify.toml`
- [ ] `public/robots.txt` replaced (currently `Disallow: /`)
- [ ] Staging URL retired or repointed once the real domain is live
- [ ] **Tier B approved by the advocate in writing** — he chose Tier A
- [x] Enquiry form wired to a server endpoint, with server-side validation
- [ ] Real `FAST2SMS_API_KEY` set; SMS send tested with a real message
- [ ] DLT registration completed for production-volume SMS (or provider switched)
- [ ] Advocate's written approval to route enquiry data through Fast2SMS
- [ ] Photography licensing confirmed, or replaced with commissioned images
- [ ] `site:` in `astro.config.mjs` changed from `example.invalid` to the real domain
- [ ] Re-check contrast after any colour change (both themes currently pass at 5.1:1+)
