import { WebContentsView, type BrowserWindow, type WebContents } from 'electron';
import path from 'node:path';
import { getMockSession, isAllowedMockUrl } from '../main/mock-protocol';
import type { BrowserCommand, CommandResult, NavState, Rect } from '@shared/ipc';
import { EMPTY_PAGE_STATE, type MockPageState } from '@scenario-engine/types';

/** Channels spoken between the main process and the mock-page preload. */
export const DRIVER = {
  command: 'mock-driver:command',
  result: 'mock-driver:result',
  state: 'mock-driver:state',
  setAgentEnabled: 'mock-driver:set-agent-enabled',
} as const;

const COMMAND_TIMEOUT_MS = 5_000;

export interface MockBrowserEvents {
  onPageState(state: MockPageState): void;
  onNavState(state: NavState): void;
  onBlockedNavigation(url: string): void;
}

/**
 * Owns the single sandboxed `WebContentsView` used as the embedded browser
 * surface. All navigation is restricted to bundled `mock:` pages.
 */
export class MockBrowser {
  private view: WebContentsView | null = null;
  private window: BrowserWindow | null = null;
  private attached = false;
  private agentEnabled = true;
  private lastState: MockPageState = EMPTY_PAGE_STATE;
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private visible = true;
  private seq = 0;
  private readonly pending = new Map<
    number,
    { resolve: (r: CommandResult) => void; timer: NodeJS.Timeout }
  >();

  constructor(private readonly events: MockBrowserEvents) {}

  get webContents(): WebContents | null {
    return this.view?.webContents ?? null;
  }

  get currentState(): MockPageState {
    return this.lastState;
  }

  attach(window: BrowserWindow): void {
    this.window = window;
    if (!this.view) this.view = this.createView();
    if (!this.attached) {
      window.contentView.addChildView(this.view);
      this.attached = true;
      this.applyBounds();
    }
  }

  detach(): void {
    if (this.view && this.window && this.attached) {
      this.window.contentView.removeChildView(this.view);
      this.attached = false;
    }
  }

  destroy(): void {
    this.detach();
    for (const [, p] of this.pending) clearTimeout(p.timer);
    this.pending.clear();
    if (this.view) {
      this.view.webContents.close();
      this.view = null;
    }
  }

  setBounds(rect: Rect): void {
    this.bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.max(0, Math.round(rect.width)),
      height: Math.max(0, Math.round(rect.height)),
    };
    this.applyBounds();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.applyBounds();
  }

  private applyBounds(): void {
    if (!this.view) return;
    this.view.setVisible(this.visible);
    this.view.setBounds(
      this.visible ? this.bounds : { x: -20000, y: 0, width: 10, height: 10 },
    );
  }

  private createView(): WebContentsView {
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'mock-page-preload.js'),
        session: getMockSession(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        spellcheck: false,
        webviewTag: false,
      },
    });
    view.setBackgroundColor('#ffffff');

    const wc = view.webContents;

    // ---- navigation allowlist -------------------------------------------
    const guard = (event: { preventDefault(): void }, url: string) => {
      if (!isAllowedMockUrl(url)) {
        event.preventDefault();
        this.events.onBlockedNavigation(url);
      }
    };
    wc.on('will-navigate', (e, url) => guard(e, url));
    wc.on('will-frame-navigate', (e) => guard(e, e.url));
    wc.on('will-redirect', (e, url) => guard(e, url));
    wc.setWindowOpenHandler(({ url }) => {
      this.events.onBlockedNavigation(url);
      return { action: 'deny' };
    });

    // ---- permissions: deny everything (isolated session only) ------------
    const ses = wc.session;
    ses.setPermissionRequestHandler((_c, _permission, callback) => callback(false));
    ses.setPermissionCheckHandler(() => false);
    ses.setDevicePermissionHandler(() => false);
    ses.webRequest.onBeforeRequest((details, callback) => {
      const allowed =
        details.url.startsWith('mock://') ||
        details.url.startsWith('devtools://') ||
        details.url.startsWith('blob:') ||
        details.url.startsWith('data:');
      if (!allowed) this.events.onBlockedNavigation(details.url);
      callback({ cancel: !allowed });
    });

    // ---- driver + nav plumbing ------------------------------------------
    wc.ipc.on(DRIVER.result, (_e, payload: { id: number; result: CommandResult }) => {
      const entry = this.pending.get(payload.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      this.pending.delete(payload.id);
      if (payload.result.state) this.lastState = payload.result.state;
      entry.resolve(payload.result);
    });

    wc.ipc.on(DRIVER.state, (_e, state: MockPageState) => {
      this.lastState = state;
      this.events.onPageState(state);
    });

    const pushNav = () => this.events.onNavState(this.navState());
    wc.on('did-navigate', pushNav);
    wc.on('did-navigate-in-page', pushNav);
    wc.on('did-start-loading', pushNav);
    wc.on('did-stop-loading', pushNav);
    wc.on('page-title-updated', pushNav);
    wc.on('did-finish-load', () => {
      wc.send(DRIVER.setAgentEnabled, this.agentEnabled);
      pushNav();
    });

    return view;
  }

  navState(): NavState {
    const wc = this.view?.webContents;
    if (!wc) return { url: '', canGoBack: false, canGoForward: false, loading: false, title: '' };
    return {
      url: wc.getURL(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
      loading: wc.isLoading(),
      title: wc.getTitle(),
    };
  }

  async navigate(url: string): Promise<CommandResult> {
    if (!this.view) return { ok: false, error: 'Browser surface not attached.' };
    if (!isAllowedMockUrl(url)) {
      this.events.onBlockedNavigation(url);
      return { ok: false, error: `Blocked: ${url} is not a bundled mock page.` };
    }
    await this.view.webContents.loadURL(url);
    const result = await this.command({ type: 'describe' }, { bypassAgentGate: true });
    return result;
  }

  goBack(): void {
    const wc = this.view?.webContents;
    if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  }

  goForward(): void {
    const wc = this.view?.webContents;
    if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  }

  reload(): void {
    this.view?.webContents.reload();
  }

  setAgentEnabled(enabled: boolean): void {
    this.agentEnabled = enabled;
    this.view?.webContents.send(DRIVER.setAgentEnabled, enabled);
  }

  /** Read-only commands stay legal during a human takeover. */
  private static readonly READ_ONLY: BrowserCommand['type'][] = ['describe', 'clearHighlight'];

  async command(
    cmd: BrowserCommand,
    opts: { bypassAgentGate?: boolean } = {},
  ): Promise<CommandResult> {
    const wc = this.view?.webContents;
    if (!wc) return { ok: false, error: 'Browser surface not attached.' };
    if (
      !this.agentEnabled &&
      !opts.bypassAgentGate &&
      !MockBrowser.READ_ONLY.includes(cmd.type)
    ) {
      return {
        ok: false,
        error: 'Agent control is disabled while the user holds the browser.',
      };
    }

    this.seq += 1;
    const id = this.seq;
    return new Promise<CommandResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, error: `Mock page did not answer "${cmd.type}" in time.` });
      }, COMMAND_TIMEOUT_MS);
      this.pending.set(id, { resolve, timer });
      wc.send(DRIVER.command, { id, cmd });
    });
  }
}
