"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    getStatus: () => electron_1.ipcRenderer.invoke('runtime:getStatus'),
    openDataDir: () => electron_1.ipcRenderer.invoke('os:openDataDir'),
    chat: (payload) => electron_1.ipcRenderer.invoke('llm:chat', payload),
    ingestDialog: () => electron_1.ipcRenderer.invoke('rag:ingestDialog'),
    ragSearch: (query, topK) => electron_1.ipcRenderer.invoke('rag:search', { query, topK }),
    onModelProgress: (cb) => electron_1.ipcRenderer.on('models:progress', (_e, d) => cb(d)),
    onRuntimeReady: (cb) => electron_1.ipcRenderer.on('runtime:ready', (_e, d) => cb(d)),
    onRuntimeError: (cb) => electron_1.ipcRenderer.on('runtime:error', (_e, d) => cb(d)),
    onOpenAbout: (cb) => electron_1.ipcRenderer.on('ui:openAbout', cb),
    onOpenLicenses: (cb) => electron_1.ipcRenderer.on('ui:openLicenses', cb)
});
//# sourceMappingURL=index.js.map