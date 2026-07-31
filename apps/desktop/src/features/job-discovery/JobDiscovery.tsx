import React from 'react';
import {
  AlertTriangle,
  Ban,
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Filter,
  MinusCircle,
  Rocket,
  Search,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Expandable,
  Input,
  Panel,
  PanelHeader,
  RecommendationChip,
  Select,
  Td,
  Th,
} from '@ui';
import {
  EFFORT_LABEL,
  EMPLOYER_VERIFICATION_LABEL,
  JOB_FAMILY_LABEL,
  JOB_SOURCE_LABEL,
  RECOMMENDATION_LABEL,
  type Job,
  type JobFamily,
  type JobRecommendation,
  type Qualification,
} from '@job-model';
import { RESUME_STRATEGY_LABEL } from '@career-model';
import { formatAge, formatMoney } from '@shared/common';
import { rankingScore } from '@scoring';
import { Screen } from '../../components/Screen';
import { ScoreCell, ScoreDimensionView } from '../../components/Scores';
import { EvidenceLinks } from '../../components/Evidence';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

type SortKey = 'ranking' | 'fit' | 'direction' | 'quality' | 'newest' | 'effort';

const EFFORT_RANK = { low: 0, medium: 1, high: 2, 'very-high': 3 } as const;

export function JobDiscovery() {
  const { state, update } = useStore();
  const { params, go } = useNav();

  const [query, setQuery] = React.useState('');
  const [family, setFamily] = React.useState<'all' | JobFamily>('all');
  const [recommendation, setRecommendation] = React.useState<'all' | JobRecommendation>('all');
  const [remote, setRemote] = React.useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [hideRejected, setHideRejected] = React.useState(true);
  const [shortlistOnly, setShortlistOnly] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>('ranking');
  const [selectedId, setSelectedId] = React.useState<string | undefined>(params.jobId);

  React.useEffect(() => {
    if (params.jobId) setSelectedId(params.jobId);
  }, [params.jobId]);

  const jobs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.jobs.filter((job) => {
      if (hideRejected && state.rejectedJobIds.includes(job.id)) return false;
      if (shortlistOnly && !state.shortlistedJobIds.includes(job.id)) return false;
      if (family !== 'all' && job.family !== family) return false;
      if (recommendation !== 'all' && job.recommendation !== recommendation) return false;
      if (remote !== 'all' && job.remote !== remote) return false;
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'fit':
          return b.fitScore.value - a.fitScore.value;
        case 'direction':
          return b.careerDirectionScore.value - a.careerDirectionScore.value;
        case 'quality':
          return b.opportunityQualityScore.value - a.opportunityQualityScore.value;
        case 'newest':
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        case 'effort':
          return EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort];
        default:
          return rankingScore(b) - rankingScore(a);
      }
    });
    return sorted;
  }, [
    state.jobs,
    state.rejectedJobIds,
    state.shortlistedJobIds,
    query,
    family,
    recommendation,
    remote,
    hideRejected,
    shortlistOnly,
    sort,
  ]);

  const selected = state.jobs.find((j) => j.id === selectedId) ?? jobs[0];

  const toggleShortlist = React.useCallback(
    (jobId: string) => {
      update((s) => ({
        ...s,
        shortlistedJobIds: s.shortlistedJobIds.includes(jobId)
          ? s.shortlistedJobIds.filter((id) => id !== jobId)
          : [...s.shortlistedJobIds, jobId],
      }));
    },
    [update],
  );

  const toggleRejected = React.useCallback(
    (jobId: string) => {
      update((s) => ({
        ...s,
        rejectedJobIds: s.rejectedJobIds.includes(jobId)
          ? s.rejectedJobIds.filter((id) => id !== jobId)
          : [...s.rejectedJobIds, jobId],
        shortlistedJobIds: s.shortlistedJobIds.filter((id) => id !== jobId),
      }));
    },
    [update],
  );

  const families = React.useMemo(
    () => Array.from(new Set(state.jobs.map((j) => j.family))).sort(),
    [state.jobs],
  );

  return (
    <Screen
      title="Job Discovery"
      description="Three scores, each explained separately. There is deliberately no single unexplained match percentage — every number can be expanded to the factors that produced it."
      padded={false}
      actions={
        <div className="text-2xs text-muted-foreground">
          {jobs.length} of {state.jobs.length} listings · {state.shortlistedJobIds.length}{' '}
          shortlisted
        </div>
      }
      bodyClassName="flex flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-7 w-64 pl-7 text-2xs"
            placeholder="Search title, company, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
        <Filter size={12} className="text-muted-foreground" />
        <Select
          className="h-7 w-44 text-2xs"
          value={family}
          onChange={(e) => setFamily(e.target.value as typeof family)}
          aria-label="Filter by job family"
        >
          <option value="all">All job families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {JOB_FAMILY_LABEL[f]}
            </option>
          ))}
        </Select>
        <Select
          className="h-7 w-44 text-2xs"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value as typeof recommendation)}
          aria-label="Filter by recommendation"
        >
          <option value="all">Any recommendation</option>
          {(Object.keys(RECOMMENDATION_LABEL) as JobRecommendation[]).map((r) => (
            <option key={r} value={r}>
              {RECOMMENDATION_LABEL[r]}
            </option>
          ))}
        </Select>
        <Select
          className="h-7 w-28 text-2xs"
          value={remote}
          onChange={(e) => setRemote(e.target.value as typeof remote)}
          aria-label="Filter by work mode"
        >
          <option value="all">Any mode</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On site</option>
        </Select>
        <Select
          className="h-7 w-40 text-2xs"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort jobs"
        >
          <option value="ranking">Sort: balanced</option>
          <option value="fit">Sort: fit</option>
          <option value="direction">Sort: career direction</option>
          <option value="quality">Sort: opportunity quality</option>
          <option value="effort">Sort: least effort</option>
          <option value="newest">Sort: newest</option>
        </Select>

        <label className="flex items-center gap-1 text-2xs text-muted-foreground">
          <input
            type="checkbox"
            checked={shortlistOnly}
            onChange={(e) => setShortlistOnly(e.target.checked)}
          />
          Shortlist only
        </label>
        <label className="flex items-center gap-1 text-2xs text-muted-foreground">
          <input
            type="checkbox"
            checked={hideRejected}
            onChange={(e) => setHideRejected(e.target.checked)}
          />
          Hide dismissed
        </label>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="scrollable min-w-0 flex-1">
          {jobs.length === 0 ? (
            <EmptyState
              title="No listings match"
              hint="Loosen a filter — dismissed listings are hidden by default."
              icon={<Search size={22} />}
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Role</Th>
                  <Th>Company</Th>
                  <Th title="How well your verified evidence matches the posting's requirements">
                    Fit
                  </Th>
                  <Th title="How much this moves you toward your stated target directions">
                    Direction
                  </Th>
                  <Th title="Compensation transparency, employer verification, listing freshness">
                    Quality
                  </Th>
                  <Th>Effort</Th>
                  <Th>Posted</Th>
                  <Th>Recommendation</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const shortlisted = state.shortlistedJobIds.includes(job.id);
                  const dismissed = state.rejectedJobIds.includes(job.id);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedId(job.id)}
                      className={[
                        'row-hover cursor-pointer border-b border-border',
                        selected?.id === job.id ? 'bg-primary/10' : '',
                        dismissed ? 'opacity-55' : '',
                      ].join(' ')}
                    >
                      <Td>
                        <div className="max-w-[260px] truncate font-medium">{job.title}</div>
                        <div className="text-2xs text-muted-foreground">
                          {JOB_FAMILY_LABEL[job.family]}
                        </div>
                      </Td>
                      <Td>
                        <div className="max-w-[170px] truncate">{job.company}</div>
                        <div className="text-2xs text-muted-foreground">
                          {job.remote} · {job.location}
                        </div>
                      </Td>
                      <Td>
                        <ScoreCell value={job.fitScore.value} title={job.fitScore.summary} />
                      </Td>
                      <Td>
                        <ScoreCell
                          value={job.careerDirectionScore.value}
                          title={job.careerDirectionScore.summary}
                        />
                      </Td>
                      <Td>
                        <ScoreCell
                          value={job.opportunityQualityScore.value}
                          title={job.opportunityQualityScore.summary}
                        />
                      </Td>
                      <Td className="text-2xs text-muted-foreground">{EFFORT_LABEL[job.effort]}</Td>
                      <Td className="text-2xs text-muted-foreground">{formatAge(job.postedAt)}</Td>
                      <Td>
                        <RecommendationChip value={job.recommendation} />
                      </Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => toggleShortlist(job.id)}
                            title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            {shortlisted ? (
                              <BookmarkCheck size={13} className="text-[hsl(var(--ok))]" />
                            ) : (
                              <Bookmark size={13} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => toggleRejected(job.id)}
                            title={dismissed ? 'Undo dismiss' : 'Dismiss this listing'}
                            aria-label={dismissed ? 'Undo dismiss' : 'Dismiss this listing'}
                          >
                            <MinusCircle size={13} />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </div>

        <div className="scrollable w-[470px] shrink-0 border-l border-border">
          {selected ? (
            <JobIntelligencePanel
              job={selected}
              shortlisted={state.shortlistedJobIds.includes(selected.id)}
              dismissed={state.rejectedJobIds.includes(selected.id)}
              onToggleShortlist={() => toggleShortlist(selected.id)}
              onToggleDismiss={() => toggleRejected(selected.id)}
              onOpenApplication={(applicationId) => go('workspace', { applicationId })}
              onOpenOutreach={() => go('outreach', { jobId: selected.id })}
              onOpenStudio={() => go('resume-studio', { jobId: selected.id })}
            />
          ) : (
            <EmptyState title="Select a listing" hint="Job intelligence appears here." />
          )}
        </div>
      </div>
    </Screen>
  );
}

