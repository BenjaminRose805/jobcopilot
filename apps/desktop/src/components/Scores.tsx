import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Expandable, ScoreBar } from '@ui';
import { scoreBand, SCORE_BAND_LABEL } from '@scoring';
import type { ScoreDimension } from '@job-model';

const BAND_TONE = {
  strong: 'ok',
  good: 'primary',
  mixed: 'warn',
  weak: 'danger',
} as const;

/**
 * A single explained score dimension.
 *
 * The product deliberately never renders one unexplained "match %": each
 * dimension is shown separately and every one can be expanded to the factors
 * that produced it.
 */
export function ScoreDimensionView({
  label,
  dimension,
  defaultOpen,
}: {
  label: string;
  dimension: ScoreDimension;
  defaultOpen?: boolean;
}) {
  const band = scoreBand(dimension.value);
  return (
    <div className="rounded border border-border bg-surface p-2.5">
      <Expandable
        defaultOpen={defaultOpen}
        summary={
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-semibold tabular-nums">
                {dimension.value}
                <span className="text-2xs font-normal text-muted-foreground">/100</span>
              </span>
            </div>
            <ScoreBar value={dimension.value} tone={BAND_TONE[band]} className="mt-1.5" />
            <div className="mt-1 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
              <span className="min-w-0 truncate">{dimension.summary}</span>
              <span className="shrink-0">{SCORE_BAND_LABEL[band]}</span>
            </div>
          </div>
        }
      >
        <ul className="space-y-1.5">
          {dimension.factors.map((factor, i) => {
            const Icon =
              factor.impact === 'positive'
                ? TrendingUp
                : factor.impact === 'negative'
                  ? TrendingDown
                  : Minus;
            const color =
              factor.impact === 'positive'
                ? 'text-[hsl(var(--ok))]'
                : factor.impact === 'negative'
                  ? 'text-[hsl(var(--danger))]'
                  : 'text-muted-foreground';
            return (
              <li key={i} className="flex gap-1.5">
                <Icon size={12} className={`mt-[2px] shrink-0 ${color}`} />
                <div className="min-w-0">
                  <div className="text-2xs font-medium">{factor.label}</div>
                  <div className="text-2xs text-muted-foreground" data-selectable>
                    {factor.detail}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Expandable>
    </div>
  );
}

/** Dense inline version used in table cells. */
export function ScoreCell({ value, title }: { value: number; title: string }) {
  const band = scoreBand(value);
  return (
    <div className="w-[74px]" title={title}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium tabular-nums">{value}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          {SCORE_BAND_LABEL[band]}
        </span>
      </div>
      <ScoreBar value={value} tone={BAND_TONE[band]} className="mt-0.5" />
    </div>
  );
}
