# AI Doctor-Visit Summary + Free / Premium Family plans

## 1. AI Doctor-Visit Summary (Premium)
- On the records page: "Visit summary" button → choose one family member, tick their records, add optional notes (medications, allergies, symptoms you entered), pick English or Bengali.
- Summary uses only the ticked records (their names, dates, provider, type, and your reviewed Report Reader values) plus your notes. Nothing else.
- Output has clearly separated parts:
  - **Facts from your records**: test name, value and unit copied exactly, with the source record name and date beside each.
  - **Plain-language explanation**: marked as AI-written, with uncertainty flagged. No diagnosis, no treatment advice.
  - **Questions you may want to ask your doctor**.
- You can edit every part. Download or share only unlocks after you tick "I reviewed this"; any edit asks for review again.
- Saved summaries can be reopened or deleted. They're deleted automatically when the member or a source record is deleted.
- Kept separate from the existing Doctor Visit Pack, which stays AI-free.

## 2. Free vs Premium Family limits (checked on the server)
| | Free | Premium Family |
|---|---|---|
| Family members | 2 | 6 |
| Records | 25 | 300 |
| AI Report Reader | 3 / month | 40 / month |
| AI Visit Summary | none | 15 / month |
| Price | free | ₹149/month or ₹999/year ($3.99 / $29.99 outside India) |
Starting numbers, easy to change later. Existing accounts keep all their data. Anyone already over a limit can still view and delete, but can't add more.
- Settings shows your plan, what you've used this month, and Upgrade / Cancel buttons.
- Admins can switch a family to Premium by hand (useful for the pilot before payments are live).

## 3. Payments
Built-in payments don't support sellers in India, so real charging needs your **Razorpay** account keys (Key ID + Key Secret, plus a webhook secret). Until then:
- Everything in step 2 works, and admins grant Premium by hand.
- Once keys are added: Razorpay checkout (UPI/cards) for monthly and yearly plans, with automatic renew/cancel from Razorpay's payment notifications. Tested in Razorpay test mode first.

## Tests
- Number fidelity: values/units in summaries must match the source exactly; malformed AI output is rejected.
- Bengali and English output; source name/date on every fact.
- Second account can't read or summarise another family's records or summaries.
- Limits: 3rd member on Free blocked; AI usage counted per month; Free can't create summaries.
- Payment notifications with a bad signature are rejected.

## Technical details
- New tables: `visit_summaries` (owner, member, source record ids, language, content jsonb, reviewed_at; cascade on member/record delete), `subscriptions` (user_id, plan, status, period_end, provider ids; read-own only, writes service-role only), `ai_usage` (user_id, kind, created_at; service-role only).
- `createServerFn` with `requireSupabaseAuth`; ownership checked as the caller, AI via Lovable AI Gateway (`openai/gpt-6-astra`, strict schema, Zod validation, numeric-fidelity check against source values).
- Limits enforced in server functions plus DB triggers for member/record inserts.
- Razorpay webhook at `/api/public/razorpay-webhook` with HMAC signature verification.
