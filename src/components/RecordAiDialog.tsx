import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { analyzeRecord } from "@/lib/record-ai.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Rec = { id: string; name: string; ai_summary: string | null };

function Formatted({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-base leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="pt-3 text-lg font-semibold text-primary">{line.slice(3)}</h3>;
        const clean = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^_(.*)_$/, "$1");
        if (/^\s*[-*] /.test(line)) return <p key={i} className="pl-4">• {clean.replace(/^\s*[-*] /, "")}</p>;
        if (!line.trim()) return <div key={i} className="h-2" />;
        return <p key={i} className={line.startsWith("_") ? "pt-2 text-sm text-muted-foreground" : ""}>{clean}</p>;
      })}
    </div>
  );
}

export function RecordAiDialog({ record, onClose }: { record: Rec | null; onClose: () => void }) {
  const run = useServerFn(analyzeRecord);
  const qc = useQueryClient();
  const [summary, setSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState<"summary" | "ask" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setSummary(record?.ai_summary ?? null); setAnswer(null); setQuestion(""); setErr(null); setBusy(null);
  }, [record?.id]);

  const summarize = async () => {
    if (!record) return;
    setBusy("summary"); setErr(null);
    try {
      const r = await run({ data: { recordId: record.id } });
      if ("error" in r && r.error) setErr(r.error);
      else if ("text" in r && r.text) { setSummary(r.text); qc.invalidateQueries({ queryKey: ["records"] }); }
    } catch { setErr("Something went wrong. Please try again."); }
    setBusy(null);
  };

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !question.trim()) return;
    setBusy("ask"); setErr(null); setAnswer(null);
    try {
      const r = await run({ data: { recordId: record.id, question } });
      if ("error" in r && r.error) setErr(r.error);
      else if ("text" in r && r.text) setAnswer(r.text);
    } catch { setErr("Something went wrong. Please try again."); }
    setBusy(null);
  };

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI help: {record?.name}</DialogTitle>
          <DialogDescription>Get a plain-language summary, or ask a question about this record.</DialogDescription>
        </DialogHeader>

        <section className="space-y-3 rounded-xl bg-secondary p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Summary</h2>
            <Button size="sm" onClick={summarize} disabled={!!busy}>
              {busy === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {summary ? "Refresh" : "Summarise"}
            </Button>
          </div>
          {busy === "summary" ? <p className="text-muted-foreground">Reading the record…</p>
            : summary ? <Formatted text={summary} />
            : <p className="text-muted-foreground">Diagnoses, medications and follow-up instructions, in simple words.</p>}
        </section>

        <form onSubmit={ask} className="space-y-3">
          <h2 className="text-lg font-semibold">Ask a question</h2>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000}
            placeholder="e.g. What does high HbA1c mean? When should the next check-up be?" />
          <div className="flex justify-center">
            <Button type="submit" disabled={!!busy || !question.trim()}>
              {busy === "ask" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Ask
            </Button>
          </div>
          {busy === "ask" && <p className="text-muted-foreground">Thinking…</p>}
          {answer && <div className="rounded-xl border bg-card p-4"><Formatted text={answer} /></div>}
        </form>

        {err && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
      </DialogContent>
    </Dialog>
  );
}
