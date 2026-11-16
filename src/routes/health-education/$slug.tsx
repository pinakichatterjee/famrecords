import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  List,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthEducationSearchTrigger } from "@/components/HealthEducationSearch";
import { HealthEducationNewsletterForm } from "@/components/HealthEducationNewsletterForm";
import {
  estimateReadingMinutes,
  getHealthEducationArticle,
  getRelatedHealthEducationArticles,
} from "@/lib/health-education";
import logo from "@/assets/logo-lockup.png";

export const Route = createFileRoute("/health-education/$slug")({
  head: (ctx) => {
    const slug = ctx?.params?.slug;
    const article = slug ? getHealthEducationArticle(slug) : undefined;
    if (!article) {
      return {
        meta: [
          { title: "Article not found — FamRecords Health Education" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    const url = `https://www.famrecords.org/health-education/${article.slug}`;
    const scripts = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.metaDescription,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
          publisher: {
            "@type": "Organization",
            name: "FamRecords: Rehab & Wellness",
            url: "https://www.famrecords.org/",
          },
        }),
      },
      ...(article.faqs.length > 0
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: article.faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.a,
                  },
                })),
              }),
            },
          ]
        : []),
    ];

    return {
      meta: [
        { title: article.seoTitle },
        { name: "description", content: article.metaDescription },
        { property: "og:title", content: article.seoTitle },
        { property: "og:description", content: article.metaDescription },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "FamRecords: Rehab & Wellness" },
        { property: "og:image", content: "https://www.famrecords.org/og-image.jpg" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: article.seoTitle },
        { name: "twitter:description", content: article.metaDescription },
        { name: "robots", content: "index, follow, max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: HealthEducationArticlePage,
});

