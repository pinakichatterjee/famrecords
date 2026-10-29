import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, FileText, ShieldCheck, CalendarDays, ClipboardList, Languages, ScanText, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, PRICES } from "@/lib/plans";
import logo from "@/assets/logo-lockup.png";

const DESC = "Organize medical documents, understand reports and prepare for doctor visits — with your family's privacy in mind.";

const faqs = [
  { q: "How do I organise my family's medical records in one place?", a: "Create a free account, add a profile for each family member, then upload reports, prescriptions and scans as PDFs, Word files or phone photos. Each record can have a visit date, healthcare provider and record type, and appears on that person's health timeline." },
  { q: "Who can see my family's records?", a: "Only you. Your family's records are private to your account, and AI features run only when you agree, every time." },
  { q: "Can I take records to a doctor's appointment?", a: "Yes. Choose one person's records, add allergies, medications and questions you've written, and download a doctor-visit pack as a PDF." },
  { q: "Does FamRecords work in Bengali?", a: "Yes. The timeline and doctor-visit packs work in English or বাংলা, and you can choose either language for AI explanations." },
  { q: "Does FamRecords diagnose conditions?", a: "No. FamRecords helps you organise and understand your own records. It does not diagnose conditions or recommend treatment — always discuss results with your doctor." },
  { q: "Is FamRecords free?", a: "Yes, the Free plan is free forever for up to 2 family members. Premium Family supports up to 6 members and more AI features." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FamRecords — Your family's health records, all in one place." },
      { name: "description", content: DESC },
      { property: "og:title", content: "FamRecords — Your family's health records, all in one place." },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.famrecords.org/" },
      { property: "og:image", content: "https://www.famrecords.org/og-image.png" },
      { name: "twitter:image", content: "https://www.famrecords.org/og-image.png" },
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
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">For families caring for loved ones</span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">Every report, prescription and scan — organised for your whole family.</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">See each person's health history on one timeline, and walk into a doctor's appointment with the right papers ready. In English or বাংলা.</p>
          <div className="flex justify-center pt-4"><Button asChild size="lg"><Link to="/auth">Create a free account</Link></Button></div>
        </section>

        <section aria-labelledby="features" className="space-y-6">
          <h2 id="features" className="text-2xl font-bold">What you can do</h2>
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
