"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedTexts = embedTexts;
async function embedTexts(texts, port = 11436) {
    const res = await fetch(`http://127.0.0.1:${port}/v1/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: texts, model: 'local-embed' })
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Embeddings error: ${t}`);
    }
    const data = await res.json();
    const arrs = data.data.map((x) => Float32Array.from(x.embedding));
    // Normalize to enable dot==cosine
    return arrs.map(norm);
}
function norm(v) {
    let s = 0;
    for (let i = 0; i < v.length; i++)
        s += v[i] * v[i];
    const n = Math.sqrt(s) || 1;
    const out = new Float32Array(v.length);
    for (let i = 0; i < v.length; i++)
        out[i] = v[i] / n;
    return out;
}
//# sourceMappingURL=embed.js.map