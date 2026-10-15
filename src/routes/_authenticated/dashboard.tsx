import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Settings, ArrowRight } from "lucide-react";
import { membersQuery, recordsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FamilyHealth Vault" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const members = useQuery(membersQuery);
  const records = useQuery(recordsQuery);
  const name = (user.user_metadata?.["name"] as string) || user.email;
  const cards = [
    { to: "/members" as const, icon: Users, title: "Members", text: "Add and manage family members", count: members.data?.length },
    { to: "/records" as const, icon: FileText, title: "Medical Records", text: "Upload and search documents", count: records.data?.length },
    { to: "/settings" as const, icon: Settings, title: "Settings", text: "Manage your account email" },
  ];
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Hello, {name}</h1>
        <p className="text-base text-muted-foreground md:text-lg">What would you like to do today?</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group space-y-4 rounded-xl bg-secondary p-6 transition hover:shadow-soft">
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
    </div>
  );
}
