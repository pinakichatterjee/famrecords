import { useEffect, useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NEWSLETTER_NOTICE,
  NEWSLETTER_STORAGE_KEY,
  readSavedNewsletterSubscription,
  validateNewsletterForm,
  type SavedNewsletterSubscription,
} from "@/lib/newsletter";

export interface HealthEducationNewsletterFormProps {
  onSubscribe?: (payload: { email: string; consent: true }) => Promise<{
    alreadySubscribed?: boolean;
    email: string;
    subscribedAt?: string;
  }>;
}

async function defaultSubscribeRequest(payload: { email: string; consent: true }) {
  const response = await fetch("/api/public/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    alreadySubscribed?: boolean;
    email?: string;
    subscribedAt?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Could not complete your subscription. Please try again.");
  }

  return {
    alreadySubscribed: Boolean(data.alreadySubscribed),
    email: data.email ?? payload.email,
    ...(data.subscribedAt ? { subscribedAt: data.subscribedAt } : {}),
  };
}

export function HealthEducationNewsletterForm({
  onSubscribe = defaultSubscribeRequest,
}: HealthEducationNewsletterFormProps) {
  const emailId = useId();
  const consentId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<
    (SavedNewsletterSubscription & { alreadySubscribed?: boolean }) | null
  >(null);

  useEffect(() => {
    try {
      const saved = readSavedNewsletterSubscription(localStorage.getItem(NEWSLETTER_STORAGE_KEY));
      if (saved) setSubscription(saved);
    } catch {
      // Ignore storage access failures in private/restricted browsers.
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateNewsletterForm(email, consent);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await onSubscribe(validation.data);
      const next: SavedNewsletterSubscription & { alreadySubscribed?: boolean } = {
        email: result.email,
        notice: NEWSLETTER_NOTICE,
        subscribedAt: result.subscribedAt ?? new Date().toISOString(),
        alreadySubscribed: Boolean(result.alreadySubscribed),
      };
      try {
        localStorage.setItem(
          NEWSLETTER_STORAGE_KEY,
          JSON.stringify({
            email: next.email,
            notice: next.notice,
            subscribedAt: next.subscribedAt,
          }),
        );
      } catch {
        // Subscription succeeded even if local storage is blocked.
      }
      setSubscription(next);
      setEmail("");
      setConsent(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete your subscription. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetSubscription() {
    try {
      localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    setSubscription(null);
    setError(null);
  }

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="rounded-2xl border border-primary/20 bg-card p-6 shadow-soft md:p-8"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 id="newsletter-heading" className="text-xl font-bold leading-snug text-foreground">
            Get new Health Education guides by email
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Receive practical checklists for organising family health records, preparing doctor
            visit packs, and keeping household medical files private. No spam and no tracking of
            which articles you read.
          </p>
        </div>
      </div>

      {subscription ? (
        <div
          role="status"
          className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-0.5 text-sm">
              <p className="font-semibold text-foreground">
                {subscription.alreadySubscribed
                  ? "This email is already subscribed."
                  : "You're subscribed to FamRecords Health Education."}
              </p>
              <p className="text-muted-foreground">
                Updates will be sent to{" "}
                <span className="font-medium text-foreground">{subscription.email}</span>.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={resetSubscription}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={emailId} className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                disabled={submitting}
                className="h-11 bg-background"
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="h-11 shrink-0 px-6">
              {submitting ? "Subscribing…" : "Subscribe"}
            </Button>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id={consentId}
              checked={consent}
              onCheckedChange={(checked) => {
                setConsent(checked === true);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label
              htmlFor={consentId}
              className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground sm:text-sm"
            >
              I agree to receive occasional Health Education articles by email from FamRecords and
              have read the{" "}
              <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          {error && (
            <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
