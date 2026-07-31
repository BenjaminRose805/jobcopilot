import React from 'react';
import { Lightbulb, Minus, Target, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Badge,
  DataTable,
  Panel,
  PanelHeader,
  ScoreBar,
  Select,
  SimulatedNotice,
  Td,
  Th,
} from '@ui';
import {
  BREAKDOWN_LABEL,
  type Breakdown,
  type FunnelCounts,
  type HeadlineMetric,
  type InsightCard,
} from '@shared/analytics';
import { refreshAnalytics } from '@scoring';
import { formatDate } from '@shared/common';
import { Screen } from '../../components/Screen';
import { useStore } from '../../renderer/store';

const FUNNEL_STAGES: { key: keyof FunnelCounts; label: string; hint: string }[] = [
  { key: 'discovered', label: 'Discovered', hint: 'Listings surfaced by the simulated crawl today' },
  { key: 'recommended', label: 'Recommended', hint: 'Passed research and scoring' },
  { key: 'approved', label: 'Approved by you', hint: 'You authorised an application package' },
  { key: 'submitted', label: 'Submitted', hint: 'Sent to a simulated ATS' },
  { key: 'recruiterResponses', label: 'Responses', hint: 'A human replied' },
  { key: 'screens', label: 'Screens', hint: 'Reached a recruiter screen' },
  { key: 'interviews', label: 'Interviews', hint: 'Reached a real interview loop' },
  { key: 'offers', label: 'Offers', hint: 'Offer extended' },
];

