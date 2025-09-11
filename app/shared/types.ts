export type ModelRole = 'chat' | 'embedding';

export interface ModelEntry {
  id: string;
  role: ModelRole;
  filename: string;
  size_bytes: number;
  sha256: string;
  urls: string[];
  default?: boolean;
}

export interface ModelManifest {
  models: ModelEntry[];
}

export interface ServerStatus {
  ready: boolean;
  port: number;
  modelPath: string;
  role: ModelRole;
  tokensPerSec?: number;
  backend?: 'cpu' | 'gpu';
}

export interface RetrievalResult {
  chunkText: string;
  sourcePath: string;
  title: string;
  score: number;
  page?: number;
}
