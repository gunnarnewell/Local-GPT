import fs from 'fs';
import path from 'path';
import { app } from 'electron';
// using global fetch (Node 20+)
import { sha256File } from '../shared/sha256';
import { ModelEntry, ModelManifest } from '../shared/types';

interface ProgressEvent {
  id: string;
  phase: 'start' | 'progress' | 'hash' | 'done';
  receivedBytes?: number;
  totalBytes?: number;
  percent?: number;
  file?: string;
  message?: string;
}

export function getDataDirs() {
  const appDataDir = app.getPath('userData');
  const dataDir = path.join(appDataDir, 'data');
  const modelsDir = path.join(dataDir, 'models');
  const knowledgeDir = path.join(dataDir, 'knowledge');
  const indexDir = path.join(dataDir, 'index');
  const logsDir = path.join(appDataDir, 'logs');
  return { appDataDir, dataDir, modelsDir, knowledgeDir, indexDir, logsDir };
}

function getManifestPaths() {
  const appPath = app.getAppPath();
  const { appDataDir } = getDataDirs();
  const defaultPath = path.join(appPath, 'model_manifest.json');
  const overridePath = path.join(appDataDir, 'model_manifest.override.json');
  return { defaultPath, overridePath };
}

export async function loadManifest(): Promise<ModelManifest> {
  const { defaultPath, overridePath } = getManifestPaths();
  const base: ModelManifest = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
  if (fs.existsSync(overridePath)) {
    try {
      const ov: ModelManifest = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
      // merge by id (fallback to filename)
      const map = new Map<string, ModelEntry>();
      for (const m of base.models) map.set(m.id || m.filename, m);
      for (const o of ov.models || []) {
        const key = o.id || o.filename;
        const curr = map.get(key);
        if (curr) {
          map.set(key, { ...curr, ...o });
        } else {
          map.set(key, o);
        }
      }
      return { models: Array.from(map.values()) };
    } catch {}
  }
  return base;
}

function isPlaceholderSha(s: string | undefined): boolean {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(t)) return true;
  if (t.includes('put_real_sha256')) return true;
  return false;
}

function saveManifestOverride(partial: Partial<ModelEntry> & { id?: string; filename?: string }) {
  const { overridePath } = getManifestPaths();
  let current: ModelManifest = { models: [] };
  if (fs.existsSync(overridePath)) {
    try { current = JSON.parse(fs.readFileSync(overridePath, 'utf-8')); } catch {}
  }
  const key = (partial.id || partial.filename)!;
  const idx = current.models.findIndex(m => (m.id || m.filename) === key);
  if (idx >= 0) {
    current.models[idx] = { ...current.models[idx], ...partial } as ModelEntry;
  } else {
    // Create a minimal entry in overrides (only fields we know)
    current.models.push(partial as ModelEntry);
  }
  fs.mkdirSync(path.dirname(overridePath), { recursive: true });
  fs.writeFileSync(overridePath, JSON.stringify(current, null, 2));
}

export async function getDefaultModels(): Promise<ModelEntry[]> {
  const manifest = await loadManifest();
  return manifest.models.filter(m => m.default);
}

