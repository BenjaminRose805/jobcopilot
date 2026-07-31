import React from 'react';
import {
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Moon,
  RotateCcw,
  Search,
  ShieldOff,
  Sun,
} from 'lucide-react';
import { AutomationModeChip, Badge, Button, Modal } from '@ui';
import { useAgent } from '../renderer/agent';
import { useNav, NAV_ITEMS, SCREEN_TITLE, type ScreenId } from '../renderer/nav';
import { useStore } from '../renderer/store';
import { GlobalSearch } from './GlobalSearch';

const SIDEBAR_WIDTH = 218;
const SIDEBAR_COLLAPSED = 52;

/**
 * Application chrome. Everything except the screen body lives here, including
 * the automation-mode indicator that must stay visible on every screen.
 */
export function AppShell({
  sidebarCollapsed,
  onToggleSidebar,
  children,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar(): void;
  children: React.ReactNode;
}) {
  const { screen } = useNav();
  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} onToggle={onToggleSidebar} />
        <main className="flex min-w-0 flex-1 flex-col" aria-label={SCREEN_TITLE[screen]}>
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}

/* -------------------------------- Sidebar ------------------------------- */

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle(): void }) {
  const { screen, go } = useNav();
  const { state } = useStore();

  const waiting = state.applications.filter(
    (a) => a.status === 'awaiting-approval' || a.status === 'waiting-for-user',
  ).length;
  const outreachReady = state.outreach.filter((o) => o.approvalState === 'approved').length;
  const shortlisted = state.shortlistedJobIds.length;

  const counts: Partial<Record<ScreenId, number>> = {
    applications: waiting,
    outreach: outreachReady,
    'job-discovery': shortlisted,
  };

  return (
    <nav
      className="flex shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH }}
      aria-label="Primary"
    >
      <div className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = screen === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              title={collapsed ? `${item.label} — ${item.hint}` : item.hint}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary/10 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              ].join(' ')}
            >
              <Icon size={15} className={active ? 'text-primary' : undefined} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && count ? (
                <span className="rounded bg-surface-2 px-1 text-2xs text-muted-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="xs"
          onClick={onToggle}
          className="w-full justify-start"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </nav>
  );
}

/* --------------------------------- TopBar ------------------------------- */

function TopBar() {
  const { state, update } = useStore();
  const { automationMode, snapshot } = useAgent();
  const { screen, go, back, canGoBack } = useNav();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const theme = state.ui.theme;

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const actionsWaiting =
    state.applications.filter(
      (a) => a.status === 'awaiting-approval' || a.status === 'waiting-for-user',
    ).length + state.recruiterResponses.filter((r) => !r.handled).length;

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
          JC
        </div>
        <span className="text-sm font-semibold tracking-tight">JobCopilot</span>
        <Badge tone="ai" className="uppercase tracking-wide" title="Nothing in this app touches a real system.">
          <FlaskConical size={10} />
          Simulated environment
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={back}
          disabled={!canGoBack}
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-xs text-muted-foreground">{SCREEN_TITLE[screen]}</span>
      </div>

      <button
        onClick={() => setSearchOpen(true)}
        className="ml-2 flex h-7 max-w-md flex-1 items-center gap-2 rounded border border-border bg-background px-2 text-xs text-muted-foreground transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Global search"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search jobs, facts, applications, contacts…</span>
        <kbd className="rounded border border-border px-1 text-2xs">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {snapshot?.pending ? (
          <Badge tone="warn" title={snapshot.currentAction}>
            <AlertTriangle size={10} />
            {snapshot.currentAction}
          </Badge>
        ) : null}

        <button
          onClick={() => go('command-center')}
          className="relative flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${actionsWaiting} items need your attention`}
          title={`${actionsWaiting} items need your attention`}
        >
          <Bell size={15} />
          {actionsWaiting > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-warn px-1 text-[9px] font-bold text-warn-foreground">
              {actionsWaiting}
            </span>
          ) : null}
        </button>

        <AutomationModeChip mode={automationMode} />

        <button
          onClick={() =>
            update((s) => ({ ...s, ui: { ...s.ui, theme: theme === 'dark' ? 'light' : 'dark' } }))
          }
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

/* ------------------------------- StatusBar ------------------------------ */

function StatusBar() {
  const { state, info, savedAt, saving, reset } = useStore();
  const { snapshot, blockedNavigations } = useAgent();
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-border bg-surface px-3 text-2xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <ShieldOff size={10} />
        Sandboxed browser · navigation restricted to <code className="font-mono">mock://</code>
      </span>
      {blockedNavigations.length > 0 ? (
        <span
          className="flex items-center gap-1 text-[hsl(var(--danger))]"
          title={blockedNavigations.slice(0, 5).join('\n')}
        >
          <AlertTriangle size={10} />
          {blockedNavigations.length} navigation
          {blockedNavigations.length === 1 ? '' : 's'} blocked
        </span>
      ) : null}

      <span className="ml-auto">
        {state.jobs.length} jobs · {state.applications.length} applications · {state.facts.length}{' '}
        vault facts
      </span>
      {snapshot ? <span>Step {snapshot.stepIndex + 1}/{snapshot.totalSteps}</span> : null}
      <span title={info?.statePath ?? ''}>
        {saving ? 'Saving…' : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Not saved'}
      </span>
      <button
        onClick={() => setConfirmReset(true)}
        className="flex items-center gap-1 rounded px-1 hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RotateCcw size={10} />
        Restore original demo data
      </button>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restore original demo data"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmReset(false);
                void reset();
              }}
            >
              Restore demo data
            </Button>
          </>
        }
      >
        <p className="text-sm">
          This discards every change made in this session — approvals, corrections, saved
          preferences, autonomy settings and CRM status changes — and rewrites the local JSON
          store with the original fixture data.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Nothing leaves this machine either way. The store lives at{' '}
          <code className="font-mono" data-selectable>
            {info?.statePath ?? 'the Electron userData directory'}
          </code>
          .
        </p>
      </Modal>
    </footer>
  );
}
