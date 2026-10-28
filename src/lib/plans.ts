// Shared Free / Premium Family rules. Database triggers mirror MEMBERS/RECORDS limits.
export type Plan = 'free' | 'premium';
export type AiKind = 'report_reader' | 'visit_summary';

export const PLAN_LIMITS: Record<Plan, { members: number; records: number; report_reader: number; visit_summary: number }> = {
  free: { members: 2, records: 25, report_reader: 3, visit_summary: 0 },
  premium: { members: 6, records: 300, report_reader: 40, visit_summary: 15 },
};

export const PRICES = {
  INR: { monthly: 149, yearly: 999 },
  USD: { monthly: 3.99, yearly: 29.99 },
} as const;

export type SubscriptionRow = { plan: string; status: string; current_period_end: string | null } | null;

/** Premium only while paid-through (cancelled plans keep access until period end). */
export function effectivePlan(sub: SubscriptionRow, now = new Date()): Plan {
  if (!sub || sub.plan !== 'premium') return 'free';
  if (!['active', 'cancelled'].includes(sub.status)) return 'free';
  if (sub.current_period_end && new Date(sub.current_period_end) <= now) return 'free';
  return 'premium';
}

/** Returns a user-facing message when the monthly AI allowance is used up, else null. */
export function aiAllowanceProblem(plan: Plan, kind: AiKind, usedThisMonth: number): string | null {
  const limit = PLAN_LIMITS[plan][kind];
  if (limit === 0) return kind === 'visit_summary' ? 'AI visit summaries are part of Premium Family.' : 'AI report reading is not included in your plan.';
  if (usedThisMonth >= limit) return `You've used all ${limit} ${kind === 'visit_summary' ? 'AI visit summaries' : 'AI report readings'} for this month.`;
  return null;
}

export function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function planLimitMessage(error: unknown): string | null {
  const m = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  return m.includes('PLAN_LIMIT:') ? (m.split('PLAN_LIMIT:')[1] ?? '').trim() + ' Upgrade to Premium Family in Settings to add more.' : null;
}

/** Maps a verified Razorpay subscription event to a subscriptions row update. */
export function razorpayUpdate(event: string, entity: { status: string; current_end?: number | null | undefined }): { plan: Plan; status: string; current_period_end: string | null; cancel_at_period_end: boolean } | null {
  const end = entity.current_end ? new Date(entity.current_end * 1000).toISOString() : null;
  switch (event) {
    case 'subscription.activated': case 'subscription.charged': case 'subscription.resumed':
      return { plan: 'premium', status: 'active', current_period_end: end, cancel_at_period_end: false };
    case 'subscription.cancelled':
      return { plan: 'premium', status: 'cancelled', current_period_end: end, cancel_at_period_end: true };
    case 'subscription.halted': case 'subscription.paused':
      return { plan: 'premium', status: 'halted', current_period_end: end, cancel_at_period_end: false };
    case 'subscription.completed': case 'subscription.expired':
      return { plan: 'free', status: 'expired', current_period_end: end, cancel_at_period_end: false };
    default: return null;
  }
}

export async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyRazorpaySignature(secret: string, body: string, signature: string | null) {
  if (!secret || !signature) return false;
  const expected = await hmacSha256Hex(secret, body);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
