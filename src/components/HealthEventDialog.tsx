import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveHealthEvent } from '@/lib/health.functions';
import { healthCopy, type HealthLanguage } from '@/lib/health-copy';
import type { HealthEvent } from '@/lib/health-timeline';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function HealthEventDialog({ event, memberId, members, language, onClose }: { event: HealthEvent | null; memberId: string; members: Tables<'family_members'>[]; language: HealthLanguage; onClose: () => void }) {
  const c = healthCopy[language];
  const [member, setMember] = useState(event?.family_member_id ?? (memberId === 'all' ? '' : memberId));
  const [type, setType] = useState<'appointment' | 'health_event'>(event?.event_type === 'appointment' ? 'appointment' : 'health_event');
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.event_date ?? '');
  const [time, setTime] = useState(event?.event_time?.slice(0, 5) ?? '');
  const [provider, setProvider] = useState(event?.provider ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const save = useServerFn(saveHealthEvent); const qc = useQueryClient();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!member) { toast.error(c.selectMember); return; }
    setSaving(true);
    try {
      await save({ data: { id: event?.id, family_member_id: member, event_type: type, title, event_date: date, event_time: time || null, provider: provider.trim() || null, notes: notes.trim() || null } });
      await qc.invalidateQueries({ queryKey: ['health-events'] }); toast.success(c.save); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save event.'); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => !open && !saving && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{event ? c.editEvent : c.newEvent}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>{c.member}</Label><Select value={member} onValueChange={setMember}><SelectTrigger aria-label={c.member}><SelectValue placeholder={c.selectMember}/></SelectTrigger><SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>{c.eventType}</Label><Select value={type} onValueChange={v => setType(v === 'appointment' ? 'appointment' : 'health_event')}><SelectTrigger aria-label={c.eventType}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="appointment">{c.appointment}</SelectItem><SelectItem value="health_event">{c.health_event}</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="event-title">{c.title}</Label><Input id="event-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="event-date">{c.date}</Label><Input id="event-date" type="date" required value={date} onChange={e => setDate(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="event-time">{c.time}</Label><Input id="event-time" type="time" value={time} onChange={e => setTime(e.target.value)}/></div></div>
      <div className="space-y-2"><Label htmlFor="event-provider">{c.provider}</Label><Input id="event-provider" maxLength={300} value={provider} onChange={e => setProvider(e.target.value)}/></div>
      <div className="space-y-2"><Label htmlFor="event-notes">{c.notes}</Label><Textarea id="event-notes" maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)}/></div>
      <p className="text-sm text-muted-foreground">{c.manualNotice}</p><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={saving}>{c.cancel}</Button><Button disabled={saving}>{saving ? c.saving : c.save}</Button></DialogFooter>
    </form></DialogContent></Dialog>;
}