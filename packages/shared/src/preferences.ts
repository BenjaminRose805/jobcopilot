import type { ISODate } from './common';

/** Scope chosen by the user when they correct an agent-proposed answer. */
export type PreferenceScope = 'once' | 'company' | 'default' | 'never-auto-answer';

export const PREFERENCE_SCOPE_LABEL: Record<PreferenceScope, string> = {
  once: 'Use once for this application only',
  company: 'Save as a company-specific preference',
  default: 'Save as my default answer',
  'never-auto-answer': 'Never auto-answer this kind of question again',
};

export const PREFERENCE_SCOPE_DETAIL: Record<PreferenceScope, string> = {
  once: 'Nothing is stored. The next application will ask again.',
  company: 'Reused automatically the next time this employer asks the same question.',
  default: 'Reused automatically for every employer unless you override it.',
  'never-auto-answer': 'The agent will always stop and hand this question to you.',
};

/** A topic bucket so preferences can match semantically similar questions. */
export type PreferenceTopic =
  | 'compensation'
  | 'notice-period'
  | 'work-authorization'
  | 'relocation'
  | 'remote-preference'
  | 'start-date'
  | 'referral-source'
  | 'other';

export interface StoredPreference {
  id: string;
  topic: PreferenceTopic;
  /** Canonical question the preference answers. */
  question: string;
  answer: string;
  scope: Exclude<PreferenceScope, 'once'>;
  /** Set when `scope === 'company'`. */
  company?: string;
  createdAt: ISODate;
  lastUsedAt?: ISODate | null;
  timesUsed: number;
  originApplicationId?: string;
}
