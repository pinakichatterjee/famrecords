# FamRecords: Smart Health Timeline and Doctor Visit Pack

## Current assessment
- Keep the existing app, accounts, approval/admin controls, password recovery, family members and uploaded records. No rebuild or authentication replacement.
- Medical records already contain visit date, upload date, provider, type and family-member links. Existing filters, upload/edit forms, calendar, dialogs and private document-opening controls are reusable.
- Confirmed the live database has the four existing application tables and these record fields. Document storage is private, has a 20 MB limit, and currently has no configured MIME allowlist. Existing viewing links last five minutes.
- Subscriptions were only placeholders, not working billing. Removed them from Settings and Admin, removed the USD 29 offer and its obsolete test. No database rows were deleted. Signed-in screenshots confirmed account controls remain; 14 regression tests passed and the preview reports build OK.

## Security review status and launch checks
Available database and connector scans report no findings; the dependency scan is stale. No recent deep code-security scan was returned. Run a scan from the Security tab before launch; this assessment does **not** establish security or compliance.

Before releasing the new features, verify two-account isolation, member/record relationship ownership, private storage permissions, upload type/size validation and deletion behaviour. Use synthetic documents only. Any confirmed issue must be repaired and retested before launch. Existing admin actions and password recovery still require full action-level checks; seeing their controls is not verification of those flows.

## Stage 1 — Smart Health Timeline
- Extend the existing Records page, preserving its current uploads, editing, search and filters.
- Choose a family member; group documents and manual events by month/year, newest first.
- Show **visit/document date** and **upload date** separately without changing existing date values. Missing document dates remain explicit; upload dates provide a labelled sorting fallback.
- Add inclusive start/end date filters alongside member, category, provider and text filters.
- Preserve all existing record categories; add Consultation and Hospitalisation without rewriting historical records.
- Add manually entered appointments and health events, with title, date, optional provider/time and notes. Mark them clearly as user-entered, never extracted or clinically verified.
- Reuse short-lived document links for viewing and explicit downloads. Preview supported images/PDFs; Word files can open/download without promising an inline viewer.
- Provide English/Bengali controls and labels for the new experience. Preserve original user-entered titles and clinical text; do not translate them automatically with AI.

**Check:** filtering boundaries, chronological/month grouping, missing-date fallback, manual-event persistence, edit/delete and secure document retrieval; test desktop and Android-sized layouts with a signed-in synthetic account.

## Stage 2 — Doctor Visit Pack
- Start from the selected family member and an optional date range.
- Explicitly select reports, prescriptions and consultation records. Missing-date documents remain available in a clearly labelled undated group rather than silently disappearing.
- Enter allergies, current medications and questions for the clinician manually; identify these as user-entered and unverified.
- Preview the exact pack and require approval before enabling PDF download. Changing any selection or text resets approval.
- Include generation date, member name, chosen date range, source document list, types, providers, visit/document dates and upload dates.
- Exclude stored AI summaries and all inferred clinical claims. This is a summary and document index, **not** a merger of the original files.
- Support English/Bengali labels in the PDF with an embedded font capable of Bengali shaping. Original clinical text stays unchanged.
- Generate the PDF locally; no automatic sharing, public URLs, stored pack copies or new payment requirements.

**Check:** member isolation, explicit selection, exact source dates, undated inclusion, approval invalidation, no AI-summary ingestion, and readable PDFs with long English/Bengali text.

## Carefully scoped AI — separate follow-up
Preserve the existing explanation feature during the first two stages; do not use its output in packs. A subsequent approved stage will add processing consent, source viewing, English/Bengali explanations, structured extracted values/units/ranges, terminology, uncertainties and clinician questions. It must never infer diagnoses, invent values, prescribe or recommend treatment changes. AI launch also needs rate-limit, provider-error and access checks. Existing explanations are not yet this full structured bilingual workflow.

## Technical details
- Keep TanStack Start, existing authenticated/approved layouts and the current data/storage integrations.
- Add one `health_events` table with owner ID, family member ID, event type, title, event date, optional time/provider/notes, and timestamps. Add grants, owner/approval-scoped policies and a member/date index; validate the referenced member belongs to the owner. No existing table replacement, destructive migration or historical backfill.
- Existing records need no new required columns for these stages. Implement owner-scoped authenticated operations for new events and document/pack source retrieval; preserve existing policies while testing relationship ownership.
- Extract shared timeline/filter/pack rules into browser-safe modules with concrete behaviour tests. Use route loaders and query caching for the new views.
- Add a deterministic PDF renderer and a licensed Bengali-capable embedded font. Drafts remain in current-page state and are discarded on exit; no pack table or storage bucket needed.
- No new AI/OCR/payment secrets are required for Timeline or Doctor Visit Pack. No new model calls during these stages.
- After each stage, report changed files, applied migrations, tests, remaining risks and any setup needed; leave the app working before proceeding.

## Explicitly deferred
Subscriptions, pricing experiments, payment providers, entitlements, clinic/staff workspaces, caregiver sharing, automatic sharing and broad export/deletion enhancements. Advertising sign-up tracking stays inactive until separately approved. No publishing or ad spend changes are included.