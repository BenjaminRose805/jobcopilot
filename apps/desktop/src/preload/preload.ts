import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  AppInfo,
  BrowserCommand,
  CommandResult,
  JobCopilotBridge,
  NavState,
  Rect,
} from '@shared/ipc';
import type { AppState } from '@shared/state';
import type { MockPageState } from '@scenario-engine/types';

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_e: Electron.IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

/**
 * The complete, narrow surface the trusted renderer is allowed to touch. No
 * `ipcRenderer`, no Node primitives and no arbitrary channel names escape here.
 */
const bridge: JobCopilotBridge = {
  state: {
    load: () => ipcRenderer.invoke(IPC.stateLoad) as Promise<AppState>,
    save: (state: AppState) => ipcRenderer.invoke(IPC.stateSave, state),
    reset: () => ipcRenderer.invoke(IPC.stateReset) as Promise<AppState>,
  },
  browser: {
    attach: () => ipcRenderer.invoke(IPC.browserAttach),
    detach: () => ipcRenderer.invoke(IPC.browserDetach),
    setBounds: (rect: Rect) => ipcRenderer.invoke(IPC.browserSetBounds, rect),
    setVisible: (visible: boolean) => ipcRenderer.invoke(IPC.browserSetVisible, visible),
    navigate: (url: string) => ipcRenderer.invoke(IPC.browserNavigate, url) as Promise<CommandResult>,
    back: () => ipcRenderer.invoke(IPC.browserBack),
    forward: () => ipcRenderer.invoke(IPC.browserForward),
    reload: () => ipcRenderer.invoke(IPC.browserReload),
    command: (cmd: BrowserCommand) =>
      ipcRenderer.invoke(IPC.browserCommand, cmd) as Promise<CommandResult>,
    setAgentEnabled: (enabled: boolean) =>
      ipcRenderer.invoke(IPC.browserSetAgentEnabled, enabled),
    getNav: () => ipcRenderer.invoke(IPC.browserGetNav) as Promise<NavState>,
    onPageState: (cb) => subscribe<MockPageState>(IPC.browserPageState, cb),
    onNavState: (cb) => subscribe<NavState>(IPC.browserNavState, cb),
    onBlockedNavigation: (cb) => subscribe<string>(IPC.browserBlockedNavigation, cb),
  },
  app: {
    info: () => ipcRenderer.invoke(IPC.appInfo) as Promise<AppInfo>,
  },
};

contextBridge.exposeInMainWorld('jobcopilot', bridge);
