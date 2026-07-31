import type { Job } from '@job-model';
import type { CareerFact, ResumeStrategy, TailoredResume } from '@career-model';
import type { Application } from './application';
import type { OutreachContact } from './outreach';
import type { AutonomySettings } from './autonomy';
import type { StoredPreference } from './preferences';
import type { AnalyticsBundle } from './analytics';
import type { ISODate } from './common';

export interface CandidateProfile {
  name: string;
  headline: string;
  currentEmployer: string;
  currentTitle: string;
  location: string;
  /** Deliberately fake placeholder contact details. */
  email: string;
  phone: string;
  portfolio: string;
  github: string;
  workAuthorization: string;
  yearsExperience: number;
}

export interface InterviewEvent {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  stage: string;
  at: ISODate;
  interviewer: string;
  prepNotes: string[];
}

export interface RecruiterResponse {
  id: string;
  applicationId: string;
  contactId?: string;
  from: string;
  at: ISODate;
  subject: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  handled: boolean;
}

export interface AppState {
  version: number;
  savedAt: ISODate;
  profile: CandidateProfile;
  jobs: Job[];
  facts: CareerFact[];
  strategies: ResumeStrategy[];
  tailoredResumes: TailoredResume[];
  applications: Application[];
  outreach: OutreachContact[];
  preferences: StoredPreference[];
  autonomy: AutonomySettings;
  analytics: AnalyticsBundle;
  interviews: InterviewEvent[];
  recruiterResponses: RecruiterResponse[];
  shortlistedJobIds: string[];
  rejectedJobIds: string[];
  ui: {
    theme: 'light' | 'dark';
    lastScreen: string;
    lastApplicationId?: string;
  };
}

export const APP_STATE_VERSION = 1;
