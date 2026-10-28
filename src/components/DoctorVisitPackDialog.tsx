import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { healthCopy, healthDate, type HealthLanguage } from '@/lib/health-copy';
import { packCandidates, packFingerprint, packApproved, buildPackLines, type PackDraft, type PackRecord } from '@/lib/visit-pack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function DoctorVisitPackDialog({ members, records, memberId, language, onClose }: { members: Tables<'family_members'>[]; records: PackRecord[]; memberId: string; language: HealthLanguage; onClose: () => void }) {
  const [draft, setDraft] = useState<PackDraft>({ memberId: memberId === 'all' ? '' : memberId, selectedIds: [], start: '', end: '', allergies: '', medications: '', questions: '', language });
  const [preview, setPreview] = useState(false); const [approved, setApproved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [generatedAt, setGeneratedAt] = useState('');
  const c = healthCopy[draft.language];
  const member = members.find(m => m.id === draft.memberId);
  const candidates = packCandidates(records, draft.memberId, draft.start, draft.end);
  const fingerprint = packFingerprint(draft, records, member?.member_name ?? '');
  const lines = useMemo(() => buildPackLines(draft, records, member?.member_name ?? '', generatedAt || new Date().toISOString()), [draft, records, member?.member_name, generatedAt]);
  const change = (values: Partial<PackDraft>) => { setDraft(d => ({ ...d, ...values })); setApproved(null); };
  useEffect(() => { import('@/lib/visit-pack-pdf').then(m => m.loadHealthFont()).catch(() => toast.error('Could not load the PDF font. Please try again.')); }, []);
  const showPreview = () => {
    if (!member) { toast.error(c.selectMember); return; }
    if (draft.start && draft.end && draft.end < draft.start) { toast.error(c.invalidRange); return; }
    if (!candidates.some(r => draft.selectedIds.includes(r.id))) { toast.error(c.selectDocuments); return; }
    setGeneratedAt(new Date().toISOString()); setApproved(null); setPreview(true);
  };
  const download = async () => {
    if (!packApproved(approved, fingerprint)) return;
    setBusy(true);
    try {
      const { createVisitPackPdf } = await import('@/lib/visit-pack-pdf');
      const blob = await createVisitPackPdf(lines); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `FamRecords-visit-pack-${generatedAt.slice(0, 10)}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not create PDF.'); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => !open && !busy && onClose()}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{c.pack}</DialogTitle></DialogHeader>
    {!preview ? <div className="space-y-5">
      <div className="flex flex-wrap gap-3"><Select value={draft.memberId} onValueChange={v => change({ memberId: v, selectedIds: [] })}><SelectTrigger aria-label={c.member} className="min-w-0 flex-1"><SelectValue placeholder={c.selectMember}/></SelectTrigger><SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}</SelectContent></Select><Select value={draft.language} onValueChange={v => change({ language: v === 'bn' ? 'bn' : 'en' })}><SelectTrigger aria-label="Pack language" className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem></SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3">{(['start', 'end'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={`pack-${key}`}>{key === 'start' ? c.from : c.to}</Label><Input id={`pack-${key}`} type="date" value={draft[key]} onChange={e => change({ [key]: e.target.value, selectedIds: [] })}/></div>)}</div>
      <fieldset className="space-y-3 border-y py-4"><legend className="font-semibold">{c.reports}</legend>{!candidates.length && <p className="text-muted-foreground">{c.empty}</p>}
        {[false, true].map(undated => <div key={String(undated)} className="space-y-3">{undated && candidates.some(r => !r.visit_date) && <h3 className="font-medium">{c.undated}</h3>}{candidates.filter(r => !r.visit_date === undated).map(r => <label key={r.id} className="flex items-start gap-3"><Checkbox aria-label={r.name} checked={draft.selectedIds.includes(r.id)} onCheckedChange={checked => change({ selectedIds: checked === true ? [...draft.selectedIds, r.id] : draft.selectedIds.filter(id => id !== r.id) })}/><span className="min-w-0 break-words"><span className="font-medium">{r.name}</span><span className="block text-sm text-muted-foreground">{r.visit_date ? healthDate(r.visit_date, draft.language) : c.missingDate} · {c.uploaded}: {healthDate(r.created_at, draft.language)}</span></span></label>)}</div>)}
      </fieldset><p className="text-sm text-muted-foreground">{c.manualNotice}</p>
      {(['allergies', 'medications', 'questions'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={`pack-${key}`}>{c[key]}</Label><Textarea id={`pack-${key}`} maxLength={5000} value={draft[key]} onChange={e => change({ [key]: e.target.value })}/></div>)}
      <div className="flex justify-center"><Button onClick={showPreview}><Eye className="h-4 w-4"/>{c.previewPack}</Button></div>
    </div> : <div className="space-y-5">
      <Button variant="ghost" onClick={() => { setPreview(false); setApproved(null); }} disabled={busy}><ArrowLeft className="h-4 w-4"/>{c.editPack}</Button>
      <article className="visit-pack-preview space-y-3 border bg-card p-5 sm:p-8">{lines.map((line, i) => line.heading ? <h3 key={i} className="break-words pt-3 text-lg font-semibold">{line.text}</h3> : <p key={i} className="whitespace-pre-wrap break-words text-sm leading-relaxed">{line.text}</p>)}</article>
      <label className="flex items-start gap-3"><Checkbox aria-label={c.approve} checked={packApproved(approved, fingerprint)} onCheckedChange={checked => setApproved(checked === true ? fingerprint : null)}/><span>{c.approve}</span></label>
      <div className="flex justify-center"><Button onClick={download} disabled={busy || !packApproved(approved, fingerprint)}><Download className="h-4 w-4"/>{busy ? c.saving : c.downloadPack}</Button></div>
    </div>}
  </DialogContent></Dialog>;
}