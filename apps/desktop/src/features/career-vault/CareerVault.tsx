import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Filter,
  Link2,
  Sparkles,
  Vault,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Expandable,
  Input,
  Panel,
  PanelHeader,
  Select,
  VerificationChip,
} from '@ui';
import {
  CAREER_FACT_CATEGORY_LABEL,
  FACT_SOURCE_LABEL,
  RESUME_STRATEGY_LABEL,
  type CareerFact,
  type CareerFactCategory,
} from '@career-model';
import { formatDate, type VerificationStatus } from '@shared/common';
import { ConfidenceChip } from '@ui';
import { Screen, SplitColumns, KeyValue } from '../../components/Screen';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

const CATEGORY_ORDER: CareerFactCategory[] = [
  'employment',
  'project',
  'accomplishment',
  'responsibility',
  'skill',
  'technology',
  'certification',
  'education',
  'portfolio',
  'github-project',
  'interview-story',
  'career-preference',
  'work-authorization',
  'location-preference',
  'compensation-preference',
];

type VerificationFilter = 'all' | VerificationStatus | 'attention';

/**
 * The single source of truth every generated answer and resume bullet traces
 * back to. The screen's job is to make provenance impossible to miss: an
 * AI-inferred fact is never allowed to render with the same affordance as one
 * the user has verified.
 */
