import fs from 'fs';
import path from 'path';
import { getDataDirs } from '../modelManager';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatPayload {
  messages: ChatMessage[];
  temperature?: number;
  useKnowledge?: boolean;
  knowledgeContext?: string;
}

export async function chatWithLLM(payload: ChatPayload) {
  const { appDataDir } = getDataDirs();

  const instructionsPath = path.join(process.resourcesPath || process.cwd(), 'assets', 'prompts', 'instructions.md');
  const system = fs.readFileSync(instructionsPath, 'utf-8');

  const messages: ChatMessage[] = [{ role: 'system', content: system }];

  if (payload.useKnowledge && payload.knowledgeContext) {
    messages.push({
      role: 'system',
      content:
        `Use ONLY the context below to answer. Cite sources.\n\n----\n${payload.knowledgeContext}\n----`
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
