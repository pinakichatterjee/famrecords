# Roadmap

## Waiting
- [ ] Dashboard accessibility stage (planned, approved to schedule only, not to implement): text readability, colour contrast, larger phone tap targets, screen-reader support, labelled buttons/icons, improved phone navigation. Start only after the security-audit follow-ups, with separate owner approval.
- [ ] Submit FamRecords to Google Play — owner must create the Play Console account themselves (Google account, $25 fee, ID verification), then upload the prepared assets; submission subject to Google approval.

## Done
- [x] Step 1 dashboard: quick actions, recent records, upcoming timeline, family overview; phone menu tap targets and notch spacing. Desktop and mobile tested, 100 tests pass.
- [ ] Groundwork F1-F5 approved; waiting for go-ahead to start (Step 1 only was requested).
- [x] Confirm public/ads.txt contains the exact owner-provided publisher entry and is live at https://famrecords.org/ads.txt (redirects to www, HTTP 200 text/plain); no additional publication needed.
- [x] Update the XML sitemap with all four indexable public pages (/, /auth, /privacy, /welcome), preserve its robots.txt reference and verify XML and public URLs; publication requested separately.
- [x] Prepare FamRecords for Google Play: privacy policy page (/privacy), app manifest + install icons, 512x512 app icon, 1024x500 feature graphic, five phone screenshots (saved in Files under google-play-assets/)
- [x] Rename the app everywhere to "FamRecords: Rehab & Wellness" (browser tab, search results, shared links, page headers)
- [x] Add a logo (icon-with-name design) at the top of the home, sign-in and app pages
- [x] New browser-tab icon (favicon) from the logo

## In progress
- [ ] Add consent-safe ad delivery monitoring and stoppage reporting — blocked: owner declined AdSense reporting connection and forbids OAuth requests; no monitoring installed or artificial ad impressions generated.
- [x] Verify live AdSense delivery and cookies: Google ad requests before consent and after declining analytics; no advertising cookies observed; no visible filled ads, one unfilled unit after reload. Browser-specific result, not a universal cookie guarantee.
- [x] Add separate opt-in advertising consent: 21 tests and authenticated advertising browser regression pass; no script before acceptance or after refusal, analytics independent, withdrawal clears two tabs, private pages ad-free. Publish required for live protection; custom control is not a Google-certified CMP.
- [x] Add admin invite-attribution retention settings (30/90/180/365 days or until account deletion/withdrawal) and confirmed early deletion; 22 privacy tests plus advertising regression pass. Admin save/read-back, synthetic old-count deletion and desktop/mobile controls verified. Initial retention restored; synthetic attribution removed. Five-minute cleanup schedule created; publish required for the new scheduled target to run live.
- [x] Add opt-in first-party invite campaign sign-up counts in Admin; seven privacy tests and authenticated advertising regression pass. Synthetic signup read back as one WhatsApp/family_invite/invite_1 account in Admin; synthetic count removed, unapproved test account retained. No medical data or ad activation; publication pending.
- [x] Add clear homepage privacy notice about AdSense and advertising cookies; clarify analytics choices do not control ads and align the privacy policy.
- [x] Add automated AdSense homepage execution and signed-in private-page isolation checks.
- [x] Add consented public-page Google Analytics campaign reporting — three tests pass; browser verified no Google requests before acceptance, one campaign-tagged collection request after acceptance, withdrawal and no script on sign-in page. Provider report receipt unverified.
- [x] Enable live post reporting — owner published; verified www.famrecords.org on 2026-10-30: consented Facebook/social/live_verification/visit_pack_test homepage page_view accepted with HTTP 204; privacy page_view also HTTP 204. No collections or tracker before consent; withdrawal persists across navigation with no new collections; fresh sign-in has no tracker. Synthetic test visits were sent, not customer outcomes. Automatic public-page user_engagement also observed; navigation-aborted requests recorded, no page errors. Google report attribution remains unverified; reports stay in Google Analytics.
- [x] Refresh homepage Open Graph and social-preview metadata — verified title, description, canonical and 1200×630 compressed sharing image in preview; reaches live site on next publish.
- [x] Replace legacy AI summaries with consent-based, source-cited informational explanations — 30 tests passed; live synthetic Word explanation and diagnosis/treatment-advice boundary verified, test data cleaned up. Quotes checked against extracted Word text; PDF/photo citations still require user comparison with original. No saved AI outputs or advertising changes.
- [x] Review architecture, live schema and storage; prepare smallest safe Smart Health Timeline + Doctor Visit Pack plan
- [x] Implement Smart Health Timeline + Doctor Visit Pack — 24 tests passed; signed-in synthetic event/upload/read-back, approved English/Bengali PDF downloads and mobile timeline verified; synthetic data cleaned up. PDF text is image-based, not searchable. Cross-account reads and foreign-member event insert denied. Existing records/accounts retained; advertising inactive.
- [x] Remove subscription offer; payments, pricing and clinic work deferred. Settings/Admin checked signed-in; 14 regression tests passed
- [ ] Add signed-in password change and email password recovery
- [ ] Prepare inactive consent-aware sign-up measurement; activation requires explicit approval and Meta eligibility checks
- [ ] Diagnose admin access and expose actionable errors
- [ ] First sign-up campaign (families in India) — channel agreed: Facebook & Instagram ads. Meta account link card was declined, so no ad account yet; creative + tracking prep continues in chat. No launch or spend without owner approval.
- [ ] Admin panel: approve new users, grant/revoke admin; users see only their own panel (built, verifying)
- [x] Add homepage-only AdSense Auto Ads script using the supplied publisher ID; browser verified script in head and full-document sign-in clears advertising runtime; four tests pass and build OK. Google approval and real ad delivery remain unverified.
- [x] Request publishing /welcome at the owner's request after current homepage changes are verified (2026-11-01); live deployment confirmation pending.
- [x] AI summary of a medical record (diagnoses, medications, follow-up)
- [x] Ask a question about a record, AI explains in plain language
- [x] Unique titles/descriptions for public pages (/, /auth, /privacy)
- [ ] Google Search Console — connected, code added; waiting for owner to publish, then verify + submit sitemap
- [x] Add /privacy to sitemap
- [x] Word (DOC/DOCX) text extraction for AI

