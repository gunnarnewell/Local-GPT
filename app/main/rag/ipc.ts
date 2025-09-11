import { ipcMain, dialog } from 'electron';
import { getDataDirs } from '../modelManager';
import { ingestPaths } from './ingest';
import { embedTexts } from './embed';
import { cosineSearch } from './retrieve';

export function initRagIPC() {
  ipcMain.handle('rag:ingestDialog', async () => {
    const { knowledgeDir } = getDataDirs();
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Docs', extensions: ['txt', 'md', 'pdf'] }]
    });
    if (res.canceled || res.filePaths.length === 0) return { ok: false };
    await ingestPaths(res.filePaths);
    return { ok: true, files: res.filePaths };
  });

  ipcMain.handle('rag:search', async (_e, { query, topK }: { query: string; topK: number }) => {
    const [qvec] = await embedTexts([query]);
    const results = cosineSearch(qvec, topK);
    return results;
  });
}