/* --------------------------- job intelligence ---------------------------- */

const QUALIFICATION_STYLE: Record<
  Qualification['match'],
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  met: { icon: CheckCircle2, className: 'text-[hsl(var(--ok))]', label: 'Supported by evidence' },
  partial: { icon: CircleHelp, className: 'text-[hsl(var(--warn))]', label: 'Partially supported' },
  missing: { icon: Ban, className: 'text-[hsl(var(--danger))]', label: 'You do not have this' },
  unsupported: {
    icon: AlertTriangle,
    className: 'text-[hsl(var(--ai))]',
    label: 'No evidence either way',
  },
};

function JobIntelligencePanel({
  job,
  shortlisted,
  dismissed,
  onToggleShortlist,
  onToggleDismiss,
  onOpenApplication,
  onOpenOutreach,
  onOpenStudio,
}: {
  job: Job;
  shortlisted: boolean;
  dismissed: boolean;
  onToggleShortlist(): void;
  onToggleDismiss(): void;
  onOpenApplication(applicationId: string): void;
  onOpenOutreach(): void;
  onOpenStudio(): void;
}) {
  const { state } = useStore();
  const application = state.applications.find((a) => a.jobId === job.id);
  const contacts = state.outreach.filter((c) => c.jobId === job.id);
  const doNotApply = job.recommendation === 'do-not-apply';

  return (
    <div className="space-y-3 p-3">
      <Panel>
        <PanelHeader
          icon={<Building2 size={13} />}
          title={job.title}
          subtitle={`${job.company} · ${job.location} · ${job.remote}`}
          actions={<RecommendationChip value={job.recommendation} />}
        />
        <div className="space-y-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={job.verification === 'verified' ? 'ok' : job.verification === 'suspicious' ? 'danger' : 'warn'}>
              {EMPLOYER_VERIFICATION_LABEL[job.verification]}
            </Badge>
            <Badge tone="muted">{JOB_SOURCE_LABEL[job.source]}</Badge>
            <Badge tone="muted">{formatMoney(job.salary)}</Badge>
            <Badge tone="muted">{EFFORT_LABEL[job.effort]}</Badge>
            {job.requiresClearance ? <Badge tone="danger">Clearance required</Badge> : null}
          </div>
          <p className="text-xs text-muted-foreground" data-selectable>
            {job.intelligence.roleSummary}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
            {application ? (
              <Button variant="primary" onClick={() => onOpenApplication(application.id)}>
                <Rocket size={13} />
                Open workspace
              </Button>
            ) : null}
            <Button variant={shortlisted ? 'outline' : 'secondary'} onClick={onToggleShortlist}>
              {shortlisted ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {shortlisted ? 'Shortlisted' : 'Shortlist'}
            </Button>
            <Button variant="ghost" onClick={onOpenStudio}>
              Tailor resume
            </Button>
            {contacts.length ? (
              <Button variant="ghost" onClick={onOpenOutreach}>
                <Users size={13} />
                {contacts.length} contact{contacts.length === 1 ? '' : 's'}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onToggleDismiss}>
              {dismissed ? 'Undo dismiss' : 'Dismiss'}
            </Button>
          </div>
          <p className="flex items-center gap-1 text-2xs text-muted-foreground">
            <ExternalLink size={10} />
            <code className="font-mono" data-selectable>
              {job.postingUrl}
            </code>{' '}
            — a bundled simulated posting, not a real employer site.
          </p>
        </div>
      </Panel>

      {/* The core transparency artefact. */}
      <Panel className={doNotApply ? 'border-[hsl(var(--danger)/0.55)]' : undefined}>
        <PanelHeader
          title="Why this recommendation?"
          subtitle={RECOMMENDATION_LABEL[job.recommendation]}
          icon={doNotApply ? <Ban size={13} className="text-[hsl(var(--danger))]" /> : undefined}
        />
        <div className="space-y-2 p-3">
          <ul className="space-y-1.5">
            {job.intelligence.recommendationRationale.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span
                  className={[
                    'mt-[6px] h-1 w-1 shrink-0 rounded-full',
                    doNotApply ? 'bg-[hsl(var(--danger))]' : 'bg-primary',
                  ].join(' ')}
                />
                <span data-selectable>{line}</span>
              </li>
            ))}
          </ul>
          {doNotApply ? (
            <p className="rounded border border-[hsl(var(--danger)/0.4)] bg-danger/10 px-2 py-1.5 text-2xs text-[hsl(var(--danger))]">
              No application scenario is wired to this listing. The agent will not open a form for
              a job it has recommended against — you would have to override the recommendation
              first.
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Score breakdown" subtitle="Each dimension stands on its own" />
        <div className="space-y-2 p-3">
          <ScoreDimensionView label="Fit with your evidence" dimension={job.fitScore} defaultOpen />
          <ScoreDimensionView
            label="Career direction alignment"
            dimension={job.careerDirectionScore}
          />
          <ScoreDimensionView
            label="Opportunity quality"
            dimension={job.opportunityQualityScore}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Qualifications (${job.intelligence.qualifications.length})`}
          subtitle="Matched against the vault, never assumed"
        />
        <div className="divide-y divide-border">
          {job.intelligence.qualifications.map((q, i) => {
            const style = QUALIFICATION_STYLE[q.match];
            const Icon = style.icon;
            return (
              <div key={i} className="space-y-1 px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <span className="mt-[2px] shrink-0" title={style.label}>
                    <Icon size={13} className={style.className} />
                  </span>
                  <span className="min-w-0 flex-1 text-xs" data-selectable>
                    {q.text}
                  </span>
                  <Badge tone={q.required ? 'warn' : 'muted'}>
                    {q.required ? 'Required' : 'Preferred'}
                  </Badge>
                </div>
                {q.note ? <p className="pl-5 text-2xs text-muted-foreground">{q.note}</p> : null}
                <div className="pl-5">
                  <EvidenceLinks factIds={q.evidenceFactIds} compact />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {job.intelligence.hardGates.length ? (
        <Panel>
          <PanelHeader title="Hard gates" subtitle="Checked before any effort is spent" />
          <div className="divide-y divide-border">
            {job.intelligence.hardGates.map((gate, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                <Badge
                  tone={
                    gate.status === 'eligible'
                      ? 'ok'
                      : gate.status === 'conditional'
                        ? 'warn'
                        : gate.status === 'ineligible'
                          ? 'danger'
                          : 'muted'
                  }
                >
                  {gate.status}
                </Badge>
                <div className="min-w-0">
                  <div className="font-medium">{gate.label}</div>
                  <div className="text-2xs text-muted-foreground" data-selectable>
                    {gate.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Research notes" />
        <div className="space-y-2.5 p-3 text-xs">
          <Expandable defaultOpen summary={<span className="text-xs font-medium">Company</span>}>
            <p className="text-2xs text-muted-foreground" data-selectable>
              {job.intelligence.companySummary}
            </p>
          </Expandable>
          <Expandable summary={<span className="text-xs font-medium">Team</span>}>
            <p className="text-2xs text-muted-foreground" data-selectable>
              {job.intelligence.teamSummary}
            </p>
          </Expandable>
          <Expandable
            summary={
              <span className="text-xs font-medium">
                Responsibilities ({job.intelligence.responsibilities.length})
              </span>
            }
          >
            <ul className="space-y-1">
              {job.intelligence.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-2xs text-muted-foreground">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  <span data-selectable>{r}</span>
                </li>
              ))}
            </ul>
          </Expandable>
          <Expandable
            summary={<span className="text-xs font-medium">Career direction analysis</span>}
          >
            <p className="text-2xs text-muted-foreground" data-selectable>
              {job.intelligence.careerDirectionAnalysis}
            </p>
          </Expandable>
          <Expandable
            summary={
              <span className="text-xs font-medium">
                Likely interview themes ({job.intelligence.likelyInterviewThemes.length})
              </span>
            }
          >
            <ul className="space-y-1">
              {job.intelligence.likelyInterviewThemes.map((t, i) => (
                <li key={i} className="text-2xs text-muted-foreground" data-selectable>
                  · {t}
                </li>
              ))}
            </ul>
          </Expandable>
          {job.intelligence.concerns.length ? (
            <Expandable
              defaultOpen
              summary={
                <span className="text-xs font-medium text-[hsl(var(--warn))]">
                  Concerns ({job.intelligence.concerns.length})
                </span>
              }
            >
              <ul className="space-y-1">
                {job.intelligence.concerns.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-2xs text-[hsl(var(--warn))]"
                  >
                    <AlertTriangle size={11} className="mt-[1px] shrink-0" />
                    <span data-selectable>{c}</span>
                  </li>
                ))}
              </ul>
            </Expandable>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Suggested approach" />
        <div className="space-y-2 p-3 text-xs">
          <div>
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              Resume strategy
            </span>
            <p className="mt-0.5">
              <Badge tone="info">
                {RESUME_STRATEGY_LABEL[job.intelligence.recommendedStrategy]}
              </Badge>
            </p>
          </div>
          <div>
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              Application difficulty
            </span>
            <p className="mt-0.5 text-2xs text-muted-foreground" data-selectable>
              {EFFORT_LABEL[job.intelligence.difficulty.level]} — {job.intelligence.difficulty.detail}
            </p>
          </div>
          <div>
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">Outreach</span>
            <p className="mt-0.5 text-2xs text-muted-foreground" data-selectable>
              {job.intelligence.recommendedOutreach}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
