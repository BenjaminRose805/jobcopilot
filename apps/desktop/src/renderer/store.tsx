import React from 'react';
import type { AppInfo, ScreenshotOptions } from '@shared/ipc';
import type { AppState } from '@shared/state';

/* ------------------------------------------------------------------ *
 * App state
 *
 * One `AppState` object is the single source of truth for every screen.
 * Mutations go through `update`, which is debounced onto the JSON store in
 * the Electron userData directory so the demo survives a relaunch.
 * ------------------------------------------------------------------ */

export type StateUpdater = (previous: AppState) => AppState;

interface StoreValue {
  state: AppState;
  update(updater: StateUpdater): void;
  reset(): Promise<void>;
  info: AppInfo | null;
  savedAt: string | null;
  saving: boolean;
  /** Documentation-capture overrides; `null` outside a dev screenshot run. */
  screenshot: ScreenshotOptions | null;
}

const StoreContext = React.createContext<StoreValue | null>(null);

const SAVE_DEBOUNCE_MS = 400;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState | null>(null);
  const [info, setInfo] = React.useState<AppInfo | null>(null);
  const [screenshot, setScreenshot] = React.useState<ScreenshotOptions | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = React.useRef<AppState | null>(null);
  /** Suppresses the save that a load or reset would otherwise trigger. */
  const skipNextSave = React.useRef(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [loaded, appInfo, shot] = await Promise.all([
        window.jobcopilot.state.load(),
        window.jobcopilot.app.info(),
        window.jobcopilot.app.screenshotOptions(),
      ]);
      if (cancelled) return;
      skipNextSave.current = true;
      // Applied to the in-memory copy only: the theme override exists to
      // photograph a screen, not to rewrite the user's saved preference.
      setState(shot?.theme ? { ...loaded, ui: { ...loaded.ui, theme: shot.theme } } : loaded);
      setInfo(appInfo);
      setScreenshot(shot);
      setSavedAt(loaded.savedAt);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flush = React.useCallback(async () => {
    const next = pending.current;
    pending.current = null;
    if (!next) return;
    setSaving(true);
    const result = await window.jobcopilot.state.save(next);
    setSaving(false);
    if (result.ok) setSavedAt(result.savedAt);
  }, []);

  React.useEffect(() => {
    if (!state) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    pending.current = state;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, flush]);

  const update = React.useCallback((updater: StateUpdater) => {
    setState((previous) => (previous ? updater(previous) : previous));
  }, []);

  const reset = React.useCallback(async () => {
    const fresh = await window.jobcopilot.state.reset();
    skipNextSave.current = true;
    pending.current = null;
    setState(fresh);
    setSavedAt(fresh.savedAt);
  }, []);

  const value = React.useMemo<StoreValue | null>(
    () => (state ? { state, update, reset, info, savedAt, saving, screenshot } : null),
    [state, update, reset, info, savedAt, saving, screenshot],
  );

  if (!value) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading local demo data…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>.');
  return ctx;
}

/** Convenience accessor for the (always-present) state object. */
export function useAppState(): AppState {
  return useStore().state;
}
