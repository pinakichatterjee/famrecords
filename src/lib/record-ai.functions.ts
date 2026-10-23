import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayRunIdFetch } from "./ai/run-id";

const MODEL = "openai/gpt-6-astra";

const SUMMARY_PROMPT = `You help family caregivers understand medical documents.
Summarise the attached record in plain, simple language using exactly these markdown sections:
## Diagnoses
## Medications
## Follow-up instructions
Under each, use short bullet points. Include dosages and dates when shown. If a section has nothing in the document, write "- Not mentioned in this record".
Do not invent information. End with one line: "_This summary is not medical advice — confirm with your doctor._"`;

const QA_PROMPT = `You help family caregivers understand medical documents.
Answer the user's question using only the attached record. Explain medical terms in plain, simple language, short paragraphs or bullets.
If the record does not contain the answer, say so clearly. Never invent details.
End with one line: "_This is not medical advice — confirm with your doctor._"`;

function toBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const analyzeRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { recordId: string; question?: string }) => {
    if (typeof input?.recordId !== "string" || !input.recordId) throw new Error("Missing record");
    const q = input.question?.trim();
    if (q && q.length > 1000) throw new Error("Question is too long");
    return { recordId: input.recordId, question: q || undefined };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rec, error } = await supabase
      .from("medical_records").select("id, name, document").eq("id", data.recordId).maybeSingle();
    if (error || !rec) return { error: "Record not found." };

    const ext = rec.document.split(".").pop()?.toLowerCase() ?? "";
    const imageTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
    if (ext !== "pdf" && !imageTypes[ext]) {
      return { error: "AI reading works for PDFs and photos (JPG, PNG, WEBP). Word files aren't supported yet." };
    }

    const { data: blob, error: dlErr } = await supabase.storage.from("medical-documents").download(rec.document);
    if (dlErr || !blob) return { error: "Could not open the document." };
    const b64 = toBase64(new Uint8Array(await blob.arrayBuffer()));

    const filePart = ext === "pdf"
      ? ({ type: "file", filename: `${rec.name}.pdf`, data: b64, mediaType: "application/pdf" } as const)
      : ({ type: "image", image: new URL(`data:${imageTypes[ext]};base64,${b64}`) } as const);

    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) return { error: "AI is not configured." };
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    try {
      const result = streamText({
        model: provider.responses(MODEL),
        system: data.question ? QA_PROMPT : SUMMARY_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: data.question ? `Record: "${rec.name}". Question: ${data.question}` : `Record: "${rec.name}". Please summarise it.` },
            filePart,
          ],
        }],
        maxRetries: 0,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = (await result.text).trim();
      if (!text) return { error: "The AI couldn't read this record. Try a clearer photo or PDF." };

      if (!data.question) {
        await supabase.from("medical_records")
          .update({ ai_summary: text, ai_summary_at: new Date().toISOString() }).eq("id", rec.id);
      }
      return { text };
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("AI request failed", status, e);
      if (status === 429) return { error: "Too many requests right now. Please try again in a minute." };
      if (status === 402) return { error: "AI credits have run out. Add credits in Settings → Plans & credits." };
      if (status === 403) return { error: "AI access is blocked for this workspace." };
      return { error: "The AI couldn't process this record. Please try again later." };
    }
  });
