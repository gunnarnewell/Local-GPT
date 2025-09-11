import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { sha256File } from '../../shared/sha256';

// Simple range server for resume tests
function startRangeServer(content: Buffer, port: number) {
  const server = http.createServer((req, res) => {
    const range = req.headers.range;
    let start = 0;
    if (range) {
      const m = /bytes=(\d+)-/i.exec(range);
      if (m) start = parseInt(m[1], 10);
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${content.length - 1}/${content.length}`);
    }
    res.setHeader('Content-Length', content.length - start);
    res.end(content.subarray(start));
  });
  return new Promise<http.Server>((resolve) => server.listen(port, () => resolve(server)));
}

describe('sha256 and resume', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const port = 18888;

  beforeAll(() => fs.mkdirSync(tmpDir, { recursive: true }));
  afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('computes sha256 correctly', async () => {
    const file = path.join(tmpDir, 'a.txt');
    fs.writeFileSync(file, 'hello world');
    const h = createHash('sha256').update('hello world').digest('hex');
    expect(await sha256File(file)).toBe(h);
  });

  it('resumes a download (manual simulation)', async () => {
    const content = Buffer.alloc(1024 * 10, 7);
    const server = await startRangeServer(content, port);
    const url = `http://127.0.0.1:${port}/file`;

    const got = await import('got');
    const dst = path.join(tmpDir, 'dl.bin');
    const tmp = dst + '.part';

    // first half
    await new Promise<void>((resolve, reject) => {
      const stream = got.default.stream(url, { headers: {}, retry: { limit: 0 } });
      const ws = fs.createWriteStream(tmp, { flags: 'a' });
      stream.once('downloadProgress', (p) => { stream.destroy(); resolve(); });
      stream.on('error', resolve as any);
      stream.pipe(ws);
    });

    const firstSize = fs.statSync(tmp).size;
    expect(firstSize).toBeGreaterThan(0);

    // resume
    await new Promise<void>((resolve, reject) => {
      const headers = { Range: `bytes=${firstSize}-` };
      const stream = got.default.stream(url, { headers, retry: { limit: 0 } });
      const ws = fs.createWriteStream(tmp, { flags: 'a' });
      stream.on('error', reject);
      stream.pipe(ws);
      ws.on('finish', () => resolve());
    });

    fs.renameSync(tmp, dst);
    const final = fs.readFileSync(dst);
    expect(final.length).toBe(content.length);
    server.close();
  });
});
