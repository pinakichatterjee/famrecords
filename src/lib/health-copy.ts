export type HealthLanguage = 'en' | 'bn';
const en = {
  timeline: 'Smart Health Timeline', subtitle: 'Medical records and events, in date order.', upload: 'Upload record', event: 'Add event', pack: 'Doctor Visit Pack',
  member: 'Family member', allMembers: 'All members', allTypes: 'All categories', allProviders: 'All providers', search: 'Search records or events', from: 'From', to: 'To', reset: 'Reset filters',
  documentDate: 'Visit / document date', uploaded: 'Uploaded', missingDate: 'Document date not provided', uploadFallback: 'Grouped by upload date', manual: 'User-entered',
  appointment: 'Appointment', health_event: 'Health event', view: 'Preview', download: 'Download', edit: 'Edit', remove: 'Delete', empty: 'No records or events found.',
  title: 'Title', date: 'Date', time: 'Time (optional)', provider: 'Healthcare provider', notes: 'Notes', save: 'Save', saving: 'Saving…', cancel: 'Cancel', type: 'Category',
  allergies: 'Allergies', medications: 'Current medications', questions: 'Questions for the clinician', manualNotice: 'User-entered information — not clinically verified.',
  reports: 'Select documents', undated: 'Undated documents', previewPack: 'Preview pack', approve: 'I have reviewed and approve this pack', downloadPack: 'Download PDF',
  generation: 'Generated', sources: 'Source documents', range: 'Date range', noEntry: 'Not provided', editPack: 'Back to editing',
  packNote: 'This pack is a document index with user-entered notes. It does not include AI summaries or replace medical advice.',
  selectMember: 'Select a family member', selectDocuments: 'Select at least one document', invalidRange: 'End date must be on or after start date.',
  newEvent: 'Add health event', editEvent: 'Edit health event', eventType: 'Event type', ai: 'Ask AI', noMembers: 'Add a family member first.',
};
const bn: typeof en = {
  timeline: 'স্বাস্থ্য ইতিহাস', subtitle: 'তারিখ অনুযায়ী চিকিৎসার নথি ও ঘটনা।', upload: 'নথি আপলোড', event: 'ঘটনা যোগ করুন', pack: 'ডাক্তার সাক্ষাৎ প্যাক',
  member: 'পরিবারের সদস্য', allMembers: 'সব সদস্য', allTypes: 'সব বিভাগ', allProviders: 'সব চিকিৎসা প্রদানকারী', search: 'নথি বা ঘটনা খুঁজুন', from: 'শুরুর তারিখ', to: 'শেষের তারিখ', reset: 'ফিল্টার মুছুন',
  documentDate: 'সাক্ষাৎ / নথির তারিখ', uploaded: 'আপলোডের তারিখ', missingDate: 'নথির তারিখ দেওয়া হয়নি', uploadFallback: 'আপলোডের তারিখ অনুযায়ী', manual: 'নিজে লিখেছেন',
  appointment: 'সাক্ষাৎ', health_event: 'স্বাস্থ্য ঘটনা', view: 'দেখুন', download: 'ডাউনলোড', edit: 'সম্পাদনা', remove: 'মুছুন', empty: 'কোনো নথি বা ঘটনা পাওয়া যায়নি।',
  title: 'শিরোনাম', date: 'তারিখ', time: 'সময় (ঐচ্ছিক)', provider: 'চিকিৎসা প্রদানকারী', notes: 'নোট', save: 'সংরক্ষণ', saving: 'সংরক্ষণ হচ্ছে…', cancel: 'বাতিল', type: 'বিভাগ',
  allergies: 'অ্যালার্জি', medications: 'বর্তমান ওষুধ', questions: 'চিকিৎসককে প্রশ্ন', manualNotice: 'নিজে লেখা তথ্য — চিকিৎসাগতভাবে যাচাই করা হয়নি।',
  reports: 'নথি নির্বাচন করুন', undated: 'তারিখবিহীন নথি', previewPack: 'প্যাক দেখুন', approve: 'আমি এই প্যাক পর্যালোচনা করেছি এবং অনুমোদন দিচ্ছি', downloadPack: 'পিডিএফ ডাউনলোড',
  generation: 'তৈরির তারিখ', sources: 'উৎস নথি', range: 'তারিখের সীমা', noEntry: 'দেওয়া হয়নি', editPack: 'সম্পাদনায় ফিরুন',
  packNote: 'এই প্যাকে নথির তালিকা এবং নিজে লেখা নোট রয়েছে। এতে এআই সারাংশ নেই এবং এটি চিকিৎসকের পরামর্শের বিকল্প নয়।',
  selectMember: 'পরিবারের সদস্য নির্বাচন করুন', selectDocuments: 'অন্তত একটি নথি নির্বাচন করুন', invalidRange: 'শেষের তারিখ শুরুর তারিখের আগে হতে পারে না।',
  newEvent: 'স্বাস্থ্য ঘটনা যোগ করুন', editEvent: 'স্বাস্থ্য ঘটনা সম্পাদনা', eventType: 'ঘটনার ধরন', ai: 'এআইকে জিজ্ঞাসা', noMembers: 'প্রথমে পরিবারের সদস্য যোগ করুন।',
};
export const healthCopy = { en, bn };
export function healthDate(value: string, language: HealthLanguage = 'en', month = false) {
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-IN' : 'en-IN', month ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}
const categories: Record<string, string> = { 'Lab report': 'ল্যাব রিপোর্ট', Prescription: 'প্রেসক্রিপশন', 'Scan / Imaging': 'স্ক্যান / ইমেজিং', 'Discharge summary': 'ছাড়পত্রের সারাংশ', Vaccination: 'টিকা', 'Bill / Invoice': 'বিল', Consultation: 'পরামর্শ', Hospitalisation: 'হাসপাতালে ভর্তি', Other: 'অন্যান্য' };
export const categoryLabel = (category: string, language: HealthLanguage) => language === 'bn' ? categories[category] ?? category : category;