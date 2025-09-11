import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import { parseAndChunk } from './chunk';
import { embedTexts } from './embed';

export async function ingestPaths(paths: string[]) {
  const db = getDB();
  const insertDoc = db.prepare('INSERT OR REPLACE INTO documents(id, path, title, mtime) VALUES(?, ?, ?, ?)');
  const insertChunk = db.prepare('INSERT OR REPLACE INTO chunks(id, doc_id, chunk_index, text) VALUES(?, ?, ?, ?)');
  const insertEmb = db.prepare('INSERT OR REPLACE INTO embeddings(id, chunk_id, vector) VALUES(?, ?, ?)');

  for (const p of paths) {
    const stat = fs.statSync(p);
    const mtime = Math.floor(stat.mtimeMs);
    const docId = uuidv4();
    const { title, chunks } = await parseAndChunk(p);
    insertDoc.run(docId, p, title, mtime);

    const batchSize = 16;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize);
      const vecs = await embedTexts(slice);
      for (let j = 0; j < slice.length; j++) {
        const chunkId = uuidv4();
        insertChunk.run(chunkId, docId, i + j, slice[j]);
        const buf = Buffer.from(vecs[j].buffer);
        insertEmb.run(uuidv4(), chunkId, buf);
      }
    }
  }
}

export function scanKnowledgeDir(dir: string): string[] {
  // In a real app, store last mtime per path and do incremental. Here we return all supported files.
  const exts = ['.txt', '.md', '.pdf'];
  const ps = fs.readdirSync(dir).map(f => `${dir}/${f}`).filter(f => exts.some(e => f.toLowerCase().endsWith(e)));
  return ps;
}
