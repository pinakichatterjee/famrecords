import { createFileRoute } from "@tanstack/react-router";
import {
  NEWSLETTER_NOTICE,
  normalizeNewsletterEmail,
  newsletterSubscriptionInput,
} from "@/lib/newsletter";

const subscribers = new Map<string, { subscribedAt: string; notice: string }>();

export function clearNewsletterSubscribersForTest() {
  subscribers.clear();
}

export async function handleNewsletterSubscribe(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = newsletterSubscriptionInput.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please enter a valid email and consent.";
    return Response.json({ error: message }, { status: 400 });
  }

  const email = normalizeNewsletterEmail(parsed.data.email);
  const existing = subscribers.get(email);
  if (existing) {
    return Response.json(
      {
        ok: true,
        alreadySubscribed: true,
        email,
        subscribedAt: existing.subscribedAt,
        notice: existing.notice,
      },
      { status: 200 },
    );
  }

  const record = {
    subscribedAt: new Date().toISOString(),
    notice: NEWSLETTER_NOTICE,
  };
  subscribers.set(email, record);

  const webhookUrl = process.env["NEWSLETTER_WEBHOOK_URL"];
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...record }),
      });
    } catch {
      // Do not fail visitor confirmation if an optional external webhook is unreachable.
    }
  }

  return Response.json(
    {
      ok: true,
      alreadySubscribed: false,
      email,
      subscribedAt: record.subscribedAt,
      notice: record.notice,
    },
    { status: 201 },
  );
}

export const Route = createFileRoute("/api/public/newsletter")({
  server: {
    handlers: {
      POST: ({ request }) => handleNewsletterSubscribe(request),
    },
  },
});
