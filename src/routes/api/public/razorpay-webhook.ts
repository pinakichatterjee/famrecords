import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { razorpayUpdate, verifyRazorpaySignature } from '@/lib/plans';

const eventSchema = z.object({
  event: z.string().max(100),
  payload: z.object({ subscription: z.object({ entity: z.object({ id: z.string().max(100), status: z.string().max(50), current_end: z.number().nullable().optional(), notes: z.record(z.string(), z.unknown()).optional() }) }).optional() }),
});

export const Route = createFileRoute('/api/public/razorpay-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const ok = await verifyRazorpaySignature(process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '', body, request.headers.get('x-razorpay-signature'));
        if (!ok) return new Response('Invalid signature', { status: 401 });
        const parsed = eventSchema.safeParse(JSON.parse(body));
        if (!parsed.success) return new Response('Ignored', { status: 200 });
        const entity = parsed.data.payload.subscription?.entity;
        const update = entity ? razorpayUpdate(parsed.data.event, entity) : null;
        if (!entity || !update) return new Response('Ignored', { status: 200 });
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        // Only update a subscription this app created (matched by Razorpay id), never one named in untrusted notes alone.
        const { data: row } = await supabaseAdmin.from('subscriptions').select('user_id').eq('provider_subscription_id', entity.id).maybeSingle();
        if (!row) return new Response('Unknown subscription', { status: 200 });
        await supabaseAdmin.from('subscriptions').update({ ...update, updated_at: new Date().toISOString() }).eq('user_id', row.user_id);
        return new Response('ok');
      },
    },
  },
});
