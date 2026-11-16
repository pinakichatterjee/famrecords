import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock, Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const OPEN_SEARCH_EVENT = "famrecords:open-health-education-search";

export function openHealthEducationSearch(initialQuery = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ query?: string }>(OPEN_SEARCH_EVENT, {
      detail: { query: initialQuery },
    }),
  );
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

function HighlightedText({ text, query }: { text: string; query: string }) {
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

export interface HealthEducationSearchDialogProps {
  onNavigate: (href: string) => void;
  defaultOpen?: boolean;
}

const CATEGORIES: readonly HealthEducationSearchCategory[] = [
  "All",
  ...HEALTH_EDUCATION_CATEGORIES,
];

export function HealthEducationSearchDialog({
  onNavigate,
  defaultOpen = false,
}: HealthEducationSearchDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HealthEducationSearchCategory>("All");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpenRequest = (event: Event) => {
      const custom = event as CustomEvent<{ query?: string }>;
      if (typeof custom.detail?.query === "string" && custom.detail.query.length > 0) {
        setQuery(custom.detail.query);
      }
      setOpen(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditableElement(event.target)) return;
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(
    () => searchHealthEducation(HEALTH_EDUCATION_ARTICLES, query, category),
    [query, category],
  );

  const handleSelect = (href: string) => {
    setOpen(false);
    onNavigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3 pr-12">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <DialogTitle className="text-sm font-semibold text-foreground">
            Search Health Education Library
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search FamRecords Health Education articles by title, topic, or question.
          </DialogDescription>
        </div>

        <Command shouldFilter={false} className="rounded-none bg-card">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles, e.g. digital records, visit pack, lab report, privacy…"
              aria-label="Search Health Education articles"
              className="flex h-12 w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search query"
                className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter by topic"
            className="flex flex-wrap gap-1.5 border-b border-border bg-background/60 px-3 py-2.5"
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
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

          <CommandList className="max-h-[360px] p-2">
            {results.length === 0 ? (
              <CommandEmpty className="py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  {`No articles found matching "${query.trim()}"`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try keywords like &ldquo;digital records&rdquo;, &ldquo;visit pack&rdquo;,
                  &ldquo;lab report&rdquo;, or &ldquo;privacy&rdquo;.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {category !== "All" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCategory("All")}
                    >
                      Show all topics
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelect("/health-education")}
                  >
                    Browse library
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup
                heading={
                  query.trim()
                    ? `${results.length} matching ${results.length === 1 ? "article" : "articles"}`
                    : "Health Education guides"
                }
              >
                {results.map(({ article, matchContext }) => {
                  const readingMinutes = estimateReadingMinutes(article);
                  const href = `/health-education/${article.slug}`;
                  return (
                    <CommandItem
                      key={article.slug}
                      value={article.slug}
                      onSelect={() => handleSelect(href)}
                      className="my-1 flex cursor-pointer flex-col items-start gap-1.5 rounded-lg border border-transparent px-3 py-3 text-left transition-colors hover:border-border data-[selected=true]:border-primary/30 data-[selected=true]:bg-secondary/70 data-[selected=true]:text-foreground"
                    >
                      <div className="flex w-full flex-wrap items-center justify-between gap-2">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {readingMinutes} min read
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        <HighlightedText text={article.title} query={query} />
                      </p>
                      {matchContext ? (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-primary">{matchContext.label}: </span>
                          <HighlightedText text={matchContext.excerpt} query={query} />
                        </p>
                      ) : (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {article.summary}
                        </p>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
            <div className="hidden items-center gap-3 sm:flex">
              <span>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[11px]">
                  ↑↓
                </kbd>{" "}
                navigate
              </span>
              <span>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[11px]">
                  ↵
                </kbd>{" "}
                open
              </span>
              <span>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[11px]">
                  Esc
                </kbd>{" "}
                close
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelect("/health-education")}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Browse all Health Education articles
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function HealthEducationSearch() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const handleNavigate = (href: string) => {
    // Homepage exits must trigger full-document navigation so AdSense runtime never leaks.
    if (pathname === "/") {
      window.location.assign(href);
      return;
    }
    if (href === "/health-education") {
      navigate({ to: "/health-education" });
      return;
    }
    const prefix = "/health-education/";
    if (href.startsWith(prefix)) {
      navigate({
        to: "/health-education/$slug",
        params: { slug: href.slice(prefix.length) },
      });
      return;
    }
    window.location.assign(href);
  };

  return <HealthEducationSearchDialog onNavigate={handleNavigate} />;
}

export interface HealthEducationSearchTriggerProps {
  variant?: "header" | "inline";
  label?: string;
  className?: string;
}

export function HealthEducationSearchTrigger({
  variant = "header",
  label = "Search Health Education…",
  className,
}: HealthEducationSearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => openHealthEducationSearch()}
      aria-label="Search Health Education library"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-card text-sm text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "header"
          ? "h-9 px-3"
          : "h-11 w-full justify-between px-4 sm:w-auto sm:min-w-72",
        className,
      )}
    >
      <span className="flex items-center gap-2 truncate">
        <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground sm:inline-block">
        Ctrl K
      </kbd>
    </button>
  );
}
