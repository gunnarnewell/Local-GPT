import { describe, it, expect } from 'vitest';

function dot(a: Float32Array, b: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(v: Float32Array) {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const n = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

describe('cosine similarity', () => {
  it('dot of normalized equals cosine', () => {
    const a = norm(new Float32Array([1, 2, 3]));
    const b = norm(new Float32Array([2, 0, 2]));
    const cos = dot(a, b);
    expect(cos).toBeGreaterThan(0);
    expect(cos).toBeLessThanOrEqual(1);
  });
});
