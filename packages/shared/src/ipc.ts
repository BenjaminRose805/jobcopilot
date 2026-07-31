import type { MockPageState } from '@scenario-engine/types';
import type { AppState } from './state';

/** Every IPC channel used by the app, in one place. */
export const IPC = {
  stateLoad: 'state:load',
  stateSave: 'state:save',
  stateReset: 'state:reset',

  browserAttach: 'browser:attach',
  browserDetach: 'browser:detach',
  browserSetBounds: 'browser:set-bounds',
  browserSetVisible: 'browser:set-visible',
  browserNavigate: 'browser:navigate',
  browserBack: 'browser:back',
  browserForward: 'browser:forward',
  browserReload: 'browser:reload',
  browserCommand: 'browser:command',
  browserSetAgentEnabled: 'browser:set-agent-enabled',
  browserGetNav: 'browser:get-nav',

  /** main → renderer */
  browserPageState: 'browser:page-state',
  browserNavState: 'browser:nav-state',
  browserBlockedNavigation: 'browser:blocked-navigation',

  appInfo: 'app:info',
  appScreenshotOptions: 'app:screenshot-options',
  appOpenExternalDenied: 'app:open-external-denied',
} as const;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NavState {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  title: string;
}

/** Commands the trusted renderer may issue against the sandboxed mock page. */
export type BrowserCommand =
  | { type: 'describe' }
  | { type: 'fill'; field: string; value: string }
  | { type: 'select'; field: string; value: string }
  | { type: 'upload'; field: string; fileName: string }
  | { type: 'click'; action: string }
  | { type: 'focus'; field?: string; action?: string }
  | { type: 'highlight'; field?: string; action?: string; note?: string }
  | { type: 'clearHighlight' };

export interface CommandResult {
  ok: boolean;
  /** Populated on success; the page's state after the command settled. */
  state?: MockPageState;
  error?: string;
}

export interface AppInfo {
  version: string;
  electron: string;
  chrome: string;
  platform: string;
  userDataPath: string;
  statePath: string;
}

/**
 * Documentation-capture options parsed from the command line. Always `null` in
 * a packaged build — see `main/screenshot-mode.ts` for the gate and the
 * reasoning. Nothing here grants a capability the UI does not already offer.
 */
export interface ScreenshotOptions {
  /** Screen to land on instead of the persisted `ui.lastScreen`. */
  screen?: string;
  /** Theme to force before first paint. */
  theme?: 'light' | 'dark';
  /** Nav parameters for the initial screen, e.g. `{ jobId: 'job-x' }`. */
  params?: Record<string, string>;
  /** Opt-in view toggles a screen would otherwise require a click to reach. */
  open?: string;
  /** Mock page to preload into the embedded browser. Still allowlist-checked. */
  url?: string;
  /** Start the application's scenario automatically, at instant pacing. */
  run?: boolean;
  /** Exact content size for the window, for fixed-dimension captures. */
  windowSize?: { width: number; height: number };
}

/** The complete surface exposed on `window.jobcopilot` by the preload bridge. */
export interface JobCopilotBridge {
  state: {
    load(): Promise<AppState>;
    save(state: AppState): Promise<{ ok: boolean; savedAt: string }>;
    reset(): Promise<AppState>;
  };
  browser: {
    attach(): Promise<void>;
    detach(): Promise<void>;
    setBounds(rect: Rect): Promise<void>;
    setVisible(visible: boolean): Promise<void>;
    navigate(url: string): Promise<CommandResult>;
    back(): Promise<void>;
    forward(): Promise<void>;
    reload(): Promise<void>;
    command(cmd: BrowserCommand): Promise<CommandResult>;
    setAgentEnabled(enabled: boolean): Promise<void>;
    getNav(): Promise<NavState>;
    onPageState(cb: (state: MockPageState) => void): () => void;
    onNavState(cb: (state: NavState) => void): () => void;
    onBlockedNavigation(cb: (url: string) => void): () => void;
  };
  app: {
    info(): Promise<AppInfo>;
    /** `null` in any packaged build. */
    screenshotOptions(): Promise<ScreenshotOptions | null>;
  };
}
