import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

export const Route = createFileRoute('/api/public/jobs/cleanup-invites')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        try {
          const { cleanupInviteAttribution } = await import('@/lib/invite-cleanup.server');
          const result = await cleanupInviteAttribution();
          return Response.json(result, { status: result.pending ? 503 : 200 });
        } catch { return Response.json({ error: 'Invite cleanup unavailable.' }, { status: 503 }); }
      },
    },
  },
});