"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataDirs = getDataDirs;
exports.loadManifest = loadManifest;
exports.getDefaultModels = getDefaultModels;
exports.ensureModelsPresent = ensureModelsPresent;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
// using global fetch (Node 20+)
const sha256_1 = require("../shared/sha256");
function getDataDirs() {
    const appDataDir = electron_1.app.getPath('userData');
    const dataDir = path_1.default.join(appDataDir, 'data');
    const modelsDir = path_1.default.join(dataDir, 'models');
    const knowledgeDir = path_1.default.join(dataDir, 'knowledge');
    const indexDir = path_1.default.join(dataDir, 'index');
    const logsDir = path_1.default.join(appDataDir, 'logs');
    return { appDataDir, dataDir, modelsDir, knowledgeDir, indexDir, logsDir };
}
async function loadManifest() {
    const manifestPath = path_1.default.join(electron_1.app.getAppPath(), 'model_manifest.json');
    const raw = fs_1.default.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw);
}
async function getDefaultModels() {
    const manifest = await loadManifest();
    return manifest.models.filter(m => m.default);
}
async function ensureModelsPresent(needed, onProgress) {
    const { modelsDir } = getDataDirs();
    let totalBytes = 0;
    const missing = [];
    for (const m of needed) {
        const dst = path_1.default.join(modelsDir, m.filename);
        if (fs_1.default.existsSync(dst)) {
            // verify hash
            const sum = await (0, sha256_1.sha256File)(dst);
            if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
                fs_1.default.rmSync(dst);
                missing.push(m);
                totalBytes += m.size_bytes;
            }
        }
        else {
            missing.push(m);
            totalBytes += m.size_bytes;
        }
    }
    return {
        ok: missing.length === 0,
        totalBytes,
        download: async () => {
            for (const m of missing) {
                const dst = path_1.default.join(modelsDir, m.filename);
                await downloadWithResume(m, dst, onProgress);
                onProgress?.({ id: m.id, phase: 'hash', message: 'Verifying SHA256', file: dst });
                const sum = await (0, sha256_1.sha256File)(dst);
                if (sum.toLowerCase() !== m.sha256.toLowerCase()) {
                    fs_1.default.rmSync(dst);
                    throw new Error(`SHA256 mismatch for ${m.filename}`);
                }
                onProgress?.({ id: m.id, phase: 'done', file: dst });
            }
        }
    };
}
async function downloadWithResume(m, dstPath, onProgress) {
    const tmp = dstPath + '.part';
    fs_1.default.mkdirSync(path_1.default.dirname(dstPath), { recursive: true });
    let start = 0;
    if (fs_1.default.existsSync(tmp)) {
        start = fs_1.default.statSync(tmp).size;
    }
    const url = m.urls[0];
    const writeStream = fs_1.default.createWriteStream(tmp, { flags: 'a' });
    onProgress?.({ id: m.id, phase: 'start', receivedBytes: start, totalBytes: m.size_bytes });
    const res = await fetch(url, {
        headers: start > 0 ? { Range: `bytes=${start}-` } : undefined
    });
    if (!res.ok && res.status !== 206) {
        throw new Error(`Download failed with status ${res.status}`);
    }
    if (!res.body)
        throw new Error('No response body from fetch');
    const reader = res.body.getReader ? res.body.getReader() : null;
    let received = start;
    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            if (value) {
                writeStream.write(Buffer.from(value));
                received += value.length;
                const total = Number(res.headers.get('Content-Length')) + start || m.size_bytes;
                onProgress?.({ id: m.id, phase: 'progress', receivedBytes: received, totalBytes: total, percent: total ? received / total : undefined });
            }
        }
    }
    else {
        // Fallback for environments without web streams
        // @ts-ignore
        await new Promise((resolve, reject) => {
            // @ts-ignore
            res.body.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });
    }
    writeStream.end();
    fs_1.default.renameSync(tmp, dstPath);
}
//# sourceMappingURL=modelManager.js.map