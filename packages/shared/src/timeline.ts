import type { ConfidenceLevel, ISODate } from './common';

/** Every meaningful agent or user action produces exactly one of these. */
export type TimelineEventKind =
  | 'job-opened'
  | 'employer-page-verified'
  | 'resume-strategy-selected'
  | 'resume-uploaded'
  | 'contact-field-completed'
  | 'answer-retrieved'
  | 'confidence-check-passed'
  | 'unsupported-claim-detected'
  | 'approval-requested'
  | 'user-took-control'
  | 'user-corrected-answer'
  | 'reusable-preference-saved'
  | 'control-returned'
  | 'submission-approved'
  | 'confirmation-detected'
  | 'crm-updated'
  | 'agent-paused'
  | 'agent-resumed'
  | 'question-skipped'
  | 'application-aborted'
  | 'page-state-observed'
  | 'human-review-required'
  | 'research-completed'
  | 'note';

export const TIMELINE_KIND_LABEL: Record<TimelineEventKind, string> = {
  'job-opened': 'Job opened',
  'employer-page-verified': 'Employer page verified',
  'resume-strategy-selected': 'Resume strategy selected',
  'resume-uploaded': 'Resume uploaded',
  'contact-field-completed': 'Contact field completed',
  'answer-retrieved': 'Answer retrieved from Career Vault',
  'confidence-check-passed': 'Confidence check passed',
  'unsupported-claim-detected': 'Unsupported claim detected',
  'approval-requested': 'Approval requested',
  'user-took-control': 'User took control',
  'user-corrected-answer': 'User corrected answer',
  'reusable-preference-saved': 'Reusable preference saved',
  'control-returned': 'Control returned to agent',
  'submission-approved': 'Submission approved',
  'confirmation-detected': 'Confirmation detected',
  'crm-updated': 'CRM updated',
  'agent-paused': 'Agent paused',
  'agent-resumed': 'Agent resumed',
  'question-skipped': 'Question skipped',
  'application-aborted': 'Application aborted',
  'page-state-observed': 'Page state observed',
  'human-review-required': 'Human review required',
  'research-completed': 'Research completed',
  note: 'Note',
};

export type TimelineStatus = 'ok' | 'warning' | 'blocked' | 'info' | 'action-required';

export type TimelineSource = 'agent' | 'user' | 'system' | 'page';

export interface TimelineEvent {
  id: string;
  timestamp: ISODate;
  kind: TimelineEventKind;
  status: TimelineStatus;
  source: TimelineSource;
  title: string;
  confidence?: ConfidenceLevel;
  /** Expandable body. Rendered only when the row is expanded. */
  details: string;
  /** Career Vault fact ids backing this event, if any. */
  evidenceFactIds?: string[];
  /** Free-form key/value rows rendered in the expanded panel. */
  meta?: { label: string; value: string }[];
  expandable: boolean;
}
