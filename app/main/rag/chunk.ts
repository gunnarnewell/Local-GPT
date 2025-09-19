import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

function chunkText(text: string, maxChars = 1200, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    const slice = text.slice(i, end);
    chunks.push(slice.trim());
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks.filter(c => c.length > 0);
}

async function readFileAsText(p: string): Promise<{ title: string; text: string }>{
  const ext = path.extname(p).toLowerCase();
  const base = path.basename(p);
  if (ext === '.pdf') {
    const buf = fs.readFileSync(p);
    const out = await pdfParse(buf);
    return { title: out.info?.Title || base, text: out.text || '' };
  }
  const raw = fs.readFileSync(p, 'utf-8');
  return { title: base, text: raw };
}

export async function parseAndChunk(p: string): Promise<{ title: string; chunks: string[] }>{
  const { title, text } = await readFileAsText(p);
  const chunks = chunkText(text);
  return { title, chunks };
}
