import type { ConfidenceLevel, ISODate } from './common';

export type ContactRole =
  | 'recruiter'
  | 'hiring-manager'
  | 'team-director'
  | 'potential-peer'
  | 'former-colleague'
  | 'alumni-connection'
  | 'second-degree-connection';

export const CONTACT_ROLE_LABEL: Record<ContactRole, string> = {
  recruiter: 'Recruiter',
  'hiring-manager': 'Hiring manager',
  'team-director': 'Team director',
  'potential-peer': 'Potential peer',
  'former-colleague': 'Former colleague',
  'alumni-connection': 'Alumni connection',
  'second-degree-connection': 'Second-degree connection',
};

export type OutreachChannel = 'linkedin' | 'email' | 'conference' | 'referral-portal';

export const OUTREACH_CHANNEL_LABEL: Record<OutreachChannel, string> = {
  linkedin: 'Professional network (manual send)',
  email: 'Email (draft only)',
  conference: 'Event / conference',
  'referral-portal': 'Employee referral portal',
};

export type OutreachGoal =
  | 'ask-for-info'
  | 'request-referral'
  | 'contact-recruiter'
  | 'intro-to-hiring-manager'
  | 'follow-up-after-applying';

export const OUTREACH_GOAL_LABEL: Record<OutreachGoal, string> = {
  'ask-for-info': 'Ask for information',
  'request-referral': 'Request a referral',
  'contact-recruiter': 'Contact recruiter',
  'intro-to-hiring-manager': 'Introduction to hiring manager',
  'follow-up-after-applying': 'Follow up after applying',
};

export type OutreachApprovalState = 'draft' | 'needs-review' | 'approved' | 'sent-manually' | 'declined';

export const OUTREACH_APPROVAL_LABEL: Record<OutreachApprovalState, string> = {
  draft: 'Draft',
  'needs-review': 'Needs review',
  approved: 'Approved (ready for you to send)',
  'sent-manually': 'Marked sent by you',
  declined: 'Declined',
};

/** Explains why a specific sentence in a draft exists. Prevents generic filler. */
export interface PersonalizationBasis {
  sentence: string;
  basis: string;
  sourceLabel: string;
  confidence: ConfidenceLevel;
}

export interface OutreachContact {
  id: string;
  jobId: string;
  name: string;
  title: string;
  company: string;
  role: ContactRole;
  whyRelevant: string;
  contactSource: string;
  confidence: ConfidenceLevel;
  recommendedChannel: OutreachChannel;
  goal: OutreachGoal;
  draftMessage: string;
  personalization: PersonalizationBasis[];
  approvalState: OutreachApprovalState;
  followUpDate?: ISODate | null;
  profileUrl?: string;
  lastUpdated: ISODate;
  /** Populated when the contact has replied in the mock dataset. */
  response?: { at: ISODate; body: string; sentiment: 'positive' | 'neutral' | 'negative' };
}
