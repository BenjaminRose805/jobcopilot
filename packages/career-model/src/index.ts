import type { ConfidenceLevel, ISODate, VerificationStatus } from '@shared/common';

export type CareerFactCategory =
  | 'employment'
  | 'project'
  | 'accomplishment'
  | 'responsibility'
  | 'skill'
  | 'technology'
  | 'certification'
  | 'education'
  | 'portfolio'
  | 'github-project'
  | 'interview-story'
  | 'career-preference'
  | 'work-authorization'
  | 'location-preference'
  | 'compensation-preference';

export const CAREER_FACT_CATEGORY_LABEL: Record<CareerFactCategory, string> = {
  employment: 'Employment',
  project: 'Projects',
  accomplishment: 'Accomplishments',
  responsibility: 'Responsibilities',
  skill: 'Skills',
  technology: 'Technologies',
  certification: 'Certifications',
  education: 'Education',
  portfolio: 'Portfolio',
  'github-project': 'GitHub projects',
  'interview-story': 'Interview stories',
  'career-preference': 'Career preferences',
  'work-authorization': 'Work authorization',
  'location-preference': 'Location preferences',
  'compensation-preference': 'Compensation preferences',
};

export type FactSource =
  | 'resume-import'
  | 'user-entered'
  | 'linkedin-import'
  | 'github-import'
  | 'performance-review'
  | 'ai-inference'
  | 'interview-debrief';

export const FACT_SOURCE_LABEL: Record<FactSource, string> = {
  'resume-import': 'Resume import',
  'user-entered': 'Entered by user',
  'linkedin-import': 'Profile import',
  'github-import': 'Repository import',
  'performance-review': 'Performance review',
  'ai-inference': 'AI inference',
  'interview-debrief': 'Interview debrief',
};

/** Resume positioning strategies the candidate maintains. */
export type ResumeStrategyId =
  | 'security-platform'
  | 'devsecops'
  | 'ai-platform'
  | 'developer-productivity'
  | 'cloud-security'
  | 'general-senior-swe';

export const RESUME_STRATEGY_LABEL: Record<ResumeStrategyId, string> = {
  'security-platform': 'Security Platform',
  devsecops: 'DevSecOps',
  'ai-platform': 'AI Platform',
  'developer-productivity': 'Developer Productivity',
  'cloud-security': 'Cloud Security',
  'general-senior-swe': 'General Senior SWE',
};

/**
 * A single unit of evidence about the candidate. Every generated answer and
 * every tailored resume bullet must trace back to one or more of these.
 */
export interface CareerFact {
  id: string;
  category: CareerFactCategory;
  title: string;
  description: string;
  /** Employer or project the fact belongs to. */
  context?: string;
  startDate?: ISODate;
  endDate?: ISODate | null;
  source: FactSource;
  confidence: ConfidenceLevel;
  verification: VerificationStatus;
  tags: string[];
  allowedStrategies: ResumeStrategyId[];
  relatedFactIds: string[];
  /** Set when `verification === 'conflicting'`; explains the disagreement. */
  conflictNote?: string;
  /**
   * Explicit ceiling on how strongly this fact may be claimed. Used by the
   * scenario engine to refuse over-claiming (e.g. exposure vs ownership).
   */
  claimCeiling?: string;
  lastUpdated: ISODate;
  updatedBy: 'user' | 'system';
}

export interface ResumeBullet {
  id: string;
  text: string;
  evidenceFactIds: string[];
  keywords: string[];
}

export interface ResumeSection {
  id: string;
  heading: string;
  kind: 'summary' | 'experience' | 'skills' | 'projects' | 'education';
  subtitle?: string;
  bullets: ResumeBullet[];
}

export interface ResumeStrategyPerformance {
  applicationsSubmitted: number;
  recruiterResponses: number;
  interviews: number;
  offers: number;
}

export function responseRate(p: ResumeStrategyPerformance): number {
  return p.applicationsSubmitted ? p.recruiterResponses / p.applicationsSubmitted : 0;
}

export function interviewRate(p: ResumeStrategyPerformance): number {
  return p.applicationsSubmitted ? p.interviews / p.applicationsSubmitted : 0;
}

export interface ResumeStrategy {
  id: ResumeStrategyId;
  name: string;
  positioning: string;
  targetJobFamilies: string[];
  includedSkills: string[];
  preferredFactIds: string[];
  baseResume: ResumeSection[];
  performance: ResumeStrategyPerformance;
  lastUpdated: ISODate;
}

export type DiffChangeKind = 'added' | 'removed' | 'reordered' | 'reworded';

export type DiffChangeDecision = 'pending' | 'approved' | 'rejected' | 'edited' | 'job-only';

/** One proposed edit between a base resume and a job-tailored resume. */
export interface ResumeDiffChange {
  id: string;
  kind: DiffChangeKind;
  sectionHeading: string;
  baseText?: string;
  proposedText?: string;
  /** Present when the user hand-edited the proposal. */
  userEditedText?: string;
  evidenceFactIds: string[];
  confidence: ConfidenceLevel;
  rationale: string;
  concerns: string[];
  keywordsCovered: string[];
  decision: DiffChangeDecision;
  /**
   * Set when the model declined to make a stronger claim. Rendered as a
   * prominent refusal card rather than an approvable change.
   */
  refusal?: {
    requestedText: string;
    reason: string;
    supportedAlternative: string;
    blockingFactIds: string[];
  };
}

export interface TailoredResume {
  id: string;
  jobId: string;
  strategyId: ResumeStrategyId;
  createdAt: ISODate;
  changes: ResumeDiffChange[];
  keywordCoverage: { keyword: string; inBase: boolean; inTailored: boolean; requiredByJob: boolean }[];
}
