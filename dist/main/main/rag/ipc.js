"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRagIPC = initRagIPC;
const electron_1 = require("electron");
const modelManager_1 = require("../modelManager");
const ingest_1 = require("./ingest");
const embed_1 = require("./embed");
const retrieve_1 = require("./retrieve");
function initRagIPC() {
    electron_1.ipcMain.handle('rag:ingestDialog', async () => {
        const { knowledgeDir } = (0, modelManager_1.getDataDirs)();
        const res = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Docs', extensions: ['txt', 'md', 'pdf'] }]
        });
        if (res.canceled || res.filePaths.length === 0)
            return { ok: false };
        await (0, ingest_1.ingestPaths)(res.filePaths);
        return { ok: true, files: res.filePaths };
    });
    electron_1.ipcMain.handle('rag:search', async (_e, { query, topK }) => {
        const [qvec] = await (0, embed_1.embedTexts)([query]);
        const results = (0, retrieve_1.cosineSearch)(qvec, topK);
        return results;
    });
}
//# sourceMappingURL=ipc.js.map