import { z } from "zod";

export type AssistantLanguage = "en" | "bn" | "hi";

export const ASSISTANT_LANGUAGE_LABELS: Record<AssistantLanguage, string> = {
  en: "English",
  bn: "বাংলা",
  hi: "हिन्दी",
};

export const assistantInputSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(2, "Please enter a question.")
      .max(1000, "Question is too long."),
    memberId: z.string().uuid().nullable().optional(),
    language: z.enum(["en", "bn", "hi"]),
    consent: z.literal(true, {
      error: "Please agree to AI processing before asking.",
    }),
  })
  .strict();

export type AssistantInput = z.infer<typeof assistantInputSchema>;

export const assistantCitationSchema = z
  .object({
    sourceName: z.string().min(1).max(300),
    memberName: z.string().min(1).max(200),
    date: z.string().max(50).nullable(),
    quote: z.string().min(1).max(500),
  })
  .strict();

export const assistantResponseSchema = z
  .object({
    answer: z.string().min(1).max(3000),
    citations: z.array(assistantCitationSchema).max(12),
    limitations: z.array(z.string().max(400)).max(8),
  })
  .strict();

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

export interface AssistantMemberRow {
  id: string;
  member_name: string;
  relation: string | null;
  blood_group: string | null;
}

export interface AssistantRecordRow {
  id: string;
  name: string;
  visit_date: string | null;
  created_at: string;
  provider: string | null;
  record_type: string | null;
  family_member_id: string;
}

export interface AssistantEventRow {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  event_time: string | null;
  provider: string | null;
  notes: string | null;
  family_member_id: string;
}

export interface ReviewedExtractionData {
  reportDate?: { value: string | null } | undefined;
  tests?:
    | Array<{
        name: string;
        value: string | null;
        unit: string | null;
        referenceRange: string | null;
      }>
    | undefined;
}

const BANNED_ASSISTANT_ADVICE =
  /\b(diagnos\w*|you (?:have|likely have|probably have|should|must|need to)|your diagnosis is|recommend(?:ed)? treatment|prescrib\w*|(?:start|stop|increase|decrease|take|switch) (?:the |your |this )?(?:medication|medicine|dose|tablet|treatment))\b|রোগ নির্ণয়|আপনার .* হয়েছে|ওষুধ (?:শুরু|বন্ধ|পরিবর্তন) করুন|रोग निदान|आपको .* बीमारी है|दवा (?:शुरू|बंद|बदलें)/i;

function normalizeDigits(text: string): string {
  return text
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)));
}

