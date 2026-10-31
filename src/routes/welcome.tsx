import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Upload, ClipboardList, CalendarDays, ScanText, Languages, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";

const TITLE = "FamRecords — Organise your family's medical records";
const DESC = "FamRecords keeps your family's reports, prescriptions and therapy notes in one private place, explains them in plain language, and packs them neatly for the doctor. Free to start, in English or Bengali.";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:site_name", content: "FamRecords: Rehab & Wellness" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.famrecords.org/welcome" },
      { property: "og:image", content: "https://www.famrecords.org/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "FamRecords: your family's health records, all in one place." },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: "https://www.famrecords.org/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: "https://www.famrecords.org/welcome" }],
  }),
  component: Welcome,
});

const steps = [
  { icon: Users, title: "1. Add your family", text: "Create a free account and add a profile for each person you care for — parents, children, yourself." },
  { icon: Upload, title: "2. Upload records", text: "Add reports, prescriptions and scans as PDFs, Word files or phone photos, with the visit date, provider and record type." },
  { icon: ClipboardList, title: "3. Take a pack to the doctor", text: "Pick one person's records, add your own notes and questions, and download a tidy doctor-visit pack as a PDF." },
];

const benefits = [
  { icon: CalendarDays, title: "A timeline for each person", text: "Every record lands on that family member's health timeline, in date order, with filters by person, type and date." },
  { icon: ScanText, title: "Plain-language explanations", text: "Choose one of your own records and AI explains what it says, quoting the exact source lines so you can check. It runs only when you agree, every time." },
  { icon: Languages, title: "English and বাংলা", text: "The timeline, visit packs and AI explanations work in English or Bengali. Hindi is planned." },
  { icon: ShieldCheck, title: "Private to your account", text: "Only you can see your family's records. Files open through short-lived private links, and there is no advertising or analytics on your records pages." },
];

function Welcome() {
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <header className="flex items-center gap-2">
          <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
        </header>

        <section className="my-12 space-y-6 md:my-16">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">Family medical records app</span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">One place for your family's medical records</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">Stop hunting through shoeboxes, chat threads and phone galleries before an appointment. FamRecords keeps everyone's reports, prescriptions and therapy notes together, explains them in plain language, and packs them neatly for the doctor.</p>
          <div className="flex flex-col items-center gap-3 pt-4">
            <Button asChild size="lg"><Link to="/auth">Create a free account</Link></Button>
            <Link to="/auth" className="text-sm font-medium text-primary hover:underline">Already have an account? Sign in</Link>
          </div>
          <p className="text-sm text-muted-foreground">Free for up to 2 family members · New accounts are approved by our team before first use</p>
        </section>

        <section aria-labelledby="how" className="my-16 space-y-6">
          <h2 id="how" className="text-2xl font-bold">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <s.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-base text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="why" className="my-16 space-y-6">
          <h2 id="why" className="text-2xl font-bold">Why families use FamRecords</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <b.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="text-base text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">FamRecords organises and explains the records you already have. It does not diagnose conditions or recommend treatment — always discuss results with your doctor.</p>
        </section>

        <section aria-labelledby="start" className="my-16 space-y-6 rounded-xl bg-card p-6 shadow-soft md:p-10">
          <h2 id="start" className="text-2xl font-bold">Start organising today</h2>
          <ul className="space-y-2 text-base text-muted-foreground">
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Free plan for up to 2 family members, free forever</li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Health timeline and doctor-visit packs included</li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Works in English and বাংলা</li>
          </ul>
          <div className="flex justify-center pt-2"><Button asChild size="lg"><Link to="/auth">Create a free account</Link></Button></div>
        </section>

        <footer className="my-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>FamRecords: Rehab & Wellness</span>
          <div className="flex gap-4">
            <Link to="/" className="font-medium text-primary hover:underline">Full homepage</Link>
            <Link to="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
