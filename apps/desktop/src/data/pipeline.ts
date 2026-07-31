import type { StoredPreference } from '@shared/preferences';
import type { InterviewEvent, RecruiterResponse } from '@shared/state';
import { ago, agoAt, aheadAt } from './util';

/**
 * Reusable answers the user chose to store. Scope is always the user's choice —
 * nothing lands here because the agent decided it was safe to remember.
 */
export const SEED_PREFERENCES: StoredPreference[] = [
  {
    id: 'pref-comp-base',
    topic: 'compensation',
    question: 'What are your base salary expectations?',
    answer: '$205,000 base, with flexibility depending on equity and scope.',
    scope: 'default',
    createdAt: ago(19, 2),
    lastUsedAt: ago(3, 6),
    timesUsed: 4,
    originApplicationId: 'app-lanternfish',
  },
  {
    id: 'pref-notice',
    topic: 'notice-period',
    question: 'How much notice are you required to give your current employer?',
    answer: 'Two weeks.',
    scope: 'default',
    createdAt: ago(31, 1),
    lastUsedAt: ago(3, 6),
    timesUsed: 9,
    originApplicationId: 'app-quillon',
  },
  {
    id: 'pref-work-auth',
    topic: 'work-authorization',
    question: 'Are you authorized to work in the United States without sponsorship?',
    answer: 'Yes. I am authorized to work in the US and do not require sponsorship now or in the future.',
    scope: 'default',
    createdAt: ago(31, 1),
    lastUsedAt: ago(3, 6),
    timesUsed: 11,
    originApplicationId: 'app-quillon',
  },
  {
    id: 'pref-remote',
    topic: 'remote-preference',
    question: 'What is your preferred working arrangement?',
    answer: 'Remote-first, with travel for onsites up to roughly one week per quarter.',
    scope: 'default',
    createdAt: ago(27, 4),
    lastUsedAt: ago(6, 2),
    timesUsed: 7,
    originApplicationId: 'app-orchardgate',
  },
  {
    id: 'pref-relocation-halcyon',
    topic: 'relocation',
    question: 'Are you willing to relocate for this role?',
    answer: 'No. I am not relocating, but I can travel for onsites.',
    scope: 'company',
    company: 'Halcyon Grid',
    createdAt: ago(2, 3),
    lastUsedAt: ago(2, 3),
    timesUsed: 1,
    originApplicationId: 'app-halcyon',
  },
  {
    id: 'pref-referral-source',
    topic: 'referral-source',
    question: 'How did you hear about this role?',
    answer: 'Found the posting on the company careers page.',
    scope: 'default',
    createdAt: ago(24, 5),
    lastUsedAt: ago(3, 6),
    timesUsed: 6,
    originApplicationId: 'app-nimbus',
  },
  {
    id: 'pref-start-date',
    topic: 'start-date',
    question: 'When could you start?',
    answer: 'Roughly three weeks from an accepted offer.',
    scope: 'default',
    createdAt: ago(22, 3),
    lastUsedAt: ago(6, 2),
    timesUsed: 5,
    originApplicationId: 'app-orchardgate',
  },
  {
    id: 'pref-equity-never',
    topic: 'compensation',
    question: 'What are your equity expectations?',
    answer: '',
    scope: 'never-auto-answer',
    createdAt: ago(11, 2),
    lastUsedAt: null,
    timesUsed: 0,
    originApplicationId: 'app-verdance',
  },
];

/** Two scheduled interviews, matching the two applications in `interviewing`. */
export const SEED_INTERVIEWS: InterviewEvent[] = [
  {
    id: 'iv-tidewater-platform',
    applicationId: 'app-tidewater',
    company: 'Tidewater Logistics',
    role: 'Senior Security Platform Engineer',
    stage: 'Platform interview (systems design)',
    at: aheadAt(3, 14, 0),
    interviewer: 'Dana Whitfield, Principal Engineer — Platform Security',
    prepNotes: [
      'Systems design is CI/CD supply chain: signing, provenance, and rollout without stopping delivery. Confirmed by the recruiter.',
      'Lead with the Veracode remediation programme (f-acc-veracode) — it is the strongest evidence of shipping controls through shared templates rather than tickets.',
      'Kubernetes will likely come up. Stay at the vault ceiling: workloads and Helm charts, not cluster operations (f-resp-k8s-exposure).',
      'Have the SBOM diff tool (f-gh-sbom-diff) ready as a concrete artefact to screen-share.',
    ],
  },
  {
    id: 'iv-orchardgate-hm',
    applicationId: 'app-orchardgate',
    company: 'Orchardgate Systems',
    role: 'Senior Software Engineer, Infrastructure',
    stage: 'Hiring-manager conversation',
    at: aheadAt(6, 11, 30),
    interviewer: 'Tomas Lindqvist, Engineering Manager',
    prepNotes: [
      'This one came through the General Senior SWE strategy — the weakest performer in analytics. Expect broader, less security-specific questions.',
      'The motivation answer was rewritten by hand to reference their engineering blog. Be ready to talk about it in person, since the interviewer may have read it.',
      'Migration work is the strongest overlap: Java 17 across ~40 services (f-proj-java-17) and Python 3.11 (f-proj-python-311).',
      'Ask directly what fraction of the role is maintenance — recorded preference f-pref-away-from-maintenance makes this a genuine decision factor.',
    ],
  },
];

/** Three recruiter responses in the pipeline; one is still unhandled. */
export const SEED_RECRUITER_RESPONSES: RecruiterResponse[] = [
  {
    id: 'rr-lanternfish',
    applicationId: 'app-lanternfish',
    contactId: 'oc-lanternfish-erin',
    from: 'Erin Boateng — Engineering Manager, Developer Experience, Lanternfish Analytics',
    at: agoAt(1, 9, 12),
    subject: 'Re: Senior Developer Productivity Engineer — application',
    body: [
      'Great application — the uv migration numbers stood out, particularly that you measured cold CI install time rather than just claiming it felt faster.',
      'Can you share availability for a 45-minute chat this week? I am curious how you handle rollout resistance on migrations that touch every team.',
    ].join('\n\n'),
    sentiment: 'positive',
    handled: false,
  },
  {
    id: 'rr-tidewater',
    applicationId: 'app-tidewater',
    contactId: 'oc-tidewater-sam',
    from: 'Sam Iverson — Senior Technical Recruiter, Tidewater Logistics',
    at: agoAt(2, 16, 40),
    subject: 'Platform interview scheduled',
    body: [
      'Systems design is CI/CD supply chain — think signing, provenance and how you would roll it out without stopping delivery.',
      'Dana from the platform team will run it. Confirmed for Thursday at 2pm. I will send the calendar invite separately.',
    ].join('\n\n'),
    sentiment: 'positive',
    handled: true,
  },
  {
    id: 'rr-orchardgate',
    applicationId: 'app-orchardgate',
    from: 'Orchardgate Systems Talent Team',
    at: agoAt(8, 10, 5),
    subject: 'Next steps — Senior Software Engineer, Infrastructure',
    body: [
      'Thanks for your patience. The team reviewed your application and would like to move to a conversation with the hiring manager.',
      'Before we schedule: this role sits across infrastructure maintenance and new platform work, roughly 50/50 today. Let us know if that split works for you.',
    ].join('\n\n'),
    sentiment: 'neutral',
    handled: true,
  },
];