- [x] AI Report Reader (extract values, review/correct)
- [x] AI Doctor-Visit Summaries — 17 new tests; live Bengali summary, review lock and second-account denial checked

## Owner's build order (2026-10-28)
1. [x] Second-account isolation test passed (full security scan still to run)
2. [x] Launch AI report reader
3. [x] Doctor-visit summaries
4. [x] Server-enforced Free vs Premium limits + admin Premium grant
4b. [ ] Live Razorpay billing — code ready; waiting for owner's Razorpay keys + plan IDs + webhook secret
5. [ ] Bengali/English everywhere + reminders
6. [ ] Pilot paid family plans (payments blocked for India seller; needs Razorpay keys)
7. [ ] Clinic plan — only with evidence of demand
- [x] Homepage: describe timeline, visit packs, EN/BN, AI report reader, AI visit summary, Free vs Premium (no medical claims)
- [x] Branded social sharing image for homepage (og:image)
- [x] Structured data (JSON-LD) on homepage; sitemap verified live (200)
- [x] Homepage FAQ section + FAQPage structured data
- [x] Keep the "Rehab & Wellness" tagline in the logo and update the positioning copy around it (hero wording, a section explaining the tagline, an FAQ entry, search/social descriptions)
- [x] Homepage: four dedicated sections — Family Records, AI Intelligence (report explainer available, health assistant planned), Multilingual support (English and বাংলা available, Hindi planned), Healthcare Connectivity (consent-based provider sharing, planned) and Privacy and Security (verified protections only); every item labelled Available now or Planned; desktop + phone layouts and all buttons/links verified
- [x] Homepage: sample doctor-visit pack preview (fictional data)
- [x] Publish homepage updates (sample visit pack) — requested 2026-10-31
- [x] Shareable landing page /welcome built + tested (desktop/mobile, links, analytics allowlist); appears on www.famrecords.org/welcome at next publish
