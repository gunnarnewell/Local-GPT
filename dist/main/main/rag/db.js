"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDB = getDB;
const path_1 = __importDefault(require("path"));
const modelManager_1 = require("../modelManager");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
let db = null;
function getDB() {
    if (db)
        return db;
    const { indexDir } = (0, modelManager_1.getDataDirs)();
    const file = path_1.default.join(indexDir, 'index.sqlite');
    db = new better_sqlite3_1.default(file);
    db.pragma('journal_mode = wal');
    db.exec(`
    CREATE TABLE IF NOT EXISTS documents(
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      title TEXT,
      mtime INTEGER
    );
    CREATE TABLE IF NOT EXISTS chunks(
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      chunk_index INTEGER,
      text TEXT,
      FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS embeddings(
      id TEXT PRIMARY KEY,
      chunk_id TEXT NOT NULL,
      vector BLOB NOT NULL,
      FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
  `);
    return db;
}
//# sourceMappingURL=db.js.map