import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 4 — a new reusable preference.
 *
 * The Lattis form asks for base salary expectations. Compensation is a mandatory
 * stop, so the agent proposes an answer from the vault and waits. When the user
 * edits the proposal, the runner detects `preferenceTopic` on the question and
 * asks how the answer should be reused: once, company-specific, default, or
 * never auto-answer this topic again. The chosen scope is persisted.
 */
export const NEW_PREFERENCE: ScenarioDefinition = {
  id: 'scenario-new-preference',
  title: 'New reusable preference — Verdance Labs',
  description:
    'A compensation question the agent will not answer alone. Editing the proposed answer offers to store it, and you choose the scope.',
  jobId: 'job-verdance-aiplat',
  applicationId: 'app-verdance',
  demonstrates: 'Learning a reusable answer with an explicit, user-chosen scope',

  steps: [
    {
      id: 'open-posting',
      type: 'navigate',
      stage: 'Opening the posting',
      url: 'mock://company/jobs/ai-platform-engineer',
      expect: { page: 'company/jobs/ai-platform-engineer', description: 'Employer posting is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'ok',
        title: 'Opened AI Platform Engineer at Verdance Labs',
        details:
          'Highest career-direction score in the pipeline at 96. No compensation range published, which is flagged as a quality detractor.',
      },
    },
    {
      id: 'select-strategy',
      type: 'note',
      stage: 'Selecting the resume',
      timeline: {
        kind: 'resume-strategy-selected',
        status: 'ok',
        confidence: 'high',
        title: 'Resume strategy: AI Platform',
        details:
          'Selected for the agent-infrastructure framing. One tailored change was refused during drafting — a claim about operating a customer-facing LLM product — because all agent work in the vault is internal-only.',
        evidenceFactIds: ['f-tech-llm-orchestration', 'f-proj-agent-review-harness'],
      },
    },
    {
      id: 'open-application',
      type: 'clickAction',
      stage: 'Opening the application form',
      action: 'apply',
      expect: { page: 'ats/lever-application', description: 'Lattis application form is loaded' },
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'info',
        title: 'Lattis application form detected',
        details:
          'Single page, and it asks for base salary expectations up front as a required field. That is a mandatory stop.',
        meta: [{ label: 'ATS', value: 'Lattis (simulated)' }],
      },
    },
    {
      id: 'fill-name',
      type: 'fillInput',
      stage: 'Completing contact details',
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
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Code profile link completed',
        details: 'The agent-review harness repository is the most relevant public artefact for this posting.',
        evidenceFactIds: ['f-gh-agent-harness'],
      },
    },
    {
      id: 'upload-resume',
      type: 'uploadMockFile',
      stage: 'Attaching the resume',
      field: 'resume',
      fileName: 'Alex_Rennick_AI_Platform_v2.pdf',
      timeline: {
        kind: 'resume-uploaded',
        status: 'ok',
        confidence: 'high',
        title: 'Approved resume attached',
        details: 'Simulated attachment. Excludes the refused customer-facing LLM bullet.',
        evidenceFactIds: ['f-tech-llm-orchestration'],
        meta: [{ label: 'File', value: 'Alex_Rennick_AI_Platform_v2.pdf' }],
      },
    },
    {
      id: 'answer-agent-experience',
      type: 'requestApproval',
      stage: 'Answering screening questions',
      question: {
        id: 'q-agent-experience',
        field: 'agentExperience',
        question: 'Tell us about agent or LLM orchestration work you have shipped',
        answerKind: 'textarea',
        proposedAnswer:
          'I built the internal agent-review harness our platform team uses to run model-assisted checks over pull requests: prompt versioning, a golden-set evaluation suite that gates changes, and cost and latency budgets per check. It runs against internal repositories only — it is developer tooling, not a customer-facing product.',
        confidence: 'high',
        evidenceFactIds: ['f-proj-agent-review-harness', 'f-tech-llm-orchestration', 'f-gh-agent-harness'],
        reasoning:
          'Three converging verified facts. The last sentence is included deliberately: fact f-tech-llm-orchestration caps this claim at internal, non-customer-facing deployments, so the boundary is stated rather than left ambiguous.',
        warnings: ['Scope boundary stated explicitly to stay inside the vault ceiling for f-tech-llm-orchestration.'],
      },
    },

    /* ----------------------- the preference moment ------------------------- */
    {
      id: 'answer-salary',
      type: 'requestApproval',
      stage: 'Compensation — waiting for you',
      question: {
        id: 'q-salary-expectation',
        field: 'salaryExpectation',
        question: 'What are your base salary expectations?',
        answerKind: 'text',
        proposedAnswer: '$205,000',
        confidence: 'medium',
        evidenceFactIds: ['f-comp-target-base', 'f-comp-market-estimate'],
        reasoning:
          'Your recorded target base is $205,000 (user-verified). The market estimate for this level and location is inferred, not verified, so it informs the framing but is not the basis for the number. Confidence is medium rather than high because the posting publishes no range, so there is nothing to calibrate against.',
        warnings: [
          'Compensation is a mandatory stop. The agent will never write a salary figure without your approval.',
          'One supporting fact (f-comp-market-estimate) is AI-inferred and is shown as inferred, not verified.',
          'Editing this answer will offer to save it for reuse — you choose the scope.',
        ],
        preferenceTopic: 'compensation',
        mandatoryStop: 'compensation',
      },
    },
    {
      id: 'answer-work-auth',
      type: 'requestApproval',
      question: {
        id: 'q-sponsorship',
        field: 'workAuth',
        question: 'Do you now or will you in the future require visa sponsorship?',
        answerKind: 'select',
        options: ['No', 'Yes'],
        proposedAnswer: 'No',
        confidence: 'high',
        evidenceFactIds: ['f-auth-us'],
        reasoning: 'Verified fact f-auth-us. Note the inverted phrasing: the correct answer here is "No".',
        warnings: [
          'Work authorization is a locked mandatory stop.',
          'This question is phrased in the negative. The agent checked the polarity before proposing an answer.',
        ],
        mandatoryStop: 'work-authorization',
      },
    },
    {
      id: 'select-referral',
      type: 'selectOption',
      field: 'referralSource',
      value: 'Company website',
      timeline: {
        kind: 'answer-retrieved',
        status: 'ok',
        confidence: 'high',
        title: 'Referral source filled from a saved preference',
        details: 'Reused your stored default. Optional field, not a mandatory stop.',
        meta: [{ label: 'Preference', value: 'pref-referral-source (default scope)' }],
      },
    },
    {
      id: 'confidence-check',
      type: 'note',
      stage: 'Pre-submission checks',
      timeline: {
        kind: 'confidence-check-passed',
        status: 'ok',
        title: 'Confidence check passed — all required fields complete',
        details:
          'Every required field is filled. The compensation figure is yours, approved directly, and is the only number in this application that did not come from a fact with a verified provenance chain.',
      },
    },
    {
      id: 'final-approval',
      type: 'requestFinalApproval',
      stage: 'Waiting for your approval',
      submitAction: 'submit',
      summary: [
        'Compensation answered by you, not by the agent',
        'Any reuse scope you chose is stored in the mock preferences store and shown in Autonomy Settings',
        'Resume attached: Alex_Rennick_AI_Platform_v2.pdf, refused LLM bullet excluded',
        'Sponsorship question answered "No" from verified fact f-auth-us',
        'The next page is a voluntary self-identification form, which is always handed to you',
      ],
      expect: { page: 'application/demographics', description: 'Reached the voluntary self-identification page' },
    },
    {
      id: 'demographics-handoff',
      type: 'requestTakeover',
      stage: 'You have control — self-identification',
      reason:
        'This is a voluntary EEO-style self-identification page. JobCopilot never answers demographic, disability or veteran-status questions on your behalf, regardless of autonomy settings.',
      instructions: [
        'Every field here is optional and every one has a "Prefer not to say" option.',
        'Use "Decline to self-identify" to fill all four with "Prefer not to say" in one action.',
        'The agent leaves all four fields blank and will not read your selections into the Career Vault.',
      ],
      doneWhen: { page: 'application/submitted', description: 'Self-identification completed, confirmation showing' },
      timeline: {
        kind: 'human-review-required',
        status: 'action-required',
        title: 'Stopping for self-identification — locked stops "demographics" and "disability-veteran"',
        details:
          'Two locked mandatory stops apply to this page. Control is handed over before any field is touched, and command dispatch to the page is switched off.',
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
      outcome: 'Submitted — compensation preference recorded',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'CRM updated — moved to Submitted',
        details:
          'The compensation answer and the scope you chose for it are both in the audit history, so a future application can show where the reused number came from.',
        meta: [{ label: 'New status', value: 'Submitted' }],
      },
    },
  ],

  resumePoints: [
    {
      when: { page: 'application/demographics', description: 'Still on the self-identification page' },
      stepId: 'demographics-handoff',
      note: 'The self-identification page is still open. The agent hands control straight back — it will not fill these fields.',
    },
    {
      when: { page: 'application/submitted', description: 'Already on the confirmation page' },
      stepId: 'detect-confirmation',
      note: 'Submission completed while you had control. The agent records the confirmation.',
    },
    {
      when: { page: 'ats/lever-application', description: 'Back on the Lattis form' },
      stepId: 'answer-salary',
      note: 'Back on the form. The agent re-presents the compensation question rather than assuming it was answered.',
    },
  ],
};
