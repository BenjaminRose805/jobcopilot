import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 1 — the happy path, end to end.
 *
 * Job page → verify employer → approved resume strategy → contact fields from
 * the vault → simulated resume upload → evidence-backed screening answers →
 * final human approval → submit → confirmation detected → CRM updated.
 *
 * Even here nothing is submitted without an explicit approval gate: `auto-submit`
 * is off by default and final submission is a locked mandatory stop.
 */
export const STANDARD_APPLICATION: ScenarioDefinition = {
  id: 'scenario-standard-application',
  title: 'Standard application — Meridian Freight Systems',
  description:
    'A complete, uneventful application on a single-page ATS. Every field is backed by a Career Vault fact, and the only stop is the final submission approval.',
  jobId: 'job-meridian-secplat',
  applicationId: 'app-meridian',
  demonstrates: 'Normal successful application with evidence-backed answers',

  steps: [
    {
      id: 'open-posting',
      type: 'navigate',
      stage: 'Opening the posting',
      url: 'mock://company/jobs/security-platform-engineer',
      expect: { page: 'company/jobs/security-platform-engineer', description: 'Employer posting is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'ok',
        title: 'Opened Security Platform Engineer at Meridian Freight Systems',
        details:
          'Navigated to the employer-hosted posting rather than the aggregator copy, so the requirements read here are the authoritative ones.',
        meta: [
          { label: 'URL', value: 'mock://company/jobs/security-platform-engineer' },
          { label: 'Req', value: 'MFS-4471' },
        ],
      },
    },
    {
      id: 'verify-employer',
      type: 'focusElement',
      stage: 'Verifying the employer',
      field: 'verificationBadge',
      note: 'Checking the posting is hosted by the employer',
      timeline: {
        kind: 'employer-page-verified',
        status: 'ok',
        confidence: 'high',
        title: 'Employer page verified',
        details:
          'The posting is served from the company careers domain and carries a requisition id that matches the aggregator listing. No third-party reposter is in the path.',
        meta: [
          { label: 'Host', value: 'Employer careers page' },
          { label: 'Requisition match', value: 'MFS-4471 (aggregator and employer agree)' },
        ],
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
        title: 'Resume strategy: Security Platform',
        details:
          'Chosen because the posting is 70% platform-build language and 30% programme management. The Security Platform strategy is also the best performer in your own history: 9 submitted, 3 interviews.',
        evidenceFactIds: ['f-acc-veracode', 'f-resp-cicd-ownership', 'f-gh-sbom-diff'],
        meta: [
          { label: 'Strategy', value: 'Security Platform' },
          { label: 'Tailored resume', value: 'Meridian — Security Platform v3 (you approved 3 of 4 changes)' },
        ],
      },
    },
    {
      id: 'open-application',
      type: 'clickAction',
      stage: 'Opening the application form',
      action: 'apply',
      expect: { page: 'ats/simple-application', description: 'Brightgate application form is loaded' },
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'info',
        title: 'Brightgate application form detected',
        details:
          'Single-page form, 8 required fields, one file attachment. No login wall and no verification challenge in the path.',
        meta: [
          { label: 'ATS', value: 'Brightgate (simulated)' },
          { label: 'Required fields', value: '8' },
        ],
      },
    },

    /* ---------------------------- contact block ---------------------------- */
    {
      id: 'fill-name',
      type: 'fillInput',
      stage: 'Completing contact details',
      field: 'fullName',
      value: 'Alex Rennick',
      confidence: 'high',
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Full name completed',
        details: 'Taken from your verified profile.',
      },
    },
    {
      id: 'fill-email',
      type: 'fillInput',
      field: 'email',
      value: 'alex.rennick@example.invalid',
      confidence: 'high',
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Email completed',
        details: 'Placeholder demo address. Nothing is ever sent to it.',
      },
    },
    {
      id: 'fill-phone',
      type: 'fillInput',
      field: 'phone',
      value: '+1 (555) 0100',
      confidence: 'high',
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Phone completed',
        details: 'Placeholder demo number.',
      },
    },
    {
      id: 'fill-location',
      type: 'fillInput',
      field: 'location',
      value: 'Denver, CO',
      confidence: 'high',
      evidenceFactIds: ['f-loc-remote-first'],
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Location completed',
        details: 'From location preference f-loc-remote-first.',
        evidenceFactIds: ['f-loc-remote-first'],
      },
    },
    {
      id: 'fill-portfolio',
      type: 'fillInput',
      field: 'portfolio',
      value: 'https://example.invalid/alex-rennick',
      confidence: 'high',
      evidenceFactIds: ['f-portfolio-site'],
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Portfolio link completed',
        details: 'From f-portfolio-site.',
        evidenceFactIds: ['f-portfolio-site'],
      },
    },
    {
      id: 'fill-github',
      type: 'fillInput',
      field: 'github',
      value: 'https://example.invalid/gh/arennick',
      confidence: 'high',
      evidenceFactIds: ['f-gh-drift-detector', 'f-gh-sbom-diff'],
      timeline: {
        kind: 'contact-field-completed',
        status: 'ok',
        confidence: 'high',
        title: 'Code profile link completed',
        details: 'Two public repositories in the vault are relevant to this posting: the drift detector and the SBOM diff tool.',
        evidenceFactIds: ['f-gh-drift-detector', 'f-gh-sbom-diff'],
      },
    },

    /* ------------------------------- resume -------------------------------- */
    {
      id: 'upload-resume',
      type: 'uploadMockFile',
      stage: 'Attaching the resume',
      field: 'resume',
      fileName: 'Alex_Rennick_Security_Platform_v3.pdf',
      timeline: {
        kind: 'resume-uploaded',
        status: 'ok',
        confidence: 'high',
        title: 'Approved resume attached',
        details:
          'Simulated attachment — no file leaves your machine and nothing is uploaded anywhere. The attached version is the one you approved in Resume Studio, including the reworded supply-chain bullet.',
        meta: [
          { label: 'File', value: 'Alex_Rennick_Security_Platform_v3.pdf' },
          { label: 'Strategy', value: 'Security Platform' },
          { label: 'Approved by you', value: 'Yes — 3 edits accepted, 1 pending change excluded' },
        ],
      },
    },

    /* ---------------------------- vault answers ---------------------------- */
    {
      id: 'answer-why',
      type: 'requestApproval',
      stage: 'Answering screening questions',
      question: {
        id: 'q-why-interested',
        field: 'whyInterested',
        question: 'Why are you interested in this role?',
        answerKind: 'textarea',
        proposedAnswer:
          'Your engineering blog argues that the paved road has to be the cheapest path rather than the mandated one, and that is the approach I have been taking for four years. I cut our Veracode remediation backlog by writing fixes into shared build templates instead of filing tickets at teams, which moved the work from negotiation to defaults. This role looks like the same problem with a real mandate behind it.',
        confidence: 'high',
        evidenceFactIds: ['f-acc-veracode', 'f-resp-cicd-ownership', 'f-pref-away-from-maintenance'],
        reasoning:
          'Built from two verified accomplishments and the employer signal found during research. Deliberately concrete: the analytics correction rate is lowest on answers that name a measured outcome rather than describing enthusiasm.',
        warnings: [],
      },
    },
    {
      id: 'answer-python',
      type: 'requestApproval',
      question: {
        id: 'q-python-years',
        field: 'pythonYears',
        question: 'Years of professional Python experience',
        answerKind: 'select',
        options: ['0-1', '2-3', '4-6', '7+'],
        proposedAnswer: '7+',
        confidence: 'high',
        evidenceFactIds: ['f-tech-python', 'f-proj-python-311', 'f-proj-poetry-uv'],
        reasoning:
          'Nine years total experience with Python in continuous professional use across three employers, including two estate-wide migrations. The band is supported without rounding up.',
        warnings: [],
      },
    },
    {
      id: 'answer-terraform',
      type: 'requestApproval',
      question: {
        id: 'q-terraform',
        field: 'terraformExperience',
        question: 'Describe your infrastructure-as-code experience',
        answerKind: 'textarea',
        proposedAnswer:
          'I maintain the shared Terraform module library used by roughly thirty services — networking, IAM boundaries, and the logging and alerting baselines that come with them. I also wrote an internal drift detector that reconciles deployed state against the modules nightly and opens pull requests for the differences rather than paging anyone.',
        confidence: 'high',
        evidenceFactIds: ['f-tech-terraform', 'f-proj-terraform-modules', 'f-gh-drift-detector'],
        reasoning:
          'Three converging verified facts. Scope is stated as the module library rather than "owned the cloud estate", which the vault would not support.',
        warnings: [],
      },
    },
    {
      id: 'answer-auth',
      type: 'requestApproval',
      question: {
        id: 'q-work-auth',
        field: 'workAuth',
        question: 'Are you legally authorised to work in the United States?',
        answerKind: 'select',
        options: ['Yes', 'No', 'Requires sponsorship'],
        proposedAnswer: 'Yes',
        confidence: 'high',
        evidenceFactIds: ['f-auth-us'],
        reasoning: 'Verified work-authorization fact f-auth-us. Reused from your saved default preference.',
        warnings: [
          'Work authorization is a locked mandatory stop. Even though a stored preference answers this, the agent still shows it to you before writing it.',
        ],
        mandatoryStop: 'work-authorization',
      },
    },
    {
      id: 'fill-start-date',
      type: 'fillInput',
      field: 'startDate',
      value: 'Roughly three weeks from an accepted offer',
      confidence: 'high',
      timeline: {
        kind: 'answer-retrieved',
        status: 'ok',
        confidence: 'high',
        title: 'Start date filled from a saved preference',
        details:
          'Reused your stored default answer for start date. This field is optional and not a mandatory stop, so it was filled without interrupting you.',
        meta: [
          { label: 'Preference', value: 'pref-start-date (default scope)' },
          { label: 'Times reused', value: '5' },
        ],
      },
    },
    {
      id: 'confidence-check',
      type: 'note',
      stage: 'Pre-submission checks',
      timeline: {
        kind: 'confidence-check-passed',
        status: 'ok',
        confidence: 'high',
        title: 'Confidence check passed — 8 of 8 required fields',
        details:
          'Every required field is filled and every substantive answer traces to at least one user-verified Career Vault fact. No AI-inferred fact was used as evidence anywhere in this application, and no claim exceeds its recorded ceiling.',
        meta: [
          { label: 'Required fields', value: '8 of 8 complete' },
          { label: 'Lowest answer confidence', value: 'High' },
          { label: 'Inferred facts relied on', value: 'None' },
        ],
      },
    },
    {
      id: 'final-approval',
      type: 'requestFinalApproval',
      stage: 'Waiting for your approval',
      submitAction: 'submit',
      summary: [
        'Resume attached: Alex_Rennick_Security_Platform_v3.pdf (Security Platform strategy, approved by you)',
        '8 of 8 required fields complete; every answer traces to a user-verified fact',
        'No unsupported claim was written anywhere in this application',
        'Work authorization answered "Yes" from verified fact f-auth-us',
        'Submitting posts to the simulated Brightgate ATS only — nothing leaves this machine',
      ],
      expect: { page: 'application/submitted', description: 'Confirmation page reached' },
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
        confidence: 'high',
        title: 'Confirmation detected',
        details:
          'The ATS returned a confirmation page with a reference number. The submission is recorded against the application rather than assumed from the click.',
        meta: [{ label: 'Detected via', value: 'Page flag confirmationVisible=true' }],
      },
    },
    {
      id: 'update-crm',
      type: 'complete',
      stage: 'Complete',
      outcome: 'Submitted — confirmation received',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'CRM updated — moved to Submitted',
        details:
          'Application status set to Submitted, the confirmation reference stored, a follow-up scheduled for 7 days out, and the full timeline retained as an audit trail.',
        meta: [
          { label: 'New status', value: 'Submitted' },
          { label: 'Follow-up', value: 'Scheduled in 7 days' },
          { label: 'Your time on this application', value: '4 minutes' },
        ],
      },
    },
  ],

  resumePoints: [
    {
      when: { page: 'ats/simple-application', description: 'Back on the Brightgate form' },
      stepId: 'fill-name',
      note: 'The form is open again; the agent re-verifies every field from the top rather than assuming earlier writes survived.',
    },
    {
      when: { page: 'application/submitted', description: 'Already on the confirmation page' },
      stepId: 'detect-confirmation',
      note: 'The application was already submitted while you had control. The agent skips straight to recording the confirmation.',
    },
  ],
};
