# Roadmap

## Waiting
- [ ] Submit FamRecords to Google Play — owner must create the Play Console account themselves (Google account, $25 fee, ID verification), then upload the prepared assets; submission subject to Google approval.

## Done
- [x] Prepare FamRecords for Google Play: privacy policy page (/privacy), app manifest + install icons, 512x512 app icon, 1024x500 feature graphic, five phone screenshots (saved in Files under google-play-assets/)
- [x] Rename the app everywhere to "FamRecords: Rehab & Wellness" (browser tab, search results, shared links, page headers)
- [x] Add a logo (icon-with-name design) at the top of the home, sign-in and app pages
- [x] New browser-tab icon (favicon) from the logo

## In progress
- [x] Replace legacy AI summaries with consent-based, source-cited informational explanations — 30 tests passed; live synthetic Word explanation and diagnosis/treatment-advice boundary verified, test data cleaned up. Quotes checked against extracted Word text; PDF/photo citations still require user comparison with original. No saved AI outputs or advertising changes.
- [x] Review architecture, live schema and storage; prepare smallest safe Smart Health Timeline + Doctor Visit Pack plan
- [x] Implement Smart Health Timeline + Doctor Visit Pack — 24 tests passed; signed-in synthetic event/upload/read-back, approved English/Bengali PDF downloads and mobile timeline verified; synthetic data cleaned up. PDF text is image-based, not searchable. Cross-account reads and foreign-member event insert denied. Existing records/accounts retained; advertising inactive.
- [x] Remove subscription offer; payments, pricing and clinic work deferred. Settings/Admin checked signed-in; 14 regression tests passed
- [ ] Add signed-in password change and email password recovery
- [ ] Prepare inactive consent-aware sign-up measurement; activation requires explicit approval and Meta eligibility checks
- [ ] Diagnose admin access and expose actionable errors
- [ ] First sign-up campaign (families in India) — channel agreed: Facebook & Instagram ads. Meta account link card was declined, so no ad account yet; creative + tracking prep continues in chat. No launch or spend without owner approval.
- [ ] Admin panel: approve new users, grant/revoke admin; users see only their own panel (built, verifying)
- [ ] AdSense ads — needs owner's approved AdSense account + publisher ID (ca-pub-…); ads only on public pages, never inside signed-in record pages
- [x] AI summary of a medical record (diagnoses, medications, follow-up)
- [x] Ask a question about a record, AI explains in plain language
- [x] Unique titles/descriptions for public pages (/, /auth, /privacy)
- [ ] Google Search Console — connected, code added; waiting for owner to publish, then verify + submit sitemap
- [x] Add /privacy to sitemap
- [x] Word (DOC/DOCX) text extraction for AI

- [x] AI Report Reader (extract values, review/correct)
- [ ] AI Doctor-Visit Summaries (Bengali/English, selected records + notes, review before export; separate from AI-free visit packs) — needs plan

## Owner's build order (2026-10-28)
1. [ ] Audit backend security (incl. second-account isolation test) — in progress
2. [x] Launch AI report reader
3. [ ] Doctor-visit summaries
4. [ ] Server-enforced Free vs Premium Family limits (₹149/mo, ₹999/yr; 2 vs 6 members) + billing — needs payment provider keys
5. [ ] Bengali/English everywhere + reminders
6. [ ] Pilot paid family plans (payments blocked for India seller; needs Razorpay keys)
7. [ ] Clinic plan — only with evidence of demand
