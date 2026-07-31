import React from 'react';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import {
  AiSuggestedBadge,
  Badge,
  Button,
  ConfidenceChip,
  DataTable,
  EmptyState,
  Expandable,
  Panel,
  PanelHeader,
  Select,
  Td,
  Textarea,
  Th,
} from '@ui';
import {
  RESUME_STRATEGY_LABEL,
  interviewRate,
  responseRate,
  type DiffChangeDecision,
  type ResumeDiffChange,
  type ResumeStrategy,
  type ResumeStrategyId,
  type TailoredResume,
} from '@career-model';
import { formatDate } from '@shared/common';
import { pct } from '@scoring';
import { Screen } from '../../components/Screen';
import { EvidenceLinks } from '../../components/Evidence';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

const KIND_TONE = {
  added: 'ok',
  removed: 'danger',
  reordered: 'info',
  reworded: 'accent',
} as const;

export function ResumeStudio() {
  const { state, update } = useStore();
  const { params } = useNav();

  const [strategyId, setStrategyId] = React.useState<ResumeStrategyId>(
    (params.strategyId as ResumeStrategyId) ?? state.strategies[0]?.id ?? 'security-platform',
  );
  const [tailoredId, setTailoredId] = React.useState<string | undefined>(() => {
    if (!params.jobId) return undefined;
    return state.tailoredResumes.find((t) => t.jobId === params.jobId)?.id;
  });

  React.useEffect(() => {
    if (params.strategyId) setStrategyId(params.strategyId as ResumeStrategyId);
  }, [params.strategyId]);

  React.useEffect(() => {
    if (!params.jobId) return;
    const match = state.tailoredResumes.find((t) => t.jobId === params.jobId);
    if (match) {
      setTailoredId(match.id);
      setStrategyId(match.strategyId);
    }
  }, [params.jobId, state.tailoredResumes]);

  const strategy = state.strategies.find((s) => s.id === strategyId) ?? state.strategies[0];
  const tailoredForStrategy = state.tailoredResumes.filter((t) => t.strategyId === strategyId);
  // Falling back to the first tailoring means switching strategy shows a diff
  // straight away rather than an empty pane the user has to click out of.
  const tailored = tailoredForStrategy.find((t) => t.id === tailoredId) ?? tailoredForStrategy[0];

  const decide = React.useCallback(
    (resumeId: string, changeId: string, decision: DiffChangeDecision, editedText?: string) => {
      update((s) => ({
        ...s,
        tailoredResumes: s.tailoredResumes.map((r) =>
          r.id !== resumeId
            ? r
            : {
                ...r,
                changes: r.changes.map((c) =>
                  c.id !== changeId
                    ? c
                    : {
                        ...c,
                        decision,
                        userEditedText: decision === 'edited' ? editedText : c.userEditedText,
                      },
                ),
              },
        ),
      }));
    },
    [update],
  );

  if (!strategy) {
    return <EmptyState title="No resume strategies" hint="Seed data is missing." />;
  }

  return (
    <Screen
      title="Resume Studio"
      description="Six maintained positioning strategies plus per-job tailoring. Every proposed edit shows the evidence behind it, and the assistant refuses edits the Career Vault cannot support."
      padded={false}
      actions={
        <Select
          className="h-7 w-52 text-2xs"
          value={strategyId}
          onChange={(e) => {
            setStrategyId(e.target.value as ResumeStrategyId);
            setTailoredId(undefined);
          }}
          aria-label="Resume strategy"
        >
          {state.strategies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      }
      bodyClassName="flex"
    >
      <div className="scrollable w-[430px] shrink-0 space-y-3 border-r border-border p-3">
        <StrategyPerformanceTable
          strategies={state.strategies}
          activeId={strategyId}
          onSelect={(id) => {
            setStrategyId(id);
            setTailoredId(undefined);
          }}
        />
        <BaseResumePanel strategy={strategy} />
      </div>

      <div className="scrollable min-w-0 flex-1 space-y-3 p-3">
        <TailoringPicker
          tailoredResumes={tailoredForStrategy}
          activeId={tailored?.id}
          onSelect={setTailoredId}
        />
        {tailored ? (
          <TailoredDiff tailored={tailored} onDecide={decide} />
        ) : (
          <EmptyState
            title="No tailored version selected"
            hint="Pick a job above to see the diff between this base resume and the version proposed for that posting."
            icon={<Shuffle size={22} />}
          />
        )}
      </div>
    </Screen>
  );
}

/* ------------------------------ performance ------------------------------ */

function StrategyPerformanceTable({
  strategies,
  activeId,
  onSelect,
}: {
  strategies: ResumeStrategy[];
  activeId: ResumeStrategyId;
  onSelect(id: ResumeStrategyId): void;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Strategy performance"
        subtitle="Which positioning actually earns interviews"
      />
      <DataTable>
        <thead>
          <tr>
            <Th>Strategy</Th>
            <Th title="Applications submitted using this positioning">Sent</Th>
            <Th title="Recruiter replies divided by applications sent">Reply</Th>
            <Th title="Interviews divided by applications sent">Interview</Th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((s) => (
            <tr
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={[
                'row-hover cursor-pointer border-b border-border',
                s.id === activeId ? 'bg-primary/10' : '',
              ].join(' ')}
            >
              <Td>
                <div className="font-medium">{s.name}</div>
                <div className="text-2xs text-muted-foreground">
                  Updated {formatDate(s.lastUpdated)}
                </div>
              </Td>
              <Td className="tabular-nums">{s.performance.applicationsSubmitted}</Td>
              <Td className="tabular-nums">{pct(responseRate(s.performance))}</Td>
              <Td className="tabular-nums">{pct(interviewRate(s.performance))}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <p className="border-t border-border px-3 py-2 text-2xs text-muted-foreground">
        Rates come from the simulated application history in this demo, not from any live tracking.
      </p>
    </Panel>
  );
}

/* ------------------------------ base resume ------------------------------ */

function BaseResumePanel({ strategy }: { strategy: ResumeStrategy }) {
  return (
    <Panel>
      <PanelHeader
        icon={<FileText size={13} />}
        title={strategy.name}
        subtitle={strategy.positioning}
      />
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-1">
          {strategy.includedSkills.map((skill) => (
            <Badge key={skill} tone="muted">
              {skill}
            </Badge>
          ))}
        </div>
        {strategy.baseResume.map((section) => (
          <Expandable
            key={section.id}
            defaultOpen={section.kind === 'summary'}
            summary={
              <span className="text-xs font-medium">
                {section.heading}
                {section.subtitle ? (
                  <span className="ml-1.5 text-2xs font-normal text-muted-foreground">
                    {section.subtitle}
                  </span>
                ) : null}
              </span>
            }
          >
            <ul className="space-y-2">
              {section.bullets.map((bullet) => (
                <li key={bullet.id}>
                  <p className="text-xs" data-selectable>
                    {bullet.text}
                  </p>
                  <div className="mt-1">
                    <EvidenceLinks factIds={bullet.evidenceFactIds} compact />
                  </div>
                </li>
              ))}
            </ul>
          </Expandable>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- tailoring ------------------------------- */

function TailoringPicker({
  tailoredResumes,
  activeId,
  onSelect,
}: {
  tailoredResumes: TailoredResume[];
  activeId?: string;
  onSelect(id: string): void;
}) {
  const { state } = useStore();
  if (tailoredResumes.length === 0) {
    return (
      <Panel className="p-3 text-xs text-muted-foreground">
        No job-tailored version exists for this strategy yet.
      </Panel>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-2xs uppercase tracking-wide text-muted-foreground">Tailored for</span>
      {tailoredResumes.map((t) => {
        const job = state.jobs.find((j) => j.id === t.jobId);
        const refusals = t.changes.filter((c) => c.refusal).length;
        return (
          <Button
            key={t.id}
            variant={t.id === activeId ? 'primary' : 'outline'}
            size="xs"
            onClick={() => onSelect(t.id)}
          >
            {job ? `${job.company} — ${job.title}` : t.jobId}
            {refusals ? (
              <Badge tone="danger" className="ml-1">
                {refusals} refused
              </Badge>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}

function TailoredDiff({
  tailored,
  onDecide,
}: {
  tailored: TailoredResume;
  onDecide(
    resumeId: string,
    changeId: string,
    decision: DiffChangeDecision,
    editedText?: string,
  ): void;
}) {
  const { state } = useStore();
  const job = state.jobs.find((j) => j.id === tailored.jobId);
  const refusals = tailored.changes.filter((c) => c.refusal);
  const normal = tailored.changes.filter((c) => !c.refusal);
  const pending = normal.filter((c) => c.decision === 'pending').length;

  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader
          title={job ? `${job.title} — ${job.company}` : tailored.jobId}
          subtitle={`${RESUME_STRATEGY_LABEL[tailored.strategyId]} base · tailored ${formatDate(
            tailored.createdAt,
          )}`}
          actions={
            <div className="flex items-center gap-1.5">
              <AiSuggestedBadge label={`${tailored.changes.length} proposed changes`} />
              {pending ? <Badge tone="warn">{pending} awaiting you</Badge> : null}
            </div>
          }
        />
        <div className="p-3">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            Keyword coverage
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {tailored.keywordCoverage.map((k) => {
              const tone = k.inTailored ? 'ok' : k.requiredByJob ? 'danger' : 'muted';
              const title = k.inTailored
                ? k.inBase
                  ? 'Already present in the base resume'
                  : 'Added by tailoring'
                : k.requiredByJob
                  ? 'Required by the posting but not covered — no evidence supports adding it'
                  : 'Not covered, and not required';
              return (
                <Badge key={k.keyword} tone={tone} title={title}>
                  {k.keyword}
                </Badge>
              );
            })}
          </div>
        </div>
      </Panel>

      {refusals.map((change) => (
        <RefusalCard key={change.id} change={change} />
      ))}

      {normal.map((change) => (
        <DiffCard
          key={change.id}
          change={change}
          onDecide={(decision, editedText) =>
            onDecide(tailored.id, change.id, decision, editedText)
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------- diff cards ------------------------------ */

/**
 * A change the assistant declined to make. Deliberately not approvable: there
 * is no affordance anywhere in this screen that turns a refusal into an
 * accepted bullet, because the blocking facts are what make it a refusal.
 */
function RefusalCard({ change }: { change: ResumeDiffChange }) {
  const refusal = change.refusal;
  const [copied, setCopied] = React.useState(false);
  if (!refusal) return null;

  return (
    <Panel className="border-[hsl(var(--danger)/0.6)]">
      <PanelHeader
        icon={<Ban size={13} className="text-[hsl(var(--danger))]" />}
        title="The assistant refused this rewrite"
        subtitle={`${change.sectionHeading} · the posting asked for a stronger claim than your evidence supports`}
        actions={<ConfidenceChip level="unsupported" />}
      />
      <div className="space-y-2.5 p-3">
        <div className="rounded border border-[hsl(var(--danger)/0.45)] bg-danger/10 p-2">
          <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-[hsl(var(--danger))]">
            <X size={11} />
            Requested, not written
          </div>
          <p className="mt-0.5 text-xs line-through" data-selectable>
            {refusal.requestedText}
          </p>
        </div>

        <div>
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            Why it was refused
          </span>
          <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground" data-selectable>
            {refusal.reason}
          </p>
        </div>

        <EvidenceLinks factIds={refusal.blockingFactIds} label="Blocking facts" />

        <div className="rounded border border-[hsl(var(--ok)/0.45)] bg-ok/10 p-2">
          <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-[hsl(var(--ok))]">
            <CheckCircle2 size={11} />
            Written instead
          </div>
          <p className="mt-0.5 text-xs" data-selectable>
            {refusal.supportedAlternative}
          </p>
          <Button
            variant="outline"
            size="xs"
            className="mt-2"
            onClick={() => {
              void navigator.clipboard?.writeText(refusal.supportedAlternative);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? 'Copied' : 'Copy supported wording'}
          </Button>
        </div>

        {change.baseText ? (
          <p className="text-2xs text-muted-foreground">
            <strong>Current base bullet:</strong> {change.baseText}
          </p>
        ) : null}

        {change.concerns.length ? (
          <ul className="space-y-1 border-t border-border pt-2">
            {change.concerns.map((concern, i) => (
              <li key={i} className="text-2xs text-[hsl(var(--warn))]" data-selectable>
                {concern}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="rounded border border-dashed border-border px-2 py-1.5 text-2xs text-muted-foreground">
          There is no "approve anyway" button here. To make this claim, the underlying Career Vault
          fact would have to change — which is a decision about your history, not about this one
          application.
        </p>
      </div>
    </Panel>
  );
}

const DECISION_TONE = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'danger',
  edited: 'accent',
  'job-only': 'info',
} as const;

const DECISION_LABEL: Record<DiffChangeDecision, string> = {
  pending: 'Awaiting your decision',
  approved: 'Approved',
  rejected: 'Rejected',
  edited: 'Edited by you',
  'job-only': 'Applied to this job only',
};

function DiffCard({
  change,
  onDecide,
}: {
  change: ResumeDiffChange;
  onDecide(decision: DiffChangeDecision, editedText?: string): void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    change.userEditedText ?? change.proposedText ?? change.baseText ?? '',
  );

  const Icon =
    change.kind === 'added'
      ? Plus
      : change.kind === 'removed'
        ? Trash2
        : change.kind === 'reordered'
          ? Shuffle
          : Pencil;

  return (
    <Panel>
      <PanelHeader
        icon={<Icon size={13} />}
        title={change.sectionHeading}
        subtitle={change.rationale}
        actions={
          <div className="flex items-center gap-1.5">
            <Badge tone={KIND_TONE[change.kind]}>{change.kind}</Badge>
            <ConfidenceChip level={change.confidence} compact />
            <Badge tone={DECISION_TONE[change.decision]}>{DECISION_LABEL[change.decision]}</Badge>
          </div>
        }
      />
      <div className="space-y-2.5 p-3">
        {change.baseText ? (
          <div>
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">Base</span>
            <p
              className={[
                'mt-0.5 text-xs',
                change.kind === 'removed' ? 'text-muted-foreground line-through' : 'text-muted-foreground',
              ].join(' ')}
              data-selectable
            >
              {change.baseText}
            </p>
          </div>
        ) : null}

        {change.proposedText ? (
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowRight size={11} className="text-muted-foreground" />
              <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                Proposed
              </span>
              <AiSuggestedBadge />
            </div>
            {editing ? (
              <Textarea
                className="mt-1"
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Edit proposed text"
              />
            ) : (
              <p className="mt-0.5 text-xs" data-selectable>
                {change.userEditedText ?? change.proposedText}
              </p>
            )}
          </div>
        ) : null}

        <EvidenceLinks factIds={change.evidenceFactIds} />

        {change.keywordsCovered.length ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">Covers</span>
            {change.keywordsCovered.map((k) => (
              <Badge key={k} tone="muted">
                {k}
              </Badge>
            ))}
          </div>
        ) : null}

        {change.concerns.length ? (
          <ul className="space-y-1">
            {change.concerns.map((concern, i) => (
              <li key={i} className="text-2xs text-[hsl(var(--warn))]" data-selectable>
                {concern}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          {editing ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  onDecide('edited', draft);
                  setEditing(false);
                }}
                disabled={!draft.trim()}
              >
                Save my wording
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ok"
                onClick={() => onDecide('approved')}
                disabled={change.decision === 'approved'}
              >
                <CheckCircle2 size={13} />
                Approve
              </Button>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil size={13} />
                Edit wording
              </Button>
              <Button
                variant="ghost"
                onClick={() => onDecide('job-only')}
                title="Use this change for this application only, leaving the base strategy untouched."
              >
                This job only
              </Button>
              <Button variant="ghost" onClick={() => onDecide('rejected')}>
                Reject
              </Button>
              {change.decision !== 'pending' ? (
                <Button variant="ghost" onClick={() => onDecide('pending')} title="Undo decision">
                  <RotateCcw size={13} />
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
