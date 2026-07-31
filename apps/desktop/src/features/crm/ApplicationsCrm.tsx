import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Mail,
  MessageSquare,
  Rocket,
  Users,
} from 'lucide-react';
import {
  ApplicationStatusChip,
  Badge,
  Button,
  ConfidenceChip,
  DataTable,
  EmptyState,
  Expandable,
  Input,
  Panel,
  PanelHeader,
  Select,
  Tabs,
  Td,
  Th,
} from '@ui';
import {
  APPLICATION_PIPELINE,
  APPLICATION_STATUS_LABEL,
  type Application,
  type ApplicationStatus,
} from '@shared/application';
import { RESUME_STRATEGY_LABEL } from '@career-model';
import { formatAge, formatDate, formatDateTime, formatMoney } from '@shared/common';
import { Screen, KeyValue } from '../../components/Screen';
import { Timeline } from '../../components/Timeline';
import { EvidenceLinks } from '../../components/Evidence';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

/** Columns shown on the board. The long tail stays in the table view. */
const BOARD_COLUMNS: ApplicationStatus[] = [
  'preparing',
  'awaiting-approval',
  'waiting-for-user',
  'submitted',
  'acknowledged',
  'recruiter-response',
  'screening',
  'interviewing',
  'offer',
];

export function ApplicationsCrm() {
  const { state, update, screenshot } = useStore();
  const { params, go } = useNav();

  const [view, setView] = React.useState<'board' | 'table'>(
    screenshot?.open === 'crm-table' ? 'table' : 'board',
  );
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | undefined>(params.applicationId);

  React.useEffect(() => {
    if (params.applicationId) setSelectedId(params.applicationId);
  }, [params.applicationId]);

  const jobById = React.useMemo(
    () => new Map(state.jobs.map((j) => [j.id, j])),
    [state.jobs],
  );

  const applications = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.applications;
    return state.applications.filter((app) => {
      const job = jobById.get(app.jobId);
      return (
        (job?.title.toLowerCase().includes(q) ?? false) ||
        (job?.company.toLowerCase().includes(q) ?? false) ||
        APPLICATION_STATUS_LABEL[app.status].toLowerCase().includes(q)
      );
    });
  }, [state.applications, jobById, query]);

  const selected = state.applications.find((a) => a.id === selectedId);

  const setStatus = React.useCallback(
    (applicationId: string, status: ApplicationStatus) => {
      update((s) => ({
        ...s,
        applications: s.applications.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                status,
                updatedAt: new Date().toISOString(),
                audit: [
                  ...app.audit,
                  {
                    id: `audit-${applicationId}-${app.audit.length + 1}`,
                    at: new Date().toISOString(),
                    actor: 'user' as const,
                    action: 'Status changed',
                    detail: `Moved to ${APPLICATION_STATUS_LABEL[status]} manually.`,
                  },
                ],
              },
        ),
      }));
    },
    [update],
  );

  const needsAttention = state.applications.filter(
    (a) => a.status === 'awaiting-approval' || a.status === 'waiting-for-user',
  ).length;

  return (
    <Screen
      title="Applications"
      description="Every application keeps its full audit history — the agent's reasoning, your corrections, and what was actually submitted. Nothing is overwritten when a status changes."
      padded={false}
      actions={
        <div className="flex items-center gap-2">
          <Input
            className="h-7 w-56 text-2xs"
            placeholder="Search applications…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search applications"
          />
          <Tabs
            value={view}
            onChange={setView}
            tabs={[
              { id: 'board', label: 'Pipeline' },
              { id: 'table', label: 'Table', count: state.applications.length },
            ]}
          />
        </div>
      }
      bodyClassName="flex flex-col"
    >
      {needsAttention > 0 ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-warn/10 px-3 py-1.5 text-2xs text-[hsl(var(--warn))]">
          <AlertTriangle size={12} />
          {needsAttention} application{needsAttention === 1 ? '' : 's'} cannot progress without you.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="scrollable min-w-0 flex-1">
          {view === 'board' ? (
            <PipelineBoard
              applications={applications}
              selectedId={selected?.id}
              onSelect={setSelectedId}
            />
          ) : (
            <PipelineTable
              applications={applications}
              selectedId={selected?.id}
              onSelect={setSelectedId}
            />
          )}
        </div>

        <div className="scrollable w-[520px] shrink-0 border-l border-border">
          {selected ? (
            <ApplicationDetail
              application={selected}
              onStatusChange={(status) => setStatus(selected.id, status)}
              onOpenWorkspace={() => go('workspace', { applicationId: selected.id })}
              onOpenJob={() => go('job-discovery', { jobId: selected.jobId })}
              onOpenOutreach={() => go('outreach', { jobId: selected.jobId })}
            />
          ) : (
            <EmptyState
              title="Select an application"
              hint="Its timeline, answers, corrections and audit trail appear here."
              icon={<ClipboardList size={22} />}
            />
          )}
        </div>
      </div>
    </Screen>
  );
}

