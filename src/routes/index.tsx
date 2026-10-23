import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FamRecords: Rehab & Wellness — Medical records for your family" },
      { name: "description", content: "Store and find your family's medical records in one secure place." },
      { property: "og:title", content: "FamRecords: Rehab & Wellness — Organise your family's medical records" },
      { property: "og:description", content: "Store and find your family's medical records in one secure place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: Users, title: "Family profiles", text: "Keep height, weight, blood group and relation for everyone." },
    { icon: FileText, title: "All records in one place", text: "Upload PDFs, documents or snap a photo with your phone." },
    { icon: ShieldCheck, title: "Private by default", text: "Only you can see the records you upload." },
  ];
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <header className="flex items-center gap-2">
          <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
        </header>
        <section className="my-12 space-y-6 md:my-20">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            For you and your loved ones
          </span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            Every prescription, report and scan — organised for your whole family.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Stop digging through drawers and chats. Keep medical records safe and find them in seconds.
          </p>
          <div className="flex justify-center pt-4">
            <Button asChild size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
              <f.icon className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="text-base text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