export function AnalyticsScreen() {
  const { state } = useStore();

  // Recomputed from live application state so approvals made during this
  // session immediately move the north-star metric.
  const analytics = React.useMemo(() => {
    const prevented = state.applications.reduce(
      (sum, app) =>
        sum + app.timeline.filter((e) => e.kind === 'unsupported-claim-detected').length,
      0,
    );
    return refreshAnalytics(state.analytics, state.jobs, state.applications, prevented);
  }, [state.analytics, state.jobs, state.applications]);

  const [dimension, setDimension] = React.useState(
    analytics.breakdowns[0]?.dimension ?? 'resume-strategy',
  );
  const breakdown =
    analytics.breakdowns.find((b) => b.dimension === dimension) ?? analytics.breakdowns[0];

  return (
    <Screen
      title="Analytics"
      description="Effectiveness of the search, measured against the only metric that matters: qualified interviews per hour of your attention — not applications sent per day."
      actions={<Badge tone="ai">Simulated data</Badge>}
    >
      <div className="space-y-3">
        <SimulatedNotice>
          Every number on this screen is derived from the bundled demo fixtures and from what you
          have done in this session. No live tracking, no third-party analytics, nothing leaves this
          machine.
        </SimulatedNotice>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-3 2xl:grid-cols-6">
          {analytics.headline.map((metric) => (
            <HeadlineCard key={metric.id} metric={metric} />
          ))}
        </div>

        <FunnelPanel funnel={analytics.funnel} />

        <Panel>
          <PanelHeader
            title="Breakdowns"
            subtitle="Where your time is actually converting"
            actions={
              <Select
                className="h-7 w-56 text-2xs"
                value={dimension}
                onChange={(e) => setDimension(e.target.value as typeof dimension)}
                aria-label="Breakdown dimension"
              >
                {analytics.breakdowns.map((b) => (
                  <option key={b.dimension} value={b.dimension}>
                    {BREAKDOWN_LABEL[b.dimension]}
                  </option>
                ))}
              </Select>
            }
          />
          {breakdown ? <BreakdownTable breakdown={breakdown} /> : null}
        </Panel>

        <div>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb size={13} />
            Written insights ({analytics.insights.length})
          </h2>
          <div className="grid gap-2 xl:grid-cols-2">
            {analytics.insights.map((insight) => (
              <InsightPanel key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------- headline -------------------------------- */

function HeadlineCard({ metric }: { metric: HeadlineMetric }) {
  const TrendIcon =
    metric.trend?.direction === 'up'
      ? TrendingUp
      : metric.trend?.direction === 'down'
        ? TrendingDown
        : Minus;
  return (
    <div
      className={[
        'rounded border p-2.5',
        metric.emphasis
          ? 'border-primary/60 bg-primary/10'
          : 'border-border bg-surface',
      ].join(' ')}
      title={metric.basis}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {metric.label}
        </span>
        {metric.emphasis ? <Target size={12} className="shrink-0 text-primary" /> : null}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</div>
      <p className="mt-0.5 text-2xs text-muted-foreground">{metric.basis}</p>
      {metric.trend ? (
        <div
          className={[
            'mt-1 flex items-start gap-1 text-2xs',
            metric.trend.direction === 'up'
              ? 'text-[hsl(var(--ok))]'
              : metric.trend.direction === 'down'
                ? 'text-[hsl(var(--danger))]'
                : 'text-muted-foreground',
          ].join(' ')}
        >
          <TrendIcon size={11} className="mt-[1px] shrink-0" />
          <span>{metric.trend.detail}</span>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- funnel -------------------------------- */

function FunnelPanel({ funnel }: { funnel: FunnelCounts }) {
  const max = Math.max(...FUNNEL_STAGES.map((s) => funnel[s.key]), 1);
  return (
    <Panel>
      <PanelHeader
        title="Pipeline funnel"
        subtitle="Discovered → recommended → approved → submitted → response → screen → interview → offer"
      />
      <div className="space-y-1.5 p-3">
        {FUNNEL_STAGES.map((stage, i) => {
          const value = funnel[stage.key];
          const prev = i === 0 ? null : funnel[FUNNEL_STAGES[i - 1].key];
          const conversion = prev && prev > 0 ? Math.round((value / prev) * 100) : null;
          return (
            <div key={stage.key} className="flex items-center gap-2" title={stage.hint}>
              <span className="w-32 shrink-0 text-2xs text-muted-foreground">{stage.label}</span>
              <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">
                {value}
              </span>
              <div className="min-w-0 flex-1">
                <ScoreBar value={(value / max) * 100} tone={i >= 5 ? 'ok' : 'primary'} />
              </div>
              <span className="w-20 shrink-0 text-right text-2xs text-muted-foreground tabular-nums">
                {conversion === null ? '' : `${conversion}% of prev`}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ------------------------------- breakdown ------------------------------- */

function BreakdownTable({ breakdown }: { breakdown: Breakdown }) {
  return (
    <DataTable>
      <thead>
        <tr>
          <Th>{BREAKDOWN_LABEL[breakdown.dimension]}</Th>
          <Th>Submitted</Th>
          <Th>Responses</Th>
          <Th>Interviews</Th>
          <Th title="Minutes of your own attention spent on this bucket">Your minutes</Th>
          <Th title="Interviews divided by hours of your attention">Interviews / hour</Th>
        </tr>
      </thead>
      <tbody>
        {breakdown.rows.map((row) => {
          const perHour = row.userMinutes ? row.interviews / (row.userMinutes / 60) : 0;
          return (
            <tr key={row.label} className="row-hover border-b border-border">
              <Td className="font-medium">{row.label}</Td>
              <Td className="tabular-nums">{row.submitted}</Td>
              <Td className="tabular-nums">{row.responses}</Td>
              <Td className="tabular-nums">{row.interviews}</Td>
              <Td className="tabular-nums">{row.userMinutes}</Td>
              <Td className="tabular-nums">{perHour.toFixed(2)}</Td>
            </tr>
          );
        })}
        {breakdown.rows.length === 0 ? (
          <tr>
            <Td colSpan={6} className="text-2xs text-muted-foreground">
              Not enough history in this dimension yet.
            </Td>
          </tr>
        ) : null}
      </tbody>
    </DataTable>
  );
}

/* -------------------------------- insights ------------------------------- */

function InsightPanel({ insight }: { insight: InsightCard }) {
  return (
    <Panel>
      <PanelHeader
        title={insight.title}
        subtitle={`Written ${formatDate(insight.createdAt)}`}
        actions={
          <Badge
            tone={
              insight.confidence === 'high' ? 'ok' : insight.confidence === 'medium' ? 'info' : 'warn'
            }
          >
            {insight.confidence} confidence
          </Badge>
        }
      />
      <div className="space-y-2 p-3">
        <p className="text-xs" data-selectable>
          {insight.body}
        </p>
        <ul className="space-y-0.5">
          {insight.evidence.map((e, i) => (
            <li key={i} className="text-2xs text-muted-foreground" data-selectable>
              · {e}
            </li>
          ))}
        </ul>
        {insight.suggestedAction ? (
          <p className="rounded border border-dashed border-border px-2 py-1.5 text-2xs">
            <strong>Suggested:</strong> {insight.suggestedAction}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
