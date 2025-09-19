"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndChunk = parseAndChunk;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
function chunkText(text, maxChars = 1200, overlap = 100) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + maxChars, text.length);
        const slice = text.slice(i, end);
        chunks.push(slice.trim());
        if (end === text.length)
            break;
        i = end - overlap;
        if (i < 0)
            i = 0;
    }
    return chunks.filter(c => c.length > 0);
}
async function readFileAsText(p) {
    const ext = path_1.default.extname(p).toLowerCase();
    const base = path_1.default.basename(p);
    if (ext === '.pdf') {
        const buf = fs_1.default.readFileSync(p);
        const out = await (0, pdf_parse_1.default)(buf);
        return { title: out.info?.Title || base, text: out.text || '' };
    }
    const raw = fs_1.default.readFileSync(p, 'utf-8');
    return { title: base, text: raw };
}
async function parseAndChunk(p) {
    const { title, text } = await readFileAsText(p);
    const chunks = chunkText(text);
    return { title, chunks };
}
//# sourceMappingURL=chunk.js.map