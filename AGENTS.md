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
- Keep advertising preparation separate from delivery; inactive sign-up measurement must discard events without loading SDKs, storing identifiers or queuing historical events.
- Keep timeline events separate from uploaded medical records; authenticated server functions and owner/member relationship validation preserve existing document semantics.
- Build doctor-visit packs from explicit source metadata and manual notes only; approval fingerprints must invalidate after edits and AI summaries must never enter a pack.
- Generate visit-pack PDFs in the browser using shaped high-resolution page images and the licensed Bengali font; this preserves Bengali conjunct rendering without exposing clinical drafts to a server, but PDF text is not searchable.
- Keep AI explanations ephemeral and strictly structured with source quotes, processing consent and owner checks; never render legacy unrestricted cached summaries or add generated claims to visit packs.
- Keep AI report extractions in report_extractions: server writes AI output with the admin client only after a caller-scoped ownership check; users may only save reviewed corrections (trigger-enforced). Why: AI output stays untampered and every value is human-reviewed; extractions never enter visit packs.
