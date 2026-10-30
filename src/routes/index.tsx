import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, FileText, ShieldCheck, CalendarDays, ClipboardList, Languages, ScanText, Sparkles, Check, FolderHeart, Network, Stethoscope, HeartPulse, Activity, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, PRICES } from "@/lib/plans";
import logo from "@/assets/logo-lockup.png";

const DESC = "A family medical records app: organise reports, prescriptions and therapy notes, understand your own records in plain language and prepare doctor-visit packs in English or Bengali.";
const SOCIAL_TITLE = "FamRecords — Family medical records, organised";
const SOCIAL_DESCRIPTION = "Keep your family's reports, prescriptions, therapy notes and check-up results together. Prepare doctor-visit packs in English or Bengali. Start free; your records stay private to your account.";

const faqs = [
  { q: "How do I organise my family's medical records in one place?", a: "Create a free account, add a profile for each family member, then upload reports, prescriptions and scans as PDFs, Word files or phone photos. Each record can have a visit date, healthcare provider and record type, and appears on that person's health timeline." },
  { q: "Who can see my family's records?", a: "Only you. Your family's records are private to your account, and AI features run only when you agree, every time." },
  { q: "Can I take records to a doctor's appointment?", a: "Yes. Choose one person's records, add allergies, medications and questions you've written, and download a doctor-visit pack as a PDF." },
  { q: "Does FamRecords work in Bengali?", a: "Yes. The timeline and doctor-visit packs work in English or বাংলা, and you can choose either language for AI explanations." },
  { q: "Does FamRecords diagnose conditions?", a: "No. FamRecords helps you organise and understand your own records. It does not diagnose conditions or recommend treatment — always discuss results with your doctor." },
  { q: "Is FamRecords free?", a: "Yes, the Free plan is free forever for up to 2 family members. Premium Family supports up to 6 members and more AI features." },
  { q: "Is FamRecords only for illness, or also for rehabilitation and wellness?", a: "Both. Families keep discharge summaries, physiotherapy and therapy notes, prescriptions and lab reports on one timeline, alongside vaccinations and routine check-up reports. FamRecords organises and explains the records you already have; it does not provide rehabilitation or medical treatment." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FamRecords — Your family's health records, all in one place." },
      { name: "description", content: DESC },
      { property: "og:title", content: SOCIAL_TITLE },
      { property: "og:description", content: SOCIAL_DESCRIPTION },
      { property: "og:site_name", content: "FamRecords: Rehab & Wellness" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.famrecords.org/" },
      { property: "og:image", content: "https://www.famrecords.org/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "FamRecords: your family's health records, all in one place. Organize medical documents and prepare for doctor visits." },
      { name: "twitter:title", content: SOCIAL_TITLE },
      { name: "twitter:description", content: SOCIAL_DESCRIPTION },
      { name: "twitter:image", content: "https://www.famrecords.org/og-image.jpg" },
      { name: "twitter:image:alt", content: "FamRecords family health-records organiser with a folder, calendar and doctor-visit checklist." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: "https://www.famrecords.org/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FamRecords: Rehab & Wellness",
          url: "https://www.famrecords.org/",
          logo: "https://www.famrecords.org/icon-512.png",
          description: DESC,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FamRecords",
          url: "https://www.famrecords.org/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }),
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: CalendarDays, title: "Health timeline", text: "See each family member's reports, visits and appointments you've added, in date order, with filters by person, type and date." },
  { icon: ClipboardList, title: "Doctor-visit packs", text: "Pick the records for one person, add allergies, medications and questions you've written, and download a tidy PDF to take to the appointment." },
  { icon: Languages, title: "English and বাংলা", text: "Use the timeline and visit packs in English or Bengali, and choose either language for AI explanations." },
  { icon: ScanText, title: "AI report reader", text: "Copies test names, values, units and reference ranges from a report photo or PDF into a table. You check and correct every value against the original." },
  { icon: Sparkles, title: "AI visit summary", text: "Turns the records you choose and your own notes into a short summary, with sources listed and plain-language explanations of terms. You review it before downloading." },
  { icon: ShieldCheck, title: "Private by default", text: "Only you can see your family's records. AI features run only when you agree, every time." },
];

type Status = "available" | "development" | "planned";
const STATUS_LABEL: Record<Status, string> = { available: "Available now", development: "In development", planned: "Planned" };
function StatusBadge({ status }: { status: Status }) {
  const cls = status === "available" ? "bg-primary text-primary-foreground" : status === "development" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground";
  return <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{STATUS_LABEL[status]}</span>;
}

const rehabWellness = [
  { icon: Activity, title: "Recovery and rehabilitation", text: "Keep discharge summaries, physiotherapy and therapy notes, and follow-up appointments on one person's timeline, so progress between visits is easy to see." },
  { icon: HeartPulse, title: "Ongoing conditions", text: "Store prescriptions, lab reports and consultation notes with visit dates and providers, and take a tidy visit pack to each review appointment." },
  { icon: Leaf, title: "Everyday wellness", text: "File vaccinations, check-up reports and routine results so nothing is forgotten before the next visit." },
];

const pillars: { icon: typeof Users; title: string; items: { status: Status; text: string }[] }[] = [
  { icon: FolderHeart, title: "Family Records", items: [
    { status: "available", text: "Store medical reports, prescriptions and scans as PDFs, Word files or phone photos." },
    { status: "available", text: "Profiles for each family member and a health timeline of visits and records." },
    { status: "available", text: "Tag records by type — lab report, prescription, discharge summary or vaccination — and filter by person, provider or date." },
  ] },
  { icon: Sparkles, title: "AI Intelligence", items: [
    { status: "available", text: "Plain-language explanations of a record, citing the exact source text — only when you agree." },
    { status: "available", text: "AI report reader that copies test values into a table for you to check." },
    { status: "planned", text: "A multilingual health assistant for questions across your family's records." },
  ] },
  { icon: Network, title: "Healthcare Connectivity", items: [
    { status: "available", text: "Doctor-visit packs you can download as a PDF and take to appointments." },
    { status: "planned", text: "Consent-based connections with authorised healthcare providers using FHIR standards." },
  ] },
  { icon: ShieldCheck, title: "Privacy and Security", items: [
    { status: "available", text: "Records are private to your account; files are stored privately and opened through short-lived links." },
    { status: "available", text: "New accounts are approved by our team, and AI features run only after you agree each time." },
    { status: "available", text: "No advertising or analytics on your records pages." },
  ] },
];

const languages: { name: string; lang: string; status: Status; note: string }[] = [
  { name: "English", lang: "en", status: "available", note: "Full app, timeline, visit packs and AI explanations." },
  { name: "বাংলা", lang: "bn", status: "available", note: "Timeline, doctor-visit packs and AI explanations." },
  { name: "हिन्दी", lang: "hi", status: "planned", note: "Hindi support is planned and not available yet." },
];

function Index() {
  const free = PLAN_LIMITS.free; const prem = PLAN_LIMITS.premium;
  const plans = [
    { name: "Free", price: "₹0", note: "Free forever", items: [`Up to ${free.members} family members`, `Up to ${free.records} records`, "Health timeline and doctor-visit packs", `${free.report_reader} AI report readings a month`] },
    { name: "Premium Family", price: `₹${PRICES.INR.monthly}/month`, note: `or ₹${PRICES.INR.yearly}/year`, items: [`Up to ${prem.members} family members`, `Up to ${prem.records} records`, `${prem.report_reader} AI report readings a month`, `${prem.visit_summary} AI visit summaries a month`] },
  ];
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <header className="flex items-center gap-2">
          <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
        </header>
        <section className="my-12 space-y-6 md:my-20">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">Family medical records app</span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">Your family's health records. Organised, understood and connected.</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">Keep reports, prescriptions, therapy notes and check-up results together — whether someone is recovering, living with a long-term condition, or simply staying well. Get plain-language explanations of your own records and prepare for better-informed conversations with your doctor.</p>
          <div className="flex flex-col items-center gap-3 pt-4">
            <Button asChild size="lg"><Link to="/auth">Create a free account</Link></Button>
            <Link to="/auth" className="text-sm font-medium text-primary hover:underline">Already have an account? Sign in</Link>
          </div>
        </section>

        <section aria-labelledby="rehab" className="my-16 space-y-6">
          <h2 id="rehab" className="text-2xl font-bold">{`What "Rehab & Wellness" means here`}</h2>
          <p className="max-w-2xl text-base text-muted-foreground">Our tagline names the part of family health we care most about: getting better after an illness or injury, and staying well in between. Both need the same thing — records that are easy to find and explain.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {rehabWellness.map((r) => (
              <div key={r.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <r.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <p className="text-base text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="pillars" className="mb-16 space-y-6">
          <h2 id="pillars" className="text-2xl font-bold">One place for your family's health</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <p.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <ul className="space-y-2">
                  {p.items.map((i) => (
                    <li key={i.text} className="flex flex-wrap items-start gap-2 text-base text-muted-foreground">
                      <StatusBadge status={i.status} /><span className="flex-1">{i.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="features" className="space-y-6">
          <h2 id="features" className="text-2xl font-bold">What you can do today</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-base text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            FamRecords helps you organise and understand your own records. It does not diagnose conditions or recommend treatment — always discuss results with your doctor.
          </p>
        </section>

        <section aria-labelledby="languages" className="my-16 space-y-6">
          <h2 id="languages" className="text-2xl font-bold">Built for Indian families</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {languages.map((l) => (
              <div key={l.name} className="space-y-2 rounded-xl bg-card p-5 shadow-soft">
                <p className="text-xl font-semibold" lang={l.lang}>{l.name}</p>
                <StatusBadge status={l.status} />
                <p className="text-sm text-muted-foreground">{l.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="providers" className="my-16 space-y-4 rounded-xl bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2"><Stethoscope className="h-6 w-6 text-primary" aria-hidden="true" /><StatusBadge status="planned" /></div>
          <h2 id="providers" className="text-2xl font-bold">For healthcare providers</h2>
          <p className="text-base text-muted-foreground">Our goal is to help families share health information securely with the clinics and doctors they choose — only with the family's consent, and using standards such as FHIR so records can move between systems.</p>
          <p className="text-sm text-muted-foreground">Provider connections are not available yet. Today, families can share information by downloading a doctor-visit pack and taking it to the appointment.</p>
        </section>

        <section aria-labelledby="plans" className="my-16 space-y-6">
          <h2 id="plans" className="text-2xl font-bold">Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.name} className="space-y-4 rounded-xl bg-card p-6 shadow-soft">
                <div><h3 className="text-xl font-semibold">{p.name}</h3><p className="text-2xl font-bold">{p.price}</p><p className="text-sm text-muted-foreground">{p.note}</p></div>
                <ul className="space-y-2">{p.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{i}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Premium Family is in an early pilot; online payment is coming soon. New accounts are approved by our team before first use.</p>
          <div className="flex justify-center"><Button asChild size="lg"><Link to="/auth">Start free</Link></Button></div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 rounded-xl bg-card p-6 shadow-soft"><Users className="h-6 w-6 text-primary" /><h3 className="text-lg font-semibold">Family profiles</h3><p className="text-muted-foreground">Keep height, weight, blood group and relation for everyone.</p></div>
          <div className="space-y-2 rounded-xl bg-card p-6 shadow-soft"><FileText className="h-6 w-6 text-primary" /><h3 className="text-lg font-semibold">Upload from your phone</h3><p className="text-muted-foreground">Add PDFs, Word files or snap a photo with your camera.</p></div>
        </section>

        <section aria-labelledby="faq" className="my-16 space-y-6">
          <h2 id="faq" className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl bg-card p-5 shadow-soft">
                <summary className="cursor-pointer text-lg font-semibold">{f.q}</summary>
                <p className="mt-3 text-base text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="my-12 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <span>FamRecords: Rehab & Wellness</span>
          <Link to="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
        </footer>
      </div>
    </div>
  );
}
