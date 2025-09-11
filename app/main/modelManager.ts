import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import got from 'got';
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

export async function loadManifest(): Promise<ModelManifest> {
  const manifestPath = path.join(app.getAppPath(), 'model_manifest.json');
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw);
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
      // verify hash
      const sum = await sha256File(dst);
      if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
        fs.rmSync(dst);
        missing.push(m);
        totalBytes += m.size_bytes;
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
        onProgress?.({ id: m.id, phase: 'hash', message: 'Verifying SHA256', file: dst });
        const sum = await sha256File(dst);
        if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
          fs.rmSync(dst);
          throw new Error(`SHA256 mismatch for ${m.filename}`);
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

  await new Promise<void>((resolve, reject) => {
    const stream = got.stream(url, {
      headers: start > 0 ? { Range: `bytes=${start}-` } : {},
      retry: { limit: 3 },
      timeout: { request: 60_000 }
    });

    let received = start;

    stream.on('downloadProgress', (p) => {
      const total = p.total ?? m.size_bytes;
      received = start + (p.transferred ?? 0);
      onProgress?.({
        id: m.id,
        phase: 'progress',
        receivedBytes: received,
        totalBytes: total,
        percent: total ? received / total : undefined
      });
    });

    stream.on('error', reject);
    stream.pipe(writeStream);
    writeStream.on('error', reject);
    writeStream.on('finish', () => resolve());
  });

  fs.renameSync(tmp, dstPath);
}