export async function ensureModelsPresent(
  needed: ModelEntry[],
  onProgress?: (evt: ProgressEvent) => void
): Promise<{ ok: boolean; totalBytes: number; download: () => Promise<void> }> {
  const { modelsDir } = getDataDirs();
  let totalBytes = 0;
  const missing: ModelEntry[] = [];

  for (const m of needed) {
    const dst = path.join(modelsDir, m.filename);
    if (fs.existsSync(dst)) {
      // Verify if manifest has a real SHA, otherwise accept and we'll compute + persist later
      if (!isPlaceholderSha(m.sha256)) {
        const sum = await sha256File(dst);
        if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
          fs.rmSync(dst);
          missing.push(m);
          totalBytes += m.size_bytes;
        }
      } else {
        // If file is already present and manifest is placeholder, compute + persist now
        try {
          const size = fs.statSync(dst).size;
          const sum = await sha256File(dst);
          saveManifestOverride({ id: m.id, filename: m.filename, sha256: sum, size_bytes: size });
        } catch {}
      }
    } else {
      missing.push(m);
      totalBytes += m.size_bytes;
    }
  }

  return {
    ok: missing.length === 0,
    totalBytes,
    download: async () => {
      for (const m of missing) {
        const dst = path.join(modelsDir, m.filename);
        await downloadWithResume(m, dst, onProgress);
        const size = fs.statSync(dst).size;
        onProgress?.({ id: m.id, phase: 'hash', message: 'Computing SHA256', file: dst });
        const sum = await sha256File(dst);
        // If manifest provides a real SHA, enforce it; otherwise, persist what we found
        if (!isPlaceholderSha(m.sha256)) {
          if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
            fs.rmSync(dst);
            throw new Error(`SHA256 mismatch for ${m.filename}`);
          }
        } else {
          // Persist computed metadata to user override manifest
          saveManifestOverride({ id: m.id, filename: m.filename, sha256: sum, size_bytes: size });
        }
        onProgress?.({ id: m.id, phase: 'done', file: dst });
      }
    }
  };
}

async function downloadWithResume(m: ModelEntry, dstPath: string, onProgress?: (evt: ProgressEvent) => void) {
  const tmp = dstPath + '.part';
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });

  let start = 0;
  if (fs.existsSync(tmp)) {
    start = fs.statSync(tmp).size;
  }

  const url = m.urls[0];
  const writeStream = fs.createWriteStream(tmp, { flags: 'a' });

  onProgress?.({ id: m.id, phase: 'start', receivedBytes: start, totalBytes: m.size_bytes });

  // helper: fetch with timeout + retries
  async function fetchWithRetry(attempts = 4, timeoutMs = 30000): Promise<Response> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'Local-Assistant/0.1 (+https://local)'
        };
        if (start > 0) headers['Range'] = `bytes=${start}-`;
        const res = await fetch(url, { headers, signal: ctrl.signal } as any);
        clearTimeout(t);
        if (res.ok || res.status === 206) return res;
        const bodyText = await res.text().catch(() => '');
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}${bodyText ? `: ${bodyText.slice(0, 200)}` : ''}`);
      } catch (e: any) {
        lastErr = e;
      }
      // backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
    throw new Error(`Fetch failed after retries: ${lastErr?.message || lastErr}`);
  }

  // Try each URL until one succeeds
  let res: Response | null = null;
  let lastErr: any;
  for (const candidate of m.urls) {
    try {
      // Update url variable for progress context
      (url as any) = candidate;
      res = await fetchWithRetry();
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!res) {
    writeStream.close();
    throw new Error(`All model URLs failed for ${m.filename}: ${lastErr?.message || lastErr}`);
  }
  if (!res.body) {
    writeStream.close();
    throw new Error('No response body from fetch');
  }

  const reader = (res.body as any).getReader ? (res.body as any).getReader() : null;
  let received = start;
  const lenHeader = res.headers.get('Content-Length');
  const total = (lenHeader ? Number(lenHeader) + start : m.size_bytes) || undefined;
  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const buf: Buffer = Buffer.isBuffer(value) ? (value as any) : Buffer.from(value);
          writeStream.write(buf);
          received += buf.length;
          onProgress?.({ id: m.id, phase: 'progress', receivedBytes: received, totalBytes: total, percent: total ? received / total : undefined });
        }
      }
    } else {
      // @ts-ignore Node.js Readable fallback
      await new Promise<void>((resolve, reject) => {
        // @ts-ignore
        (res.body as any).on('data', (chunk: Buffer) => {
          writeStream.write(chunk);
          received += chunk.length;
          onProgress?.({ id: m.id, phase: 'progress', receivedBytes: received, totalBytes: total, percent: total ? received / total : undefined });
        });
        // @ts-ignore
        (res.body as any).on('end', () => resolve());
        // @ts-ignore
        (res.body as any).on('error', reject);
      });
    }
  } finally {
    writeStream.end();
  }
  fs.renameSync(tmp, dstPath);
}
