/**
 * Date helpers for the seed dataset. Everything is expressed relative to the
 * moment the demo data is generated so the fixtures never look stale.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;

let base = Date.now();

/** Pins the clock so a whole seed pass produces internally consistent dates. */
export function pinClock(now: number = Date.now()): void {
  base = now;
}

export function ago(days: number, hours = 0): string {
  return new Date(base - days * DAY - hours * HOUR).toISOString();
}

export function ahead(days: number, hours = 0): string {
  return new Date(base + days * DAY + hours * HOUR).toISOString();
}

/** A time on a past day, useful for building readable timelines. */
export function agoAt(days: number, hour: number, minute = 0): string {
  const d = new Date(base - days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** A time on an upcoming day. */
export function aheadAt(days: number, hour: number, minute = 0): string {
  const d = new Date(base + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function now(): string {
  return new Date(base).toISOString();
}
