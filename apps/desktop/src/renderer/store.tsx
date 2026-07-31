import React from 'react';
import type { AppInfo } from '@shared/ipc';
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
}

const StoreContext = React.createContext<StoreValue | null>(null);

const SAVE_DEBOUNCE_MS = 400;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState | null>(null);
  const [info, setInfo] = React.useState<AppInfo | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = React.useRef<AppState | null>(null);
  /** Suppresses the save that a load or reset would otherwise trigger. */
  const skipNextSave = React.useRef(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [loaded, appInfo] = await Promise.all([
        window.jobcopilot.state.load(),
        window.jobcopilot.app.info(),
      ]);
      if (cancelled) return;
      skipNextSave.current = true;
      setState(loaded);
      setInfo(appInfo);
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
    () => (state ? { state, update, reset, info, savedAt, saving } : null),
    [state, update, reset, info, savedAt, saving],
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
