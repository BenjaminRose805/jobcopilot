import React from 'react';
import {
  ScenarioRunner,
  type RunnerSnapshot,
  type RunnerStatus,
  type ScenarioDefinition,
} from '@scenario-engine';
import type { AutomationMode } from '@shared/common';
import type { ApplicationStatus, Application } from '@shared/application';
import type { NavState } from '@shared/ipc';
import type { AppState } from '@shared/state';
import type { StoredPreference } from '@shared/preferences';
import { scenarioForApplication } from '@app/scenarios';
import { RendererPageDriver } from './page-driver';
import { useStore } from './store';

/* ------------------------------------------------------------------ *
 * Status mapping
 * ------------------------------------------------------------------ */

const MODE_BY_STATUS: Record<RunnerStatus, AutomationMode> = {
  idle: 'assisted',
  running: 'agent-running',
  'waiting-for-approval': 'waiting-for-approval',
  'waiting-for-user-state': 'waiting-for-approval',
  'human-takeover': 'human-takeover',
  paused: 'paused',
  completed: 'completed',
  aborted: 'paused',
  error: 'paused',
};

function applicationStatusFor(status: RunnerStatus, outcome?: string): ApplicationStatus | null {
  switch (status) {
    case 'running':
      return 'preparing';
    case 'waiting-for-approval':
      return 'awaiting-approval';
    case 'waiting-for-user-state':
    case 'human-takeover':
      return 'waiting-for-user';
    case 'completed':
      return outcome?.toLowerCase().includes('do not apply') ? 'rejected' : 'submitted';
    case 'aborted':
      return 'withdrawn';
    case 'error':
      return 'waiting-for-user';
    default:
      return null;
  }
}

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

function patchApplication(
  state: AppState,
  applicationId: string,
  patch: (app: Application) => Application,
): AppState {
  let touched = false;
  const applications = state.applications.map((app) => {
    if (app.id !== applicationId) return app;
    touched = true;
    return patch(app);
  });
  return touched ? { ...state, applications } : state;
}

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

export interface AgentValue {
  driver: RendererPageDriver;
  runner: ScenarioRunner | null;
  snapshot: RunnerSnapshot | null;
  scenario: ScenarioDefinition | null;
  automationMode: AutomationMode;
  navState: NavState;
  blockedNavigations: string[];
  pacingMs: number;
  setPacingMs(ms: number): void;
  /** Starts (or restarts) the scenario wired to an application. */
  startForApplication(applicationId: string): Promise<void>;
  /** Tears the runner down without touching persisted application state. */
  clear(): void;
}

const AgentContext = React.createContext<AgentValue | null>(null);

