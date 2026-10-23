export const RECORD_TYPES = ["Lab report", "Prescription", "Scan / Imaging", "Discharge summary", "Vaccination", "Bill / Invoice", "Other"];

export type FilterableRecord = {
  name: string;
  family_member_id: string;
  provider: string | null;
  record_type: string | null;
  visit_date: string | null;
  created_at: string;
};

export type RecordFilters = { member: string; type: string; provider: string; search: string };

export function filterRecords<T extends FilterableRecord>(records: T[], f: RecordFilters): T[] {
  const q = f.search.trim().toLowerCase();
  return records
    .filter((r) =>
      (f.member === "all" || r.family_member_id === f.member) &&
      (f.type === "all" || r.record_type === f.type) &&
      (f.provider === "all" || r.provider === f.provider) &&
      (!q || r.name.toLowerCase().includes(q) || (r.provider ?? "").toLowerCase().includes(q)))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

const sortKey = (r: FilterableRecord) => r.visit_date ?? r.created_at.slice(0, 10);
