"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const modelManager_1 = require("./modelManager");
const runtimeManager_1 = require("./runtimeManager");
const ipc_1 = require("./rag/ipc");
const chat_1 = require("./llm/chat");
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
let mainWindow = null;
function setUserDataPath() {
    // Match requested paths
    const name = 'LocalAssistant';
    if (process.platform === 'win32') {
        const base = process.env.APPDATA || path_1.default.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
        electron_1.app.setPath('userData', path_1.default.join(base, name));
    }
    else if (process.platform === 'darwin') {
        const base = path_1.default.join(process.env.HOME || '', 'Library', 'Application Support');
        electron_1.app.setPath('userData', path_1.default.join(base, name));
    }
    else {
        const base = path_1.default.join(process.env.HOME || '', '.local', 'share');
        electron_1.app.setPath('userData', path_1.default.join(base, 'local-assistant'));
    }
}
function createWindow() {
    const isDev = !!process.env.VITE_DEV_SERVER_URL;
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Local Assistant',
        webPreferences: {
            preload: path_1.default.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true
        }
    });
    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    const template = [
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
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
electron_1.app.on('ready', async () => {
    setUserDataPath();
    const dirs = (0, modelManager_1.getDataDirs)();
    fs_1.default.mkdirSync(dirs.modelsDir, { recursive: true });
    fs_1.default.mkdirSync(dirs.knowledgeDir, { recursive: true });
    fs_1.default.mkdirSync(dirs.indexDir, { recursive: true });
    fs_1.default.mkdirSync(dirs.logsDir, { recursive: true });
    createWindow();
    // First-run model ensure flow
    const defaults = await (0, modelManager_1.getDefaultModels)();
    const missing = await (0, modelManager_1.ensureModelsPresent)(defaults, (evt) => {
        mainWindow?.webContents.send('models:progress', evt);
    });
    if (!missing.ok) {
        const res = await electron_1.dialog.showMessageBox({
            type: 'question',
            message: `Download models locally (~${(missing.totalBytes / (1024 ** 3)).toFixed(1)} GB)?`,
            buttons: ['Download', 'Quit'],
            defaultId: 0,
            cancelId: 1
        });
        if (res.response === 1) {
            electron_1.app.quit();
            return;
        }
        try {
            await missing.download();
            mainWindow?.webContents.send('models:downloadComplete');
        }
        catch (e) {
            electron_1.dialog.showErrorBox('Model Download Failed', String(e?.message || e));
            electron_1.app.quit();
            return;
        }
    }
    // Start servers
    try {
        await (0, runtimeManager_1.startServers)();
        mainWindow?.webContents.send('runtime:ready', await (0, runtimeManager_1.getServerStatuses)());
    }
    catch (e) {
        electron_1.dialog.showErrorBox('Runtime Error', 'Failed to start llama servers. See logs in data/logs.');
        mainWindow?.webContents.send('runtime:error', String(e?.message || e));
    }
});
electron_1.app.on('before-quit', async (e) => {
    e.preventDefault();
    try {
        await (0, runtimeManager_1.stopServers)();
    }
    finally {
        electron_1.app.exit(0);
    }
});
// IPC: Settings / Status
electron_1.ipcMain.handle('runtime:getStatus', async () => (0, runtimeManager_1.getServerStatuses)());
// IPC: Open data folder
electron_1.ipcMain.handle('os:openDataDir', async () => {
    const { appDataDir } = (0, modelManager_1.getDataDirs)();
    await electron_1.shell.openPath(appDataDir);
});
// IPC: LLM chat
electron_1.ipcMain.handle('llm:chat', async (_e, payload) => {
    return (0, chat_1.chatWithLLM)(payload);
});
// Init RAG IPC
(0, ipc_1.initRagIPC)();
//# sourceMappingURL=index.js.map