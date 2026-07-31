import path from 'node:path';
import fs from 'node:fs';
import type { Plugin } from 'vite';

export const rootDir = __dirname;

export const aliases = {
  '@shared': path.resolve(rootDir, 'packages/shared/src'),
  '@career-model': path.resolve(rootDir, 'packages/career-model/src'),
  '@job-model': path.resolve(rootDir, 'packages/job-model/src'),
  '@scoring': path.resolve(rootDir, 'packages/scoring/src'),
  '@scenario-engine': path.resolve(rootDir, 'packages/scenario-engine/src'),
  '@ui': path.resolve(rootDir, 'packages/ui/src'),
  '@app': path.resolve(rootDir, 'apps/desktop/src'),
};

function walk(dir: string, base = ''): { rel: string; abs: string }[] {
  const out: { rel: string; abs: string }[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else out.push({ rel, abs });
  }
  return out;
}

/**
 * Emits the hand-written mock ATS/job pages next to the compiled main process so
 * the `mock:` protocol handler can resolve them from `__dirname/mock-sites`.
 */
export function copyMockSites(): Plugin {
  const srcDir = path.resolve(rootDir, 'apps/desktop/src/mock-sites');
  return {
    name: 'jobcopilot-copy-mock-sites',
    buildStart() {
      for (const f of walk(srcDir)) this.addWatchFile(f.abs);
    },
    generateBundle() {
      for (const f of walk(srcDir)) {
        this.emitFile({
          type: 'asset',
          fileName: `mock-sites/${f.rel}`,
          source: fs.readFileSync(f.abs),
        });
      }
    },
  };
}
