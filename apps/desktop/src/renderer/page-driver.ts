import {
  EMPTY_PAGE_STATE,
  matchesCondition,
  type MockPageState,
  type PageCondition,
  type PageDriver,
} from '@scenario-engine';
import type { BrowserCommand, CommandResult } from '@shared/ipc';

const DEFAULT_WAIT_MS = 12_000;

/**
 * The renderer half of the page-driver protocol.
 *
 * Every method the scenario engine can call maps onto exactly one typed
 * `BrowserCommand` sent over IPC to the main process, which forwards it to the
 * sandboxed mock-page preload. The engine has no other vocabulary for touching
 * the page — it cannot inject script, cannot read arbitrary DOM and cannot
 * navigate anywhere the main-process allowlist rejects.
 *
 * `waitFor` is the reason the engine needs almost no timers: it resolves off
 * the page's own mutation-driven state pushes.
 */
export class RendererPageDriver implements PageDriver {
  private last: MockPageState = EMPTY_PAGE_STATE;
  private readonly watchers = new Set<(state: MockPageState) => void>();
  private readonly unsubscribe: () => void;

  constructor() {
    this.unsubscribe = window.jobcopilot.browser.onPageState((state) => {
      this.last = state;
      for (const watcher of [...this.watchers]) watcher(state);
    });
  }

  dispose(): void {
    this.unsubscribe();
    this.watchers.clear();
  }

  get lastState(): MockPageState {
    return this.last;
  }

  /** Lets the workspace observe page state without opening a second channel. */
  watch(cb: (state: MockPageState) => void): () => void {
    this.watchers.add(cb);
    return () => this.watchers.delete(cb);
  }

  private unwrap(result: CommandResult, what: string): MockPageState {
    if (!result.ok) throw new Error(`${what} failed: ${result.error ?? 'unknown error'}`);
    if (result.state) this.last = result.state;
    return this.last;
  }

  private async send(cmd: BrowserCommand, what: string): Promise<MockPageState> {
    return this.unwrap(await window.jobcopilot.browser.command(cmd), what);
  }

  async navigate(url: string): Promise<MockPageState> {
    return this.unwrap(await window.jobcopilot.browser.navigate(url), `Navigating to ${url}`);
  }

  describe(): Promise<MockPageState> {
    return this.send({ type: 'describe' }, 'Reading page state');
  }

  fill(field: string, value: string): Promise<MockPageState> {
    return this.send({ type: 'fill', field, value }, `Filling “${field}”`);
  }

  select(field: string, value: string): Promise<MockPageState> {
    return this.send({ type: 'select', field, value }, `Selecting “${value}” in “${field}”`);
  }

  upload(field: string, fileName: string): Promise<MockPageState> {
    return this.send({ type: 'upload', field, fileName }, `Attaching ${fileName}`);
  }

  click(action: string): Promise<MockPageState> {
    return this.send({ type: 'click', action }, `Activating “${action}”`);
  }

  async focus(target: { field?: string; action?: string }): Promise<void> {
    await window.jobcopilot.browser.command({ type: 'focus', ...target });
  }

  async highlight(target: { field?: string; action?: string; note?: string }): Promise<void> {
    await window.jobcopilot.browser.command({ type: 'highlight', ...target });
  }

  async clearHighlight(): Promise<void> {
    await window.jobcopilot.browser.command({ type: 'clearHighlight' });
  }

  async setAgentEnabled(enabled: boolean): Promise<void> {
    await window.jobcopilot.browser.setAgentEnabled(enabled);
  }

  /**
   * Resolves as soon as the live page satisfies `condition`. Checks the most
   * recent state first so a condition that is already true costs nothing, then
   * listens for pushes. The timeout exists only to turn a genuinely stuck page
   * into a visible error instead of a hang.
   */
  waitFor(condition: PageCondition, timeoutMs = DEFAULT_WAIT_MS): Promise<MockPageState> {
    if (matchesCondition(this.last, condition)) return Promise.resolve(this.last);

    return new Promise<MockPageState>((resolve, reject) => {
      const timer = setTimeout(() => {
        stop();
        reject(
          new Error(
            `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for: ${condition.description}`,
          ),
        );
      }, timeoutMs);

      const stop = () => {
        clearTimeout(timer);
        this.watchers.delete(onState);
      };

      const onState = (state: MockPageState) => {
        if (!matchesCondition(state, condition)) return;
        stop();
        resolve(state);
      };

      this.watchers.add(onState);
    });
  }
}
