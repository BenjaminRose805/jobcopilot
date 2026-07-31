import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 3 — control transfer, twice.
 *
 * The application sits behind a candidate-account sign-in and then a
 * human-verification challenge. Both are locked mandatory stops. On each the
 * agent calls `setAgentEnabled(false)` so it is *structurally* unable to keep
 * driving the page, not merely instructed not to. The CAPTCHA page additionally
 * rejects any click whose `isTrusted` flag is false, so it cannot be solved by
 * automation even if the command channel were open.
 *
 * When control comes back the agent re-reads the live DOM and picks a re-entry
 * point from `resumePoints` — it never resumes from a memorised step index.
 */
export const HUMAN_TAKEOVER: ScenarioDefinition = {
  id: 'scenario-human-takeover',
  title: 'Human takeover — Northlake Mutual',
  description:
    'A sign-in wall and a verification challenge sit in front of the form. The agent stops twice, hands you the browser, and resumes from whatever it finds when you hand it back.',
  jobId: 'job-northlake-cloudsec',
  applicationId: 'app-northlake',
  demonstrates: 'Control transfer for login and CAPTCHA, then state-based resumption',

  steps: [
    {
      id: 'open-posting',
      type: 'navigate',
      stage: 'Opening the posting',
      url: 'mock://company/jobs/cloud-security-engineer',
      expect: { page: 'company/jobs/cloud-security-engineer', description: 'Employer posting is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'ok',
        title: 'Opened Cloud Security Engineer at Northlake Mutual',
        details: 'Employer-hosted posting. Applying requires a candidate account on their portal.',
      },
    },
    {
      id: 'warn-handoffs',
      type: 'note',
      stage: 'Planning the run',
      timeline: {
        kind: 'human-review-required',
        status: 'warning',
        title: 'Two mandatory handoffs identified before the form',
        details:
          'Sign-in and a human-verification challenge both sit between the agent and the application form. Credentials are never entered by the agent and verification challenges are never solved by it. Both stops are locked and cannot be disabled in Autonomy Settings.',
        meta: [
          { label: 'Handoff 1', value: 'Candidate account sign-in (locked stop: login)' },
          { label: 'Handoff 2', value: 'Human-verification challenge (locked stop: captcha)' },
        ],
      },
    },
    {
      id: 'open-login',
      type: 'clickAction',
      stage: 'Reaching the sign-in wall',
      action: 'apply',
      expect: { page: 'auth/login', requiresHuman: true, description: 'Sign-in page declares it requires a human' },
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'warning',
        title: 'Sign-in page detected',
        details:
          'The page declares requiresHuman. The agent read the declaration from the page itself rather than guessing from the URL.',
        meta: [{ label: 'Page reason', value: 'Account credentials must be entered by the account owner.' }],
      },
    },

    /* ---------------------------- handoff one ------------------------------ */
    {
      id: 'takeover-login',
      type: 'requestTakeover',
      stage: 'You have control — sign in',
      reason:
        'This page asks for your account credentials. JobCopilot never handles passwords, never stores them, and never types into a password field.',
      instructions: [
        'The browser on the right is now yours. Agent commands are disabled at the transport layer, not just paused.',
        'Sign in with the demo credentials shown on the page.',
        'The password field is cleared by the page as soon as sign-in succeeds.',
        'When you land on the next page, hand control back and the agent will re-read where you are.',
      ],
      doneWhen: {
        page: 'challenge/captcha',
        description: 'Signed in — the verification challenge is now showing',
      },
      timeline: {
        kind: 'human-review-required',
        status: 'action-required',
        title: 'Stopping for sign-in — locked mandatory stop "login"',
        details:
          'The agent will not type into a password field under any autonomy setting. Command dispatch to the page is being switched off before control is handed over.',
      },
    },

    /* ---------------------------- handoff two ------------------------------ */
    {
      id: 'observe-captcha',
      type: 'waitForUserState',
      stage: 'Verification challenge',
      condition: { page: 'challenge/captcha', description: 'On the verification challenge page' },
      message: 'Waiting to observe the verification challenge',
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'warning',
        title: 'Human-verification challenge detected',
        details:
          'The challenge tiles are deliberately outside the agent\'s command vocabulary — they carry no action name it could target. The page also rejects any click that did not originate from real input.',
        meta: [
          { label: 'Page', value: 'challenge/captcha' },
          { label: 'Solvable by agent', value: 'No — structurally, not by policy' },
        ],
      },
    },
    {
      id: 'takeover-captcha',
      type: 'requestTakeover',
      stage: 'You have control — verification',
      reason:
        'This is a human-verification challenge. Solving it automatically would defeat its purpose and violate the site\'s terms, so the agent will not attempt it.',
      instructions: [
        'Select the three tiles the page asks for, then press Verify.',
        'The page rejects synthetic clicks: if automation were to try, it would mark itself automation-rejected rather than pass.',
        'You will land on the application form. Hand control back there.',
      ],
      doneWhen: {
        page: 'ats/simple-application',
        description: 'Challenge cleared — the application form is showing',
      },
      timeline: {
        kind: 'human-review-required',
        status: 'action-required',
        title: 'Stopping for verification — locked mandatory stop "captcha"',
        details:
          'No CAPTCHA-solving capability exists in this application. The agent waits for the page to report that the challenge has been cleared by a real person.',
      },
    },

    /* --------------------------- resumed work ------------------------------ */
    {
      id: 'reorient',
      type: 'note',
      stage: 'Resuming',
      timeline: {
        kind: 'agent-resumed',
        status: 'ok',
        title: 'Agent resumed after inspecting the live page',
        details:
          'Two handoffs completed. The agent re-read the DOM after each one and matched a re-entry point against what it actually found, rather than continuing from where it had been interrupted.',
      },
    },
    {
      id: 'fill-name',
      type: 'fillInput',
      stage: 'Completing the form',
      field: 'fullName',
      value: 'Alex Rennick',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Full name completed', details: 'From your verified profile.' },
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
      id: 'fill-location',
      type: 'fillInput',
      field: 'location',
      value: 'Denver, CO',
      confidence: 'high',
      evidenceFactIds: ['f-loc-remote-first'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Location completed', details: 'From f-loc-remote-first.', evidenceFactIds: ['f-loc-remote-first'] },
    },
    {
      id: 'fill-portfolio',
      type: 'fillInput',
      field: 'portfolio',
      value: 'https://example.invalid/alex-rennick',
      confidence: 'high',
      evidenceFactIds: ['f-portfolio-site'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Portfolio link completed', details: 'From f-portfolio-site.', evidenceFactIds: ['f-portfolio-site'] },
    },
    {
      id: 'fill-github',
      type: 'fillInput',
      field: 'github',
      value: 'https://example.invalid/gh/arennick',
      confidence: 'high',
      evidenceFactIds: ['f-gh-drift-detector'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Code profile link completed', details: 'From f-gh-drift-detector.', evidenceFactIds: ['f-gh-drift-detector'] },
    },
    {
      id: 'upload-resume',
      type: 'uploadMockFile',
      field: 'resume',
      fileName: 'Alex_Rennick_Cloud_Security_v1.pdf',
      timeline: {
        kind: 'resume-uploaded',
        status: 'ok',
        confidence: 'high',
        title: 'Approved resume attached',
        details: 'Simulated attachment using the Cloud Security strategy you approved.',
        meta: [{ label: 'File', value: 'Alex_Rennick_Cloud_Security_v1.pdf' }],
      },
    },
    {
      id: 'answer-why',
      type: 'requestApproval',
      stage: 'Answering screening questions',
      question: {
        id: 'q-why-northlake',
        field: 'whyInterested',
        question: 'Why are you interested in this role?',
        answerKind: 'textarea',
        proposedAnswer:
          'Most of my security work has been on the build side — getting controls into shared Terraform modules and CI templates so teams inherit them instead of arguing about them. A regulated environment is where that approach earns its keep, because the audit evidence falls out of the pipeline rather than being assembled afterwards.',
        confidence: 'medium',
        evidenceFactIds: ['f-proj-terraform-modules', 'f-resp-security-review', 'f-gh-drift-detector'],
        reasoning:
          'Medium rather than high: the regulated-environment angle is inferred from the posting, not from a verified fact about your own experience in a regulated industry.',
        warnings: ['Confidence is medium — the compliance framing is not directly evidenced by a vault fact.'],
      },
    },
    {
      id: 'answer-python',
      type: 'requestApproval',
      question: {
        id: 'q-python-years-nl',
        field: 'pythonYears',
        question: 'Years of professional Python experience',
        answerKind: 'select',
        options: ['0-1', '2-3', '4-6', '7+'],
        proposedAnswer: '7+',
        confidence: 'high',
        evidenceFactIds: ['f-tech-python'],
        reasoning: 'Verified from f-tech-python.',
        warnings: [],
      },
    },
    {
      id: 'answer-terraform',
      type: 'requestApproval',
      question: {
        id: 'q-terraform-nl',
        field: 'terraformExperience',
        question: 'Describe your infrastructure-as-code experience',
        answerKind: 'textarea',
        proposedAnswer:
          'I maintain the shared Terraform module library behind roughly thirty services — networking, IAM boundaries and the logging baselines — plus a nightly drift detector that opens pull requests for differences between deployed state and the modules.',
        confidence: 'high',
        evidenceFactIds: ['f-tech-terraform', 'f-proj-terraform-modules', 'f-gh-drift-detector'],
        reasoning: 'Three converging verified facts.',
        warnings: [],
      },
    },
    {
      id: 'answer-auth',
      type: 'requestApproval',
      question: {
        id: 'q-work-auth-nl',
        field: 'workAuth',
        question: 'Are you legally authorised to work in the United States?',
        answerKind: 'select',
        options: ['Yes', 'No', 'Requires sponsorship'],
        proposedAnswer: 'Yes',
        confidence: 'high',
        evidenceFactIds: ['f-auth-us'],
        reasoning: 'Verified fact f-auth-us, surfaced anyway because work authorization is a locked stop.',
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
        'You completed sign-in and the verification challenge; the agent did neither',
        'The agent re-read the live page after each handoff before touching any field',
        '8 of 8 required fields complete',
        'One answer is medium confidence: the compliance framing in "why interested"',
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
        title: 'Confirmation detected',
        details: 'Reference number captured from the confirmation page.',
      },
    },
    {
      id: 'complete',
      type: 'complete',
      stage: 'Complete',
      outcome: 'Submitted after two human handoffs',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'CRM updated — moved to Submitted',
        details: 'Both control transfers are retained in the audit history, including how long you held control.',
        meta: [
          { label: 'New status', value: 'Submitted' },
          { label: 'Human handoffs', value: '2 (login, verification challenge)' },
        ],
      },
    },
  ],

  resumePoints: [
    {
      when: { page: 'challenge/captcha', description: 'Signed in, verification challenge showing' },
      stepId: 'observe-captcha',
      note: 'Sign-in succeeded and the next wall is the verification challenge. The agent moves to the second handoff instead of trying to fill a form that is not there yet.',
    },
    {
      when: {
        page: 'ats/simple-application',
        fieldFilled: 'fullName',
        description: 'On the application form with contact details already filled',
      },
      stepId: 'upload-resume',
      note: 'You filled the contact details while you had control. The agent skips those fields rather than overwriting your input, and continues at the resume attachment.',
    },
    {
      when: { page: 'ats/simple-application', description: 'On the application form, empty' },
      stepId: 'reorient',
      note: 'Both walls are behind us and the form is empty. The agent starts the form from the top.',
    },
    {
      when: { page: 'auth/login', description: 'Still on the sign-in page' },
      stepId: 'takeover-login',
      note: 'Sign-in has not completed. The agent hands control straight back rather than pretending to make progress.',
    },
    {
      when: { page: 'application/submitted', description: 'Already on the confirmation page' },
      stepId: 'detect-confirmation',
      note: 'The application was submitted while you had control. The agent records the confirmation and stops.',
    },
  ],
};
