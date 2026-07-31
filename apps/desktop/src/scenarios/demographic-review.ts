import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 6 (bonus) — the stop that autonomy settings cannot remove.
 *
 * Run this with every autonomy toggle switched on, including `auto-submit`. The
 * agent still stops at the voluntary self-identification page, because
 * `demographics` and `disability-veteran` are locked mandatory stops and the
 * page itself declares `requiresHuman`. Two independent mechanisms have to fail
 * for this to be bypassed: the product guarantee and the page's own declaration.
 */
export const DEMOGRAPHIC_REVIEW: ScenarioDefinition = {
  id: 'scenario-demographic-review',
  title: 'Always-human review — Corvid Analytics',
  description:
    'A voluntary self-identification page that is handed to you no matter how the autonomy settings are configured.',
  jobId: 'job-corvid-agentsec',
  applicationId: 'app-corvid',
  demonstrates: 'A locked stop that no autonomy setting can switch off',

  steps: [
    {
      id: 'note-autonomy',
      type: 'note',
      stage: 'Before starting',
      timeline: {
        kind: 'note',
        status: 'info',
        title: 'Autonomy check before the run',
        details:
          'This scenario is worth running with every autonomy toggle enabled. Four of the fourteen mandatory stops that apply to this flow are locked and cannot be turned off in Autonomy Settings: demographics, disability/veteran status, legal attestations and final submission.',
        meta: [
          { label: 'Locked stops in this flow', value: 'demographics, disability-veteran, final-submission' },
          { label: 'Effect of enabling auto-submit', value: 'None on this page — the stop is not a preference' },
        ],
      },
    },
    {
      id: 'open-application',
      type: 'navigate',
      stage: 'Opening the application form',
      url: 'mock://ats/lever-application?co=Corvid%20Analytics&role=Senior%20Engineer%2C%20Agent%20Security&req=CA-3390',
      expect: { page: 'ats/lever-application', description: 'Lattis application form is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'ok',
        title: 'Opened the Corvid Analytics application',
        details: 'Lattis-hosted form. Research already flagged that this flow ends on a self-identification page.',
      },
    },
    {
      id: 'fill-name',
      type: 'fillInput',
      stage: 'Completing the form',
      field: 'name',
      value: 'Alex Rennick',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Name completed', details: 'From your verified profile.' },
    },
    {
      id: 'fill-email',
      type: 'fillInput',
      field: 'email',
      value: 'alex.rennick@example.invalid',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Email completed', details: 'Placeholder demo address.' },
    },
    {
      id: 'fill-phone',
      type: 'fillInput',
      field: 'phone',
      value: '+1 (555) 0100',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Phone completed', details: 'Placeholder demo number.' },
    },
    {
      id: 'fill-code-profile',
      type: 'fillInput',
      field: 'codeProfile',
      value: 'https://example.invalid/gh/arennick',
      confidence: 'high',
      evidenceFactIds: ['f-gh-agent-harness'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Code profile link completed', details: 'From f-gh-agent-harness.', evidenceFactIds: ['f-gh-agent-harness'] },
    },
    {
      id: 'upload-resume',
      type: 'uploadMockFile',
      field: 'resume',
      fileName: 'Alex_Rennick_AI_Platform_v2.pdf',
      timeline: {
        kind: 'resume-uploaded',
        status: 'ok',
        confidence: 'high',
        title: 'Approved resume attached',
        details: 'Simulated attachment using the AI Platform strategy.',
        meta: [{ label: 'File', value: 'Alex_Rennick_AI_Platform_v2.pdf' }],
      },
    },
    {
      id: 'answer-agent-experience',
      type: 'requestApproval',
      question: {
        id: 'q-agent-security',
        field: 'agentExperience',
        question: 'Tell us about agent or LLM orchestration work you have shipped',
        answerKind: 'textarea',
        proposedAnswer:
          'I built the internal agent-review harness the platform team uses for model-assisted pull-request checks: prompt versioning, a golden-set evaluation suite gating changes, and per-check cost and latency budgets. Security-wise the interesting part was the blast radius — the harness runs with read-only repository scope and cannot merge anything, which is the control that made it approvable.',
        confidence: 'high',
        evidenceFactIds: ['f-proj-agent-review-harness', 'f-tech-llm-orchestration', 'f-story-ai-guardrails'],
        reasoning:
          'Three converging verified facts, including the guardrails story, which is the most directly relevant vault entry for an agent-security posting.',
        warnings: [],
      },
    },
    {
      id: 'answer-salary',
      type: 'requestApproval',
      question: {
        id: 'q-salary-corvid',
        field: 'salaryExpectation',
        question: 'What are your base salary expectations?',
        answerKind: 'text',
        proposedAnswer: '$205,000',
        confidence: 'high',
        evidenceFactIds: ['f-comp-target-base'],
        reasoning:
          'Reused from your stored default preference, which you saved at default scope. Compensation is still a mandatory stop, so the stored answer is shown to you rather than written silently.',
        warnings: ['Compensation is a mandatory stop even when a stored preference exists.'],
        preferenceTopic: 'compensation',
        mandatoryStop: 'compensation',
      },
    },
    {
      id: 'answer-work-auth',
      type: 'requestApproval',
      question: {
        id: 'q-sponsorship-corvid',
        field: 'workAuth',
        question: 'Do you now or will you in the future require visa sponsorship?',
        answerKind: 'select',
        options: ['No', 'Yes'],
        proposedAnswer: 'No',
        confidence: 'high',
        evidenceFactIds: ['f-auth-us'],
        reasoning: 'Verified fact f-auth-us. Negative phrasing checked before proposing.',
        warnings: ['Work authorization is a locked mandatory stop.'],
        mandatoryStop: 'work-authorization',
      },
    },
    {
      id: 'final-approval',
      type: 'requestFinalApproval',
      stage: 'Waiting for your approval',
      submitAction: 'submit',
      summary: [
        'All required fields complete, every answer traced to a verified fact',
        'The next page is voluntary self-identification and will be handed to you',
        'This handoff happens even with auto-submit enabled — it is not a preference',
        'Submitting posts to the simulated Lattis ATS only — nothing leaves this machine',
      ],
      expect: { page: 'application/demographics', requiresHuman: true, description: 'Self-identification page declares it requires a human' },
    },
    {
      id: 'observe-demographics',
      type: 'note',
      stage: 'Locked stop reached',
      timeline: {
        kind: 'human-review-required',
        status: 'action-required',
        title: 'Voluntary self-identification page — stopping unconditionally',
        details:
          'Two independent mechanisms produce this stop. The product side: "demographics" and "disability-veteran" are locked mandatory stops that Autonomy Settings renders as read-only. The page side: the page sets requiresHuman on its own body, so the agent would stop even if the product guarantee were misconfigured.\n\nThe agent will not read, infer, store or answer any field on this page, and nothing you enter here is written to the Career Vault.',
        meta: [
          { label: 'Product guarantee', value: 'Locked stops: demographics, disability-veteran' },
          { label: 'Page declaration', value: 'requiresHuman = true' },
          { label: 'Fields the agent will touch', value: 'None' },
          { label: 'Written to Career Vault', value: 'Nothing' },
        ],
      },
    },
    {
      id: 'takeover-demographics',
      type: 'requestTakeover',
      stage: 'You have control — self-identification',
      reason:
        'Voluntary self-identification. JobCopilot never answers demographic, disability or veteran-status questions on your behalf, regardless of autonomy settings.',
      instructions: [
        'Every field is optional and every one offers "Prefer not to say".',
        '"Decline to self-identify" fills all four with "Prefer not to say" in a single action.',
        'Agent command dispatch is switched off for as long as you hold control.',
        'Your selections are not read back into the Career Vault or the analytics breakdowns.',
      ],
      doneWhen: { page: 'application/submitted', description: 'Self-identification completed, confirmation showing' },
      timeline: {
        kind: 'user-took-control',
        status: 'action-required',
        source: 'system',
        title: 'Control transferred for self-identification',
        details: 'The agent stopped sending commands before the page was touched.',
      },
    },
    {
      id: 'detect-confirmation',
      type: 'waitForUserState',
      stage: 'Confirming submission',
      condition: {
        page: 'application/submitted',
        flag: { name: 'confirmationVisible', value: 'true' },
        description: 'Confirmation page shows a reference number',
      },
      message: 'Waiting for the ATS confirmation page',
      timeline: {
        kind: 'confirmation-detected',
        source: 'page',
        status: 'ok',
        title: 'Confirmation detected',
        details: 'Reference number captured from the confirmation page.',
      },
    },
    {
      id: 'complete',
      type: 'complete',
      stage: 'Complete',
      outcome: 'Submitted — self-identification completed by you',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'CRM updated — moved to Submitted',
        details:
          'The audit history records that a locked stop was triggered and that you handled the page. It records nothing about what you entered.',
        meta: [
          { label: 'New status', value: 'Submitted' },
          { label: 'Locked stops triggered', value: 'demographics, disability-veteran' },
          { label: 'Demographic data stored', value: 'None' },
        ],
      },
    },
  ],

  resumePoints: [
    {
      when: { page: 'application/demographics', description: 'Still on the self-identification page' },
      stepId: 'takeover-demographics',
      note: 'The page is still open. The agent hands control straight back rather than filling anything.',
    },
    {
      when: { page: 'application/submitted', description: 'Already on the confirmation page' },
      stepId: 'detect-confirmation',
      note: 'Submission completed while you had control. The agent records the confirmation and stops.',
    },
  ],
};
