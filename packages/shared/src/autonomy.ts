export type AutonomyToggleId =
  | 'auto-discover-jobs'
  | 'auto-research-companies'
  | 'auto-recommend'
  | 'auto-prepare-resume-changes'
  | 'auto-select-resume-strategy'
  | 'auto-fill-known-fields'
  | 'auto-answer-repeated-questions'
  | 'auto-upload-approved-resume'
  | 'auto-continue-multistep-forms'
  | 'auto-draft-outreach'
  | 'auto-submit';

export const AUTONOMY_TOGGLES: { id: AutonomyToggleId; label: string; description: string }[] = [
  { id: 'auto-discover-jobs', label: 'Discover jobs automatically', description: 'Run scheduled discovery passes across configured sources.' },
  { id: 'auto-research-companies', label: 'Research companies automatically', description: 'Build job intelligence without asking first.' },
  { id: 'auto-recommend', label: 'Recommend jobs automatically', description: 'Produce apply / do-not-apply recommendations unprompted.' },
  { id: 'auto-prepare-resume-changes', label: 'Prepare resume changes', description: 'Draft tailored resume diffs ahead of your review.' },
  { id: 'auto-select-resume-strategy', label: 'Select resume strategy', description: 'Pick the positioning strategy without confirmation.' },
  { id: 'auto-fill-known-fields', label: 'Auto-fill known fields', description: 'Fill name, email, phone, location and links from the vault.' },
  { id: 'auto-answer-repeated-questions', label: 'Auto-answer repeated questions', description: 'Reuse previously approved answers for identical questions.' },
  { id: 'auto-upload-approved-resume', label: 'Auto-upload approved resume', description: 'Attach the approved resume file without a separate prompt.' },
  { id: 'auto-continue-multistep-forms', label: 'Auto-continue multi-step forms', description: 'Advance wizard steps once every field on the page is settled.' },
  { id: 'auto-draft-outreach', label: 'Auto-draft outreach', description: 'Prepare outreach messages for priority jobs.' },
  { id: 'auto-submit', label: 'Auto-submit applications', description: 'Submit without a final human approval. Disabled by default.' },
];

export type MandatoryStopId =
  | 'final-submission'
  | 'unfamiliar-questions'
  | 'low-confidence-answers'
  | 'compensation'
  | 'work-authorization'
  | 'relocation'
  | 'legal-attestations'
  | 'demographics'
  | 'disability-veteran'
  | 'assessments'
  | 'login'
  | 'captcha'
  | 'background-check-consent'
  | 'unsupported-claims';

export const MANDATORY_STOPS: {
  id: MandatoryStopId;
  label: string;
  description: string;
  /** Locked stops cannot be turned off in this build — they are product guarantees. */
  locked: boolean;
}[] = [
  { id: 'final-submission', label: 'Final submission', description: 'Never submit an application without explicit approval.', locked: true },
  { id: 'unfamiliar-questions', label: 'Unfamiliar questions', description: 'Stop on any question with no matching prior answer.', locked: false },
  { id: 'low-confidence-answers', label: 'Low-confidence answers', description: 'Stop whenever confidence falls below medium.', locked: false },
  { id: 'compensation', label: 'Compensation questions', description: 'Salary, equity and bonus expectations.', locked: false },
  { id: 'work-authorization', label: 'Work authorization questions', description: 'Visa, sponsorship and right-to-work.', locked: true },
  { id: 'relocation', label: 'Relocation questions', description: 'Willingness to relocate or on-site expectations.', locked: false },
  { id: 'legal-attestations', label: 'Legal attestations', description: 'Anything you are certifying as true under penalty.', locked: true },
  { id: 'demographics', label: 'Demographic questions', description: 'Voluntary EEO-style self-identification.', locked: true },
  { id: 'disability-veteran', label: 'Disability / veteran status', description: 'Protected-status self-identification.', locked: true },
  { id: 'assessments', label: 'Assessments', description: 'Timed tests, work samples and coding challenges.', locked: true },
  { id: 'login', label: 'Login pages', description: 'Account credentials are never entered by the agent.', locked: true },
  { id: 'captcha', label: 'CAPTCHA challenges', description: 'Human-verification challenges are never solved by the agent.', locked: true },
  { id: 'background-check-consent', label: 'Background-check consent', description: 'Consent to third-party screening.', locked: true },
  { id: 'unsupported-claims', label: 'Unsupported claims', description: 'Stop rather than assert anything the vault cannot support.', locked: true },
];

export type AutonomyPresetId =
  | 'research-only'
  | 'copilot'
  | 'approval-before-every-application'
  | 'trusted-forms-only'
  | 'custom';

export const AUTONOMY_PRESET_LABEL: Record<AutonomyPresetId, string> = {
  'research-only': 'Research only',
  copilot: 'Copilot',
  'approval-before-every-application': 'Approval before every application',
  'trusted-forms-only': 'Trusted forms only',
  custom: 'Custom',
};

export interface AutonomySettings {
  preset: AutonomyPresetId;
  toggles: Record<AutonomyToggleId, boolean>;
  stops: Record<MandatoryStopId, boolean>;
}

function togglesFrom(on: AutonomyToggleId[]): Record<AutonomyToggleId, boolean> {
  const out = {} as Record<AutonomyToggleId, boolean>;
  for (const t of AUTONOMY_TOGGLES) out[t.id] = on.includes(t.id);
  return out;
}

function allStopsOn(except: MandatoryStopId[] = []): Record<MandatoryStopId, boolean> {
  const out = {} as Record<MandatoryStopId, boolean>;
  for (const s of MANDATORY_STOPS) out[s.id] = s.locked ? true : !except.includes(s.id);
  return out;
}

export const AUTONOMY_PRESETS: Record<Exclude<AutonomyPresetId, 'custom'>, AutonomySettings> = {
  'research-only': {
    preset: 'research-only',
    toggles: togglesFrom(['auto-discover-jobs', 'auto-research-companies', 'auto-recommend']),
    stops: allStopsOn(),
  },
  copilot: {
    preset: 'copilot',
    toggles: togglesFrom([
      'auto-discover-jobs',
      'auto-research-companies',
      'auto-recommend',
      'auto-prepare-resume-changes',
      'auto-select-resume-strategy',
      'auto-fill-known-fields',
      'auto-draft-outreach',
    ]),
    stops: allStopsOn(),
  },
  'approval-before-every-application': {
    preset: 'approval-before-every-application',
    toggles: togglesFrom([
      'auto-discover-jobs',
      'auto-research-companies',
      'auto-recommend',
      'auto-prepare-resume-changes',
      'auto-select-resume-strategy',
      'auto-fill-known-fields',
      'auto-answer-repeated-questions',
      'auto-upload-approved-resume',
      'auto-draft-outreach',
    ]),
    stops: allStopsOn(),
  },
  'trusted-forms-only': {
    preset: 'trusted-forms-only',
    toggles: togglesFrom([
      'auto-discover-jobs',
      'auto-research-companies',
      'auto-recommend',
      'auto-prepare-resume-changes',
      'auto-select-resume-strategy',
      'auto-fill-known-fields',
      'auto-answer-repeated-questions',
      'auto-upload-approved-resume',
      'auto-continue-multistep-forms',
      'auto-draft-outreach',
    ]),
    stops: allStopsOn(['relocation']),
  },
};

/** Conservative default: everything is prepared for you, nothing is sent for you. */
export const DEFAULT_AUTONOMY: AutonomySettings =
  AUTONOMY_PRESETS['approval-before-every-application'];
