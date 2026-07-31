import type { ConfidenceLevel, ISODate } from './common';
import type { TimelineEvent } from './timeline';
import type { ResumeStrategyId } from '@career-model';

export type ApplicationStatus =
  | 'discovered'
  | 'researching'
  | 'shortlisted'
  | 'preparing'
  | 'awaiting-approval'
  | 'waiting-for-user'
  | 'submitted'
  | 'acknowledged'
  | 'recruiter-response'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'stale';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  discovered: 'Discovered',
  researching: 'Researching',
  shortlisted: 'Shortlisted',
  preparing: 'Preparing',
  'awaiting-approval': 'Awaiting approval',
  'waiting-for-user': 'Waiting for user',
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  'recruiter-response': 'Recruiter response',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  stale: 'Stale',
};

/** Ordered pipeline used by the CRM board. */
export const APPLICATION_PIPELINE: ApplicationStatus[] = [
  'discovered',
  'researching',
  'shortlisted',
  'preparing',
  'awaiting-approval',
  'waiting-for-user',
  'submitted',
  'acknowledged',
  'recruiter-response',
  'screening',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
  'stale',
];

export interface ScreeningAnswer {
  id: string;
  question: string;
  answer: string;
  /** Answer originally proposed by the agent, kept even after a user edit. */
  proposedAnswer?: string;
  confidence: ConfidenceLevel;
  evidenceFactIds: string[];
  reasoning: string;
  answeredBy: 'agent' | 'user';
  correctedByUser: boolean;
  answeredAt: ISODate;
}

export interface UserCorrection {
  id: string;
  at: ISODate;
  field: string;
  before: string;
  after: string;
  reason?: string;
}

export interface InterviewNote {
  id: string;
  at: ISODate;
  stage: string;
  interviewer: string;
  notes: string;
}

export interface AuditEntry {
  id: string;
  at: ISODate;
  actor: 'agent' | 'user' | 'system';
  action: string;
  detail?: string;
}

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  submittedAt?: ISODate | null;
  strategyId: ResumeStrategyId;
  tailoredResumeId?: string;
  /** Snapshot of the posting text at discovery time. */
  postingSnapshot: string;
  coverLetter?: string;
  screeningAnswers: ScreeningAnswer[];
  timeline: TimelineEvent[];
  corrections: UserCorrection[];
  outreachContactIds: string[];
  interviewNotes: InterviewNote[];
  audit: AuditEntry[];
  outcome?: string;
  /** Scenario definition to run when the workspace is opened for this app. */
  scenarioId?: string;
  /** Minutes of the user's own attention spent, used by the analytics screen. */
  userMinutesSpent: number;
  nextFollowUp?: ISODate | null;
  interviewAt?: ISODate | null;
  defects: string[];
}
