import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthEducationNewsletterForm } from "@/components/HealthEducationNewsletterForm";
import {
  NEWSLETTER_STORAGE_KEY,
  normalizeNewsletterEmail,
  readSavedNewsletterSubscription,
  validateNewsletterForm,
} from "@/lib/newsletter";
import {
  clearNewsletterSubscribersForTest,
  handleNewsletterSubscribe,
} from "@/routes/api/public/newsletter";

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
  });
  const privacyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/privacy",
    component: () => <div>Privacy</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, privacyRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { queryClient: new QueryClient() },
  });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("newsletter validation and API handler", () => {
  beforeEach(() => {
    clearNewsletterSubscribersForTest();
    localStorage.clear();
  });

  it("validates email and consent requirement", () => {
    expect(validateNewsletterForm("", true).ok).toBe(false);
    expect(validateNewsletterForm("not-an-email", true).ok).toBe(false);
    expect(validateNewsletterForm("User@Example.com", false).ok).toBe(false);

    const valid = validateNewsletterForm("  User@Example.COM ", true);
    expect(valid).toEqual({
      ok: true,
      data: { email: "user@example.com", consent: true },
    });
  });

  it("normalizes email and rejects invalid saved payloads", () => {
    expect(normalizeNewsletterEmail("  Family@Example.ORG ")).toBe("family@example.org");
    expect(readSavedNewsletterSubscription("not-json")).toBeNull();
    expect(
      readSavedNewsletterSubscription(JSON.stringify({ email: "a@b.com", notice: "wrong" })),
    ).toBeNull();
  });

  it("subscribes and deduplicates emails on the public API handler", async () => {
    const req1 = new Request("https://www.famrecords.org/api/public/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Reader@Example.com", consent: true }),
    });
    const res1 = await handleNewsletterSubscribe(req1);
    expect(res1.status).toBe(201);
    const body1 = (await res1.json()) as { ok: boolean; alreadySubscribed: boolean; email: string };
    expect(body1.ok).toBe(true);
    expect(body1.alreadySubscribed).toBe(false);
    expect(body1.email).toBe("reader@example.com");

    const req2 = new Request("https://www.famrecords.org/api/public/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "reader@example.com", consent: true }),
    });
    const res2 = await handleNewsletterSubscribe(req2);
    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as { ok: boolean; alreadySubscribed: boolean };
    expect(body2.ok).toBe(true);
    expect(body2.alreadySubscribed).toBe(true);

    const badReq = new Request("https://www.famrecords.org/api/public/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad", consent: false }),
    });
    const badRes = await handleNewsletterSubscribe(badReq);
    expect(badRes.status).toBe(400);
  });
});

describe("HealthEducationNewsletterForm component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows validation error when email or consent is missing", async () => {
    const onSubscribe = vi.fn();
    renderWithRouter(<HealthEducationNewsletterForm onSubscribe={onSubscribe} />);

    const submitButton = await screen.findByRole("button", { name: /subscribe/i });
    fireEvent.click(submitButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your email/i);
    expect(onSubscribe).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "family@example.com" },
    });
    fireEvent.click(submitButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(/confirm that you would like/i);
    expect(onSubscribe).not.toHaveBeenCalled();
  });

  it("submits valid email with consent, persists confirmation, and supports switching email", async () => {
    const onSubscribe = vi.fn().mockResolvedValue({
      alreadySubscribed: false,
      email: "family@example.com",
      subscribedAt: "2026-11-16T05:00:00.000Z",
    });

    renderWithRouter(<HealthEducationNewsletterForm onSubscribe={onSubscribe} />);

    const emailInput = await screen.findByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "Family@Example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => {
      expect(onSubscribe).toHaveBeenCalledWith({
        email: "family@example.com",
        consent: true,
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /you're subscribed to famrecords health education/i,
    );
    expect(localStorage.getItem(NEWSLETTER_STORAGE_KEY)).toContain("family@example.com");

    fireEvent.click(screen.getByRole("button", { name: /use a different email/i }));
    expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument();
  });
});
