import { APP_STATE_VERSION, type AppState, type CandidateProfile } from '@shared/state';
import { DEFAULT_AUTONOMY } from '@shared/autonomy';
import { refreshAnalytics } from '@scoring';
import { pinClock, now } from './util';
import { SEED_FACTS } from './facts';
import { SEED_JOBS, SEED_SHORTLIST, SEED_REJECTED } from './jobs';
import { SEED_STRATEGIES, SEED_TAILORED_RESUMES } from './strategies';
import { SEED_APPLICATIONS } from './applications';
import { SEED_OUTREACH } from './outreach';
import { SEED_ANALYTICS, UNSUPPORTED_CLAIMS_PREVENTED } from './analytics';
import { SEED_PREFERENCES, SEED_INTERVIEWS, SEED_RECRUITER_RESPONSES } from './pipeline';

/**
 * Entirely fictional. The employer, every company named in the dataset, and all
 * contact details below are invented for the demo — the email and phone number
 * are deliberately non-routable placeholders.
 */
const PROFILE: CandidateProfile = {
  name: 'Alex Rennick',
  headline: 'Security-focused software engineer — CI/CD, cloud infrastructure and security automation',
  currentEmployer: 'Vantage Air (fictional)',
  currentTitle: 'Senior Software Engineer, Platform Security',
  location: 'Denver, CO (remote-first)',
  email: 'alex.rennick@example.invalid',
  phone: '+1 (555) 0100',
  portfolio: 'https://example.invalid/alex-rennick',
  github: 'https://example.invalid/gh/arennick',
  workAuthorization: 'US citizen — no sponsorship required',
  yearsExperience: 9,
};

/**
 * Builds the demo dataset. Called on first launch and again by the
 * "Restore original demo data" action, so it must be pure and repeatable.
 * `pinClock` fixes the reference time for the whole pass so every relative date
 * in the fixtures stays internally consistent.
 */
export function buildSeedState(): AppState {
  pinClock();

  const base: AppState = {
    version: APP_STATE_VERSION,
    savedAt: now(),
    profile: PROFILE,
    jobs: SEED_JOBS,
    facts: SEED_FACTS,
    strategies: SEED_STRATEGIES,
    tailoredResumes: SEED_TAILORED_RESUMES,
    applications: SEED_APPLICATIONS,
    outreach: SEED_OUTREACH,
    preferences: SEED_PREFERENCES,
    autonomy: DEFAULT_AUTONOMY,
    analytics: SEED_ANALYTICS,
    interviews: SEED_INTERVIEWS,
    recruiterResponses: SEED_RECRUITER_RESPONSES,
    shortlistedJobIds: SEED_SHORTLIST,
    rejectedJobIds: SEED_REJECTED,
    ui: {
      theme: 'dark',
      lastScreen: 'command-center',
      lastApplicationId: 'app-halcyon',
    },
  };

  return {
    ...base,
    analytics: refreshAnalytics(
      SEED_ANALYTICS,
      base.jobs,
      base.applications,
      UNSUPPORTED_CLAIMS_PREVENTED,
    ),
  };
}
