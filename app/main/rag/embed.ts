
export async function embedTexts(texts: string[], port = 11436): Promise<Float32Array[]> {
  const res = await fetch(`http://127.0.0.1:${port}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts, model: 'local-embed' })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embeddings error: ${t}`);
  }
  const data = await res.json() as any;
  const arrs = data.data.map((x: any) => Float32Array.from(x.embedding));
  // Normalize to enable dot==cosine
  return arrs.map(norm);
}

function norm(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const n = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}
