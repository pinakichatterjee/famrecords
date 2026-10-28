import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FamRecords" },
      {
        name: "description",
        content:
          "How FamRecords collects, stores and protects your family's medical records and personal information.",
      },
      { property: "og:title", content: "Privacy Policy — FamRecords" },
      {
        property: "og:description",
        content:
          "How FamRecords collects, stores and protects your family's medical records and personal information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "What we collect",
    body: [
      "Account details: your name and email address, used to sign you in and secure your account.",
      "Family member details you choose to add: name, relation, height, weight and blood group.",
      "Medical records you upload: documents, PDFs and photos, along with the visit date, healthcare provider and record type you enter.",
    ],
  },
  {
    title: "How your information is stored",
    body: [
      "Your account and records are stored on secure cloud servers. Every medical document is kept in private storage that only your account can open.",
      "Records you upload are visible only to you when you are signed in. Other FamRecords users cannot see your family members or documents.",
    ],
  },
  {
    title: "Optional AI explanations",
    body: [
      "Only after you agree, the selected document is sent through Lovable AI to an AI provider for an informational explanation. Do not submit a document unless you are authorised to share it.",
      "New explanations and questions are not saved by FamRecords or automatically included in doctor-visit packs. Original documents remain unchanged. AI may misread details; source quotes should be checked against the original. This is not diagnosis or treatment advice.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We do not sell, rent or share your personal information or medical records with advertisers or data brokers.",
      "We do not show advertising inside the app, and we do not use your medical information for marketing.",
    ],
  },
  {
    title: "Your choices and rights",
    body: [
      "You can edit or delete family members and medical records at any time from within the app. Deleting a record removes the stored document.",
      "You can change the email address on your account from the Settings page.",
      "If you want your account and all its data removed, contact us and we will delete it.",
    ],
  },
  {
    title: "Data security",
    body: [
      "Access to your data is protected by your email and password. Please choose a strong password and do not share it.",
      "No method of storage is completely risk-free, but we use industry-standard safeguards to protect your information.",
    ],
  },
  {
    title: "Children's privacy",
    body: [
      "FamRecords is designed for adults to manage their family's records, including records about their children. The app is not intended to be used directly by children.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "If we change this privacy policy, we will update this page and change the date below. Continuing to use the app after a change means you accept the updated policy.",
    ],
  },
  {
    title: "Contact",
    body: [
      "If you have questions about this policy or your data, contact the FamRecords team through the app or at the contact address shown on our website.",
    ],
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="FamRecords home">
            <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
          </Link>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </header>
        <main className="my-12 max-w-3xl space-y-6">
          <h1 className="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            FamRecords helps you store your family's medical records in one private place. This
            policy explains what information we collect, how it is stored, and the choices you
            have. Last updated: 28 October 2026.
          </p>
          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                {s.body.map((p) => (
                  <p key={p} className="text-base text-muted-foreground">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
