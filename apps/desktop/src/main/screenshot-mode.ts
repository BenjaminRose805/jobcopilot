import { app } from 'electron';
import type { ScreenshotOptions } from '@shared/ipc';

/* ------------------------------------------------------------------ *
 * Screenshot mode
 *
 * A documentation-capture aid, not a product feature. The sandbox used to
 * build this repo has no synthetic input tool, so the only way to photograph
 * a screen that normally takes several clicks to reach is to let the app be
 * told where to start.
 *
 * Two properties keep this from becoming a back door:
 *
 *   1. It is inert in a packaged build. `app.isPackaged` is the gate, so the
 *      flags cannot be reached by a user of a shipped installer at all.
 *   2. It grants no capability that the UI does not already grant. Every
 *      option below selects a screen, a theme, or a nav parameter that a
 *      human could reach by clicking. `url` is still funnelled through
 *      `MockBrowser.navigate`, which validates against the same
 *      `isAllowedMockUrl` allowlist as every other navigation, so a real
 *      URL passed here is blocked and reported exactly like any other.
 * ------------------------------------------------------------------ */

/** Parses `--flag=value`, returning undefined when the flag is absent. */
function flag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

/** Parses `--initial-params=jobId=job-x,strategyId=devsecops`. */
function parseParams(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/** Parses `--capture-size=1920x1080`. */
function parseSize(raw: string | undefined): { width: number; height: number } | undefined {
  if (!raw) return undefined;
  const m = /^(\d{3,5})x(\d{3,5})$/.exec(raw.trim());
  if (!m) return undefined;
  return { width: Number(m[1]), height: Number(m[2]) };
}

let cached: ScreenshotOptions | null | undefined;

/**
 * The parsed options, or `null` when screenshot mode is off — which is always
 * the case in a packaged build, regardless of what is on the command line.
 */
export function screenshotOptions(): ScreenshotOptions | null {
  if (cached !== undefined) return cached;

  if (app.isPackaged) {
    cached = null;
    return cached;
  }

  const screen = flag('initial-screen');
  const theme = flag('theme');
  const params = parseParams(flag('initial-params'));
  const open = flag('screenshot-open');
  const url = flag('screenshot-url');
  const run = process.argv.includes('--screenshot-run');
  const windowSize = parseSize(flag('capture-size'));

  if (!screen && !theme && !params && !open && !url && !run && !windowSize) {
    cached = null;
    return cached;
  }

  cached = {
    screen,
    theme: theme === 'light' || theme === 'dark' ? theme : undefined,
    params,
    open,
    url,
    run,
    windowSize,
  };
  console.log('[screenshot-mode] active:', JSON.stringify(cached));
  return cached;
}
