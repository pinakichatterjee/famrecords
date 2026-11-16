export type HealthEducationCategory =
  "Family Records" | "Doctor Visits" | "Lab Literacy" | "Rehab & Wellness" | "Privacy & Care";

export interface HealthEducationSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface HealthEducationFaq {
  q: string;
  a: string;
}

export interface HealthEducationReference {
  label: string;
  url: string;
  note?: string;
}

export interface HealthEducationArticle {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  category: HealthEducationCategory;
  summary: string;
  tags: string[];
  sections: HealthEducationSection[];
  faqs: HealthEducationFaq[];
  disclaimer: string;
  references: HealthEducationReference[];
}

export const HEALTH_EDUCATION_CATEGORIES: readonly HealthEducationCategory[] = [
  "Family Records",
  "Doctor Visits",
  "Lab Literacy",
  "Rehab & Wellness",
  "Privacy & Care",
] as const;

const STANDARD_DISCLAIMER =
  "Educational information only: This article is designed to help families organise and understand their own health documents. It does not provide medical advice, diagnosis, or treatment recommendations. Always consult a qualified doctor or healthcare professional about symptoms, test results, or treatment decisions.";

export const HEALTH_EDUCATION_ARTICLES: HealthEducationArticle[] = [
  {
    slug: "why-every-family-should-maintain-digital-health-records",
    title: "Why Every Family Should Maintain Digital Health Records",
    seoTitle: "Why Every Family Should Maintain Digital Health Records | FamRecords",
    metaDescription:
      "Learn how keeping digital family health records on one chronological timeline prevents lost reports, improves doctor visits, and supports everyday care.",
    category: "Family Records",
    summary:
      "Paper folders fade and chat attachments get buried. Keeping every family member's prescriptions, lab reports, and discharge notes in one structured digital timeline makes routine and urgent care far easier to navigate.",
    tags: [
      "digital health records",
      "family health timeline",
      "prescriptions",
      "lab reports",
      "caregiving",
    ],
    sections: [
      {
        id: "the-problem-with-paper-and-chats",
        heading: "Why paper files and chat threads fall short",
        paragraphs: [
          "Most households store medical history across plastic folders, hospital envelopes, email attachments, and messaging apps. Over months and years, thermal lab printouts fade, prescriptions go missing between clinics, and key dates become guesswork.",
          "When a parent visits a specialist or a child needs an urgent check-up, trying to scroll through thousands of phone photos in a waiting room wastes valuable consultation time and increases the chance of forgetting an important detail.",
        ],
        bullets: [
          "Thermal pharmacy bills and diagnostic slips often smudge or fade within months.",
          "Reports shared in family chat groups are quickly buried under everyday messages.",
          "Switching doctors or cities can leave earlier baseline test results behind.",
          "Caregivers coordinating care for ageing parents rarely have the same paper folder at hand.",
        ],
      },
      {
        id: "what-digital-records-change",
        heading: "What changes when records live on one family timeline",
        paragraphs: [
          "Maintaining digital health records means giving every family member a dedicated profile where documents are filed with a visit date, healthcare provider, and record category. Instead of hunting by filename, you can look across a clean chronological timeline.",
          "A structured timeline helps you and your clinician compare how lab numbers, symptoms, or rehabilitation goals have evolved across appointments rather than viewing a single report in isolation.",
        ],
        bullets: [
          "Faster appointment prep with all recent prescriptions, scans, and lab results in one view.",
          "Clear visibility into vaccinations, allergies, and long-term medication changes.",
          "Consistent continuity when moving from hospital discharge to outpatient physiotherapy or follow-up.",
          "Accessible bilingual organisation in English and Bengali for multi-generational households.",
        ],
      },
      {
        id: "essential-documents-to-keep",
        heading: "Which health documents every family should keep",
        paragraphs: [
          "You do not need complex hospital software to build a useful personal health archive. Start with the documents that carry decisions, measurements, and dates across your family's care.",
        ],
        bullets: [
          "Lab reports and blood work with test values, units, and reference ranges.",
          "Prescriptions noting medication names, strengths, and duration.",
          "Discharge summaries from hospital admissions or day procedures.",
          "Imaging summaries and scan reports such as X-rays, ultrasounds, or MRI notes.",
          "Vaccination cards and annual preventive check-up records.",
          "Physiotherapy, speech therapy, or rehabilitation progress notes.",
        ],
      },
      {
        id: "emergencies-and-referrals",
        heading: "Being ready for referrals and unexpected visits",
        paragraphs: [
          "During a referral to a new specialist or an unexpected hospital visit, clinicians often ask the same foundational questions: what conditions have been evaluated before, which medicines are currently being taken, and whether there are known allergies.",
          "Having digital copies paired with a clean visit pack lets you hand over an accurate summary and source document list without relying on memory under stress.",
        ],
      },
      {
        id: "privacy-and-ownership",
        heading: "Keeping family records private and under your control",
        paragraphs: [
          "Convenience should never come at the cost of household privacy. Digital health records should stay private to your account, open through protected access rather than public web links, and leave you in control of when anything is shared with a doctor.",
        ],
      },
    ],
    faqs: [
      {
        q: "What file formats work best when digitising paper medical records?",
        a: "Clear PDFs from diagnostic labs, Word documents, and well-lit phone photos of paper prescriptions or discharge summaries are ideal. Check that dates, provider names, and printed numbers are legible before filing.",
      },
      {
        q: "Should we keep old reports after a health issue resolves?",
        a: "Yes. Older baseline lab reports, vaccination dates, and past discharge summaries provide helpful context years later when comparing trends or answering a new doctor's history questions.",
      },
      {
        q: "Does maintaining digital health records replace my doctor's medical chart?",
        a: "No. Personal digital records complement clinical care by keeping your family's copies organised across multiple clinics and labs so you can share accurate information at each visit.",
      },
    ],
    disclaimer: STANDARD_DISCLAIMER,
    references: [
      {
        label: "World Health Organization — Digital Health Overview",
        url: "https://www.who.int/health-topics/digital-health",
        note: "Global context on how digital health tools support continuity of care.",
      },
      {
        label: "Ayushman Bharat Digital Mission (ABDM)",
        url: "https://abdm.gov.in/",
        note: "India's national framework for longitudinal digital health records.",
      },
      {
        label: "MedlinePlus — Personal Health Records",
        url: "https://medlineplus.gov/personalhealthrecords.html",
        note: "Patient guidance on what to include in a personal health record.",
      },
    ],
  },
  {
    slug: "how-to-prepare-a-doctor-visit-pack",
    title: "How to Prepare a Doctor-Visit Pack Before Your Appointment",
    seoTitle: "How to Prepare a Doctor-Visit Pack | FamRecords Health Education",
    metaDescription:
      "A step-by-step checklist for gathering relevant records, allergies, medications, and questions before your next medical appointment.",
    category: "Doctor Visits",
    summary:
      "Short consultation slots go much further when you arrive with the right recent reports, an up-to-date medication list, and clear questions written down ahead of time.",
    tags: ["doctor visit pack", "appointment prep", "medications", "allergies", "checklist"],
    sections: [
      {
        id: "why-visit-prep-matters",
        heading: "Why a focused visit pack helps both you and your clinician",
        paragraphs: [
          "Doctor appointments often last only ten to fifteen minutes. Spending half of that time searching for an old prescription or trying to remember the dose of a medicine leaves less room to discuss what matters most.",
          "A doctor-visit pack brings one family member's selected records and your own written notes together into a single reviewable PDF.",
        ],
      },
      {
        id: "four-parts-of-a-visit-pack",
        heading: "Four essentials to include in every visit pack",
        paragraphs: [
          "Keep your pack concise and specific to the appointment so the clinician can scan it quickly.",
        ],
        bullets: [
          "Selected source documents: recent lab reports, imaging summaries, or the previous visit's prescription.",
          "Known allergies: medication, food, or environmental reactions you want flagged clearly.",
          "Current medications and supplements: names and dosages as taken at home.",
          "Questions for the clinician: two or three specific points you want answered before leaving.",
        ],
      },
      {
        id: "review-before-sharing",
        heading: "Reviewing your notes before the appointment",
        paragraphs: [
          "Always double-check dates, medication spellings, and selected attachments before downloading or printing your visit pack. Keeping visit packs strictly factual and free of unverified automated text ensures your clinician sees only the documents and notes you explicitly approved.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many past records should I include in one visit pack?",
        a: "Usually the most recent two to five records relevant to the visit—such as the latest blood panel, prior prescription, and any related scan or discharge note—are enough without overwhelming the consultation.",
      },
      {
        q: "Can I prepare a visit pack in Bengali or English?",
        a: "Yes. FamRecords lets you organise and export doctor-visit packs in either English or Bengali so family members and caregivers can review the details comfortably.",
      },
    ],
    disclaimer: STANDARD_DISCLAIMER,
    references: [
      {
        label: "MedlinePlus — Talking With Your Doctor",
        url: "https://medlineplus.gov/talkingwithyourdoctor.html",
        note: "Practical tips for preparing questions and medication lists for clinic visits.",
      },
      {
        label: "Agency for Healthcare Research and Quality — Question Builder",
        url: "https://www.ahrq.gov/questions/index.html",
        note: "Guidance on preparing clear questions before medical appointments.",
      },
    ],
  },
  {
    slug: "understanding-lab-reports-and-reference-ranges",
    title: "Understanding Lab Reports, Units, and Reference Ranges",
    seoTitle: "Understanding Lab Reports and Reference Ranges | FamRecords",
    metaDescription:
      "Learn how diagnostic lab reports are structured, what reference ranges represent, and why verifying numbers against the original report is essential.",
    category: "Lab Literacy",
    summary:
      "Diagnostic reports contain unfamiliar abbreviations, units, and flagged ranges. Knowing how to read the layout helps you prepare calmer, better-informed questions for your doctor.",
    tags: ["lab reports", "reference ranges", "blood test", "test units", "plain language"],
    sections: [
      {
        id: "anatomy-of-a-lab-report",
        heading: "Key columns on a standard diagnostic lab report",
        paragraphs: [
          "Even though laboratories use slightly different layouts, almost every blood or urine report shares the same four pieces of information for each test.",
        ],
        bullets: [
          "Test name: the specific substance or marker measured (for example, Haemoglobin or HbA1c).",
          "Observed result: the numeric value or qualitative finding from your sample.",
          "Unit of measurement: such as g/dL, mg/dL, or mmol/L—important when comparing reports from different labs.",
          "Reference interval: the typical range printed by that specific laboratory for a comparable group.",
        ],
      },
      {
        id: "why-reference-ranges-differ",
        heading: "Why reference ranges vary between laboratories",
        paragraphs: [
          "A result marked slightly outside a printed range does not automatically mean something is wrong, and a result inside the range does not replace clinical context. Labs calibrate their ranges based on their equipment, testing methods, age groups, and biological sex.",
          "That is why doctors look at your symptoms, medical history, and past trends alongside the laboratory's exact reference range.",
        ],
      },
      {
        id: "checking-extracted-values",
        heading: "Always verify extracted numbers against the original report",
        paragraphs: [
          "If you use digital tools to copy test values from a scanned PDF or phone photo into a structured table, treat the output as a draft until you compare every row—especially decimal points, units, and ranges—against the original lab printout.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why do two labs sometimes use different units for the same test?",
        a: "Different laboratories may follow regional or equipment-specific reporting standards. Always check the unit column before comparing numbers across two different diagnostic centres.",
      },
      {
        q: "Can a plain-language explainer tell me if my lab result is normal?",
        a: "Plain-language tools can explain what a test generally measures and quote what is written on your report, but only your doctor can interpret whether a value is normal for your individual health.",
      },
    ],
    disclaimer: STANDARD_DISCLAIMER,
    references: [
      {
        label: "MedlinePlus — How to Understand Your Lab Results",
        url: "https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/",
        note: "Overview of test values, units, and laboratory reference ranges.",
      },
    ],
  },
  {
    slug: "organising-rehab-and-long-term-care-notes",
    title: "Organising Physiotherapy, Rehab, and Long-Term Care Notes",
    seoTitle: "Organising Rehab and Long-Term Care Notes | FamRecords",
    metaDescription:
      "How families recovering from surgery, injury, or managing chronic care can track discharge summaries, therapy sessions, and follow-ups together.",
    category: "Rehab & Wellness",
    summary:
      "Recovery rarely ends at hospital discharge. Keeping surgical notes, physiotherapy plans, and follow-up dates together helps families see steady progress between visits.",
    tags: ["rehabilitation", "physiotherapy", "discharge summary", "recovery", "chronic care"],
    sections: [
      {
        id: "bridging-hospital-to-home",
        heading: "Bridging the gap between hospital discharge and home recovery",
        paragraphs: [
          "After surgery, fracture care, or a hospital stay, families frequently juggle instructions from multiple specialists—orthopaedics, physiotherapy, nutrition, and primary care.",
          "Filing the hospital discharge summary alongside subsequent rehab notes on a single timeline prevents instructions from conflicting or getting forgotten once you return home.",
        ],
      },
      {
        id: "tracking-therapy-and-milestones",
        heading: "What to record during rehabilitation and follow-ups",
        paragraphs: [
          "Alongside scanned documents, short user-entered health events make it easier to remember what changed between clinic visits.",
        ],
        bullets: [
          "Date and provider for each physiotherapy or occupational therapy review.",
          "Updated home exercise instructions or mobility precautions.",
          "Pain, stiffness, or stamina observations written in your own words before a follow-up.",
          "Upcoming diagnostic re-checks or suture/cast removal appointments.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should wellness check-ups sit on the same timeline as rehab records?",
        a: "Yes. Having routine check-ups, vaccinations, and recovery notes on one person's timeline gives a complete picture while still letting you filter by record type or date range.",
      },
    ],
    disclaimer: STANDARD_DISCLAIMER,
    references: [
      {
        label: "World Health Organization — Rehabilitation",
        url: "https://www.who.int/health-topics/rehabilitation",
        note: "Overview of rehabilitation across recovery and ongoing health.",
      },
    ],
  },
  {
    slug: "protecting-family-medical-privacy",
    title: "Protecting Your Family's Medical Privacy Online",
    seoTitle: "Protecting Your Family's Medical Privacy Online | FamRecords",
    metaDescription:
      "Practical habits for safeguarding family medical documents, managing device access, and understanding consent before using AI record helpers.",
    category: "Privacy & Care",
    summary:
      "Health documents are among a family's most sensitive files. Simple security and consent habits keep private medical history out of public threads and ad trackers.",
    tags: ["medical privacy", "data security", "consent", "account safety", "family care"],
    sections: [
      {
        id: "risks-of-everyday-sharing",
        heading: "Everyday habits that expose sensitive records",
        paragraphs: [
          "Forwarding lab PDFs across unencrypted emails, saving reports in shared cloud folders with open links, or leaving medical downloads on a shared computer can expose personal health details unintentionally.",
        ],
        bullets: [
          "Avoid storing medical PDFs in folders shared with public 'anyone with the link' permissions.",
          "Keep personal health records separate from social media or advertising trackers.",
          "Use strong, unique passwords for accounts holding family health documents.",
        ],
      },
      {
        id: "consent-before-ai",
        heading: "Why explicit consent matters for AI record tools",
        paragraphs: [
          "If you choose to use an AI explainer or report reader to understand medical terms in plain language, that step should happen only when you explicitly agree for that specific document—never automatically in the background.",
          "You should also know what stays saved privately to your account and ensure unreviewed AI text is never mixed into official doctor-visit packs.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can other FamRecords users view my family's uploaded documents?",
        a: "No. Records are scoped to your account, stored privately, and opened through short-lived links rather than public web addresses.",
      },
    ],
    disclaimer: STANDARD_DISCLAIMER,
    references: [
      {
        label: "HL7 FHIR — Health Data Interoperability Overview",
        url: "https://www.hl7.org/fhir/overview.html",
        note: "Open healthcare data exchange standard designed around structured patient consent.",
      },
    ],
  },
];

export function getHealthEducationArticle(slug: string): HealthEducationArticle | undefined {
  return HEALTH_EDUCATION_ARTICLES.find((article) => article.slug === slug);
}

export function getRelatedHealthEducationArticles(
  currentSlug: string,
  limit = 3,
): HealthEducationArticle[] {
  const current = getHealthEducationArticle(currentSlug);
  const others = HEALTH_EDUCATION_ARTICLES.filter((a) => a.slug !== currentSlug);
  if (!current) return others.slice(0, limit);
  return [...others]
    .sort((a, b) => {
      const aSame = a.category === current.category ? 1 : 0;
      const bSame = b.category === current.category ? 1 : 0;
      return bSame - aSame;
    })
    .slice(0, limit);
}

export function countArticleWords(article: HealthEducationArticle): number {
  const chunks: string[] = [article.title, article.summary];
  for (const section of article.sections) {
    chunks.push(section.heading, ...section.paragraphs, ...(section.bullets ?? []));
  }
  for (const faq of article.faqs) {
    chunks.push(faq.q, faq.a);
  }
  return chunks.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(article: HealthEducationArticle): number {
  const words = countArticleWords(article);
  return Math.max(1, Math.ceil(words / 200));
}
