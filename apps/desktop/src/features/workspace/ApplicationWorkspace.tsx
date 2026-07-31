import React from 'react';
import {
  Activity,
  Ban,
  Bot,
  ChevronLeft,
  Eye,
  Gauge,
  Hand,
  Pause,
  Play,
  Rocket,
} from 'lucide-react';
import {
  Badge,
  Button,
  ControlOwnerChip,
  EmptyState,
  Expandable,
  Panel,
  PanelHeader,
  Select,
  Tabs,
} from '@ui';
import { APPLICATION_STATUS_LABEL } from '@shared/application';
import { RESUME_STRATEGY_LABEL } from '@career-model';
import { scenarioForApplication } from '@app/scenarios';
import { Timeline } from '../../components/Timeline';
import { useAgent } from '../../renderer/agent';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';
import { BrowserSurface } from './BrowserSurface';
import { PendingActionPanel } from './PendingActionPanel';

const MIN_LEFT = 340;
const MAX_LEFT = 720;

/**
 * Priority-one screen: the agent works an application in the sandboxed browser
 * on the right while every decision it makes is explained on the left. Control
 * ownership is always visible and always transferable.
 */
export function ApplicationWorkspace() {
  const { params, go } = useNav();
  const { state, update } = useStore();
  const agent = useAgent();

  const applicationId = params.applicationId ?? state.ui.lastApplicationId;
  const application = state.applications.find((a) => a.id === applicationId);
  const job = application ? state.jobs.find((j) => j.id === application.jobId) : undefined;
  const definition = applicationId ? scenarioForApplication(applicationId) : undefined;

  const [leftWidth, setLeftWidth] = React.useState(430);
  const [tab, setTab] = React.useState<'activity' | 'answers' | 'page'>('activity');
  const dragging = React.useRef(false);

  React.useEffect(() => {
    if (!applicationId) return;
    update((s) =>
      s.ui.lastApplicationId === applicationId
        ? s
        : { ...s, ui: { ...s.ui, lastApplicationId: applicationId } },
    );
  }, [applicationId, update]);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setLeftWidth((w) => {
        const next = w + e.movementX;
        return Math.min(MAX_LEFT, Math.max(MIN_LEFT, next));
      });
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!application || !job) {
    return (
      <EmptyState
        title="No application selected"
        hint="Open an application from the Command Center, Job Discovery or the Applications pipeline."
        icon={<Rocket size={22} />}
      />
    );
  }

  const snapshot = agent.snapshot?.applicationId === application.id ? agent.snapshot : null;
  const runner = snapshot ? agent.runner : null;
  const running = snapshot?.status === 'running';
  const finished =
    snapshot?.status === 'completed' ||
    snapshot?.status === 'aborted' ||
    snapshot?.status === 'error';
  const timelineEvents = snapshot ? snapshot.timeline : application.timeline;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ------------------------------- header ------------------------------ */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2">
        <Button variant="ghost" size="xs" onClick={() => go('applications', { applicationId: application.id })}>
          <ChevronLeft size={13} />
          Pipeline
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{job.title}</h1>
            <Badge tone="neutral">{job.company}</Badge>
            <Badge tone="muted" title="Simulated applicant tracking system">
              {job.atsVendor}
            </Badge>
          </div>
          <div className="truncate text-2xs text-muted-foreground">
            {APPLICATION_STATUS_LABEL[application.status]} ·{' '}
            {RESUME_STRATEGY_LABEL[application.strategyId]} strategy ·{' '}
            {definition ? definition.demonstrates : 'No scenario wired to this application'}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {snapshot ? (
            <>
              <span className="text-2xs text-muted-foreground">{snapshot.stage}</span>
              <ControlOwnerChip owner={snapshot.controlOwner} />
            </>
          ) : (
            <ControlOwnerChip owner="agent" />
          )}
        </div>
      </div>

      {/* -------------------------------- body ------------------------------- */}
      <div className="flex min-h-0 flex-1">
        <div
          className="flex min-h-0 shrink-0 flex-col border-r border-border"
          style={{ width: leftWidth }}
        >
          <div className="shrink-0 border-b border-border px-2 pt-1">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'activity', label: 'Agent activity', count: timelineEvents.length },
                { id: 'answers', label: 'Answers', count: application.screeningAnswers.length },
                { id: 'page', label: 'What the agent sees' },
              ]}
            />
          </div>

          <div className="scrollable min-h-0 flex-1">
            {tab === 'activity' ? (
              <ActivityTab
                snapshot={snapshot}
                runner={runner}
                definition={definition}
                events={timelineEvents}
                onStart={() => void agent.startForApplication(application.id)}
              />
            ) : null}
            {tab === 'answers' ? <AnswersTab applicationId={application.id} /> : null}
            {tab === 'page' ? <PageStateTab /> : null}
          </div>
        </div>

        {/* split-pane handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize agent panel"
          tabIndex={0}
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setLeftWidth((w) => Math.max(MIN_LEFT, w - 24));
            if (e.key === 'ArrowRight') setLeftWidth((w) => Math.min(MAX_LEFT, w + 24));
          }}
          className="w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary focus-visible:bg-primary focus-visible:outline-none"
        />

        <BrowserSurface visible />
      </div>

      {/* ------------------------------ bottom bar ---------------------------- */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-t border-border bg-surface px-3">
        {!snapshot || finished ? (
          <Button
            variant="primary"
            onClick={() => void agent.startForApplication(application.id)}
            disabled={!definition}
            title={definition ? definition.title : 'No scenario is wired to this application'}
          >
            <Play size={13} />
            {finished ? 'Run again' : 'Start agent run'}
          </Button>
        ) : null}

        {runner && running ? (
          <Button variant="outline" onClick={() => runner.pause()}>
            <Pause size={13} />
            Pause agent
          </Button>
        ) : null}

        {runner && snapshot?.status === 'paused' ? (
          <Button variant="primary" onClick={() => runner.resume()}>
            <Play size={13} />
            Resume agent
          </Button>
        ) : null}

        {runner && !finished && snapshot?.status !== 'human-takeover' ? (
          <Button variant="warn" onClick={() => void runner.takeOver()}>
            <Hand size={13} />
            Take control
          </Button>
        ) : null}

        {runner && snapshot?.status === 'human-takeover' ? (
          <Button variant="primary" onClick={() => void runner.returnControl()}>
            <Bot size={13} />
            Return control to agent
          </Button>
        ) : null}

        {runner && !finished ? (
          <Button variant="ghost" onClick={() => runner.abort()}>
            <Ban size={13} />
            Abort application
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Gauge size={12} />
            Pacing
            <Select
              className="h-6 w-28 text-2xs"
              value={String(agent.pacingMs)}
              onChange={(e) => agent.setPacingMs(Number(e.target.value))}
              aria-label="Agent pacing"
              title="Cosmetic only — all correctness waiting is driven by page state, never by timers."
            >
              <option value="0">Instant</option>
              <option value="350">Fast</option>
              <option value="700">Normal</option>
              <option value="1400">Slow</option>
            </Select>
          </label>
          {snapshot ? (
            <span className="text-2xs text-muted-foreground">
              Step {snapshot.stepIndex + 1} of {snapshot.totalSteps} · {snapshot.currentAction}
            </span>
          ) : (
            <span className="text-2xs text-muted-foreground">Agent idle</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- activity -------------------------------- */

function ActivityTab({
  snapshot,
  runner,
  definition,
  events,
  onStart,
}: {
  snapshot: ReturnType<typeof useAgent>['snapshot'];
  runner: ReturnType<typeof useAgent>['runner'];
  definition: ReturnType<typeof scenarioForApplication>;
  events: ReturnType<typeof useStore>['state']['applications'][number]['timeline'];
  onStart(): void;
}) {
  const [filter, setFilter] = React.useState<'all' | 'decisions' | 'user'>('all');

  return (
    <div className="space-y-3 p-3">
      {!snapshot ? (
        <Panel>
          <PanelHeader icon={<Rocket size={13} />} title="Ready to run" subtitle={definition?.title} />
          <div className="space-y-2 p-3">
            <p className="text-xs text-muted-foreground">
              {definition?.description ??
                'This application has no scenario attached, so the agent has nothing scripted to demonstrate here.'}
            </p>
            {definition ? (
              <p className="text-2xs text-muted-foreground">
                Demonstrates: <strong>{definition.demonstrates}</strong>
              </p>
            ) : null}
            <Button variant="primary" onClick={onStart} disabled={!definition}>
              <Play size={13} />
              Start agent run
            </Button>
          </div>
        </Panel>
      ) : null}

      {snapshot?.pending && runner ? (
        <PendingActionPanel pending={snapshot.pending} runner={runner} />
      ) : null}

      {snapshot?.error ? (
        <Panel className="border-[hsl(var(--danger)/0.5)]">
          <PanelHeader title="Agent halted" icon={<Ban size={13} />} />
          <p className="p-3 text-xs text-[hsl(var(--danger))]">{snapshot.error}</p>
        </Panel>
      ) : null}

      {snapshot && !snapshot.pending && snapshot.status === 'running' ? (
        <div className="flex items-center gap-2 rounded border border-border bg-surface px-2.5 py-2 text-xs">
          <Activity size={13} className="animate-pulse text-primary" />
          <span className="min-w-0 flex-1 truncate">{snapshot.currentAction}</span>
        </div>
      ) : null}

      {snapshot?.warnings.length ? (
        <Panel className="border-[hsl(var(--warn)/0.4)]">
          <PanelHeader title={`Run warnings (${snapshot.warnings.length})`} />
          <ul className="space-y-1 p-3">
            {snapshot.warnings.map((w, i) => (
              <li key={i} className="text-2xs text-[hsl(var(--warn))]">
                {w}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Audit timeline"
          subtitle="Every action, with the evidence behind it"
          actions={
            <Select
              className="h-6 w-32 text-2xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              aria-label="Filter timeline"
            >
              <option value="all">All events</option>
              <option value="decisions">Decisions only</option>
              <option value="user">Your actions</option>
            </Select>
          }
        />
        <Timeline
          events={events}
          filter={filter}
          autoScroll={snapshot?.status === 'running'}
          emptyHint="Start the agent to see its reasoning here."
        />
      </Panel>
    </div>
  );
}

/* -------------------------------- answers -------------------------------- */

function AnswersTab({ applicationId }: { applicationId: string }) {
  const { state } = useStore();
  const application = state.applications.find((a) => a.id === applicationId);
  if (!application || application.screeningAnswers.length === 0) {
    return (
      <EmptyState
        title="No screening answers yet"
        hint="Answers appear here the moment you approve them, together with the facts they were built from."
      />
    );
  }

  return (
    <div className="space-y-2 p-3">
      {application.screeningAnswers.map((answer) => (
        <Panel key={answer.id} className="p-2.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium">{answer.question}</span>
            <Badge tone={answer.answeredBy === 'user' ? 'warn' : 'neutral'}>
              {answer.answeredBy === 'user' ? 'Answered by you' : 'Agent, approved by you'}
            </Badge>
          </div>
          <p className="mt-1 whitespace-pre-line text-xs" data-selectable>
            {answer.answer}
          </p>
          {answer.correctedByUser && answer.proposedAnswer ? (
            <Expandable
              className="mt-1.5"
              summary={<span className="text-2xs text-muted-foreground">Show what the agent proposed</span>}
            >
              <p className="text-2xs text-muted-foreground line-through" data-selectable>
                {answer.proposedAnswer}
              </p>
            </Expandable>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

/* ------------------------------- page state ------------------------------- */

function PageStateTab() {
  const { driver } = useAgent();
  const [pageState, setPageState] = React.useState(driver.lastState);

  React.useEffect(() => driver.watch(setPageState), [driver]);

  return (
    <div className="space-y-3 p-3">
      <Panel>
        <PanelHeader
          icon={<Eye size={13} />}
          title="Observed page state"
          subtitle="The complete set of things the agent can see"
          actions={
            pageState.requiresHuman ? (
              <Badge tone="danger" title={pageState.requiresHumanReason}>
                Requires a human
              </Badge>
            ) : null
          }
        />
        <div className="space-y-2 p-3 text-2xs">
          <dl className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">Page</dt>
            <dd className="font-mono" data-selectable>
              {pageState.page}
            </dd>
            <dt className="text-muted-foreground">Step</dt>
            <dd className="font-mono">{pageState.step || '—'}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono">{pageState.status}</dd>
            <dt className="text-muted-foreground">Flags</dt>
            <dd className="font-mono">
              {Object.entries(pageState.flags).length
                ? Object.entries(pageState.flags)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ')
                : '—'}
            </dd>
          </dl>
          {pageState.requiresHumanReason ? (
            <p className="rounded border border-[hsl(var(--danger)/0.4)] bg-danger/10 px-2 py-1 text-[hsl(var(--danger))]">
              {pageState.requiresHumanReason}
            </p>
          ) : null}
          <p className="text-muted-foreground">
            The agent cannot read anything not listed here. There is no DOM access, no script
            injection and no screenshot channel — only this typed description.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Fields (${pageState.fields.length})`} />
        <div className="divide-y divide-border">
          {pageState.fields.map((field) => (
            <div key={field.name} className="flex items-center gap-2 px-3 py-1.5 text-2xs">
              <span className="w-32 shrink-0 truncate font-mono text-muted-foreground">
                {field.name}
              </span>
              <span className="min-w-0 flex-1 truncate">{field.value || <em>empty</em>}</span>
              {field.required ? <Badge tone="muted">required</Badge> : null}
              <Badge tone={field.filled ? 'ok' : 'muted'}>{field.filled ? 'filled' : 'blank'}</Badge>
            </div>
          ))}
          {pageState.fields.length === 0 ? (
            <p className="px-3 py-3 text-2xs text-muted-foreground">No fields on this page.</p>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Actions (${pageState.actions.length})`} />
        <div className="flex flex-wrap gap-1.5 p-3">
          {pageState.actions.map((action) => (
            <Badge key={action.name} tone={action.disabled ? 'muted' : 'neutral'}>
              {action.label}
            </Badge>
          ))}
          {pageState.actions.length === 0 ? (
            <span className="text-2xs text-muted-foreground">
              No agent-addressable controls. A page can deliberately expose none — the CAPTCHA
              challenge does exactly that, which is why it cannot be solved by the agent.
            </span>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
