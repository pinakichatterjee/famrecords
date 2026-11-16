import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  HealthEducationSearchDialog,
  HealthEducationSearchTrigger,
} from "@/components/HealthEducationSearch";
import {
  HEALTH_EDUCATION_ARTICLES,
  estimateReadingMinutes,
  getHealthEducationArticle,
} from "@/lib/health-education";
import { highlightMatches, searchHealthEducation } from "@/lib/health-education-search";

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

describe("Health Education library and search engine", () => {
  it("contains the digital health records article and computes reading time", () => {
    const article = getHealthEducationArticle(
      "why-every-family-should-maintain-digital-health-records",
    );
    expect(article).toBeDefined();
    expect(article?.title).toBe("Why Every Family Should Maintain Digital Health Records");
    expect(estimateReadingMinutes(article!)).toBeGreaterThanOrEqual(2);
  });

  it("ranks title matches ahead of body matches", () => {
    const results = searchHealthEducation(HEALTH_EDUCATION_ARTICLES, "digital health records");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.article.slug).toBe(
      "why-every-family-should-maintain-digital-health-records",
    );
  });

  it("finds articles by section and FAQ content and extracts a match snippet", () => {
    const results = searchHealthEducation(HEALTH_EDUCATION_ARTICLES, "HbA1c");
    expect(results).toHaveLength(1);
    expect(results[0]?.article.slug).toBe("understanding-lab-reports-and-reference-ranges");
    expect(results[0]?.matchContext?.label).toContain("Section:");
  });

  it("filters by topic category", () => {
    const results = searchHealthEducation(HEALTH_EDUCATION_ARTICLES, "", "Doctor Visits");
    expect(results.length).toBe(1);
    expect(results[0]?.article.slug).toBe("how-to-prepare-a-doctor-visit-pack");
  });

  it("splits text into highlighted and plain segments safely", () => {
    const segments = highlightMatches("Keep digital health records safe", "digital records");
    expect(segments.filter((s) => s.match).map((s) => s.text.toLowerCase())).toEqual([
      "digital",
      "records",
    ]);
  });
});

describe("Global HealthEducationSearchDialog component", () => {
  it("opens from the trigger button, filters results as the user types, and navigates on selection", async () => {
    const onNavigate = vi.fn();
    render(
      <>
        <HealthEducationSearchTrigger />
        <HealthEducationSearchDialog onNavigate={onNavigate} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: /search health education library/i }));

    const input = await screen.findByLabelText(/search health education articles/i);
    fireEvent.change(input, { target: { value: "visit pack" } });

    const matchedTitle = await screen.findByText(/how to prepare a/i);
    fireEvent.click(matchedTitle);

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith(
        "/health-education/how-to-prepare-a-doctor-visit-pack",
      );
    });
  });

  it("opens with Ctrl+K and shows an empty state with reset action when nothing matches", async () => {
    const onNavigate = vi.fn();
    render(<HealthEducationSearchDialog onNavigate={onNavigate} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const input = await screen.findByLabelText(/search health education articles/i);
    fireEvent.change(input, { target: { value: "zzzznonexistentquery" } });

    expect(await screen.findByText(/no articles found matching/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /browse library/i }));
    expect(onNavigate).toHaveBeenCalledWith("/health-education");
  });

  it("filters displayed articles when a topic chip is clicked", async () => {
    const onNavigate = vi.fn();
    render(<HealthEducationSearchDialog onNavigate={onNavigate} defaultOpen />);

    fireEvent.click(screen.getByRole("button", { name: "Privacy & Care" }));

    expect(
      await screen.findByText("Protecting Your Family's Medical Privacy Online"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Why Every Family Should Maintain Digital Health Records"),
    ).not.toBeInTheDocument();
  });
});
