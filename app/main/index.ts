import { app, BrowserWindow, dialog, ipcMain, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { ensureModelsPresent, getDataDirs, getDefaultModels } from './modelManager';
import { startServers, stopServers, getServerStatuses } from './runtimeManager';
import { initRagIPC } from './rag/ipc';
import { chatWithLLM } from './llm/chat';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow | null = null;

function setUserDataPath() {
  // Match requested paths
  const name = 'LocalAssistant';
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
    app.setPath('userData', path.join(base, name));
  } else if (process.platform === 'darwin') {
    const base = path.join(process.env.HOME || '', 'Library', 'Application Support');
    app.setPath('userData', path.join(base, name));
  } else {
    const base = path.join(process.env.HOME || '', '.local', 'share');
    app.setPath('userData', path.join(base, 'local-assistant'));
  }
}

function createWindow() {
  const isDev = !!process.env.VITE_DEV_SERVER_URL;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Local Assistant',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Local Assistant',
      submenu: [
        {
          label: 'About',
          click: () => mainWindow?.webContents.send('ui:openAbout')
        },
        {
          label: 'Licenses',
          click: () => mainWindow?.webContents.send('ui:openLicenses')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'togglefullscreen' }]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', async () => {
  setUserDataPath();
  const dirs = getDataDirs();
  fs.mkdirSync(dirs.modelsDir, { recursive: true });
  fs.mkdirSync(dirs.knowledgeDir, { recursive: true });
  fs.mkdirSync(dirs.indexDir, { recursive: true });
  fs.mkdirSync(dirs.logsDir, { recursive: true });

  createWindow();

  // First-run model ensure flow
  const defaults = await getDefaultModels();
  const missing = await ensureModelsPresent(defaults, (evt) => {
    mainWindow?.webContents.send('models:progress', evt);
  });

  if (!missing.ok) {
    const res = await dialog.showMessageBox({
      type: 'question',
      message: `Download models locally (~${(missing.totalBytes / (1024 ** 3)).toFixed(1)} GB)?`,
      buttons: ['Download', 'Quit'],
      defaultId: 0,
      cancelId: 1
    });
    if (res.response === 1) {
      app.quit();
      return;
    }
    try {
      await missing.download();
      mainWindow?.webContents.send('models:downloadComplete');
    } catch (e: any) {
      dialog.showErrorBox('Model Download Failed', String(e?.message || e));
      app.quit();
      return;
    }
  }

  // Start servers
  try {
    await startServers();
    mainWindow?.webContents.send('runtime:ready', await getServerStatuses());
  } catch (e: any) {
    dialog.showErrorBox('Runtime Error', 'Failed to start llama servers. See logs in data/logs.');
    mainWindow?.webContents.send('runtime:error', String(e?.message || e));
  }
});

app.on('before-quit', async (e) => {
  e.preventDefault();
  try {
    await stopServers();
  } finally {
    app.exit(0);
  }
});

// IPC: Settings / Status
ipcMain.handle('runtime:getStatus', async () => getServerStatuses());

// IPC: Open data folder
ipcMain.handle('os:openDataDir', async () => {
  const { appDataDir } = getDataDirs();
  await shell.openPath(appDataDir);
});

// IPC: LLM chat
ipcMain.handle('llm:chat', async (_e, payload) => {
  return chatWithLLM(payload);
});

// Init RAG IPC
initRagIPC();
