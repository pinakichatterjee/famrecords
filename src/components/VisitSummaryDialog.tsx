import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Download, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { createVisitSummary, deleteVisitSummary, listVisitSummaries, saveVisitSummary } from '@/lib/visit-summary.functions';
import { contentFingerprint, summaryLines, type SummaryContent } from '@/lib/visit-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Rec = { id: string; name: string; visit_date: string | null; family_member_id: string };
type Saved = Awaited<ReturnType<typeof listVisitSummaries>>[number];
type Lang = 'en' | 'bn';

export function VisitSummaryDialog({ members, records, memberId, language, onClose }: { members: Tables<'family_members'>[]; records: Rec[]; memberId: string; language: Lang; onClose: () => void }) {
  const list = useServerFn(listVisitSummaries); const create = useServerFn(createVisitSummary);
  const save = useServerFn(saveVisitSummary); const remove = useServerFn(deleteVisitSummary);
  const [saved, setSaved] = useState<Saved[] | null>(null);
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [form, setForm] = useState({ memberId: memberId === 'all' ? '' : memberId, ids: [] as string[], language, medications: '', allergies: '', other: '', consent: false });
  const [editing, setEditing] = useState<{ id: string; memberId: string; language: Lang; content: SummaryContent; reviewedPrint: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => list().then(setSaved).catch(() => toast.error('Could not load summaries.'));
  useEffect(() => { refresh(); import('@/lib/visit-pack-pdf').then(m => m.loadHealthFont()).catch(() => {}); }, []);

  const memberName = (id: string) => members.find(m => m.id === id)?.member_name ?? '';
  const candidates = records.filter(r => r.family_member_id === form.memberId);
  const open = (s: Saved) => { const content = s.content as unknown as SummaryContent; setEditing({ id: s.id, memberId: s.family_member_id, language: s.language as Lang, content, reviewedPrint: s.reviewed_at ? contentFingerprint(content) : null }); setMode('edit'); };

  const generate = async () => {
    if (!form.memberId || !form.ids.length) { toast.error('Choose a family member and at least one record.'); return; }
    setBusy(true);
    try {
      const r = await create({ data: { memberId: form.memberId, recordIds: form.ids, language: form.language, notes: { medications: form.medications, allergies: form.allergies, other: form.other }, consent: true } });
      setEditing({ id: r.id, memberId: form.memberId, language: form.language, content: r.content, reviewedPrint: null }); setMode('edit'); refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not create the summary.'); }
    finally { setBusy(false); }
  };

  const update = (fn: (c: SummaryContent) => SummaryContent) => setEditing(e => e && { ...e, content: fn(structuredClone(e.content)) });
  const reviewedNow = editing ? editing.reviewedPrint === contentFingerprint(editing.content) : false;

  const persist = async (reviewed: boolean) => {
    if (!editing) return; setBusy(true);
    try { await save({ data: { id: editing.id, content: editing.content, reviewed } }); setEditing({ ...editing, reviewedPrint: reviewed ? contentFingerprint(editing.content) : null }); toast.success(reviewed ? 'Reviewed and saved' : 'Saved'); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save.'); } finally { setBusy(false); }
  };
  const download = async () => {
    if (!editing || !reviewedNow) return; setBusy(true);
    try {
      const { createVisitPackPdf } = await import('@/lib/visit-pack-pdf');
      const blob = await createVisitPackPdf(summaryLines(editing.content, memberName(editing.memberId), editing.language));
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `FamRecords-visit-summary-${new Date().toISOString().slice(0, 10)}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not create PDF.'); } finally { setBusy(false); }
  };
  const del = async (id: string) => { if (!confirm('Delete this summary?')) return; try { await remove({ data: { id } }); if (editing?.id === id) { setEditing(null); setMode('list'); } refresh(); } catch { toast.error('Could not delete.'); } };

  return <Dialog open onOpenChange={o => !o && !busy && onClose()}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>AI doctor-visit summary</DialogTitle><DialogDescription>Uses only the records and notes you choose. It explains terms; it does not diagnose or advise treatment. Premium Family feature.</DialogDescription></DialogHeader>

    {mode === 'list' && <div className="space-y-4">
      <div className="flex justify-center"><Button onClick={() => setMode('new')}><Plus className="h-4 w-4"/>New summary</Button></div>
      {saved === null ? <Loader2 className="mx-auto h-5 w-5 animate-spin"/> : !saved.length ? <p className="text-muted-foreground">No saved summaries yet.</p> :
        <ul className="divide-y rounded-lg border">{saved.map(s => <li key={s.id} className="flex items-center justify-between gap-3 p-3"><button className="min-w-0 text-left" onClick={() => open(s)}><span className="block font-medium">{memberName(s.family_member_id)} · {s.language === 'bn' ? 'বাংলা' : 'English'}</span><span className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()} · {s.reviewed_at ? 'Reviewed' : 'Needs review'}</span></button><Button variant="ghost" size="icon" aria-label="Delete summary" onClick={() => del(s.id)}><Trash2 className="h-4 w-4"/></Button></li>)}</ul>}
    </div>}

    {mode === 'new' && <div className="space-y-4">
      <Button variant="ghost" onClick={() => setMode('list')}><ArrowLeft className="h-4 w-4"/>Back</Button>
      <div className="flex flex-wrap gap-3"><Select value={form.memberId} onValueChange={v => setForm(f => ({ ...f, memberId: v, ids: [] }))}><SelectTrigger aria-label="Family member" className="min-w-0 flex-1"><SelectValue placeholder="Choose family member"/></SelectTrigger><SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}</SelectContent></Select>
        <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v === 'bn' ? 'bn' : 'en' }))}><SelectTrigger aria-label="Summary language" className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem></SelectContent></Select></div>
      <fieldset className="space-y-2 border-y py-3"><legend className="font-semibold">Records to include</legend>{!candidates.length && <p className="text-muted-foreground">No records for this member.</p>}
        {candidates.map(r => <label key={r.id} className="flex items-start gap-3"><Checkbox aria-label={r.name} checked={form.ids.includes(r.id)} onCheckedChange={c => setForm(f => ({ ...f, ids: c === true ? [...f.ids, r.id] : f.ids.filter(i => i !== r.id) }))}/><span>{r.name}<span className="block text-sm text-muted-foreground">{r.visit_date ?? 'No visit date'}</span></span></label>)}
        <p className="text-sm text-muted-foreground">Test values come only from reports you've already reviewed in the Report Reader.</p></fieldset>
      {(['medications', 'allergies', 'other'] as const).map(k => <div key={k} className="space-y-1"><Label htmlFor={`vs-${k}`}>{k === 'medications' ? 'Medications (as you know them)' : k === 'allergies' ? 'Allergies' : 'Other notes or symptoms'}</Label><Textarea id={`vs-${k}`} maxLength={3000} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/></div>)}
      <label className="flex items-start gap-3"><Checkbox checked={form.consent} onCheckedChange={c => setForm(f => ({ ...f, consent: c === true }))}/><span className="text-sm">I agree to send the selected record details and my notes to the AI service to create this summary.</span></label>
      <div className="flex justify-center"><Button onClick={generate} disabled={busy || !form.consent}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}{busy ? 'Creating summary…' : 'Create summary'}</Button></div>
    </div>}

    {mode === 'edit' && editing && <div className="space-y-5" lang={editing.language}>
      <Button variant="ghost" onClick={() => setMode('list')} disabled={busy}><ArrowLeft className="h-4 w-4"/>All summaries</Button>
      <section className="space-y-2"><h3 className="font-semibold">Source documents</h3><ul className="list-disc pl-5 text-sm">{editing.content.sources.map(s => <li key={s.id}>{s.name}{s.date ? ` (${s.date})` : ''}</li>)}</ul></section>
      <section className="space-y-2"><h3 className="font-semibold">Facts from your records <span className="text-sm font-normal text-muted-foreground">(copied, not AI-written)</span></h3>
        {!editing.content.facts.length && <p className="text-sm text-muted-foreground">No reviewed test values in these records.</p>}
        {editing.content.facts.map((f, i) => <div key={i} className="grid grid-cols-[1fr_6rem_5rem] items-center gap-2 text-sm"><span className="min-w-0 break-words">{f.testName}<span className="block text-xs text-muted-foreground">{f.recordName}{f.recordDate ? `, ${f.recordDate}` : ''}</span></span>
          <Input aria-label={`${f.testName} value`} value={f.value ?? ''} onChange={e => update(c => { c.facts[i].value = e.target.value || null; return c; })}/>
          <Input aria-label={`${f.testName} unit`} value={f.unit ?? ''} onChange={e => update(c => { c.facts[i].unit = e.target.value || null; return c; })}/></div>)}</section>
      <section className="space-y-2 rounded-lg border border-dashed p-3"><h3 className="font-semibold">AI-written explanation <span className="text-sm font-normal text-muted-foreground">(check against your records)</span></h3>
        <Textarea aria-label="Overview" value={editing.content.ai.overview} maxLength={1500} onChange={e => update(c => { c.ai.overview = e.target.value; return c; })}/>
        {editing.content.ai.explanations.map((x, i) => <div key={i} className="space-y-1"><Label>{x.term}{x.uncertain && <span className="ml-2 rounded bg-accent px-1.5 text-xs">uncertain</span>}</Label><Textarea value={x.explanation} maxLength={800} onChange={e => update(c => { c.ai.explanations[i].explanation = e.target.value; return c; })}/></div>)}
        {!!editing.content.ai.limitations.length && <ul className="list-disc pl-5 text-sm text-muted-foreground">{editing.content.ai.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>}</section>
      <div className="space-y-1"><Label htmlFor="vs-q">Questions to ask your clinician (one per line)</Label><Textarea id="vs-q" value={editing.content.ai.questions.join('\n')} onChange={e => update(c => { c.ai.questions = e.target.value.split('\n').slice(0, 10).map(q => q.slice(0, 300)); return c; })}/></div>
      <label className="flex items-start gap-3"><Checkbox checked={reviewedNow} disabled={busy} onCheckedChange={c => c === true ? persist(true) : setEditing({ ...editing, reviewedPrint: null })}/><span className="text-sm">I reviewed this summary against the original records. Any later edit needs a new review.</span></label>
      <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => persist(false)} disabled={busy}>Save changes</Button><Button onClick={download} disabled={busy || !reviewedNow}><Download className="h-4 w-4"/>Download PDF</Button><Button variant="ghost" onClick={() => del(editing.id)} disabled={busy}><Trash2 className="h-4 w-4"/>Delete</Button></div>
    </div>}
  </DialogContent></Dialog>;
}
