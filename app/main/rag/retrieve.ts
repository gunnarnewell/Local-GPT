import { getDB } from './db';

export interface TopKResult {
  chunkText: string;
  sourcePath: string;
  title: string;
  score: number;
}

export function cosineSearch(queryVec: Float32Array, topK = 5): TopKResult[] {
  const db = getDB();
  const rows = db.prepare(`
    SELECT c.text as text, d.path as path, d.title as title, e.vector as vector
    FROM embeddings e
    JOIN chunks c ON c.id = e.chunk_id
    JOIN documents d ON d.id = c.doc_id
  `).iterate() as Iterable<any>;

  const scored: TopKResult[] = [];
  for (const r of rows) {
    const v = new Float32Array(new Uint8Array(r.vector).buffer);
    // dot product (cosine due to normalization)
    let dot = 0;
    for (let i = 0; i < v.length; i++) dot += v[i] * queryVec[i];
    scored.push({ chunkText: r.text, sourcePath: r.path, title: r.title, score: dot });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