function HealthEducationArticlePage() {
  const { slug } = Route.useParams();
  const article = getHealthEducationArticle(slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-hero">
        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/" aria-label="FamRecords home">
              <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <HealthEducationSearchTrigger />
              <Button asChild variant="outline" size="sm">
                <Link to="/health-education">All articles</Link>
              </Button>
            </div>
          </header>

          <main className="mx-auto my-16 max-w-xl rounded-xl border border-border bg-card p-8 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <p className="mt-2 text-base text-muted-foreground">
              The Health Education guide you requested could not be found. Use search or browse the
              full library to find another guide.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <HealthEducationSearchTrigger variant="inline" label="Search Health Education…" />
              <Button asChild>
                <Link to="/health-education">Browse Health Education</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const readingMinutes = estimateReadingMinutes(article);
  const relatedArticles = getRelatedHealthEducationArticles(article.slug, 3);
  const tocItems = [
    ...article.sections.map((section) => ({
      id: section.id,
      label: section.heading,
    })),
    ...(article.faqs.length > 0
      ? [{ id: "frequently-asked-questions", label: "Frequently asked questions" }]
      : []),
    { id: "medical-disclaimer", label: "Medical disclaimer" },
    ...(article.references.length > 0 ? [{ id: "references", label: "References" }] : []),
  ];

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
              <Link to="/health-education">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Health Education
              </Link>
            </Button>
          </div>
        </header>

        <nav
          aria-label="Breadcrumb"
          className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/health-education" className="hover:text-primary hover:underline">
            Health Education
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">{article.title}</span>
        </nav>

        <div className="my-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-8">
            <article className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-10">
              <header className="space-y-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                    {readingMinutes} min read
                  </span>
                </div>
                <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  {article.title}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  {article.summary}
                </p>
              </header>

              {/* Mobile / Tablet Table of Contents */}
              <nav
                aria-label="Table of contents"
                className="rounded-xl border border-border bg-secondary/40 p-5 lg:hidden"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <List className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>In this article</span>
                </div>
                <ol className="mt-3 space-y-2 text-sm">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-muted-foreground transition-colors hover:text-primary hover:underline"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="space-y-10">
                {article.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`${section.id}-heading`}
                    className="scroll-mt-20 space-y-4"
                  >
                    <h2
                      id={`${section.id}-heading`}
                      className="text-2xl font-bold leading-snug text-foreground"
                    >
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-base leading-relaxed text-muted-foreground md:text-[17px]"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-2.5 pt-1">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2.5 text-base leading-relaxed text-muted-foreground"
                          >
                            <CheckCircle2
                              className="mt-1 h-4 w-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}

                {article.faqs.length > 0 && (
                  <section
                    id="frequently-asked-questions"
                    aria-labelledby="faq-heading"
                    className="scroll-mt-20 space-y-4 border-t border-border pt-8"
                  >
                    <h2 id="faq-heading" className="text-2xl font-bold text-foreground">
                      Frequently asked questions
                    </h2>
                    <div className="space-y-3">
                      {article.faqs.map((faq) => (
                        <details
                          key={faq.q}
                          className="rounded-xl border border-border bg-background/70 p-4"
                        >
                          <summary className="cursor-pointer text-base font-semibold text-foreground">
                            {faq.q}
                          </summary>
                          <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">
                            {faq.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                <section
                  id="medical-disclaimer"
                  aria-labelledby="disclaimer-heading"
                  className="scroll-mt-20 rounded-xl border border-primary/25 bg-secondary/50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div className="space-y-1.5">
                      <h2
                        id="disclaimer-heading"
                        className="text-base font-semibold text-foreground"
                      >
                        Medical disclaimer
                      </h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {article.disclaimer}
                      </p>
                    </div>
                  </div>
                </section>

                {article.references.length > 0 && (
                  <section
                    id="references"
                    aria-labelledby="references-heading"
                    className="scroll-mt-20 space-y-3 border-t border-border pt-8"
                  >
                    <h2 id="references-heading" className="text-xl font-bold text-foreground">
                      References
                    </h2>
                    <ol className="list-decimal space-y-2.5 pl-5 text-sm text-muted-foreground">
                      {article.references.map((ref) => (
                        <li key={ref.url} className="leading-relaxed">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <span>{ref.label}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </a>
                          {ref.note && <span className="block text-xs">{ref.note}</span>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            </article>
            <HealthEducationNewsletterForm />
          </div>

          {/* Desktop Sticky Table of Contents + CTA */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            <nav
              aria-label="Table of contents"
              className="hidden rounded-xl border border-border bg-card p-5 shadow-soft lg:block"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <List className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>In this article</span>
              </div>
              <ol className="mt-3 space-y-2.5 text-sm">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block leading-snug text-muted-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <h2 className="text-base font-semibold text-foreground">
                Keep your family&apos;s records in one timeline
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Store reports, prescriptions, and therapy notes privately, and prepare PDF
                doctor-visit packs in English or বাংলা.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Create a free account</Link>
              </Button>
            </div>
          </aside>
        </div>

        {relatedArticles.length > 0 && (
          <section aria-labelledby="more-guides" className="my-12 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="more-guides" className="text-2xl font-bold">
                More from Health Education
              </h2>
              <Link
                to="/health-education"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all articles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <article
                  key={related.slug}
                  className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                        {related.category}
                      </span>
                      <span className="text-muted-foreground">
                        {estimateReadingMinutes(related)} min read
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold leading-snug">
                      <Link
                        to="/health-education/$slug"
                        params={{ slug: related.slug }}
                        className="hover:text-primary hover:underline"
                      >
                        {related.title}
                      </Link>
                    </h3>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{related.summary}</p>
                  </div>
                  <Link
                    to="/health-education/$slug"
                    params={{ slug: related.slug }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Read article
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="my-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>FamRecords: Rehab &amp; Wellness</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/" className="font-medium text-primary hover:underline">
              Home
            </Link>
            <Link to="/health-education" className="font-medium text-primary hover:underline">
              Health Education
            </Link>
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
