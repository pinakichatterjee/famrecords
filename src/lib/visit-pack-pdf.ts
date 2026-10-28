import fontAsset from '@/assets/health-font.asset.json';
import type { PackLine } from './visit-pack';

let loadedFont: Promise<void> | undefined;
export function loadHealthFont() {
  loadedFont ??= (async () => {
    const face = new FontFace('FamHealth', `url(${fontAsset.url})`);
    document.fonts.add(await face.load());
  })();
  return loadedFont;
}

// The browser shapes Bengali conjuncts before the PDF embeds page images.
// These high-resolution PDFs are readable, but text is not selectable/searchable.
export async function createVisitPackPdf(lines: PackLine[]): Promise<Blob> {
  await loadHealthFont();
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const width = 1240, height = 1754, margin = 90;
  let canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  let context = canvas.getContext('2d');
  if (!context) throw new Error('PDF rendering is not available in this browser.');
  const css = getComputedStyle(document.documentElement);
  const paper = css.getPropertyValue('--card').trim();
  const ink = css.getPropertyValue('--foreground').trim();
  let y = margin;
  const startPage = () => {
    canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the PDF page.');
    context.fillStyle = paper; context.fillRect(0, 0, width, height); context.fillStyle = ink;
    context.textBaseline = 'top'; y = margin;
  };
  const finishPage = async () => {
    const image = await pdf.embedPng(canvas.toDataURL('image/png'));
    const page = pdf.addPage([595.28, 841.89]);
    page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
  };
  startPage();
  for (const line of lines) {
    if (!context) throw new Error('Could not render the PDF.');
    const size = line.heading ? 32 : 26;
    const gap = line.heading ? 16 : 8;
    y += gap;
    for (const paragraph of line.text.split('\n')) {
      const segmenter = new Intl.Segmenter('bn', { granularity: 'grapheme' });
      const segments = [...segmenter.segment(paragraph)].map(s => s.segment);
      let row = '';
      const write = async (text: string) => {
        if (y + 46 > height - margin) { await finishPage(); startPage(); }
        if (!context) throw new Error('Could not render text.');
        context.font = `${line.heading ? 600 : 400} ${size}px FamHealth`;
        context.fillText(text, margin, y); y += 44;
      };
      context.font = `${line.heading ? 600 : 400} ${size}px FamHealth`;
      for (const part of segments) {
        if (context.measureText(row + part).width > width - margin * 2 && row) { await write(row); row = ''; }
        row += part;
      }
      await write(row);
    }
  }
  await finishPage();
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}