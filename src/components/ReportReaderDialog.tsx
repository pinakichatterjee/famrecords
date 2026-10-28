import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, RotateCcw, ScanText, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { extractReport, getReportExtraction, saveReportReview } from '@/lib/report-reader.functions';
import { getRecordDocument } from '@/lib/health.functions';
import { FAILURE_MESSAGES, MAX_ATTEMPTS_PER_RECORD, type Extraction, type FailureCode } from '@/lib/report-reader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Rec = { id: string; name: string };
type Status = 'none' | 'processing' | 'needs_review' | 'reviewed' | 'failed';

function Badge({ c }: { c: string }) {
  const cls = c === 'printed' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground';
  return <span className={`rounded px-1.5 py-0.5 text-xs ${cls}`}>{c}</span>;
}

export function ReportReaderDialog({ record, onClose }: { record: Rec | null; onClose: () => void }) {
  const load = useServerFn(getReportExtraction);
  const run = useServerFn(extractReport);
  const save = useServerFn(saveReportReview);
  const openDoc = useServerFn(getRecordDocument);
  const [status, setStatus] = useState<Status>('none');
  const [draft, setDraft] = useState<Extraction | null>(null);
  const [failure, setFailure] = useState<FailureCode | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [source, setSource] = useState<{ url: string; extension: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!record) return;
    setStatus('none'); setDraft(null); setFailure(null); setErr(null); setConsent(false); setConfirmed(false); setSource(null);
    load({ data: { recordId: record.id } }).then(({ extraction: x }) => {
      if (!x) return;
      setStatus(x.status as Status); setAttempts(x.attempt_count);
      setFailure((x.failure_code as FailureCode) ?? null);
      if (x.corrected) setDraft(x.corrected as Extraction);
    }).catch(() => setErr('Could not load the saved reading.'));
    openDoc({ data: { id: record.id } }).then(setSource).catch(() => setErr('Could not open the original report.'));
  }, [record?.id]);

  const start = async () => {
    if (!record || !consent) return;
    setStatus('processing'); setErr(null); setFailure(null);
    try {
      const r = await run({ data: { recordId: record.id } });
      setAttempts(a => a + 1);
      if (r.status === 'failed') { setStatus('failed'); setFailure(r.failureCode ?? 'ai_unavailable'); }
      else { setStatus('needs_review'); setDraft(r.extraction ?? null); setConfirmed(false); }
    } catch (e) { setStatus('failed'); setErr(e instanceof Error ? e.message : 'Reading failed.'); }
  };
  const submit = async () => {
    if (!record || !draft) return;
    setSaving(true); setErr(null);
    try { await save({ data: { recordId: record.id, corrected: draft } }); setStatus('reviewed'); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not save.'); }
    finally { setSaving(false); }
  };
  const setTest = (i: number, k: string, v: string) => setDraft(d => d && { ...d, tests: d.tests.map((t, j) => j === i ? { ...t, [k]: v || null, ...(k === 'name' ? { name: v } : {}) } : t) });
  const edit = () => { if (status === 'reviewed') setStatus('needs_review'); setConfirmed(false); };
  const canRetry = attempts < MAX_ATTEMPTS_PER_RECORD;

  return <Dialog open={!!record} onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 break-words"><ScanText className="h-5 w-5 shrink-0 text-primary"/>Report reader: {record?.name}</DialogTitle>
        <DialogDescription>Copies printed values only — no diagnosis or advice. AI can misread; check every value against the original and correct it.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Original report" className="min-h-[300px] rounded border">
          {!source ? <p className="p-4 text-sm text-muted-foreground">Loading original…</p>
            : source.extension === 'pdf' ? <iframe title="Original report" src={source.url} className="h-[70vh] w-full"/>
            : /^(png|jpe?g|webp|gif)$/.test(source.extension) ? <img src={source.url} alt="Original report" className="max-h-[70vh] w-full object-contain"/>
            : <p className="p-4 text-sm text-muted-foreground">This file type can't be read by the report reader.</p>}
        </section>
        <section className="space-y-4" aria-live="polite">
          {(status === 'none' || status === 'failed') && <>
            <div className="flex items-start gap-3"><Checkbox id="rr-consent" checked={consent} onCheckedChange={v => setConsent(v === true)}/><Label htmlFor="rr-consent" className="text-sm leading-relaxed">I agree to send this report to the AI provider through Lovable AI so its printed values can be copied into a reviewable table, which is saved with this record.</Label></div>
            {status === 'failed' && <p role="alert" className="text-sm text-destructive">{err ?? (failure ? FAILURE_MESSAGES[failure] : 'Reading failed.')}</p>}
            <div className="flex justify-center">{status === 'failed'
              ? <Button onClick={start} disabled={!consent || !canRetry}><RotateCcw className="h-4 w-4"/>Retry ({attempts}/{MAX_ATTEMPTS_PER_RECORD})</Button>
              : <Button onClick={start} disabled={!consent}><ScanText className="h-4 w-4"/>Read report</Button>}</div>
          </>}
          {status === 'processing' && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Reading report… this can take up to a minute.</p>}
          {draft && (status === 'needs_review' || status === 'reviewed') && <>
            <p className={`flex items-center gap-2 text-sm font-medium ${status === 'reviewed' ? 'text-primary' : 'text-destructive'}`}>
              {status === 'reviewed' ? <><CheckCircle2 className="h-4 w-4"/>Reviewed by you</> : 'Needs your review'}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="rr-type">Document type <Badge c={draft.documentType.certainty}/></Label><Input id="rr-type" value={draft.documentType.value ?? ''} placeholder="Unknown" onChange={e => { edit(); setDraft({ ...draft, documentType: { ...draft.documentType, value: e.target.value || null } }); }}/></div>
              <div className="space-y-1"><Label htmlFor="rr-date">Report date <Badge c={draft.reportDate.certainty}/></Label><Input id="rr-date" type="date" value={draft.reportDate.value ?? ''} onChange={e => { edit(); setDraft({ ...draft, reportDate: { ...draft.reportDate, value: e.target.value || null } }); }}/></div>
            </div>
            <div className="space-y-3">
              {draft.tests.length === 0 && <p className="text-sm text-muted-foreground">No test values found.</p>}
              {draft.tests.map((t, i) => <div key={i} className="space-y-2 rounded border p-3">
                <div className="flex items-center gap-2"><Badge c={t.certainty}/>{t.location && <span className="text-xs text-muted-foreground">{t.location}</span>}<Button variant="ghost" size="icon" className="ml-auto h-7 w-7" aria-label={`Remove ${t.name}`} onClick={() => { edit(); setDraft({ ...draft, tests: draft.tests.filter((_, j) => j !== i) }); }}><Trash2 className="h-4 w-4"/></Button></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['name', 'value', 'unit', 'referenceRange'] as const).map(k => <Input key={k} aria-label={`${k} ${i + 1}`} placeholder={k === 'referenceRange' ? 'Range: unknown' : `${k}: unknown`} value={t[k] ?? ''} onChange={e => { edit(); setTest(i, k, e.target.value); }}/>)}
                </div>
                {t.sourceQuote && <p className="break-words text-xs text-muted-foreground">Source: “{t.sourceQuote}”</p>}
              </div>)}
              <Button variant="outline" size="sm" onClick={() => { edit(); setDraft({ ...draft, tests: [...draft.tests, { name: 'New test', value: null, unit: null, referenceRange: null, certainty: 'uncertain', sourceQuote: null, location: null }] }); }}><Plus className="h-4 w-4"/>Add value</Button>
            </div>
            {draft.limitations.length > 0 && <div className="space-y-1"><h3 className="text-sm font-semibold">Uncertain or missing</h3>{draft.limitations.map((l, i) => <p key={i} className="text-sm text-muted-foreground">{l}</p>)}</div>}
            {status === 'needs_review' && <>
              <div className="flex items-start gap-3"><Checkbox id="rr-confirm" checked={confirmed} onCheckedChange={v => setConfirmed(v === true)}/><Label htmlFor="rr-confirm" className="text-sm">I compared these values with the original and corrected any mistakes.</Label></div>
              <div className="flex justify-center"><Button onClick={submit} disabled={!confirmed || saving}>{saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save review</Button></div>
            </>}
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            {canRetry && <div className="flex justify-center"><Button variant="ghost" size="sm" onClick={() => { setStatus('none'); setConsent(false); }}><RotateCcw className="h-4 w-4"/>Read again</Button></div>}
          </>}
        </section>
      </div>
    </DialogContent>
  </Dialog>;
}
