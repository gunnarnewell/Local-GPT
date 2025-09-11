import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('runtime:getStatus'),
  openDataDir: () => ipcRenderer.invoke('os:openDataDir'),
  chat: (payload: any) => ipcRenderer.invoke('llm:chat', payload),
  ingestDialog: () => ipcRenderer.invoke('rag:ingestDialog'),
  ragSearch: (query: string, topK: number) => ipcRenderer.invoke('rag:search', { query, topK }),
  onModelProgress: (cb: (e: any) => void) => ipcRenderer.on('models:progress', (_e, d) => cb(d)),
  onRuntimeReady: (cb: (e: any) => void) => ipcRenderer.on('runtime:ready', (_e, d) => cb(d)),
  onRuntimeError: (cb: (e: any) => void) => ipcRenderer.on('runtime:error', (_e, d) => cb(d)),
  onOpenAbout: (cb: () => void) => ipcRenderer.on('ui:openAbout', cb),
  onOpenLicenses: (cb: () => void) => ipcRenderer.on('ui:openLicenses', cb)
});

declare global {
  interface Window {
    api: any;
  }
}
