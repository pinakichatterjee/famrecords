<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep password validation and account-management safety rules in a shared browser-safe module so forms and server actions use tested rules.
- Maintain the existing static public/sitemap.xml with canonical indexable public pages only; omit lastmod without authoritative page-specific content dates. Why: search discovery must exclude private records and avoid fabricated freshness.
- Keep advertising preparation separate from delivery; inactive sign-up measurement must discard events without loading SDKs, storing identifiers or queuing historical events.
- Keep first-party invite attribution separate from advertising: predefined labels only after an independent opt-in, tab-scoped 24-hour retention, immutable capture at account creation and admin-only grouped RPC reads; withdrawal deletes account attribution. Why: sign-up counts must never expose clinical data or activate ad SDKs.
- Saved invite retention is admin-controlled through validated RPCs; exclude expired/purge-selected rows immediately and use a bounded authenticated scheduled cleanup to clear Auth metadata before reporting rows. Why: retention must cover both copies without touching clinical data or losing retry state.
- Load AdSense dynamically from the homepage-only AdvertisingConsent after explicit advertising acceptance, never in SSR head; reload on withdrawal and use full-document navigation for every homepage exit. Why: advertising must be denied before choice and must not survive into private pages.
- Run `bun run test:adsense` with an approved admin browser session for advertising regressions; the deterministic browser probe verifies execution and isolation without serving live ads or modifying records.
- Optional Google Analytics is limited to consented homepage/privacy page views with allowlisted campaign labels; disable automatic/enhanced measurement in the Google stream to prevent private-route or form collection. Why: campaign reports must never include account or clinical activity.
- Keep timeline events separate from uploaded medical records; authenticated server functions and owner/member relationship validation preserve existing document semantics.
- Build doctor-visit packs from explicit source metadata and manual notes only; approval fingerprints must invalidate after edits and AI summaries must never enter a pack.
- Generate visit-pack PDFs in the browser using shaped high-resolution page images and the licensed Bengali font; this preserves Bengali conjunct rendering without exposing clinical drafts to a server, but PDF text is not searchable.
- Keep AI explanations ephemeral and strictly structured with source quotes, processing consent and owner checks; never render legacy unrestricted cached summaries or add generated claims to visit packs.
- Keep AI report extractions in report_extractions: server writes AI output with the admin client only after a caller-scoped ownership check; users may only save reviewed corrections (trigger-enforced). Why: AI output stays untampered and every value is human-reviewed; extractions never enter visit packs.
- Plan limits live in src/lib/plans.ts and are enforced server-side (DB insert triggers for members/records, ai_usage counts in server functions); subscriptions rows are written only by service-role code (admin grant, Razorpay webhook matched by provider_subscription_id). Why: clients can never grant themselves Premium.
- AI visit summaries store code-copied facts separately from AI text; AI numbers must appear in sources, edits invalidate review, and export needs review. Why: numerical fidelity and traceability; summaries never enter AI-free visit packs.
- Consent components render only their first-choice prompt; changing a saved choice happens via the Privacy settings section on /privacy (openPrivacySetting events). Why: keep footers clean while consent stays withdrawable.
