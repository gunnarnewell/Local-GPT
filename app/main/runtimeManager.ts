import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getDataDirs } from './modelManager';
import { ModelEntry, ServerStatus } from '../shared/types';

let chatProc: ChildProcessWithoutNullStreams | null = null;
let embedProc: ChildProcessWithoutNullStreams | null = null;

const state: { chat?: ServerStatus; embed?: ServerStatus } = {};

function platformFolder() {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  return 'linux';
}

async function pickPort(defaultPort: number): Promise<number> {
  // naive probe; in production you might do a robust free-port finder
  return defaultPort;
}

function getBinaryPath(): string {
  const binName = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const base = process.resourcesPath || process.cwd();
  const withFolder = path.join(base, 'runtime', 'llama', platformFolder(), binName);
  const flat = path.join(base, 'runtime', 'llama', binName);
  return fs.existsSync(withFolder) ? withFolder : flat;
}

async function waitHealthy(port: number, tries = 30, ms = 500): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/models`, { timeout: 1000 } as any);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, ms));
  }
  throw new Error(`Server on ${port} did not become healthy`);
}

async function resolveModels(): Promise<{ chat: string; embed: string }> {
  const { modelsDir } = getDataDirs();
  const manifest = JSON.parse(fs.readFileSync(path.join(process.resourcesPath || process.cwd(), 'model_manifest.json'), 'utf-8'));
  const chat: ModelEntry = manifest.models.find((m: ModelEntry) => m.role === 'chat' && m.default)!;
  const embed: ModelEntry = manifest.models.find((m: ModelEntry) => m.role === 'embedding' && m.default)!;
  return {
    chat: path.join(modelsDir, chat.filename),
    embed: path.join(modelsDir, embed.filename)
  };
}

export async function startServers() {
  const { appDataDir, logsDir } = getDataDirs();
  const { chat, embed } = await resolveModels();
  const bin = getBinaryPath();

  if (!fs.existsSync(bin)) throw new Error(`llama-server binary missing at ${bin}`);

  const chatPort = await pickPort(11435);
  const embedPort = await pickPort(11436);

  const commonFlags = ['--host', '127.0.0.1', '--api', '--ctx-size', '8192'];
  const chatFlags = ['-m', chat, ...commonFlags];
  // Defaults to CPU; advanced users can toggle GPU in settings later
  const embedFlags = ['-m', embed, ...commonFlags, '--embedding', '--slots', '0'];

  const chatLog = fs.createWriteStream(path.join(logsDir, 'llama-chat.log'), { flags: 'a' });
  const embedLog = fs.createWriteStream(path.join(logsDir, 'llama-embed.log'), { flags: 'a' });

  chatProc = spawn(bin, [...chatFlags, '--port', String(chatPort)]);
  embedProc = spawn(bin, [...embedFlags, '--port', String(embedPort)]);

  chatProc.stderr.pipe(chatLog);
  chatProc.stdout.pipe(chatLog);
  embedProc.stderr.pipe(embedLog);
  embedProc.stdout.pipe(embedLog);

  chatProc.on('exit', (code) => { /* auto-restart policy could go here if desired */ });
  embedProc.on('exit', (code) => { /* ... */ });

  await waitHealthy(chatPort);
  await waitHealthy(embedPort);

  state.chat = { ready: true, port: chatPort, role: 'chat', modelPath: chat, backend: 'cpu' };
  state.embed = { ready: true, port: embedPort, role: 'embedding', modelPath: embed, backend: 'cpu' };
}

export async function stopServers() {
  for (const proc of [chatProc, embedProc]) {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  }
  chatProc = null;
  embedProc = null;
  state.chat = undefined;
  state.embed = undefined;
}

export async function getServerStatuses() {
  return state;
}
