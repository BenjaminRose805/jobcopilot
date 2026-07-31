import type { ISODate } from './common';

export interface FunnelCounts {
  discovered: number;
  recommended: number;
  approved: number;
  submitted: number;
  recruiterResponses: number;
  screens: number;
  interviews: number;
  offers: number;
}

export type BreakdownDimension =
  | 'resume-strategy'
  | 'job-family'
  | 'fit-score-range'
  | 'career-direction-range'
  | 'source'
  | 'company-size'
  | 'salary-range'
  | 'remote-status'
  | 'posting-age'
  | 'outreach'
  | 'contact-type';

export const BREAKDOWN_LABEL: Record<BreakdownDimension, string> = {
  'resume-strategy': 'Resume strategy',
  'job-family': 'Job family',
  'fit-score-range': 'Fit score range',
  'career-direction-range': 'Career-direction score range',
  source: 'Job source',
  'company-size': 'Company size',
  'salary-range': 'Salary range',
  'remote-status': 'Remote status',
  'posting-age': 'Posting age at application',
  outreach: 'Outreach vs none',
  'contact-type': 'Contact type',
};

export interface BreakdownRow {
  label: string;
  submitted: number;
  responses: number;
  interviews: number;
  /** Minutes of the user's own attention attributed to this bucket. */
  userMinutes: number;
}

export interface Breakdown {
  dimension: BreakdownDimension;
  rows: BreakdownRow[];
}

export interface HeadlineMetric {
  id: string;
  label: string;
  value: string;
  /** Short explanation of how the number is computed. */
  basis: string;
  trend?: { direction: 'up' | 'down' | 'flat'; detail: string };
  /** The product's north-star metric gets visual emphasis. */
  emphasis?: boolean;
}

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  evidence: string[];
  suggestedAction?: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: ISODate;
}

export interface AnalyticsBundle {
  funnel: FunnelCounts;
  headline: HeadlineMetric[];
  breakdowns: Breakdown[];
  insights: InsightCard[];
}
