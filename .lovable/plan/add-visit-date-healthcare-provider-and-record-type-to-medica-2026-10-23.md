# Add visit date, healthcare provider and record type to medical records

## What you'll get
- Upload form gets three new fields:
  - **Visit date**: pick it from a calendar
  - **Healthcare provider**: type in a doctor, hospital or lab name
  - **Record type**: choose from Lab report, Prescription, Scan / Imaging, Discharge summary, Vaccination, Bill / Invoice, Other
- Each record card shows its type, provider and visit date.
- New filters next to the search box: record type and provider. These work together with the existing member filter.
- The search box also finds records by provider name.
- Records are sorted by visit date, newest first. Records without a visit date fall back to their upload date.
- Records you already uploaded keep working. Their new fields stay blank until you edit them.
- An **Edit** button on each card lets you fill in the new fields for older records.

## Technical details
- Migration: add nullable columns `visit_date date`, `provider text`, `record_type text` to `medical_records`. Existing RLS covers them.
- `src/lib/data.ts`: add a `RECORD_TYPES` constant.
- `src/routes/_authenticated/records.tsx`: add the fields to the form (shadcn datepicker, input, select), reuse the dialog for editing, add the type and provider filters (provider options come from existing records), and update the sort.
- Put the filter logic in a small pure function and add a vitest test for combined filters.
