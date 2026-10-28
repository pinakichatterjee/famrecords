import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { toast } from 'sonner';
import { cancelSubscription, getMyPlan, startCheckout } from '@/lib/plans.functions';
import { PLAN_LIMITS, PRICES } from '@/lib/plans';
import { Button } from '@/components/ui/button';

export function PlanCard() {
  const qc = useQueryClient();
  const fetchPlan = useServerFn(getMyPlan); const checkout = useServerFn(startCheckout); const cancel = useServerFn(cancelSubscription);
  const q = useQuery({ queryKey: ['my-plan'], queryFn: () => fetchPlan() });
  const [busy, setBusy] = useState(false);
  const buy = async (period: 'monthly' | 'yearly') => {
    setBusy(true);
    try { const { url } = await checkout({ data: { period } }); window.location.href = url; }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not start checkout.'); setBusy(false); }
  };
  const stop = async () => {
    if (!confirm('Cancel Premium Family? You keep Premium until the end of the paid period, and all your records stay.')) return;
    setBusy(true);
    try { await cancel(); toast.success('Subscription cancelled.'); await qc.invalidateQueries({ queryKey: ['my-plan'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not cancel.'); } finally { setBusy(false); }
  };
  if (q.isPending) return <section className="rounded-xl border bg-card p-6"><p role="status">Loading your plan…</p></section>;
  if (q.isError) return <section className="rounded-xl border bg-card p-6 text-destructive">Could not load your plan.</section>;
  const p = q.data; const premium = p.plan === 'premium'; const sub = p.subscription;
  const rows: [string, number, number][] = [['Family members', p.used.members, p.limits.members], ['Records', p.used.records, p.limits.records], ['AI report readings this month', p.used.report_reader, p.limits.report_reader], ['AI visit summaries this month', p.used.visit_summary, p.limits.visit_summary]];
  return <section className="space-y-5 rounded-xl border bg-card p-6">
    <div className="space-y-1"><h2 className="text-xl font-semibold">Your plan: {premium ? 'Premium Family' : 'Free'}</h2>
      {sub?.status === 'cancelled' && sub.current_period_end && <p className="text-muted-foreground">Cancelled — Premium until {new Date(sub.current_period_end).toLocaleDateString()}.</p>}
      {sub?.status === 'halted' && <p className="text-destructive">Your last payment failed. Update it in Razorpay to keep Premium.</p>}</div>
    <ul className="space-y-1 text-base">{rows.map(([label, used, limit]) => <li key={label} className="flex justify-between gap-4"><span>{label}</span><span className="font-medium">{used} / {limit}</span></li>)}</ul>
    {!premium && <div className="space-y-3 border-t pt-4">
      <p>Premium Family: up to {PLAN_LIMITS.premium.members} members, {PLAN_LIMITS.premium.records} records, {PLAN_LIMITS.premium.report_reader} AI report readings and {PLAN_LIMITS.premium.visit_summary} AI visit summaries a month.</p>
      {p.paymentsReady ? <div className="flex flex-wrap justify-center gap-2"><Button onClick={() => buy('monthly')} disabled={busy}>₹{PRICES.INR.monthly} / month</Button><Button variant="outline" onClick={() => buy('yearly')} disabled={busy}>₹{PRICES.INR.yearly} / year</Button></div>
        : <p className="text-muted-foreground">Online payment is coming soon. To join the Premium pilot, email pinakic113@gmail.com.</p>}
    </div>}
    {premium && sub?.provider === 'razorpay' && sub.status === 'active' && <div className="flex justify-center"><Button variant="outline" onClick={stop} disabled={busy}>Cancel subscription</Button></div>}
  </section>;
}
