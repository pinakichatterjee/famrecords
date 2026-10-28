import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { effectivePlan, PLAN_LIMITS } from './plans';

export const getMyPlan = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: sub }, members, records, rr, vs] = await Promise.all([
      supabase.from('subscriptions').select('plan, status, billing_period, current_period_end, cancel_at_period_end, provider').eq('user_id', userId).maybeSingle(),
      supabase.from('family_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('medical_records').select('id', { count: 'exact', head: true }).eq('created_by', userId),
      supabase.rpc('ai_usage_this_month', { _kind: 'report_reader' }),
      supabase.rpc('ai_usage_this_month', { _kind: 'visit_summary' }),
    ]);
    const plan = effectivePlan(sub);
    return {
      plan, subscription: sub ?? null, limits: PLAN_LIMITS[plan],
      used: { members: members.count ?? 0, records: records.count ?? 0, report_reader: rr.data ?? 0, visit_summary: vs.data ?? 0 },
      paymentsReady: Boolean(process.env['RAZORPAY_KEY_ID'] && process.env['RAZORPAY_KEY_SECRET'] && process.env['RAZORPAY_PLAN_MONTHLY'] && process.env['RAZORPAY_PLAN_YEARLY']),
    };
  });

async function razorpay(path: string, body: unknown) {
  const id = process.env['RAZORPAY_KEY_ID']; const secret = process.env['RAZORPAY_KEY_SECRET'];
  if (!id || !secret) throw new Error('Online payments are not switched on yet.');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, { method: 'POST', headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) { console.warn('razorpay_error', { path: path.split('/')[1], status: res.status }); throw new Error('The payment service could not process this request.'); }
  return json;
}

export const startCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ period: z.enum(['monthly', 'yearly']) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase.from('subscriptions').select('plan, status, current_period_end').eq('user_id', context.userId).maybeSingle();
    if (effectivePlan(sub) === 'premium') throw new Error('You already have Premium Family.');
    const planId = process.env[data.period === 'monthly' ? 'RAZORPAY_PLAN_MONTHLY' : 'RAZORPAY_PLAN_YEARLY'];
    if (!planId) throw new Error('Online payments are not switched on yet.');
    const created = await razorpay('/subscriptions', { plan_id: planId, total_count: data.period === 'monthly' ? 120 : 10, customer_notify: 1, notes: { user_id: context.userId } });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('subscriptions').upsert({ user_id: context.userId, plan: 'free', status: 'pending', billing_period: data.period, provider: 'razorpay', provider_subscription_id: String(created.id), updated_at: new Date().toISOString() });
    return { url: String(created.short_url) };
  });

export const cancelSubscription = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sub } = await context.supabase.from('subscriptions').select('provider, provider_subscription_id, status').eq('user_id', context.userId).maybeSingle();
    if (!sub || sub.status !== 'active') throw new Error('There is no active subscription to cancel.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (sub.provider === 'razorpay' && sub.provider_subscription_id) await razorpay(`/subscriptions/${encodeURIComponent(sub.provider_subscription_id)}/cancel`, { cancel_at_cycle_end: 1 });
    await supabaseAdmin.from('subscriptions').update({ status: 'cancelled', cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq('user_id', context.userId);
    return { ok: true };
  });

export const adminSetPremium = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ userId: z.string().uuid(), premium: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Admins only');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: existing } = await supabaseAdmin.from('subscriptions').select('provider').eq('user_id', data.userId).maybeSingle();
    if (existing?.provider === 'razorpay') throw new Error('This family pays online; manage it in Razorpay.');
    const { error } = await supabaseAdmin.from('subscriptions').upsert({
      user_id: data.userId, plan: data.premium ? 'premium' : 'free', status: data.premium ? 'active' : 'expired',
      billing_period: 'manual', provider: 'manual', current_period_end: null, cancel_at_period_end: false, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error('Could not change the plan.');
    return { ok: true };
  });

export const adminListPlans = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('subscriptions').select('user_id, plan, status, current_period_end, provider');
    if (error) throw new Error('Could not load plans.');
    return data.map(s => ({ userId: s.user_id, plan: effectivePlan(s), provider: s.provider }));
  });
