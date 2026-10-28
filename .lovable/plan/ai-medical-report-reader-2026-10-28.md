# AI Medical Report Reader

## Current schema (confirmed)
- `profiles` (id, email, name, approved), `user_roles`, `family_members` (owner `user_id`), `medical_records` (owner `created_by`, `family_member_id`, `document` storage path, `visit_date`, `provider`, `record_type`, legacy `ai_summary`), `health_events`, `ai_provider_access_blocks`.
- All family data RLS: owner = `auth.uid()` AND `is_approved(auth.uid())`. Documents in private `medical-documents` bucket under `<user_id>/...`.
- Existing AI explanations stay ephemeral and untouched. No existing table stores extractions, so one new table is added; nothing is duplicated and no policy is loosened.

## One change from your request: server function, not Edge Function
This app runs on TanStack Start, where Edge Functions are not used. The same guarantees come from an authenticated server function: it verifies the caller's token on every call, runs only on the server, reads `LOVABLE_API_KEY` from server secrets, and queries as the caller so RLS still applies. AI provider: Lovable AI Gateway, model `openai/gpt-6-astra` (no extra key).

## Migration (exact)
```sql
CREATE TABLE public.report_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','needs_review','reviewed','failed')),
  extraction jsonb,            -- validated AI output, never edited
  corrected jsonb,             -- user-reviewed copy
  failure_code text,           -- short code only, never medical text
  attempt_count int NOT NULL DEFAULT 0,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medical_record_id)
);
GRANT SELECT, UPDATE ON public.report_extractions TO authenticated;
GRANT ALL ON public.report_extractions TO service_role;
ALTER TABLE public.report_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved own extractions read" ON public.report_extractions
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "approved own extractions review" ON public.report_extractions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
-- Trigger: user_id must equal medical_records.created_by; users may only change
-- corrected/status('reviewed')/reviewed_at; extraction/attempts only via server.
-- Rate-limit log: report_extraction_attempts(user_id, created_at) — server-only, no client grants.
```
Inserts and AI results are written by the server after ownership is verified; users can only read and save corrections.

## Server contract
`extractReport({ recordId, retry? })` — authenticated, approved users only.
1. Check provider-denial block, then rate limit: 10 extractions/hour and 30/day per user; max 3 attempts per record.
2. Load record as caller (`created_by = userId`); path prefix must match user.
3. Validate: PDF, JPG, PNG, WEBP only; at most 10 MB; real file signature checked.
4. Set status `processing`, call AI with strict JSON schema, validate with Zod.
5. Save `needs_review` or `failed` + code (`unsupported_file`, `too_large`, `unreadable`, `malformed_output`, `rate_limited`, `credits`, `ai_unavailable`).

Returns `{ status, extraction? , failureCode? }`. `saveReview({ extractionId, corrected })` validates the same schema and marks `reviewed`.

### Extraction JSON
```text
{ documentType: {value|null, certainty: "printed"|"uncertain"|"unknown", sourceQuote|null},
  reportDate: same shape (YYYY-MM-DD only if printed),
  tests: [{ name, value, unit|null, referenceRange|null, certainty, sourceQuote, location }],
  limitations: string[] }
```
Rules: values copied exactly as printed; missing items are `null` + `unknown`; no flags like high/low, no diagnoses, no advice. Server rejects output containing diagnosis/treatment wording or (for text PDFs, when text is extractable) quotes not found in the source.

## Screen
- "Read report" button on each record you own.
- Side-by-side view: original document on one side, editable table of extracted values on the other, each with source quote and "uncertain/unknown" badge.
- States: processing spinner, failure message with Retry, "Needs your review" until you confirm, then "Reviewed".
- Extractions never appear in Doctor Visit Packs.

## Privacy
No logging of document text, images, AI output, keys or emails — only record id and failure code. Privacy page updated to mention stored extracted values.

## Testing
- Unit tests: schema accepts valid output, rejects malformed output, rejects diagnosis wording, file-type/size limits, rate-limit rule.
- Live (synthetic data only): own record extracts; second account cannot read or trigger another user's record; unsupported file fails cleanly; retry works.

## Steps
1. Migration + rules module + tests. 2. Server functions. 3. Review screen. 4. Live checks, cleanup.
