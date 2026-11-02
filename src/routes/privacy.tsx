import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";

const CONTACT_EMAIL = "famrecords.app@gmail.com";

function ContactEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-primary underline underline-offset-4"
    >
      {CONTACT_EMAIL}
    </a>
  );
}


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
      { property: "og:url", content: "https://www.famrecords.org/privacy" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.famrecords.org/privacy" }],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "Optional invite sign-up measurement",
    body: [
      "Only if you choose Allow invite measurement, FamRecords remembers predefined invite platform, campaign and post labels in this browser tab for up to 24 hours. When a new account is created, these labels and your consent time and notice version are saved with an internal account reference. Admins see grouped new-account counts, including accounts awaiting confirmation or approval, not a list of people in the invite report. We do not measure a visit-to-sign-up rate.",
      "No medical information, family details, names, email addresses, full URLs, IP addresses or device identifiers are included in invite attribution. Nothing from this feature is sent to Google, Meta or other advertisers. Google Analytics and advertising choices remain separate. Use only the predefined labels; never put personal or medical details in invite URLs.",
      "You can decline or change your choice through Invite privacy settings below. Withdrawal clears pending labels and stops future invite measurement immediately. To remove saved account attribution and its labels from account metadata, sign in and withdraw here; this changes grouped counts but does not delete your account or records. Admins can keep saved attribution for 30, 90, 180 or 365 days after sign-up, or until account deletion or withdrawal (the initial setting). Admins can also delete it earlier. Expired or selected attribution is excluded from counts immediately and automatically deleted in batches every five minutes, including its saved account labels; failed deletions are retried. This does not delete accounts or medical records. Consent evidence uses notice famrecords-invite-v1, which resolves to the text shown in the invite choice panel.",
    ],
  },
  {
    title: "Advertising on the public homepage",
    body: [
      "Our public homepage loads Google AdSense only after you choose Allow advertising. Google and its advertising partners may use cookies or similar technologies, IP addresses and browser information to deliver, measure and personalise ads based on visits to this and other websites. Before a choice or after Decline advertising, FamRecords does not load AdSense.",
      "AdSense is not loaded on sign-in, account or private medical pages. FamRecords does not send your medical records or family account details to advertisers. Analytics and advertising choices are separate: allowing analytics does not allow advertising. Use Advertising privacy settings on the homepage to change your choice. Withdrawal saves a refusal and reloads the page to stop the advertising runtime; it cannot undo information already received by Google or remove cookies on Google's domains. We save your choice, decision time, original acceptance time and notice version famrecords-advertising-v1 on this browser. This is a local opt-in control, not a Google-certified consent platform.",
      <>You can manage or block cookies in your browser (which may affect sign-in), review ad personalisation in <a href="https://myadcenter.google.com/" className="font-medium text-primary underline">Google My Ad Center</a>, and read <a href="https://policies.google.com/technologies/partner-sites" className="font-medium text-primary underline">how Google uses information from partner sites</a>.</>,
    ],
  },
  {
    title: "Optional public-page visitor analytics",
    body: [
      "If you choose Allow analytics, Google Analytics measures visits to our homepage and privacy page, using analytics cookies and device and visit information. Social links may include platform, campaign and post labels so we can compare where visits come from. Never put personal or medical information in those labels.",
      "We do not send account details, medical records or visits to signed-in pages to Google Analytics. Advertising features and Google signals are disabled. Declining prevents this optional Google Analytics tracking; accepting later does not replay earlier visits. Lovable's existing site analytics remains separate.",
      "You can decline or withdraw your choice through Analytics privacy settings on the homepage or privacy page. We store your choice, the notice version and the time you decided on your device. Withdrawal stops future optional measurement but does not remove data already received by Google. Our notice version is famrecords-public-analytics-v1.",
    ],
  },
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
    title: "Optional AI report reader",
    body: [
      "Only after you agree, a selected PDF or report photo is sent through Lovable AI so printed test names, values, units and ranges can be copied into a table. That table and your corrections are saved privately with the record, visible only to you, and deleted when the record is deleted.",
      "Readings are limited per hour and day, are never added to doctor-visit packs, and must be checked against the original. They are not diagnosis or treatment advice.",
    ],
  },
  {
    title: "Optional AI visit summaries and plans",
    body: [
      "Only after you agree, the names, dates and reviewed values of records you select, plus notes you type, are sent through Lovable AI to write a plain-language summary. Summaries are saved privately, visible only to you, and deleted when you delete them, the family member or any source record.",
      "We count how many AI readings and summaries you use each month to apply your plan's limits. If you pay for Premium Family, payments are handled by Razorpay; we store only your plan status, not card or bank details.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We do not sell, rent or share your personal information or medical records with advertisers or data brokers.",
      "Advertising is limited to the public homepage, not private medical or account pages. We do not use your medical information for marketing.",
    ],
  },
  {
    title: "Your choices and rights",
    body: [
      "You can edit or delete family members and medical records at any time from within the app. Deleting a record removes the stored document.",
      "You can change the email address on your account from the Settings page.",
      <>
        If you want your account and all its data removed, email <ContactEmail /> and we will
        delete it.
      </>,

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
      <>
        If you have questions about this policy or your data, contact the FamRecords team through
        the app or email <ContactEmail />.
      </>,
      <>
        For account removal or privacy requests, please write to <ContactEmail /> from the email
        address on your account so we can confirm it is you.
      </>,
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
            have. Last updated: 1 November 2026.
          </p>
          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.title} className="space-y-3 rounded-xl bg-card p-6 shadow-soft">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-base text-muted-foreground">
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
