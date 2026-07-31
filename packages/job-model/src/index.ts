import type {
  CompanySize,
  ISODate,
  Money,
  RemoteStatus,
  Seniority,
} from '@shared/common';
import type { ResumeStrategyId } from '@career-model';

export type JobFamily =
  | 'security-platform'
  | 'devsecops'
  | 'ai-platform'
  | 'developer-productivity'
  | 'cloud-security'
  | 'ai-agent-infrastructure'
  | 'senior-software-engineering'
  | 'site-reliability';

export const JOB_FAMILY_LABEL: Record<JobFamily, string> = {
  'security-platform': 'Security Platform Engineer',
  devsecops: 'DevSecOps Engineer',
  'ai-platform': 'AI Platform Engineer',
  'developer-productivity': 'Developer Productivity Engineer',
  'cloud-security': 'Cloud Security Engineer',
  'ai-agent-infrastructure': 'AI Agent Infrastructure Engineer',
  'senior-software-engineering': 'Senior Software Engineer',
  'site-reliability': 'Site Reliability Engineer',
};

export type EmployerVerification = 'verified' | 'unverified' | 'aggregator-only' | 'suspicious';

export const EMPLOYER_VERIFICATION_LABEL: Record<EmployerVerification, string> = {
  verified: 'Verified on employer site',
  unverified: 'Not yet verified',
  'aggregator-only': 'Aggregator listing only',
  suspicious: 'Possible ghost listing',
};

export type EligibilityStatus = 'eligible' | 'conditional' | 'ineligible' | 'unknown';

export type JobRecommendation =
  | 'priority-apply'
  | 'apply'
  | 'apply-with-referral'
  | 'stretch'
  | 'low-value'
  | 'do-not-apply';

export const RECOMMENDATION_LABEL: Record<JobRecommendation, string> = {
  'priority-apply': 'Priority apply',
  apply: 'Apply',
  'apply-with-referral': 'Apply only with referral',
  stretch: 'Stretch opportunity',
  'low-value': 'Low strategic value',
  'do-not-apply': 'Do not apply',
};

export type JobSource =
  | 'employer-careers-page'
  | 'ats-feed'
  | 'aggregator'
  | 'referral-network'
  | 'community-board';

export const JOB_SOURCE_LABEL: Record<JobSource, string> = {
  'employer-careers-page': 'Employer careers page',
  'ats-feed': 'ATS feed',
  aggregator: 'Aggregator',
  'referral-network': 'Referral network',
  'community-board': 'Community board',
};

export type ApplicationEffort = 'low' | 'medium' | 'high' | 'very-high';

/**
 * A separately explained score dimension. The product deliberately never shows
 * a single unexplained "match %".
 */
export interface ScoreDimension {
  /** 0–100. */
  value: number;
  summary: string;
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
}

export interface Qualification {
  text: string;
  /** Whether the posting lists this as required or preferred. */
  required: boolean;
  /**
   * `met` — directly supported by verified evidence.
   * `partial` — related but weaker evidence exists.
   * `missing` — the candidate genuinely lacks it.
   * `unsupported` — the vault has no evidence either way (distinct from missing).
   */
  match: 'met' | 'partial' | 'missing' | 'unsupported';
  evidenceFactIds: string[];
  note?: string;
}

export interface JobIntelligence {
  roleSummary: string;
  companySummary: string;
  teamSummary: string;
  responsibilities: string[];
  qualifications: Qualification[];
  hardGates: { label: string; status: EligibilityStatus; detail: string }[];
  concerns: string[];
  careerDirectionAnalysis: string;
  likelyInterviewThemes: string[];
  difficulty: { level: ApplicationEffort; detail: string };
  recommendedStrategy: ResumeStrategyId;
  recommendedOutreach: string;
  recommendation: JobRecommendation;
  /** Content of the "Why this recommendation?" expandable panel. */
  recommendationRationale: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companySize: CompanySize;
  location: string;
  remote: RemoteStatus;
  seniority: Seniority;
  family: JobFamily;
  salary: Money | null;
  postedAt: ISODate;
  discoveredAt: ISODate;
  deadline?: ISODate | null;
  source: JobSource;
  verification: EmployerVerification;
  requiresClearance: boolean;
  /** `mock://` URL of the simulated posting page. */
  postingUrl: string;
  /** `mock://` URL of the simulated application form. */
  applyUrl: string;
  atsVendor: 'brightgate' | 'northwind' | 'lattis' | 'internal';
  fitScore: ScoreDimension;
  careerDirectionScore: ScoreDimension;
  opportunityQualityScore: ScoreDimension;
  effort: ApplicationEffort;
  eligibility: EligibilityStatus;
  hasOutreachOpportunity: boolean;
  recommendedStrategy: ResumeStrategyId;
  recommendation: JobRecommendation;
  tags: string[];
  intelligence: JobIntelligence;
}

export const EFFORT_LABEL: Record<ApplicationEffort, string> = {
  low: 'Low (~5 min)',
  medium: 'Medium (~15 min)',
  high: 'High (~35 min)',
  'very-high': 'Very high (60 min+)',
};
