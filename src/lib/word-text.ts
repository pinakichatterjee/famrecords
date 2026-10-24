import { unzipSync, strFromU8 } from "fflate";

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");

/** Extract plain text from a .docx file (Word 2007+). */
export function docxToText(bytes: Uint8Array): string {
  const files = unzipSync(bytes, { filter: (f) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f.name) });
  const xml = files["word/document.xml"];
  if (!xml) return "";
  return decodeEntities(
    strFromU8(xml)
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<\/w:tc>/g, "\t")
      .replace(/<[^>]+>/g, ""),
  ).replace(/\n{3,}/g, "\n\n").trim();
}

/** Best-effort text from a legacy binary .doc file: collects readable text runs. */
export function docToText(bytes: Uint8Array): string {
  const runs: string[] = [];
  // Word 97-2003 commonly stores text as UTF-16LE; also try 8-bit runs.
  const utf16 = new TextDecoder("utf-16le").decode(bytes.subarray(0, bytes.length - (bytes.length % 2)));
  for (const m of utf16.matchAll(/[\p{L}\p{N}\p{P}\p{Zs}\r\n\t]{20,}/gu)) runs.push(m[0]);
  if (runs.join("").length < 200) {
    const latin = new TextDecoder("latin1").decode(bytes);
    for (const m of latin.matchAll(/[A-Za-z0-9 .,:;()%/+\-'"\r\n\t]{20,}/g)) runs.push(m[0]);
  }
  return runs.join("\n").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
