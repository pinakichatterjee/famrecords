import type { Tables } from '@/integrations/supabase/types';
import { filterRecords, type FilterableRecord, type RecordFilters } from './record-filters';

export type HealthEvent = Tables<'health_events'>;
export type TimelineItem<R> = { kind: 'record'; date: string; item: R } | { kind: 'event'; date: string; item: HealthEvent };
export function timelineGroups<R extends FilterableRecord>(records: R[], events: HealthEvent[], filters: RecordFilters) {
  const query = filters.search.trim().toLowerCase();
  const rows: TimelineItem<R>[] = filterRecords(records, filters).map(item => ({ kind: 'record', date: item.visit_date ?? item.created_at.slice(0, 10), item }));
  for (const item of events) {
    if (filters.member !== 'all' && item.family_member_id !== filters.member) continue;
    if (filters.type !== 'all' && filters.type !== item.event_type) continue;
    if (filters.provider !== 'all' && filters.provider !== item.provider) continue;
    if (query && !`${item.title} ${item.provider ?? ''} ${item.notes ?? ''}`.toLowerCase().includes(query)) continue;
    if (filters.start && item.event_date < filters.start || filters.end && item.event_date > filters.end) continue;
    rows.push({ kind: 'event', date: item.event_date, item });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, TimelineItem<R>[]>();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    const group = groups.get(key) ?? [];
    group.push(row); groups.set(key, group);
  }
  return [...groups].map(([month, items]) => ({ month, items }));
}