import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import type { AppState } from '@shared/state';

/**
 * Minimal JSON-file store in Electron's userData directory. Writes are atomic
 * (temp file + rename) so a crash mid-save cannot corrupt the demo state.
 */
export class JsonStore {
  private readonly file: string;

  constructor(fileName = 'jobcopilot-state.json') {
    this.file = path.join(app.getPath('userData'), fileName);
  }

  get path(): string {
    return this.file;
  }

  read(): AppState | null {
    try {
      if (!fs.existsSync(this.file)) return null;
      const raw = fs.readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw) as AppState;
      if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.jobs)) return null;
      return parsed;
    } catch (err) {
      console.error('[store] failed to read state, falling back to seed:', err);
      return null;
    }
  }

  write(state: AppState): string {
    const savedAt = new Date().toISOString();
    const payload = JSON.stringify({ ...state, savedAt }, null, 2);
    const tmp = `${this.file}.tmp`;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, this.file);
    return savedAt;
  }

  clear(): void {
    if (fs.existsSync(this.file)) fs.rmSync(this.file);
  }
}
