import type { Job, ScoreDimension } from '@job-model';
import type { Application } from '@shared/application';
import type { AnalyticsBundle, BreakdownRow, FunnelCounts } from '@shared/analytics';

export type ScoreBand = 'strong' | 'good' | 'mixed' | 'weak';

export function scoreBand(value: number): ScoreBand {
  if (value >= 80) return 'strong';
  if (value >= 65) return 'good';
  if (value >= 45) return 'mixed';
  return 'weak';
}

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  strong: 'Strong',
  good: 'Good',
  mixed: 'Mixed',
  weak: 'Weak',
};

/**
 * Composite used only for default table ordering. It is never displayed as a
 * headline "match %" — the three dimensions are always shown separately.
 */
export function rankingScore(job: Job): number {
  return (
    job.fitScore.value * 0.4 +
    job.careerDirectionScore.value * 0.35 +
    job.opportunityQualityScore.value * 0.25
  );
}

export function dimensionSummary(d: ScoreDimension): string {
  const pos = d.factors.filter((f) => f.impact === 'positive').length;
  const neg = d.factors.filter((f) => f.impact === 'negative').length;
  return `${pos} supporting factor${pos === 1 ? '' : 's'}, ${neg} detracting`;
}

/* ------------------------- analytics derivation ------------------------- */

const SUBMITTED_STATUSES = new Set([
  'submitted',
  'acknowledged',
  'recruiter-response',
  'screening',
  'interviewing',
  'offer',
  'rejected',
]);

const RESPONDED_STATUSES = new Set([
  'recruiter-response',
  'screening',
  'interviewing',
  'offer',
]);

const INTERVIEW_STATUSES = new Set(['interviewing', 'offer']);

export function isSubmitted(app: Application): boolean {
  return SUBMITTED_STATUSES.has(app.status);
}

export function hasResponse(app: Application): boolean {
  return RESPONDED_STATUSES.has(app.status);
}

export function reachedInterview(app: Application): boolean {
  return INTERVIEW_STATUSES.has(app.status);
}

export function computeFunnel(
  jobs: Job[],
  applications: Application[],
  discoveredToday: number,
): FunnelCounts {
  const submitted = applications.filter(isSubmitted);
  return {
    discovered: discoveredToday,
    recommended: jobs.filter(
      (j) => j.recommendation === 'apply' || j.recommendation === 'priority-apply',
    ).length,
    approved: applications.filter(
      (a) => isSubmitted(a) || a.status === 'awaiting-approval',
    ).length,
    submitted: submitted.length,
    recruiterResponses: applications.filter(hasResponse).length,
    screens: applications.filter((a) => a.status === 'screening' || reachedInterview(a)).length,
    interviews: applications.filter(reachedInterview).length,
    offers: applications.filter((a) => a.status === 'offer').length,
  };
}

export function bucketRow(label: string, apps: Application[]): BreakdownRow {
  return {
    label,
    submitted: apps.filter(isSubmitted).length,
    responses: apps.filter(hasResponse).length,
    interviews: apps.filter(reachedInterview).length,
    userMinutes: apps.reduce((sum, a) => sum + a.userMinutesSpent, 0),
  };
}

/**
 * The product's north-star metric: qualified interviews per hour of the user's
 * own attention — not applications submitted per day.
 */
export function qualifiedInterviewsPerHour(applications: Application[]): number {
  const minutes = applications.reduce((s, a) => s + a.userMinutesSpent, 0);
  if (minutes === 0) return 0;
  return applications.filter(reachedInterview).length / (minutes / 60);
}

export function interviewsPerApplication(applications: Application[]): number {
  const submitted = applications.filter(isSubmitted).length;
  if (!submitted) return 0;
  return applications.filter(reachedInterview).length / submitted;
}

export function correctionRate(applications: Application[]): number {
  const answers = applications.flatMap((a) => a.screeningAnswers);
  if (!answers.length) return 0;
  return answers.filter((a) => a.correctedByUser).length / answers.length;
}

export function defectRate(applications: Application[]): number {
  const submitted = applications.filter(isSubmitted);
  if (!submitted.length) return 0;
  return submitted.filter((a) => a.defects.length > 0).length / submitted.length;
}

export function averageUserMinutes(applications: Application[]): number {
  const submitted = applications.filter(isSubmitted);
  if (!submitted.length) return 0;
  return submitted.reduce((s, a) => s + a.userMinutesSpent, 0) / submitted.length;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function ratio(n: number, digits = 2): string {
  return n.toFixed(digits);
}

/** Recomputes the numeric parts of the analytics bundle from live app state. */
export function refreshAnalytics(
  base: AnalyticsBundle,
  jobs: Job[],
  applications: Application[],
  unsupportedClaimsPrevented: number,
): AnalyticsBundle {
  const discoveredToday = jobs.filter(
    (j) => new Date(j.discoveredAt).toDateString() === new Date().toDateString(),
  ).length;
  const funnel = computeFunnel(jobs, applications, discoveredToday || base.funnel.discovered);

  const headline = base.headline.map((m) => {
    switch (m.id) {
      case 'interviews-per-application':
        return { ...m, value: ratio(interviewsPerApplication(applications)) };
      case 'qualified-interviews-per-hour':
        return { ...m, value: ratio(qualifiedInterviewsPerHour(applications)) };
      case 'user-correction-rate':
        return { ...m, value: pct(correctionRate(applications)) };
      case 'application-defect-rate':
        return { ...m, value: pct(defectRate(applications)) };
      case 'avg-user-minutes':
        return { ...m, value: `${Math.round(averageUserMinutes(applications))} min` };
      case 'unsupported-claims-prevented':
        return { ...m, value: String(unsupportedClaimsPrevented) };
      default:
        return m;
    }
  });

  return { ...base, funnel, headline };
}