export function CareerVault() {
  const { state, update } = useStore();
  const { params, go } = useNav();

  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<'all' | CareerFactCategory>('all');
  const [verification, setVerification] = React.useState<VerificationFilter>('all');
  const [selectedId, setSelectedId] = React.useState<string | undefined>(params.factId);

  // Deep links from evidence chips elsewhere in the app land here.
  React.useEffect(() => {
    if (!params.factId) return;
    setSelectedId(params.factId);
    setQuery('');
    setCategory('all');
    setVerification('all');
  }, [params.factId]);

  const facts = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.facts.filter((fact) => {
      if (category !== 'all' && fact.category !== category) return false;
      if (verification === 'attention') {
        if (
          fact.verification !== 'conflicting' &&
          fact.verification !== 'needs-confirmation' &&
          fact.verification !== 'ai-inferred'
        ) {
          return false;
        }
      } else if (verification !== 'all' && fact.verification !== verification) {
        return false;
      }
      if (!q) return true;
      return (
        fact.title.toLowerCase().includes(q) ||
        fact.description.toLowerCase().includes(q) ||
        (fact.context ?? '').toLowerCase().includes(q) ||
        fact.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.facts, query, category, verification]);

  const selected = state.facts.find((f) => f.id === selectedId) ?? facts[0];

  const counts = React.useMemo(() => {
    const byStatus: Partial<Record<VerificationStatus, number>> = {};
    for (const fact of state.facts) {
      byStatus[fact.verification] = (byStatus[fact.verification] ?? 0) + 1;
    }
    return byStatus;
  }, [state.facts]);

  const grouped = React.useMemo(() => {
    const map = new Map<CareerFactCategory, CareerFact[]>();
    for (const fact of facts) {
      const list = map.get(fact.category);
      if (list) list.push(fact);
      else map.set(fact.category, [fact]);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      facts: map.get(c) as CareerFact[],
    }));
  }, [facts]);

  const verify = React.useCallback(
    (factId: string, next: VerificationStatus) => {
      update((s) => ({
        ...s,
        facts: s.facts.map((f) =>
          f.id === factId
            ? {
                ...f,
                verification: next,
                updatedBy: 'user' as const,
                lastUpdated: new Date().toISOString(),
              }
            : f,
        ),
      }));
    },
    [update],
  );

  const attention =
    (counts.conflicting ?? 0) + (counts['needs-confirmation'] ?? 0) + (counts['ai-inferred'] ?? 0);

  return (
    <Screen
      title="Career Vault"
      description="Everything the assistant is allowed to say about you. Answers and resume bullets can only cite facts that live here — nothing may be invented at application time."
      padded={false}
      actions={
        <div className="flex items-center gap-2 text-2xs text-muted-foreground">
          <span>{state.facts.length} facts</span>
          <span>·</span>
          <span className="text-[hsl(var(--ok))]">{counts['user-verified'] ?? 0} verified</span>
          <span>·</span>
          <span className="text-[hsl(var(--warn))]">{attention} need your attention</span>
        </div>
      }
      bodyClassName="flex"
    >
      <SplitColumns
        leftWidth={410}
        left={
          <div className="flex min-h-0 flex-col">
            <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-background p-3">
              <Input
                placeholder="Search facts, tags, employers…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search Career Vault"
              />
              <div className="flex items-center gap-1.5">
                <Filter size={12} className="shrink-0 text-muted-foreground" />
                <Select
                  className="h-7 flex-1 text-2xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CAREER_FACT_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </Select>
                <Select
                  className="h-7 flex-1 text-2xs"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value as VerificationFilter)}
                  aria-label="Filter by verification"
                >
                  <option value="all">Any status</option>
                  <option value="attention">Needs attention</option>
                  <option value="user-verified">User verified</option>
                  <option value="imported">Imported</option>
                  <option value="ai-inferred">AI inferred</option>
                  <option value="needs-confirmation">Needs confirmation</option>
                  <option value="conflicting">Conflicting</option>
                </Select>
              </div>
            </div>

            {grouped.length === 0 ? (
              <EmptyState
                title="No facts match"
                hint="Clear the filters or widen the search."
                icon={<Vault size={22} />}
              />
            ) : (
              <div>
                {grouped.map(({ category: cat, facts: list }) => (
                  <div key={cat}>
                    <div className="sticky top-[92px] z-[5] flex items-center justify-between border-y border-border bg-surface px-3 py-1">
                      <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                        {CAREER_FACT_CATEGORY_LABEL[cat]}
                      </span>
                      <span className="text-2xs text-muted-foreground">{list.length}</span>
                    </div>
                    {list.map((fact) => (
                      <FactRow
                        key={fact.id}
                        fact={fact}
                        active={selected?.id === fact.id}
                        onSelect={() => setSelectedId(fact.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        right={
          selected ? (
            <FactDetail
              fact={selected}
              onVerify={verify}
              onOpenFact={setSelectedId}
              onOpenStrategy={(strategyId) => go('resume-studio', { strategyId })}
            />
          ) : (
            <EmptyState
              title="Select a fact"
              hint="Pick a fact on the left to see its provenance, claim ceiling and everywhere it is used."
              icon={<Vault size={22} />}
            />
          )
        }
      />
    </Screen>
  );
}

/* --------------------------------- list ---------------------------------- */

function FactRow({
  fact,
  active,
  onSelect,
}: {
  fact: CareerFact;
  active: boolean;
  onSelect(): void;
}) {
  return (
    <button
      onClick={onSelect}
      className={[
        'block w-full border-b border-border px-3 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active ? 'bg-primary/10' : 'hover:bg-surface-2',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{fact.title}</span>
        <VerificationChip status={fact.verification} />
      </div>
      <p className="mt-0.5 line-clamp-2 text-2xs text-muted-foreground">{fact.description}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-2xs text-muted-foreground">
        {fact.context ? <span className="truncate">{fact.context}</span> : null}
        {fact.claimCeiling ? (
          <Badge tone="warn" title={fact.claimCeiling}>
            Claim ceiling
          </Badge>
        ) : null}
        {fact.conflictNote ? <Badge tone="danger">Conflict</Badge> : null}
      </div>
    </button>
  );
}

/* -------------------------------- detail --------------------------------- */

function FactDetail({
  fact,
  onVerify,
  onOpenFact,
  onOpenStrategy,
}: {
  fact: CareerFact;
  onVerify(factId: string, next: VerificationStatus): void;
  onOpenFact(factId: string): void;
  onOpenStrategy(strategyId: string): void;
}) {
  const { state } = useStore();
  const { go } = useNav();

  const related = fact.relatedFactIds
    .map((id) => state.facts.find((f) => f.id === id))
    .filter((f): f is CareerFact => Boolean(f));

  // Where this fact is actually load-bearing — the reason provenance matters.
  const usedInAnswers = state.applications.flatMap((app) =>
    app.screeningAnswers
      .filter((a) => a.evidenceFactIds.includes(fact.id))
      .map((a) => ({ app, answer: a })),
  );
  const usedInResumes = state.tailoredResumes.flatMap((resume) =>
    resume.changes
      .filter((c) => c.evidenceFactIds.includes(fact.id) || c.refusal?.blockingFactIds.includes(fact.id))
      .map((c) => ({ resume, change: c })),
  );
  const usedInQualifications = state.jobs.filter((job) =>
    job.intelligence.qualifications.some((q) => q.evidenceFactIds.includes(fact.id)),
  );

  const unverified = fact.verification === 'ai-inferred' || fact.verification === 'needs-confirmation';

  return (
    <div className="space-y-3 p-4">
      <Panel>
        <PanelHeader
          title={fact.title}
          subtitle={CAREER_FACT_CATEGORY_LABEL[fact.category]}
          actions={
            <div className="flex items-center gap-1.5">
              <ConfidenceChip level={fact.confidence} compact />
              <VerificationChip status={fact.verification} />
            </div>
          }
        />
        <div className="space-y-3 p-3">
          <p className="whitespace-pre-line text-xs" data-selectable>
            {fact.description}
          </p>

          {fact.verification === 'ai-inferred' ? (
            <div className="flex items-start gap-2 rounded border border-dashed border-[hsl(var(--ai)/0.6)] bg-[hsl(var(--ai)/0.08)] px-2.5 py-2 text-2xs">
              <Sparkles size={13} className="mt-[1px] shrink-0 text-[hsl(var(--ai))]" />
              <span>
                <strong>Inferred by the assistant, not confirmed by you.</strong> It is rendered in
                the AI colour everywhere it appears and can never be cited as verified evidence.
                Confirm it below if it is accurate.
              </span>
            </div>
          ) : null}

          {fact.conflictNote ? (
            <div className="flex items-start gap-2 rounded border border-[hsl(var(--danger)/0.5)] bg-danger/10 px-2.5 py-2 text-2xs text-[hsl(var(--danger))]">
              <AlertTriangle size={13} className="mt-[1px] shrink-0" />
              <span>
                <strong>Sources disagree.</strong> {fact.conflictNote}
              </span>
            </div>
          ) : null}

          {fact.claimCeiling ? (
            <div className="flex items-start gap-2 rounded border border-[hsl(var(--warn)/0.5)] bg-warn/10 px-2.5 py-2 text-2xs text-[hsl(var(--warn))]">
              <CircleHelp size={13} className="mt-[1px] shrink-0" />
              <span>
                <strong>Claim ceiling.</strong> {fact.claimCeiling} The agent will refuse to write
                anything stronger than this, even when a form asks for it directly.
              </span>
            </div>
          ) : null}

          <KeyValue
            rows={[
              { label: 'Source', value: FACT_SOURCE_LABEL[fact.source] },
              { label: 'Context', value: fact.context ?? '—' },
              {
                label: 'Period',
                value: fact.startDate
                  ? `${formatDate(fact.startDate)} — ${
                      fact.endDate ? formatDate(fact.endDate) : 'present'
                    }`
                  : '—',
              },
              { label: 'Last updated', value: `${formatDate(fact.lastUpdated)} by ${fact.updatedBy}` },
              {
                label: 'Tags',
                value: fact.tags.length ? (
                  <span className="flex flex-wrap gap-1">
                    {fact.tags.map((t) => (
                      <Badge key={t} tone="muted">
                        {t}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  '—'
                ),
              },
              {
                label: 'Usable by',
                value: fact.allowedStrategies.length ? (
                  <span className="flex flex-wrap gap-1">
                    {fact.allowedStrategies.map((s) => (
                      <button key={s} onClick={() => onOpenStrategy(s)}>
                        <Badge tone="info" className="hover:brightness-110">
                          {RESUME_STRATEGY_LABEL[s]}
                        </Badge>
                      </button>
                    ))}
                  </span>
                ) : (
                  'No resume strategy'
                ),
              },
            ]}
          />

          {unverified ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
              <Button variant="ok" onClick={() => onVerify(fact.id, 'user-verified')}>
                <CheckCircle2 size={13} />
                Confirm — this is accurate
              </Button>
              <Button variant="outline" onClick={() => onVerify(fact.id, 'archived')}>
                Archive — do not use this
              </Button>
            </div>
          ) : fact.verification === 'conflicting' ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
              <Button variant="ok" onClick={() => onVerify(fact.id, 'user-verified')}>
                <CheckCircle2 size={13} />
                Resolve — keep this version
              </Button>
              <Button variant="outline" onClick={() => onVerify(fact.id, 'needs-confirmation')}>
                Flag for later
              </Button>
            </div>
          ) : fact.verification === 'archived' ? (
            <div className="border-t border-border pt-2.5">
              <Button variant="outline" onClick={() => onVerify(fact.id, 'needs-confirmation')}>
                Restore to the vault
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>

      {related.length ? (
        <Panel>
          <PanelHeader title="Related facts" subtitle="Cited together when this fact is used" />
          <div className="divide-y divide-border">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenFact(r.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-surface-2"
              >
                <Link2 size={11} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <VerificationChip status={r.verification} />
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Where this fact is used"
          subtitle="Changing it changes every answer below"
        />
        <div className="space-y-2 p-3">
          <Expandable
            defaultOpen={usedInAnswers.length > 0}
            summary={
              <span className="text-xs">
                Screening answers <Badge tone="muted">{usedInAnswers.length}</Badge>
              </span>
            }
          >
            {usedInAnswers.length === 0 ? (
              <p className="text-2xs text-muted-foreground">Not cited by any submitted answer yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {usedInAnswers.map(({ app, answer }) => (
                  <li key={answer.id}>
                    <button
                      onClick={() => go('applications', { applicationId: app.id })}
                      className="w-full rounded border border-border px-2 py-1.5 text-left hover:bg-surface-2"
                    >
                      <div className="text-2xs text-muted-foreground">{answer.question}</div>
                      <div className="text-xs" data-selectable>
                        {answer.answer}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Expandable>

          <Expandable
            summary={
              <span className="text-xs">
                Tailored resume changes <Badge tone="muted">{usedInResumes.length}</Badge>
              </span>
            }
          >
            {usedInResumes.length === 0 ? (
              <p className="text-2xs text-muted-foreground">Not used by any tailored resume yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {usedInResumes.map(({ resume, change }) => (
                  <li
                    key={`${resume.id}-${change.id}`}
                    className="rounded border border-border px-2 py-1.5"
                  >
                    <div className="text-2xs text-muted-foreground">
                      {RESUME_STRATEGY_LABEL[resume.strategyId]} · {change.sectionHeading}
                      {change.refusal ? ' · blocked an over-claim' : ''}
                    </div>
                    <div className="text-xs" data-selectable>
                      {change.proposedText ?? change.baseText}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Expandable>

          <Expandable
            summary={
              <span className="text-xs">
                Job qualification matches <Badge tone="muted">{usedInQualifications.length}</Badge>
              </span>
            }
          >
            {usedInQualifications.length === 0 ? (
              <p className="text-2xs text-muted-foreground">
                No open posting is currently matched against this fact.
              </p>
            ) : (
              <ul className="space-y-1">
                {usedInQualifications.map((job) => (
                  <li key={job.id}>
                    <button
                      onClick={() => go('job-discovery', { jobId: job.id })}
                      className="w-full rounded border border-border px-2 py-1.5 text-left text-xs hover:bg-surface-2"
                    >
                      {job.title} — {job.company}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Expandable>
        </div>
      </Panel>
    </div>
  );
}
