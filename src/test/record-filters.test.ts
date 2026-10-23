import { describe, it, expect } from "vitest";
import { filterRecords } from "@/lib/record-filters";

const recs = [
  { name: "Blood test", family_member_id: "a", provider: "Apollo", record_type: "Lab report", visit_date: "2026-01-10", created_at: "2026-10-01T00:00:00Z" },
  { name: "Rx", family_member_id: "a", provider: "Dr Sen", record_type: "Prescription", visit_date: "2026-05-01", created_at: "2026-02-01T00:00:00Z" },
  { name: "Xray", family_member_id: "b", provider: "Apollo", record_type: "Scan / Imaging", visit_date: null, created_at: "2026-03-01T00:00:00Z" },
];
const all = { member: "all", type: "all", provider: "all", search: "" };

describe("filterRecords", () => {
  it("combines member and provider filters", () => {
    expect(filterRecords(recs, { ...all, member: "a", provider: "Apollo" }).map((r) => r.name)).toEqual(["Blood test"]);
  });
  it("filters by record type", () => {
    expect(filterRecords(recs, { ...all, type: "Prescription" }).map((r) => r.name)).toEqual(["Rx"]);
  });
  it("search matches provider name", () => {
    expect(filterRecords(recs, { ...all, search: "sen" }).map((r) => r.name)).toEqual(["Rx"]);
  });
  it("sorts by visit date newest first, falling back to upload date", () => {
    expect(filterRecords(recs, all).map((r) => r.name)).toEqual(["Rx", "Xray", "Blood test"]);
  });
});
