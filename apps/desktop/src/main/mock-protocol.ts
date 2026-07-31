import { protocol, net, session, type Session } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MOCK_SCHEME = 'mock';

/** Hosts the mock protocol will serve. Anything else is refused. */
export const MOCK_HOSTS = ['company', 'ats', 'auth', 'challenge', 'application', 'static'] as const;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

/**
 * Must run before `app.ready`. Marks `mock:` as a standard, secure scheme so
 * pages get a normal origin, relative URLs resolve, and `fetch` works.
 */
export function registerMockScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MOCK_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

function siteRoot(): string {
  // `__dirname` is `.vite/build` in both dev and packaged builds; the mock
  // pages are emitted alongside the compiled main process by a Vite plugin.
  return path.join(__dirname, 'mock-sites');
}

/** Resolves a `mock://host/path` URL to a file inside the bundled site root. */
export function resolveMockPath(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== `${MOCK_SCHEME}:`) return null;

  const host = url.hostname;
  if (!(MOCK_HOSTS as readonly string[]).includes(host)) return null;

  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index';
  if (!path.extname(rel)) rel += '.html';

  const root = siteRoot();
  const target = path.normalize(path.join(root, host, rel));
  // Directory-traversal guard: the resolved path must stay under the site root.
  if (!target.startsWith(path.join(root, host) + path.sep)) return null;
  return target;
}

/**
 * Non-persistent session used exclusively by the embedded mock browser, so its
 * request filter and permission handlers cannot affect the trusted app window.
 */
export const MOCK_PARTITION = 'mock-sandbox';

export function getMockSession(): Session {
  return session.fromPartition(MOCK_PARTITION);
}

export function registerMockProtocolHandler(target?: Session): void {
  const handler = target ? target.protocol : protocol;
  handler.handle(MOCK_SCHEME, async (request) => {
    const file = resolveMockPath(request.url);
    if (!file || !fs.existsSync(file)) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><title>404</title>` +
          `<body style="font:14px system-ui;padding:40px;color:#334">` +
          `<h1 style="font-size:18px">404 — no mock page at this address</h1>` +
          `<p><code>${escapeHtml(request.url)}</code></p>` +
          `<p>Only bundled mock pages are reachable from this window.</p>`,
        { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } },
      );
    }
    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    headers.set('content-type', MIME[path.extname(file)] ?? 'application/octet-stream');
    // The mock pages are fully self-contained; forbid any outbound requests.
    headers.set(
      'content-security-policy',
      "default-src 'self' mock:; script-src 'self' 'unsafe-inline' mock:; style-src 'self' 'unsafe-inline' mock:; img-src 'self' data: mock:; connect-src 'none'; form-action 'none'; frame-src 'none'",
    );
    return new Response(res.body, { status: 200, headers });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

export function isAllowedMockUrl(rawUrl: string): boolean {
  return resolveMockPath(rawUrl) !== null;
}
