import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import path from 'node:path';
import startedViaSquirrel from 'electron-squirrel-startup';
import { IPC, type BrowserCommand, type Rect } from '@shared/ipc';
import type { AppState } from '@shared/state';
import { MockBrowser } from '../browser/mock-browser';
import { JsonStore } from './store';
import {
  getMockSession,
  registerMockProtocolHandler,
  registerMockScheme,
} from './mock-protocol';
import { buildSeedState } from '../data/seed';
import { screenshotOptions } from './screenshot-mode';

// Squirrel installer hooks (Windows). Exits early during install/uninstall.
if (startedViaSquirrel) app.quit();

registerMockScheme();

let mainWindow: BrowserWindow | null = null;
let browser: MockBrowser | null = null;
const store = new JsonStore();

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

function send(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function createWindow(): void {
  const shot = screenshotOptions();

  // Electron's stock File/Edit/View menu is not part of the product's design
  // and only adds a strip of unrelated chrome to a documentation capture.
  if (shot) Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: shot?.windowSize?.width ?? 1600,
    height: shot?.windowSize?.height ?? 980,
    minWidth: 1180,
    minHeight: 700,
    // Captures need the requested figure to be the pixel size of the app
    // itself, not of the app plus whatever frame the host draws around it.
    useContentSize: Boolean(shot?.windowSize),
    backgroundColor: '#0d0f14',
    show: false,
    title: 'JobCopilot',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  browser = new MockBrowser({
    onPageState: (state) => send(IPC.browserPageState, state),
    onNavState: (state) => send(IPC.browserNavState, state),
    onBlockedNavigation: (url) => send(IPC.browserBlockedNavigation, url),
  });

  // The trusted app window itself may never leave its own bundle.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    send(IPC.appOpenExternalDenied, url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' ? MAIN_WINDOW_VITE_DEV_SERVER_URL : undefined;
    if (devUrl && url.startsWith(devUrl)) return;
    event.preventDefault();
  });

  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const name = typeof MAIN_WINDOW_VITE_NAME !== 'undefined' ? MAIN_WINDOW_VITE_NAME : 'main_window';
    void mainWindow.loadFile(path.join(__dirname, `../renderer/${name}/index.html`));
  }

  mainWindow.on('closed', () => {
    browser?.destroy();
    browser = null;
    mainWindow = null;
  });
}

/* ------------------------------- IPC wiring ------------------------------ */

function registerIpc(): void {
  ipcMain.handle(IPC.stateLoad, (): AppState => {
    const persisted = store.read();
    if (persisted) return persisted;
    const seed = buildSeedState();
    store.write(seed);
    return seed;
  });

  ipcMain.handle(IPC.stateSave, (_e, state: AppState) => {
    try {
      const savedAt = store.write(state);
      return { ok: true, savedAt };
    } catch (err) {
      console.error('[state] save failed', err);
      return { ok: false, savedAt: '' };
    }
  });

  ipcMain.handle(IPC.stateReset, (): AppState => {
    const seed = buildSeedState();
    store.write(seed);
    return seed;
  });

  ipcMain.handle(IPC.browserAttach, () => {
    if (mainWindow && browser) browser.attach(mainWindow);
  });
  ipcMain.handle(IPC.browserDetach, () => browser?.detach());
  ipcMain.handle(IPC.browserSetBounds, (_e, rect: Rect) => browser?.setBounds(rect));
  ipcMain.handle(IPC.browserSetVisible, (_e, visible: boolean) => browser?.setVisible(visible));
  ipcMain.handle(IPC.browserNavigate, (_e, url: string) =>
    browser ? browser.navigate(url) : { ok: false, error: 'No browser surface.' },
  );
  ipcMain.handle(IPC.browserBack, () => browser?.goBack());
  ipcMain.handle(IPC.browserForward, () => browser?.goForward());
  ipcMain.handle(IPC.browserReload, () => browser?.reload());
  ipcMain.handle(IPC.browserCommand, (_e, cmd: BrowserCommand) =>
    browser ? browser.command(cmd) : { ok: false, error: 'No browser surface.' },
  );
  ipcMain.handle(IPC.browserSetAgentEnabled, (_e, enabled: boolean) =>
    browser?.setAgentEnabled(enabled),
  );
  ipcMain.handle(IPC.browserGetNav, () =>
    browser?.navState() ?? { url: '', canGoBack: false, canGoForward: false, loading: false, title: '' },
  );

  ipcMain.handle(IPC.appInfo, () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: process.platform,
    userDataPath: app.getPath('userData'),
    statePath: store.path,
  }));

  ipcMain.handle(IPC.appScreenshotOptions, () => screenshotOptions());
}

/* -------------------------------- lifecycle ------------------------------ */

app.on('web-contents-created', (_e, contents) => {
  // Belt and braces: nothing in this app is allowed to open a real browser.
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});

// Nothing calls this, but make the intent explicit for future maintainers.
Object.defineProperty(shell, 'openExternal', {
  value: async (url: string) => {
    console.warn('[security] openExternal is disabled in the demo build:', url);
  },
});

void app.whenReady().then(() => {
  registerMockProtocolHandler(getMockSession());
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
