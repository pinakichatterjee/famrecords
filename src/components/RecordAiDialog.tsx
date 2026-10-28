import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Sparkles, Send, Loader2, ExternalLink } from 'lucide-react';
import { analyzeRecord } from '@/lib/record-ai.functions';
import { getRecordDocument } from '@/lib/health.functions';
import type { Explanation } from '@/lib/record-explanation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Rec = { id: string; name: string; ai_summary: string | null };
function Details({ result, name }: { result: Explanation; name: string }) {
  return <div className="space-y-5" aria-live="polite">
    {result.details.map((d, i) => <section key={i} className="space-y-2 border-b pb-4">
      <p className="text-base leading-relaxed">{d.explanation}</p>
      <blockquote className="border-l-2 border-primary pl-3 text-sm text-muted-foreground"><p className="whitespace-pre-wrap break-words">“{d.quote}”</p><p className="mt-1">Source: {name} · {d.location}</p></blockquote>
    </section>)}
    {result.limitations.length > 0 && <section className="space-y-2"><h3 className="font-semibold">Uncertainty / সীমাবদ্ধতা</h3>{result.limitations.map((s,i) => <p key={i} className="text-sm text-muted-foreground">{s}</p>)}</section>}
  </div>;
}
export function RecordAiDialog({ record, onClose }: { record: Rec | null; onClose: () => void }) {
  const run = useServerFn(analyzeRecord);
  const openDocument = useServerFn(getRecordDocument);
  const [result, setResult] = useState<Explanation | null>(null);
  const [question, setQuestion] = useState('');
  const [consent, setConsent] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    setResult(null); setQuestion(''); setConsent(false); setErr(null); setBusy(false);
  }, [record?.id]);
  const explain = async (ask = false) => {
    if (!record || !consent || busy) return;
    const current = generation.current;
    setBusy(true); setErr(null); setResult(null);
    try {
      const response = await run({ data: { recordId: record.id, consent, language, question: ask ? question : undefined } });
      if (current !== generation.current) return;
      if ('error' in response) setErr(response.error ?? 'No explanation was produced.');
      else setResult(response.explanation);
    } catch (error) { if (current === generation.current) setErr(error instanceof Error ? error.message : 'No explanation was produced.'); }
    finally { if (current === generation.current) setBusy(false); }
  };
  const viewSource = async () => {
    if (!record) return;
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    try { const r = await openDocument({ data: { id: record.id } }); if (win) win.location.href = r.url; }
    catch { win?.close(); setErr('Could not open the original record.'); }
  };
  return <Dialog open={!!record} onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2 break-words"><Sparkles className="h-5 w-5 shrink-0 text-primary"/> Record explanation: {record?.name}</DialogTitle>
        <DialogDescription>Informational only — no diagnoses or treatment recommendations. AI can misread documents; compare every quoted detail with the original.</DialogDescription></DialogHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={language} onValueChange={v => { setLanguage(v === 'bn' ? 'bn' : 'en'); setResult(null); }} disabled={busy}><SelectTrigger aria-label="Explanation language" className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem></SelectContent></Select>
        <Button variant="outline" size="sm" onClick={viewSource}><ExternalLink className="h-4 w-4"/>Original record</Button>
      </div>
      <div className="flex items-start gap-3 border-y py-4"><Checkbox id="ai-consent" checked={consent} disabled={busy} onCheckedChange={v => setConsent(v === true)}/><Label htmlFor="ai-consent" className="text-sm leading-relaxed">I agree to send this selected document to the AI provider through Lovable AI for this explanation. I am authorised to share it. Explanations are not saved or added to doctor-visit packs.</Label></div>
      <div className="flex justify-center"><Button onClick={() => explain()} disabled={!consent || busy}><Sparkles className="h-4 w-4"/>{language === 'bn' ? 'নথি ব্যাখ্যা করুন' : 'Explain record'}</Button></div>
      <form onSubmit={e => { e.preventDefault(); explain(true); }} className="space-y-3">
        <Label htmlFor="record-question">Question about the source / নথি সম্পর্কে প্রশ্ন</Label>
        <Textarea id="record-question" value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} maxLength={1000} placeholder="What does this recorded measurement mean?"/>
        <div className="flex justify-center"><Button type="submit" variant="outline" disabled={!consent || busy || !question.trim()}><Send className="h-4 w-4"/>Ask about record</Button></div>
      </form>
      {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Reading selected document…</p>}
      {result && <Details result={result} name={record?.name ?? ''}/>}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <p className="text-sm text-muted-foreground">Not medical advice. Missing details are not inferred. Confirm unclear source information with your clinician.</p>
    </DialogContent>
  </Dialog>;
}
