import { z } from "zod";

export const NEWSLETTER_STORAGE_KEY = "famrecords-newsletter-v1";
export const NEWSLETTER_NOTICE = "famrecords-newsletter-v1";

export const newsletterSubscriptionInput = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(254, "Please enter a shorter email address.")
    .email("Please enter a valid email address."),
  consent: z.literal(true, {
    error: "Please confirm that you would like to receive Health Education updates.",
  }),
});

export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionInput>;

export interface SavedNewsletterSubscription {
  email: string;
  notice: string;
  subscribedAt: string;
}

export function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateNewsletterForm(
  email: string,
  consent: boolean,
): { ok: true; data: NewsletterSubscriptionInput } | { ok: false; error: string } {
  const parsed = newsletterSubscriptionInput.safeParse({ email, consent });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? "Please check your details and try again." };
  }
  return {
    ok: true,
    data: {
      email: normalizeNewsletterEmail(parsed.data.email),
      consent: true,
    },
  };
}

export function readSavedNewsletterSubscription(
  raw: string | null,
): SavedNewsletterSubscription | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedNewsletterSubscription> | null;
    if (
      parsed &&
      parsed.notice === NEWSLETTER_NOTICE &&
      typeof parsed.email === "string" &&
      parsed.email.includes("@") &&
      typeof parsed.subscribedAt === "string"
    ) {
      return {
        email: parsed.email,
        notice: parsed.notice,
        subscribedAt: parsed.subscribedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}
