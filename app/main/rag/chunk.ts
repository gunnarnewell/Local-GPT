import path from 'path';
import { getDataDirs } from '../modelManager';
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDB() {
  if (db) return db;
  const { indexDir } = getDataDirs();
  const file = path.join(indexDir, 'index.sqlite');
  db = new Database(file);
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
