# Roadmap

## Waiting
- [ ] Submit FamRecords to Google Play — owner must create the Play Console account themselves (Google account, $25 fee, ID verification), then upload the prepared assets; submission subject to Google approval.

## Done
- [x] Prepare FamRecords for Google Play: privacy policy page (/privacy), app manifest + install icons, 512x512 app icon, 1024x500 feature graphic, five phone screenshots (saved in Files under google-play-assets/)
- [x] Rename the app everywhere to "FamRecords: Rehab & Wellness" (browser tab, search results, shared links, page headers)
- [x] Add a logo (icon-with-name design) at the top of the home, sign-in and app pages
- [x] New browser-tab icon (favicon) from the logo

## In progress
- [ ] Replace legacy AI summaries with consent-based, source-cited informational explanations; verify synthetic-record flow and safety tests.
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
