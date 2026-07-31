import React from 'react';
import { ArrowLeft, ArrowRight, Lock, RotateCw, ShieldOff } from 'lucide-react';
import { Badge, Button } from '@ui';
import { useAgent } from '../../renderer/agent';

/**
 * The region of the window occupied by the sandboxed `WebContentsView`.
 *
 * The view is a native child of the window, not a DOM node, so this component
 * renders an empty placeholder and continuously reports its geometry to the
 * main process. Bounds are recalculated by a `ResizeObserver` rather than a
 * timer, so sidebar collapses, split-pane drags and window resizes all stay in
 * sync with no polling and no visible lag.
 */
export function BrowserSurface({ visible }: { visible: boolean }) {
  const { navState } = useAgent();
  const hostRef = React.useRef<HTMLDivElement>(null);
  const lastRect = React.useRef('');

  const sync = React.useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rect = {
      x: Math.round(r.left),
      y: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
    const key = `${rect.x}:${rect.y}:${rect.width}:${rect.height}`;
    if (key === lastRect.current) return;
    lastRect.current = key;
    void window.jobcopilot.browser.setBounds(rect);
  }, []);

  React.useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    let attached = false;
    void (async () => {
      await window.jobcopilot.browser.attach();
      attached = true;
      sync();
      await window.jobcopilot.browser.setVisible(visible);
    })();

    const observer = new ResizeObserver(() => sync());
    observer.observe(el);
    // The host's own size does not change when only its x-offset moves (for
    // example when the sidebar collapses), so the body is observed too.
    observer.observe(document.body);
    window.addEventListener('resize', sync);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      if (attached) void window.jobcopilot.browser.setVisible(false);
    };
    // `visible` is deliberately absent from the deps: it is applied by the
    // effect below, and re-attaching on every toggle would recreate the view.
  }, [sync]);

  React.useEffect(() => {
    void window.jobcopilot.browser.setVisible(visible);
    if (visible) sync();
  }, [visible, sync]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2">
        <Button
          variant="ghost"
          size="xs"
          aria-label="Back"
          disabled={!navState.canGoBack}
          onClick={() => void window.jobcopilot.browser.back()}
        >
          <ArrowLeft size={13} />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          aria-label="Forward"
          disabled={!navState.canGoForward}
          onClick={() => void window.jobcopilot.browser.forward()}
        >
          <ArrowRight size={13} />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          aria-label="Reload"
          onClick={() => void window.jobcopilot.browser.reload()}
        >
          <RotateCw size={13} className={navState.loading ? 'animate-spin' : undefined} />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-border bg-background px-2 py-1">
          <Lock size={11} className="shrink-0 text-[hsl(var(--ok))]" />
          <span className="truncate font-mono text-2xs text-muted-foreground" data-selectable>
            {navState.url || 'about:blank'}
          </span>
        </div>

        <Badge tone="ai" title="Only bundled mock:// pages can load in this view.">
          <ShieldOff size={10} />
          Sandboxed
        </Badge>
      </div>

      {/* Reserved geometry for the native WebContentsView. */}
      <div
        ref={hostRef}
        className="min-h-0 min-w-0 flex-1 bg-surface-2"
        aria-label="Simulated employer and ATS browser"
      />
    </div>
  );
}
