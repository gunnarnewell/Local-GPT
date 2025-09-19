"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithLLM = chatWithLLM;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const modelManager_1 = require("../modelManager");
async function chatWithLLM(payload) {
    const { appDataDir } = (0, modelManager_1.getDataDirs)();
    const instructionsPath = path_1.default.join(process.resourcesPath || process.cwd(), 'assets', 'prompts', 'instructions.md');
    const system = fs_1.default.readFileSync(instructionsPath, 'utf-8');
    const messages = [{ role: 'system', content: system }];
    if (payload.useKnowledge && payload.knowledgeContext) {
        messages.push({
            role: 'system',
            content: `Use ONLY the context below to answer. Cite sources.\n\n----\n${payload.knowledgeContext}\n----`
        });
    }
    messages.push(...payload.messages);
    const chatPort = 11435; // we kept defaults; in advanced, read runtimeManager state
    const res = await fetch(`http://127.0.0.1:${chatPort}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Streaming can be wired with fetch reader + renderer SSE; here we return full text for simplicity
        body: JSON.stringify({
            model: 'local-chat',
            messages,
            temperature: payload.temperature ?? 0.7,
            stream: false
        })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM error: ${text}`);
    }
    const data = await res.json();
    // OpenAI-compatible response
    return data;
}
//# sourceMappingURL=chat.js.map