const INITIAL_NAV: NavState = {
  url: '',
  canGoBack: false,
  canGoForward: false,
  loading: false,
  title: '',
};

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const { update } = useStore();

  const driverRef = React.useRef<RendererPageDriver | null>(null);
  if (!driverRef.current) driverRef.current = new RendererPageDriver();
  const driver = driverRef.current;

  const runnerRef = React.useRef<ScenarioRunner | null>(null);
  const [snapshot, setSnapshot] = React.useState<RunnerSnapshot | null>(null);
  const [scenario, setScenario] = React.useState<ScenarioDefinition | null>(null);
  const [navState, setNavState] = React.useState<NavState>(INITIAL_NAV);
  const [blockedNavigations, setBlocked] = React.useState<string[]>([]);
  const [pacingMs, setPacingMs] = React.useState(700);

  /* --------------------------- subscriptions --------------------------- */

  React.useEffect(() => {
    const offNav = window.jobcopilot.browser.onNavState(setNavState);
    const offBlocked = window.jobcopilot.browser.onBlockedNavigation((url) =>
      setBlocked((prev) => [url, ...prev].slice(0, 20)),
    );
    const offPage = driver.watch((state) => runnerRef.current?.observePageState(state));
    return () => {
      offNav();
      offBlocked();
      offPage();
    };
  }, [driver]);

  React.useEffect(() => {
    return () => {
      runnerRef.current?.dispose();
      driver.dispose();
    };
  }, [driver]);

  /* ------------------------------- hooks ------------------------------- */

  const clear = React.useCallback(() => {
    runnerRef.current?.dispose();
    runnerRef.current = null;
    setSnapshot(null);
    setScenario(null);
  }, []);

  const startForApplication = React.useCallback(
    async (applicationId: string) => {
      const definition = scenarioForApplication(applicationId);
      if (!definition) return;

      runnerRef.current?.dispose();
      setSnapshot(null);
      setScenario(definition);

      const runner = new ScenarioRunner(
        definition,
        driver,
        {
          onSnapshot: (s) => setSnapshot({ ...s }),

          onTimeline: (appId, event) =>
            update((state) =>
              patchApplication(state, appId, (app) => ({
                ...app,
                updatedAt: event.timestamp,
                timeline: [...app.timeline, event],
                audit: [
                  ...app.audit,
                  {
                    id: uid('au'),
                    at: event.timestamp,
                    actor: event.source === 'page' ? 'system' : event.source,
                    action: event.title,
                    detail: event.details.slice(0, 400),
                  },
                ],
              })),
            ),

          onAnswerCommitted: ({ applicationId: appId, question, answer, correctedByUser, confidence }) =>
            update((state) =>
              patchApplication(state, appId, (app) => ({
                ...app,
                screeningAnswers: [
                  ...app.screeningAnswers.filter((a) => a.question !== question.question),
                  {
                    id: uid('ans'),
                    question: question.question,
                    answer,
                    proposedAnswer: question.proposedAnswer || undefined,
                    confidence,
                    evidenceFactIds: question.evidenceFactIds,
                    reasoning: question.reasoning,
                    answeredBy: correctedByUser ? 'user' : 'agent',
                    correctedByUser,
                    answeredAt: new Date().toISOString(),
                  },
                ],
                corrections: correctedByUser
                  ? [
                      ...app.corrections,
                      {
                        id: uid('cor'),
                        at: new Date().toISOString(),
                        field: question.field ?? question.id,
                        before: question.proposedAnswer,
                        after: answer,
                        reason: question.evidenceGap
                          ? 'Agent refused to answer — evidence gap'
                          : undefined,
                      },
                    ]
                  : app.corrections,
                /* Every minute the user spends approving or correcting is the
                   denominator of the product's north-star metric, so it is
                   attributed here rather than estimated later. */
                userMinutesSpent: app.userMinutesSpent + (correctedByUser ? 2 : 1),
              })),
            ),

          onPreferenceSaved: ({ applicationId: appId, question, answer, scope }) =>
            update((state) => {
              const app = state.applications.find((a) => a.id === appId);
              const job = app ? state.jobs.find((j) => j.id === app.jobId) : undefined;
              const preference: StoredPreference = {
                id: uid('pref'),
                topic: question.preferenceTopic ?? 'other',
                question: question.question,
                answer,
                scope,
                company: scope === 'company' ? job?.company : undefined,
                createdAt: new Date().toISOString(),
                lastUsedAt: new Date().toISOString(),
                timesUsed: 1,
                originApplicationId: appId,
              };
              return {
                ...state,
                preferences: [
                  preference,
                  ...state.preferences.filter(
                    (p) => !(p.topic === preference.topic && p.scope === scope && p.company === preference.company),
                  ),
                ],
              };
            }),

          onStatusChange: ({ applicationId: appId, status, outcome }) => {
            const next = applicationStatusFor(status, outcome);
            if (!next) return;
            update((state) =>
              patchApplication(state, appId, (app) => ({
                ...app,
                status: next,
                outcome: outcome ?? app.outcome,
                updatedAt: new Date().toISOString(),
                submittedAt:
                  next === 'submitted' && !app.submittedAt
                    ? new Date().toISOString()
                    : app.submittedAt,
              })),
            );
          },
        },
        { pacingMs },
      );

      runnerRef.current = runner;
      setSnapshot(runner.snapshot());

      // The agent must always be re-enabled at the start of a run: a previous
      // human takeover may have left command dispatch switched off.
      await driver.setAgentEnabled(true);
      await runner.start();
    },
    [driver, update, pacingMs],
  );

  const automationMode: AutomationMode = snapshot
    ? MODE_BY_STATUS[snapshot.status]
    : 'assisted';

  const value = React.useMemo<AgentValue>(
    () => ({
      driver,
      runner: runnerRef.current,
      snapshot,
      scenario,
      automationMode,
      navState,
      blockedNavigations,
      pacingMs,
      setPacingMs,
      startForApplication,
      clear,
    }),
    [driver, snapshot, scenario, automationMode, navState, blockedNavigations, pacingMs, startForApplication, clear],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent(): AgentValue {
  const ctx = React.useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used inside <AgentProvider>.');
  return ctx;
}
