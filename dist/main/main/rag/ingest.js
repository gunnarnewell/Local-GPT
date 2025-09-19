"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestPaths = ingestPaths;
exports.scanKnowledgeDir = scanKnowledgeDir;
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const db_1 = require("./db");
const chunk_1 = require("./chunk");
const embed_1 = require("./embed");
async function ingestPaths(paths) {
    const db = (0, db_1.getDB)();
    const insertDoc = db.prepare('INSERT OR REPLACE INTO documents(id, path, title, mtime) VALUES(?, ?, ?, ?)');
    const insertChunk = db.prepare('INSERT OR REPLACE INTO chunks(id, doc_id, chunk_index, text) VALUES(?, ?, ?, ?)');
    const insertEmb = db.prepare('INSERT OR REPLACE INTO embeddings(id, chunk_id, vector) VALUES(?, ?, ?)');
    for (const p of paths) {
        const stat = fs_1.default.statSync(p);
        const mtime = Math.floor(stat.mtimeMs);
        const docId = (0, uuid_1.v4)();
        const { title, chunks } = await (0, chunk_1.parseAndChunk)(p);
        insertDoc.run(docId, p, title, mtime);
        const batchSize = 16;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const slice = chunks.slice(i, i + batchSize);
            const vecs = await (0, embed_1.embedTexts)(slice);
            for (let j = 0; j < slice.length; j++) {
                const chunkId = (0, uuid_1.v4)();
                insertChunk.run(chunkId, docId, i + j, slice[j]);
                const buf = Buffer.from(vecs[j].buffer);
                insertEmb.run((0, uuid_1.v4)(), chunkId, buf);
            }
        }
    }
}
function scanKnowledgeDir(dir) {
    // In a real app, store last mtime per path and do incremental. Here we return all supported files.
    const exts = ['.txt', '.md', '.pdf'];
    const ps = fs_1.default.readdirSync(dir).map(f => `${dir}/${f}`).filter(f => exts.some(e => f.toLowerCase().endsWith(e)));
    return ps;
}
//# sourceMappingURL=ingest.js.map