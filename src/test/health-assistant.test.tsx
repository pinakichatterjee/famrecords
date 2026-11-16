import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HealthAssistantDialog } from "@/components/HealthAssistantDialog";
import {
  assistantInputSchema,
  buildFamilyAssistantContext,
  validateAssistantResponse,
} from "@/lib/health-assistant";

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

const members = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    member_name: "Ma",
    relation: "Mother",
    blood_group: "O+",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    member_name: "Baba",
    relation: "Father",
    blood_group: "A+",
  },
];

const records = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Blood sugar (HbA1c)",
    visit_date: "2026-09-12",
    created_at: "2026-09-13T10:00:00Z",
    provider: "City Diagnostics",
    record_type: "Lab report",
    family_member_id: members[0]!.id,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Cardiology Rx",
    visit_date: "2026-08-20",
    created_at: "2026-08-21T10:00:00Z",
    provider: "Dr. Sen",
    record_type: "Prescription",
    family_member_id: members[1]!.id,
  },
];

const events = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Orthopaedic follow-up",
    event_type: "appointment",
    event_date: "2026-11-25",
    event_time: "10:30:00",
    provider: "Dr. Banerjee",
    notes: "Bring knee X-ray",
    family_member_id: members[0]!.id,
  },
];

describe("AI Health Assistant validation and safety", () => {
  it("validates consent and multilingual inputs", () => {
    expect(() =>
      assistantInputSchema.parse({
        question: "What tests were recorded?",
        language: "bn",
        consent: false,
      }),
    ).toThrow();

    const parsed = assistantInputSchema.parse({
      question: "What tests were recorded?",
      memberId: null,
      language: "hi",
      consent: true,
    });
    expect(parsed.language).toBe("hi");
  });

  it("builds scoped family context across records, reviewed tests, and events", () => {
    const allContext = buildFamilyAssistantContext({
      members,
      records,
      events,
      reviewedExtractions: {
        [records[0]!.id]: {
          tests: [{ name: "HbA1c", value: "6.4", unit: "%", referenceRange: "4.0-5.6" }],
        },
      },
      question: "What is Ma's HbA1c?",
    });
    expect(allContext.recordCount).toBe(2);
    expect(allContext.eventCount).toBe(1);
    expect(allContext.allowedText).toContain("6.4");
    expect(allContext.allowedText).toContain("Dr. Sen");

    const scoped = buildFamilyAssistantContext({
      members,
      records,
      events,
      reviewedExtractions: {},
      memberId: members[0]!.id,
      question: "Show Ma's records",
    });
    expect(scoped.recordCount).toBe(1);
    expect(scoped.payload.records[0]?.name).toBe("Blood sugar (HbA1c)");
  });

  it("enforces numerical fidelity and blocks diagnostic/treatment advice", () => {
    const allowed = "Blood sugar (HbA1c) 2026-09-12 Ma HbA1c 6.4 %";
    const ok = validateAssistantResponse(
      {
        answer: "মায়ের HbA1c মান ৬.৪% নথিভুক্ত আছে (২০২৬-০৯-১২)।",
        citations: [
          {
            sourceName: "Blood sugar (HbA1c)",
            memberName: "Ma",
            date: "2026-09-12",
            quote: "HbA1c 6.4 %",
          },
        ],
        limitations: [],
      },
      allowed,
    );
    expect(ok.citations).toHaveLength(1);

    expect(() =>
      validateAssistantResponse(
        {
          answer: "HbA1c is 9.9%.",
          citations: [],
          limitations: [],
        },
        allowed,
      ),
    ).toThrow(/unverified number/i);

    expect(() =>
      validateAssistantResponse(
        {
          answer: "You have diabetes and should start medication immediately.",
          citations: [],
          limitations: [],
        },
        allowed,
      ),
    ).toThrow(/safety checks/i);
  });
});

describe("HealthAssistantDialog component", () => {
  it("requires consent, populates starter question, submits, and displays citations", async () => {
    const onAsk = vi.fn().mockResolvedValue({
      response: {
        answer: "Recorded blood sugar (HbA1c) for Ma on 2026-09-12 at City Diagnostics.",
        citations: [
          {
            sourceName: "Blood sugar (HbA1c)",
            memberName: "Ma",
            date: "2026-09-12",
            quote: "City Diagnostics · Lab report",
          },
        ],
        limitations: ["Scanned PDF contents require a reviewed Report Reader table."],
      },
    });

    render(
      <HealthAssistantDialog
        open
        members={members}
        defaultMemberId="all"
        defaultLanguage="en"
        onClose={() => {}}
        onAsk={onAsk}
      />,
    );

    const askBtn = await screen.findByRole("button", { name: /ask assistant/i });
    expect(askBtn).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /which lab reports and visit dates/i }));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(askBtn).toBeEnabled();

    fireEvent.click(askBtn);

    await waitFor(() => {
      expect(onAsk).toHaveBeenCalledWith({
        question: "Which lab reports and visit dates are on record?",
        memberId: null,
        language: "en",
        consent: true,
      });
    });

    expect(
      await screen.findByText(/recorded blood sugar \(hba1c\) for ma on 2026-09-12/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sources cited/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear session/i }));
    expect(
      screen.queryByText(/recorded blood sugar \(hba1c\) for ma on 2026-09-12/i),
    ).not.toBeInTheDocument();
  });
});