export function numbersInAssistantText(text: string): string[] {
  const normalized = normalizeDigits(text);
  return (normalized.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

export function validateAssistantResponse(raw: unknown, allowedText: string): AssistantResponse {
  const parsed = assistantResponseSchema.parse(raw);
  const allowedNumbers = new Set(numbersInAssistantText(allowedText));

  const textsToCheck = [
    parsed.answer,
    ...parsed.citations.flatMap((c) => [c.sourceName, c.memberName, c.date ?? "", c.quote]),
    ...parsed.limitations,
  ];

  for (const text of textsToCheck) {
    if (BANNED_ASSISTANT_ADVICE.test(text)) {
      throw new Error("The assistant response did not meet source-only safety checks.");
    }
    for (const num of numbersInAssistantText(text)) {
      if (!allowedNumbers.has(num)) {
        throw new Error(`Unverified number in assistant response: ${num}`);
      }
    }
  }

  return parsed;
}

export function buildFamilyAssistantContext({
  members,
  records,
  events,
  reviewedExtractions,
  wordTexts = {},
  memberId,
  question,
}: {
  members: AssistantMemberRow[];
  records: AssistantRecordRow[];
  events: AssistantEventRow[];
  reviewedExtractions: Record<string, ReviewedExtractionData>;
  wordTexts?: Record<string, string>;
  memberId?: string | null;
  question: string;
}) {
  const scopedMembers = memberId ? members.filter((m) => m.id === memberId) : members;
  const memberById = new Map(members.map((m) => [m.id, m.member_name]));

  const scopedRecords = (
    memberId ? records.filter((r) => r.family_member_id === memberId) : records
  ).slice(0, 50);

  const scopedEvents = (
    memberId ? events.filter((e) => e.family_member_id === memberId) : events
  ).slice(0, 50);

  const structuredRecords = scopedRecords.map((r) => {
    const extraction = reviewedExtractions[r.id];
    const wordText = wordTexts[r.id];
    return {
      name: r.name,
      memberName: memberById.get(r.family_member_id) ?? "Family member",
      recordType: r.record_type,
      visitDate: r.visit_date ?? extraction?.reportDate?.value ?? null,
      uploadedDate: r.created_at.slice(0, 10),
      provider: r.provider,
      reviewedTests: (extraction?.tests ?? []).map((t) => ({
        name: t.name,
        value: t.value,
        unit: t.unit,
        referenceRange: t.referenceRange,
      })),
      ...(wordText ? { documentText: wordText.slice(0, 12000) } : {}),
    };
  });

  const structuredEvents = scopedEvents.map((e) => ({
    title: e.title,
    eventType: e.event_type,
    memberName: memberById.get(e.family_member_id) ?? "Family member",
    date: e.event_date,
    time: e.event_time ? e.event_time.slice(0, 5) : null,
    provider: e.provider,
    notes: e.notes,
  }));

  const payload = {
    members: scopedMembers.map((m) => ({
      name: m.member_name,
      relation: m.relation,
      bloodGroup: m.blood_group,
    })),
    records: structuredRecords,
    timelineEvents: structuredEvents,
  };

  const allowedChunks: string[] = [
    question,
    ...scopedMembers.flatMap((m) => [m.member_name, m.relation ?? "", m.blood_group ?? ""]),
    ...structuredRecords.flatMap((r) => [
      r.name,
      r.memberName,
      r.recordType ?? "",
      r.visitDate ?? "",
      r.uploadedDate,
      r.provider ?? "",
      r.documentText ?? "",
      ...r.reviewedTests.flatMap((t) => [
        t.name,
        t.value ?? "",
        t.unit ?? "",
        t.referenceRange ?? "",
      ]),
    ]),
    ...structuredEvents.flatMap((e) => [
      e.title,
      e.eventType,
      e.memberName,
      e.date,
      e.time ?? "",
      e.provider ?? "",
      e.notes ?? "",
    ]),
  ];

  return {
    payload,
    allowedText: allowedChunks.join("\n"),
    recordCount: structuredRecords.length,
    eventCount: structuredEvents.length,
  };
}

export const ASSISTANT_UI_COPY: Record<
  AssistantLanguage,
  {
    title: string;
    subtitle: string;
    scopeLabel: string;
    allMembers: string;
    languageLabel: string;
    consentLabel: string;
    questionLabel: string;
    placeholder: string;
    askButton: string;
    thinking: string;
    citationsHeading: string;
    limitationsHeading: string;
    clearSession: string;
    disclaimer: string;
    starterQuestions: string[];
  }
> = {
  en: {
    title: "AI Health Assistant",
    subtitle:
      "Ask questions across your family's records, timeline events, and reviewed test tables. Answers are informational only — no diagnoses or treatment advice.",
    scopeLabel: "Search scope",
    allMembers: "All family members",
    languageLabel: "Answer language",
    consentLabel:
      "I agree to send my selected family record details, timeline events, and reviewed test values to the AI provider through Lovable AI for this question. Answers are not saved or added to doctor-visit packs.",
    questionLabel: "Your question across family records",
    placeholder: "e.g. Which lab reports and providers are recorded for Ma this year?",
    askButton: "Ask assistant",
    thinking: "Reviewing your selected family records…",
    citationsHeading: "Sources cited",
    limitationsHeading: "Limitations / missing details",
    clearSession: "Clear session",
    disclaimer:
      "Not medical advice. Values come only from record details, timeline events, and reviewed Report Reader tables. Always verify against original documents and discuss with your doctor.",
    starterQuestions: [
      "Which lab reports and visit dates are on record?",
      "List recent prescriptions and healthcare providers.",
      "What upcoming appointments or health events are on the timeline?",
    ],
  },
  bn: {
    title: "AI স্বাস্থ্য সহায়ক",
    subtitle:
      "আপনার পরিবারের নথি, স্বাস্থ্য ইতিহাস ও পর্যালোচিত টেস্ট টেবিল থেকে প্রশ্ন করুন। এটি শুধুমাত্র তথ্যের জন্য — রোগ নির্ণয় বা চিকিৎসার পরামর্শ নয়।",
    scopeLabel: "কোন সদস্যের নথি",
    allMembers: "পরিবারের সব সদস্য",
    languageLabel: "উত্তরের ভাষা",
    consentLabel:
      "এই প্রশ্নের উত্তরের জন্য নির্বাচিত পারিবারিক নথির তথ্য, স্বাস্থ্য ঘটনা এবং পর্যালোচিত টেস্টের মান Lovable AI-এর মাধ্যমে AI প্রদানকারীর কাছে পাঠাতে আমি সম্মত। উত্তর সংরক্ষণ করা হয় না বা ডাক্তার দেখানোর প্যাকে যোগ হয় না।",
    questionLabel: "পারিবারিক নথি সম্পর্কে আপনার প্রশ্ন",
    placeholder: "যেমন: এই বছরে মায়ের কোন কোন ল্যাব রিপোর্ট ও ডাক্তারের নাম নথিভুক্ত আছে?",
    askButton: "সহায়ককে জিজ্ঞাসা করুন",
    thinking: "নির্বাচিত পারিবারিক নথি দেখা হচ্ছে…",
    citationsHeading: "উদ্ধৃত উৎস",
    limitationsHeading: "সীমাবদ্ধতা / অসম্পূর্ণ তথ্য",
    clearSession: "কথোপকথন মুছুন",
    disclaimer:
      "এটি চিকিৎসা পরামর্শ নয়। উত্তর শুধুমাত্র আপনার নথি, ঘটনা এবং পর্যালোচিত রিপোর্ট থেকে দেওয়া হয়। মূল নথির সাথে মিলিয়ে দেখুন এবং চিকিৎসকের সাথে আলোচনা করুন।",
    starterQuestions: [
      "কোন কোন ল্যাব রিপোর্ট এবং তারিখ নথিভুক্ত আছে?",
      "সাম্প্রতিক প্রেসক্রিপশন ও চিকিৎসকদের তালিকা দিন।",
      "স্বাস্থ্য ইতিহাসে আসন্ন কোন সাক্ষাৎ বা ঘটনা আছে?",
    ],
  },
  hi: {
    title: "AI स्वास्थ्य सहायक",
    subtitle:
      "अपने परिवार के रिकॉर्ड, टाइमलाइन और समीक्षित लैब टेस्ट तालिकाओं के आधार पर प्रश्न पूछें। यह केवल जानकारी के लिए है — रोग निदान या उपचार सलाह नहीं।",
    scopeLabel: "खोज का दायरा",
    allMembers: "परिवार के सभी सदस्य",
    languageLabel: "उत्तर की भाषा",
    consentLabel:
      "मैं इस प्रश्न के लिए चुने गए पारिवारिक रिकॉर्ड विवरण, टाइमलाइन घटनाएँ और समीक्षित टेस्ट मान Lovable AI के माध्यम से AI प्रदाता को भेजने के लिए सहमत हूँ। उत्तर सहेजे नहीं जाते और डॉक्टर-विज़िट पैक में नहीं जोड़े जाते।",
    questionLabel: "पारिवारिक रिकॉर्ड से जुड़ा आपका प्रश्न",
    placeholder: "जैसे: इस वर्ष कौन-कौन सी लैब रिपोर्ट और डॉक्टर के नाम दर्ज हैं?",
    askButton: "सहायक से पूछें",
    thinking: "चुने गए पारिवारिक रिकॉर्ड देखे जा रहे हैं…",
    citationsHeading: "उद्धृत स्रोत",
    limitationsHeading: "सीमाएँ / अधूरी जानकारी",
    clearSession: "सत्र साफ़ करें",
    disclaimer:
      "यह चिकित्सीय सलाह नहीं है। जानकारी केवल आपके रिकॉर्ड, घटनाओं और समीक्षित टेस्ट तालिकाओं पर आधारित है। मूल दस्तावेज़ों से मिलाएँ और अपने डॉक्टर से चर्चा करें।",
    starterQuestions: [
      "कौन-कौन सी लैब रिपोर्ट और तिथियाँ दर्ज हैं?",
      "हाल के प्रिस्क्रिप्शन और डॉक्टरों की सूची दिखाएँ।",
      "टाइमलाइन पर आगामी कौन-से अपॉइंटमेंट या स्वास्थ्य कार्यक्रम हैं?",
    ],
  },
};
