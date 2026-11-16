import { useEffect, useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquareText, Send, Sparkles, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { askHealthAssistant } from "@/lib/health-assistant.functions";
import {
  ASSISTANT_LANGUAGE_LABELS,
  ASSISTANT_UI_COPY,
  type AssistantLanguage,
  type AssistantResponse,
} from "@/lib/health-assistant";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AssistantTurn {
  id: string;
  question: string;
  language: AssistantLanguage;
  response: AssistantResponse;
}

export interface HealthAssistantDialogProps {
  open: boolean;
  members: Pick<Tables<"family_members">, "id" | "member_name">[];
  defaultMemberId?: string;
  defaultLanguage?: "en" | "bn";
  onClose: () => void;
  onAsk?: (input: {
    question: string;
    memberId: string | null;
    language: AssistantLanguage;
    consent: true;
  }) => Promise<{ response: AssistantResponse } | { error: string }>;
}

export function HealthAssistantDialog({
  open,
  members,
  defaultMemberId = "all",
  defaultLanguage = "en",
  onClose,
  onAsk,
}: HealthAssistantDialogProps) {
  const runServerAsk = useServerFn(askHealthAssistant);
  const consentId = useId();
  const questionId = useId();

  const [memberId, setMemberId] = useState<string>(defaultMemberId);
  const [language, setLanguage] = useState<AssistantLanguage>(defaultLanguage);
  const [consent, setConsent] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    if (!open) return;
    setMemberId(defaultMemberId);
    setLanguage(defaultLanguage);
    setError(null);
  }, [open, defaultMemberId, defaultLanguage]);

  const copy = ASSISTANT_UI_COPY[language];

  async function submitQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || !consent || busy) return;

    const currentGen = generation.current;
    setBusy(true);
    setError(null);

    try {
      const payload = {
        question: trimmed,
        memberId: memberId === "all" ? null : memberId,
        language,
        consent: true as const,
      };
      const result = onAsk ? await onAsk(payload) : await runServerAsk({ data: payload });

      if (currentGen !== generation.current) return;

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setTurns((prev) => [
        {
          id: `${Date.now()}-${prev.length}`,
          question: trimmed,
          language,
          response: result.response,
        },
        ...prev,
      ]);
      setQuestion("");
    } catch (err) {
      if (currentGen === generation.current) {
        setError(err instanceof Error ? err.message : "Could not get an answer. Please try again.");
      }
    } finally {
      if (currentGen === generation.current) {
        setBusy(false);
      }
    }
  }

  function clearSession() {
    generation.current += 1;
    setTurns([]);
    setError(null);
    setBusy(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>{copy.title}</span>
          </DialogTitle>
          <DialogDescription>{copy.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{copy.scopeLabel}</Label>
            <Select value={memberId} onValueChange={setMemberId} disabled={busy}>
              <SelectTrigger aria-label={copy.scopeLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allMembers}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.member_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{copy.languageLabel}</Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as AssistantLanguage)}
              disabled={busy}
            >
              <SelectTrigger aria-label={copy.languageLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ASSISTANT_LANGUAGE_LABELS) as [AssistantLanguage, string][]).map(
                  ([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start gap-3 border-y border-border py-3.5">
          <Checkbox
            id={consentId}
            checked={consent}
            disabled={busy}
            onCheckedChange={(checked) => setConsent(checked === true)}
          />
          <Label htmlFor={consentId} className="cursor-pointer text-sm leading-relaxed">
            {copy.consentLabel}
          </Label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {copy.starterQuestions.map((starter) => (
              <button
                key={starter}
                type="button"
                disabled={busy}
                onClick={() => setQuestion(starter)}
                className="rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-left text-xs text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuestion(question);
          }}
          className="space-y-3"
        >
          <Label htmlFor={questionId}>{copy.questionLabel}</Label>
          <Textarea
            id={questionId}
            value={question}
            disabled={busy}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={copy.placeholder}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {turns.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSession}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {copy.clearSession}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!consent || busy || question.trim().length < 2}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {copy.askButton}
            </Button>
          </div>
        </form>

        {busy && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            <span>{copy.thinking}</span>
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {turns.length > 0 && (
          <div className="space-y-4" aria-live="polite">
            {turns.map((turn) => (
              <section
                key={turn.id}
                className="space-y-3 rounded-xl border border-border bg-background/70 p-4"
              >
                <div className="flex items-start gap-2 text-sm font-semibold text-foreground">
                  <MessageSquareText
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{turn.question}</span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
                  {turn.response.answer}
                </p>

                {turn.response.citations.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {ASSISTANT_UI_COPY[turn.language].citationsHeading}
                    </h3>
                    <ul className="space-y-2">
                      {turn.response.citations.map((citation, index) => (
                        <li
                          key={`${citation.sourceName}-${index}`}
                          className="border-l-2 border-primary pl-3 text-xs text-muted-foreground"
                        >
                          <p className="whitespace-pre-wrap break-words text-foreground">
                            &ldquo;{citation.quote}&rdquo;
                          </p>
                          <p className="mt-0.5">
                            {citation.sourceName} · {citation.memberName}
                            {citation.date ? ` · ${citation.date}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {turn.response.limitations.length > 0 && (
                  <div className="space-y-1 border-t border-border pt-2.5">
                    <h3 className="text-xs font-semibold text-muted-foreground">
                      {ASSISTANT_UI_COPY[turn.language].limitationsHeading}
                    </h3>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {turn.response.limitations.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">{copy.disclaimer}</p>
      </DialogContent>
    </Dialog>
  );
}
