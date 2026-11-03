import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Users, FileText, Settings, ArrowRight, Upload, CalendarClock, UserPlus, CalendarDays } from "lucide-react";
import { membersQuery, recordsQuery } from "@/lib/data";
import { listHealthEvents } from "@/lib/health.functions";
import { Button } from "@/components/ui/button";

// Same key as the records page so both share one cached copy.
const eventsQuery = queryOptions({ queryKey: ["health-events"], queryFn: () => listHealthEvents() });

export const Route = createFileRoute("/_authenticated/_approved/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FamRecords" }, { name: "description", content: "Your FamRecords overview of members and medical records." }, { property: "og:title", content: "Dashboard — FamRecords" }, { property: "og:description", content: "Your FamRecords overview of members and medical records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

const fmt = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function Dashboard() {
  const { user } = Route.useRouteContext();
  const members = useQuery(membersQuery);
  const records = useQuery(recordsQuery);
  const events = useQuery(eventsQuery);
  const name = (user.user_metadata?.["name"] as string) || user.email;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (events.data ?? []).filter((e) => e.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 3);
  const recent = (records.data ?? []).slice(0, 3);

  const cards = [
    { to: "/members" as const, icon: Users, title: "Members", text: "Add and manage family members", count: members.data?.length },
    { to: "/records" as const, icon: FileText, title: "Medical Records", text: "Upload and search documents", count: records.data?.length },
    { to: "/settings" as const, icon: Settings, title: "Settings", text: "Manage your account email" },
  ];
  const actions = [
    { to: "/records" as const, icon: Upload, label: "Upload a record" },
    { to: "/records" as const, icon: CalendarClock, label: "Timeline & visit packs" },
    { to: "/members" as const, icon: UserPlus, label: "Add a family member" },
  ];

  return (
    <div className="space-y-8">
      <div className="min-w-0 space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Your family medical records dashboard</h1>
        <p className="break-words text-muted-foreground">Hello, {name}</p>
        <p className="text-base text-muted-foreground md:text-lg">What would you like to do today?</p>
      </div>

      <section aria-labelledby="quick-actions" className="space-y-3">
        <h2 id="quick-actions" className="text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((a) => (
            <Button key={a.label} asChild variant="outline" className="h-12 justify-start">
              <Link to={a.to}><a.icon className="h-5 w-5 shrink-0 text-primary" /><span className="truncate">{a.label}</span></Link>
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group space-y-4 rounded-xl bg-secondary p-5 transition hover:shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-card p-3"><c.icon className="h-6 w-6 text-primary" /></div>
              {c.count !== undefined && <span className="font-heading text-3xl font-bold text-primary">{c.count}</span>}
            </div>
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                {c.title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </h2>
              <p className="text-base text-muted-foreground">{c.text}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-records" className="space-y-3 rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <h2 id="recent-records" className="text-lg font-semibold">Recently added records</h2>
            <Link to="/records" className="shrink-0 text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          {records.isPending ? <p className="text-sm text-muted-foreground">Loading…</p>
            : records.isError ? <p role="alert" className="text-sm text-destructive">Records could not be loaded.</p>
            : recent.length === 0 ? <p className="text-sm text-muted-foreground">No records yet. Upload a prescription, report or bill to get started.</p>
            : <ul className="divide-y">{recent.map((r) => (
              <li key={r.id} className="flex min-w-0 items-center gap-3 py-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{[r.family_members?.member_name, r.record_type, r.visit_date ? fmt(r.visit_date) : null].filter(Boolean).join(" · ")}</p>
                </div>
              </li>))}</ul>}
        </section>

        <section aria-labelledby="upcoming-events" className="space-y-3 rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <h2 id="upcoming-events" className="text-lg font-semibold">Upcoming on the timeline</h2>
            <Link to="/records" className="shrink-0 text-sm font-medium text-primary hover:underline">Open timeline</Link>
          </div>
          {events.isPending ? <p className="text-sm text-muted-foreground">Loading…</p>
            : events.isError ? <p role="alert" className="text-sm text-destructive">Timeline could not be loaded.</p>
            : upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nothing upcoming. Add doctor visits or tests to your timeline to see them here.</p>
            : <ul className="divide-y">{upcoming.map((e) => (
              <li key={e.id} className="flex min-w-0 items-center gap-3 py-3">
                <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{[members.data?.find((m) => m.id === e.family_member_id)?.member_name, fmt(e.event_date)].filter(Boolean).join(" · ")}</p>
                </div>
              </li>))}</ul>}
        </section>
      </div>

      {(members.data?.length ?? 0) > 0 && (
        <section aria-labelledby="family-overview" className="space-y-3">
          <h2 id="family-overview" className="text-lg font-semibold">Family overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.data!.map((m) => {
              const mine = (records.data ?? []).filter((r) => r.family_member_id === m.id);
              const latest = mine[0];
              return (
                <div key={m.id} className="min-w-0 rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{m.member_name}</p>
                    {m.relation && <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{m.relation}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{mine.length} {mine.length === 1 ? "record" : "records"}{m.blood_group ? ` · ${m.blood_group}` : ""}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{latest ? `Latest: ${latest.name}` : "No records yet"}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
