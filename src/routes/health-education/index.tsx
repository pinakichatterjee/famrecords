import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock, Search, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthEducationSearchTrigger } from "@/components/HealthEducationSearch";
import {
  HEALTH_EDUCATION_ARTICLES,
  HEALTH_EDUCATION_CATEGORIES,
  estimateReadingMinutes,
} from "@/lib/health-education";
import {
  highlightMatches,
  searchHealthEducation,
  type HealthEducationSearchCategory,
} from "@/lib/health-education-search";
import logo from "@/assets/logo-lockup.png";
import { cn } from "@/lib/utils";

const PAGE_TITLE = "Health Education Library — FamRecords";
const PAGE_DESCRIPTION =
  "Plain-language family health guides on organising digital medical records, preparing doctor-visit packs, understanding lab reports, and protecting medical privacy.";

const CATEGORIES: readonly HealthEducationSearchCategory[] = [
  "All",
  ...HEALTH_EDUCATION_CATEGORIES,
];

export const Route = createFileRoute("/health-education/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.famrecords.org/health-education" },
      { property: "og:image", content: "https://www.famrecords.org/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: "https://www.famrecords.org/health-education" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "FamRecords Health Education Library",
          description: PAGE_DESCRIPTION,
          url: "https://www.famrecords.org/health-education",
          publisher: {
            "@type": "Organization",
            name: "FamRecords: Rehab & Wellness",
            url: "https://www.famrecords.org/",
          },
        }),
      },
    ],
  }),
  component: HealthEducationIndexPage,
});

function InlineHighlight({ text, query }: { text: string; query: string }) {
  const segments = useMemo(() => highlightMatches(text, query), [text, query]);
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={`${index}-${segment.text}`}
            className="rounded-xs bg-accent/60 px-0.5 font-semibold text-foreground"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function HealthEducationIndexPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HealthEducationSearchCategory>("All");

  const results = useMemo(
    () => searchHealthEducation(HEALTH_EDUCATION_ARTICLES, query, category),
    [query, category],
  );

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" aria-label="FamRecords home" className="shrink-0">
            <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <HealthEducationSearchTrigger />
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </header>

        <main className="my-10 space-y-10 md:my-14">
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Health Education</span>
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
              Practical guides for organising your family&apos;s health records
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Clear, non-clinical guides to keeping medical history together, preparing for doctor
              appointments, reading lab report layouts, and protecting household privacy.
            </p>
          </section>

          <section
            aria-label="Filter and search Health Education articles"
            className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search articles by topic, title, or question (e.g. digital records, lab report, visit pack)…"
                aria-label="Filter Health Education articles"
                className="h-11 pl-9 pr-10"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Article topics" className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Showing {results.length} of {HEALTH_EDUCATION_ARTICLES.length} articles
              </p>
            </div>
          </section>

          {results.length === 0 ? (
            <section className="rounded-xl border border-border bg-card p-8 text-center shadow-soft">
              <h2 className="text-lg font-semibold">No matching articles found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No Health Education guides matched your current search or topic filter.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Reset search and filters
                </Button>
              </div>
            </section>
          ) : (
            <section aria-label="Health Education articles" className="grid gap-6 md:grid-cols-2">
              {results.map(({ article, matchContext }) => {
                const readingMinutes = estimateReadingMinutes(article);
                return (
                  <article
                    key={article.slug}
                    className="flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                          {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {readingMinutes} min read
                        </span>
                      </div>
                      <h2 className="text-xl font-bold leading-snug text-foreground">
                        <Link
                          to="/health-education/$slug"
                          params={{ slug: article.slug }}
                          className="hover:text-primary hover:underline"
                        >
                          <InlineHighlight text={article.title} query={query} />
                        </Link>
                      </h2>
                      <p className="text-base text-muted-foreground">
                        <InlineHighlight text={article.summary} query={query} />
                      </p>
                      {matchContext && (
                        <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">{matchContext.label}: </span>
                          <InlineHighlight text={matchContext.excerpt} query={query} />
                        </p>
                      )}
                    </div>
                    <div className="pt-2">
                      <Link
                        to="/health-education/$slug"
                        params={{ slug: article.slug }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        Read article
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          <aside
            aria-label="Educational disclaimer"
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-soft"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Educational information only: FamRecords Health Education guides help families
              organise and prepare their own medical records. They do not diagnose conditions or
              provide medical advice — always discuss test results and care decisions with your
              doctor.
            </p>
          </aside>
        </main>

        <footer className="my-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>FamRecords: Rehab &amp; Wellness</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/" className="font-medium text-primary hover:underline">
              Home
            </Link>
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