/* --------------------------------- board --------------------------------- */

function PipelineBoard({
  applications,
  selectedId,
  onSelect,
}: {
  applications: Application[];
  selectedId?: string;
  onSelect(id: string): void;
}) {
  const { state } = useStore();
  const other = applications.filter((a) => !BOARD_COLUMNS.includes(a.status));

  return (
    <div className="flex h-full min-h-0 gap-2 overflow-x-auto p-3">
      {BOARD_COLUMNS.map((status) => {
        const column = applications.filter((a) => a.status === status);
        return (
          <div key={status} className="flex w-[220px] shrink-0 flex-col">
            <div className="flex items-center justify-between rounded-t border border-border bg-surface px-2 py-1.5">
              <span className="truncate text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                {APPLICATION_STATUS_LABEL[status]}
              </span>
              <span className="text-2xs text-muted-foreground">{column.length}</span>
            </div>
            <div className="flex-1 space-y-1.5 rounded-b border border-t-0 border-border bg-surface-2/40 p-1.5">
              {column.map((app) => {
                const job = state.jobs.find((j) => j.id === app.jobId);
                const waiting =
                  app.status === 'awaiting-approval' || app.status === 'waiting-for-user';
                return (
                  <button
                    key={app.id}
                    onClick={() => onSelect(app.id)}
                    className={[
                      'block w-full rounded border p-2 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selectedId === app.id
                        ? 'border-primary bg-primary/10'
                        : waiting
                          ? 'border-[hsl(var(--warn)/0.5)] bg-surface hover:bg-surface-2'
                          : 'border-border bg-surface hover:bg-surface-2',
                    ].join(' ')}
                  >
                    <div className="truncate text-xs font-medium">{job?.title ?? app.jobId}</div>
                    <div className="truncate text-2xs text-muted-foreground">{job?.company}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-2xs text-muted-foreground">
                      <Badge tone="muted">{RESUME_STRATEGY_LABEL[app.strategyId]}</Badge>
                      <span>{formatAge(app.updatedAt)}</span>
                    </div>
                    {app.defects.length ? (
                      <div className="mt-1 flex items-center gap-1 text-2xs text-[hsl(var(--danger))]">
                        <AlertTriangle size={10} />
                        {app.defects.length} defect{app.defects.length === 1 ? '' : 's'}
                      </div>
                    ) : null}
                  </button>
                );
              })}
              {column.length === 0 ? (
                <p className="px-1 py-2 text-2xs text-muted-foreground">Empty</p>
              ) : null}
            </div>
          </div>
        );
      })}

      {other.length ? (
        <div className="flex w-[220px] shrink-0 flex-col">
          <div className="flex items-center justify-between rounded-t border border-border bg-surface px-2 py-1.5">
            <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Closed / other
            </span>
            <span className="text-2xs text-muted-foreground">{other.length}</span>
          </div>
          <div className="flex-1 space-y-1.5 rounded-b border border-t-0 border-border bg-surface-2/40 p-1.5">
            {other.map((app) => {
              const job = state.jobs.find((j) => j.id === app.jobId);
              return (
                <button
                  key={app.id}
                  onClick={() => onSelect(app.id)}
                  className={[
                    'block w-full rounded border p-2 text-left',
                    selectedId === app.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:bg-surface-2',
                  ].join(' ')}
                >
                  <div className="truncate text-xs font-medium">{job?.title ?? app.jobId}</div>
                  <div className="truncate text-2xs text-muted-foreground">{job?.company}</div>
                  <div className="mt-1">
                    <ApplicationStatusChip status={app.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- table --------------------------------- */

function PipelineTable({
  applications,
  selectedId,
  onSelect,
}: {
  applications: Application[];
  selectedId?: string;
  onSelect(id: string): void;
}) {
  const { state } = useStore();
  if (applications.length === 0) {
    return <EmptyState title="No applications match" hint="Clear the search to see all." />;
  }
  return (
    <DataTable>
      <thead>
        <tr>
          <Th>Role</Th>
          <Th>Company</Th>
          <Th>Status</Th>
          <Th>Strategy</Th>
          <Th title="Minutes of your own attention — the denominator of the north-star metric">
            Your time
          </Th>
          <Th>Answers</Th>
          <Th>Corrections</Th>
          <Th>Updated</Th>
        </tr>
      </thead>
      <tbody>
        {applications.map((app) => {
          const job = state.jobs.find((j) => j.id === app.jobId);
          return (
            <tr
              key={app.id}
              onClick={() => onSelect(app.id)}
              className={[
                'row-hover cursor-pointer border-b border-border',
                selectedId === app.id ? 'bg-primary/10' : '',
              ].join(' ')}
            >
              <Td>
                <div className="max-w-[260px] truncate font-medium">{job?.title ?? app.jobId}</div>
              </Td>
              <Td className="max-w-[160px] truncate">{job?.company ?? '—'}</Td>
              <Td>
                <ApplicationStatusChip status={app.status} />
              </Td>
              <Td className="text-2xs">{RESUME_STRATEGY_LABEL[app.strategyId]}</Td>
              <Td className="tabular-nums">{app.userMinutesSpent} min</Td>
              <Td className="tabular-nums">{app.screeningAnswers.length}</Td>
              <Td className="tabular-nums">{app.corrections.length}</Td>
              <Td className="text-2xs text-muted-foreground">{formatAge(app.updatedAt)}</Td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

/* --------------------------------- detail -------------------------------- */

function ApplicationDetail({
  application,
  onStatusChange,
  onOpenWorkspace,
  onOpenJob,
  onOpenOutreach,
}: {
  application: Application;
  onStatusChange(status: ApplicationStatus): void;
  onOpenWorkspace(): void;
  onOpenJob(): void;
  onOpenOutreach(): void;
}) {
  const { state } = useStore();
  const [tab, setTab] = React.useState<'timeline' | 'answers' | 'audit' | 'posting'>('timeline');

  const job = state.jobs.find((j) => j.id === application.jobId);
  const contacts = state.outreach.filter((c) =>
    application.outreachContactIds.includes(c.id),
  );
  const responses = state.recruiterResponses.filter((r) => r.applicationId === application.id);
  const interviews = state.interviews.filter((i) => i.applicationId === application.id);

  return (
    <div className="space-y-3 p-3">
      <Panel>
        <PanelHeader
          title={job?.title ?? application.jobId}
          subtitle={job ? `${job.company} · ${job.location} · ${formatMoney(job.salary)}` : undefined}
          actions={<ApplicationStatusChip status={application.status} />}
        />
        <div className="space-y-2.5 p-3">
          <KeyValue
            rows={[
              { label: 'Strategy', value: RESUME_STRATEGY_LABEL[application.strategyId] },
              { label: 'Created', value: formatDate(application.createdAt) },
              {
                label: 'Submitted',
                value: application.submittedAt ? formatDateTime(application.submittedAt) : 'Not submitted',
              },
              { label: 'Your time', value: `${application.userMinutesSpent} minutes` },
              {
                label: 'Next follow-up',
                value: application.nextFollowUp ? formatDate(application.nextFollowUp) : '—',
              },
              { label: 'Outcome', value: application.outcome ?? '—' },
            ]}
          />

          {application.defects.length ? (
            <div className="rounded border border-[hsl(var(--danger)/0.45)] bg-danger/10 p-2">
              <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-[hsl(var(--danger))]">
                <AlertTriangle size={11} />
                Defects found after submission
              </div>
              <ul className="mt-1 space-y-0.5">
                {application.defects.map((d, i) => (
                  <li key={i} className="text-2xs" data-selectable>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
            <Button variant="primary" onClick={onOpenWorkspace}>
              <Rocket size={13} />
              Open workspace
            </Button>
            <Button variant="ghost" onClick={onOpenJob}>
              View job intelligence
            </Button>
            {contacts.length ? (
              <Button variant="ghost" onClick={onOpenOutreach}>
                <Users size={13} />
                {contacts.length} contact{contacts.length === 1 ? '' : 's'}
              </Button>
            ) : null}
            <Select
              className="ml-auto h-7 w-40 text-2xs"
              value={application.status}
              onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
              aria-label="Change status"
            >
              {APPLICATION_PIPELINE.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Panel>

      {interviews.length ? (
        <Panel>
          <PanelHeader icon={<CalendarClock size={13} />} title="Scheduled interviews" />
          <div className="divide-y divide-border">
            {interviews.map((iv) => (
              <div key={iv.id} className="space-y-1 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{iv.stage}</span>
                  <span className="text-2xs text-muted-foreground">{formatDateTime(iv.at)}</span>
                </div>
                <div className="text-2xs text-muted-foreground">with {iv.interviewer}</div>
                {iv.prepNotes.length ? (
                  <Expandable summary={<span className="text-2xs">Prep notes</span>}>
                    <ul className="space-y-0.5">
                      {iv.prepNotes.map((n, i) => (
                        <li key={i} className="text-2xs text-muted-foreground" data-selectable>
                          · {n}
                        </li>
                      ))}
                    </ul>
                  </Expandable>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {responses.length ? (
        <Panel>
          <PanelHeader icon={<Mail size={13} />} title="Recruiter responses" />
          <div className="divide-y divide-border">
            {responses.map((r) => (
              <div key={r.id} className="space-y-1 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{r.subject}</span>
                  <Badge
                    tone={
                      r.sentiment === 'positive' ? 'ok' : r.sentiment === 'negative' ? 'danger' : 'muted'
                    }
                  >
                    {r.sentiment}
                  </Badge>
                </div>
                <div className="text-2xs text-muted-foreground">
                  {r.from} · {formatDateTime(r.at)} · {r.handled ? 'handled' : 'needs a reply'}
                </div>
                <p className="whitespace-pre-line text-2xs" data-selectable>
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="border-b border-border px-2 pt-1">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'timeline', label: 'Timeline', count: application.timeline.length },
              { id: 'answers', label: 'Answers', count: application.screeningAnswers.length },
              { id: 'audit', label: 'Audit', count: application.audit.length },
              { id: 'posting', label: 'Posting snapshot' },
            ]}
          />
        </div>

        {tab === 'timeline' ? (
          <Timeline
            events={application.timeline}
            emptyHint="This application has no recorded agent activity yet."
          />
        ) : null}

        {tab === 'answers' ? (
          <div className="space-y-2 p-3">
            {application.screeningAnswers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No screening answers recorded.</p>
            ) : (
              application.screeningAnswers.map((answer) => (
                <div key={answer.id} className="rounded border border-border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium">{answer.question}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <ConfidenceChip level={answer.confidence} compact />
                      <Badge tone={answer.answeredBy === 'user' ? 'warn' : 'neutral'}>
                        {answer.answeredBy === 'user' ? 'You' : 'Agent, approved by you'}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs" data-selectable>
                    {answer.answer}
                  </p>
                  <p className="mt-1 text-2xs text-muted-foreground" data-selectable>
                    {answer.reasoning}
                  </p>
                  <div className="mt-1.5">
                    <EvidenceLinks factIds={answer.evidenceFactIds} compact />
                  </div>
                  {answer.correctedByUser && answer.proposedAnswer ? (
                    <Expandable
                      className="mt-1.5"
                      summary={
                        <span className="text-2xs text-muted-foreground">
                          You corrected this — show the original proposal
                        </span>
                      }
                    >
                      <p className="text-2xs text-muted-foreground line-through" data-selectable>
                        {answer.proposedAnswer}
                      </p>
                    </Expandable>
                  ) : null}
                </div>
              ))
            )}

            {application.corrections.length ? (
              <div className="rounded border border-[hsl(var(--warn)/0.4)] bg-warn/10 p-2.5">
                <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-[hsl(var(--warn))]">
                  <MessageSquare size={11} />
                  Your corrections ({application.corrections.length})
                </div>
                <ul className="mt-1 space-y-1.5">
                  {application.corrections.map((c) => (
                    <li key={c.id} className="text-2xs">
                      <div className="font-medium">{c.field}</div>
                      <div className="text-muted-foreground line-through" data-selectable>
                        {c.before}
                      </div>
                      <div data-selectable>{c.after}</div>
                      {c.reason ? (
                        <div className="text-muted-foreground">Reason: {c.reason}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'audit' ? (
          <div className="divide-y divide-border">
            {application.audit.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 px-3 py-1.5 text-2xs">
                <span className="w-24 shrink-0 font-mono text-muted-foreground">
                  {formatDateTime(entry.at)}
                </span>
                <Badge tone={entry.actor === 'user' ? 'warn' : entry.actor === 'agent' ? 'accent' : 'muted'}>
                  {entry.actor}
                </Badge>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{entry.action}</span>
                  {entry.detail ? (
                    <span className="block text-muted-foreground" data-selectable>
                      {entry.detail}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
            {application.audit.length === 0 ? (
              <p className="px-3 py-3 text-2xs text-muted-foreground">No audit entries.</p>
            ) : null}
          </div>
        ) : null}

        {tab === 'posting' ? (
          <div className="p-3">
            <p className="mb-2 text-2xs text-muted-foreground">
              Captured when the job was discovered, so a later edit to the live posting cannot
              silently change what you applied to.
            </p>
            <pre
              className="scrollable max-h-96 whitespace-pre-wrap rounded border border-border bg-surface-2 p-2.5 text-2xs"
              data-selectable
            >
              {application.postingSnapshot}
            </pre>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
