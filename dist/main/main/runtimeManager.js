"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServers = startServers;
exports.stopServers = stopServers;
exports.getServerStatuses = getServerStatuses;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const modelManager_1 = require("./modelManager");
let chatProc = null;
let embedProc = null;
const state = {};
function platformFolder() {
    if (process.platform === 'win32')
        return 'win';
    if (process.platform === 'darwin')
        return 'mac';
    return 'linux';
}
async function pickPort(defaultPort) {
    // naive probe; in production you might do a robust free-port finder
    return defaultPort;
}
function getBinaryPath() {
    const binName = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    return path_1.default.join(process.resourcesPath || process.cwd(), 'runtime', 'llama', platformFolder(), binName);
}
async function waitHealthy(port, tries = 30, ms = 500) {
    for (let i = 0; i < tries; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/v1/models`, { timeout: 1000 });
            if (res.ok)
                return;
        }
        catch { }
        await new Promise(r => setTimeout(r, ms));
    }
    throw new Error(`Server on ${port} did not become healthy`);
}
async function resolveModels() {
    const { modelsDir } = (0, modelManager_1.getDataDirs)();
    const manifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.resourcesPath || process.cwd(), 'model_manifest.json'), 'utf-8'));
    const chat = manifest.models.find((m) => m.role === 'chat' && m.default);
    const embed = manifest.models.find((m) => m.role === 'embedding' && m.default);
    return {
        chat: path_1.default.join(modelsDir, chat.filename),
        embed: path_1.default.join(modelsDir, embed.filename)
    };
}
async function startServers() {
    const { appDataDir, logsDir } = (0, modelManager_1.getDataDirs)();
    const { chat, embed } = await resolveModels();
    const bin = getBinaryPath();
    if (!fs_1.default.existsSync(bin))
        throw new Error(`llama-server binary missing at ${bin}`);
    const chatPort = await pickPort(11435);
    const embedPort = await pickPort(11436);
    const commonFlags = ['--host', '127.0.0.1', '--api', '--ctx-size', '8192'];
    const chatFlags = ['-m', chat, ...commonFlags];
    // Defaults to CPU; advanced users can toggle GPU in settings later
    const embedFlags = ['-m', embed, ...commonFlags, '--embedding', '--slots', '0'];
    const chatLog = fs_1.default.createWriteStream(path_1.default.join(logsDir, 'llama-chat.log'), { flags: 'a' });
    const embedLog = fs_1.default.createWriteStream(path_1.default.join(logsDir, 'llama-embed.log'), { flags: 'a' });
    chatProc = (0, child_process_1.spawn)(bin, [...chatFlags, '--port', String(chatPort)]);
    embedProc = (0, child_process_1.spawn)(bin, [...embedFlags, '--port', String(embedPort)]);
    chatProc.stderr.pipe(chatLog);
    chatProc.stdout.pipe(chatLog);
    embedProc.stderr.pipe(embedLog);
    embedProc.stdout.pipe(embedLog);
    chatProc.on('exit', (code) => { });
    embedProc.on('exit', (code) => { });
    await waitHealthy(chatPort);
    await waitHealthy(embedPort);
    state.chat = { ready: true, port: chatPort, role: 'chat', modelPath: chat, backend: 'cpu' };
    state.embed = { ready: true, port: embedPort, role: 'embedding', modelPath: embed, backend: 'cpu' };
}
async function stopServers() {
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
async function getServerStatuses() {
    return state;
}
//# sourceMappingURL=runtimeManager.js.map