import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 2 — the refusal.
 *
 * A Workday-style wizard reaches a screening question asking how many years the
 * candidate has *managed production Kubernetes clusters*. The Career Vault
 * records cluster *exposure* only, and fact `f-resp-k8s-exposure` carries an
 * explicit ceiling forbidding "manage", "operate", "own" and "administer".
 *
 * The agent stops, names the evidence gap, refuses to fabricate, and offers the
 * supported alternative. The user may accept the honest answer, write their own,
 * or skip. There is no path through this scenario that invents experience.
 */
export const UNSUPPORTED_EXPERIENCE: ScenarioDefinition = {
  id: 'scenario-unsupported-experience',
  title: 'Unsupported experience — Halcyon Grid',
  description:
    'A required screening question asks for experience the Career Vault cannot support. The agent refuses to fabricate it and hands you the decision.',
  jobId: 'job-halcyon-devsecops',
  applicationId: 'app-halcyon',
  demonstrates: 'Refusing to fabricate experience the evidence does not support',

  steps: [
    {
      id: 'open-posting',
      type: 'navigate',
      stage: 'Opening the posting',
      url: 'mock://company/jobs/staff-devsecops-engineer',
      expect: { page: 'company/jobs/staff-devsecops-engineer', description: 'Employer posting is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'warning',
        title: 'Opened Staff DevSecOps Engineer at Halcyon Grid',
        details:
          'Flagged as a stretch application before it started. One required qualification — production Kubernetes cluster management — is already known to be unsupported by the vault.',
        evidenceFactIds: ['f-resp-k8s-exposure'],
        meta: [
          { label: 'Recommendation', value: 'Stretch — apply with the gap stated honestly' },
          { label: 'Known gap', value: 'Kubernetes cluster ownership' },
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
        title: 'Resume strategy: DevSecOps',
        details:
          'The DevSecOps strategy is used with the reworded Kubernetes bullet. A stronger bullet was requested during tailoring and refused: see the Resume Studio refusal card for the exact wording that was rejected.',
        evidenceFactIds: ['f-resp-k8s-exposure', 'f-resp-cicd-ownership'],
      },
    },
    {
      id: 'open-application',
      type: 'clickAction',
      stage: 'Opening the application form',
      action: 'apply',
      expect: { page: 'ats/multistep-application', step: 'contact', description: 'Northwind wizard, step 1' },
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'info',
        title: 'Northwind Talent Suite wizard detected — 4 steps',
        details: 'Contact, resume, experience, review. Screening questions are configured on the experience step.',
        meta: [{ label: 'ATS', value: 'Northwind Talent Suite (simulated)' }],
      },
    },

    /* ------------------------------ step 1 --------------------------------- */
    {
      id: 'fill-first',
      type: 'fillInput',
      stage: 'Step 1 — contact',
      field: 'firstName',
      value: 'Alex',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'First name completed', details: 'From your verified profile.' },
    },
    {
      id: 'fill-last',
      type: 'fillInput',
      field: 'lastName',
      value: 'Rennick',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Last name completed', details: 'From your verified profile.' },
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
      id: 'fill-city',
      type: 'fillInput',
      field: 'city',
      value: 'Denver',
      confidence: 'high',
      evidenceFactIds: ['f-loc-remote-first'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'City completed', details: 'From f-loc-remote-first.', evidenceFactIds: ['f-loc-remote-first'] },
    },
    {
      id: 'fill-state',
      type: 'fillInput',
      field: 'state',
      value: 'CO',
      confidence: 'high',
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'State completed', details: 'From f-loc-remote-first.' },
    },
    {
      id: 'next-contact',
      type: 'clickAction',
      action: 'next-contact',
      expect: { page: 'ats/multistep-application', step: 'resume', description: 'Advanced to the resume step' },
    },

    /* ------------------------------ step 2 --------------------------------- */
    {
      id: 'upload-resume',
      type: 'uploadMockFile',
      stage: 'Step 2 — resume',
      field: 'resume',
      fileName: 'Alex_Rennick_DevSecOps_v2.pdf',
      timeline: {
        kind: 'resume-uploaded',
        status: 'ok',
        confidence: 'high',
        title: 'Approved resume attached',
        details:
          'Simulated attachment. This version contains the supported Kubernetes wording — deployment and workload debugging — not the ownership claim that was refused during tailoring.',
        evidenceFactIds: ['f-resp-k8s-exposure'],
        meta: [{ label: 'File', value: 'Alex_Rennick_DevSecOps_v2.pdf' }],
      },
    },
    {
      id: 'next-resume',
      type: 'clickAction',
      action: 'next-resume',
      expect: { page: 'ats/multistep-application', step: 'experience', description: 'Advanced to the experience step' },
    },

    /* ------------------------------ step 3 --------------------------------- */
    {
      id: 'fill-title',
      type: 'fillInput',
      stage: 'Step 3 — experience',
      field: 'currentTitle',
      value: 'Senior Software Engineer, Platform Security',
      confidence: 'high',
      evidenceFactIds: ['f-emp-vantage-senior'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Current title completed', details: 'From employment fact f-emp-vantage-senior.', evidenceFactIds: ['f-emp-vantage-senior'] },
    },
    {
      id: 'fill-employer',
      type: 'fillInput',
      field: 'currentEmployer',
      value: 'Vantage Air',
      confidence: 'high',
      evidenceFactIds: ['f-emp-vantage-senior'],
      timeline: { kind: 'contact-field-completed', status: 'ok', confidence: 'high', title: 'Current employer completed', details: 'From employment fact f-emp-vantage-senior.', evidenceFactIds: ['f-emp-vantage-senior'] },
    },
    {
      id: 'answer-cicd',
      type: 'requestApproval',
      question: {
        id: 'q-cicd-ownership',
        field: 'cicdExperience',
        question: 'Describe your CI/CD platform ownership',
        answerKind: 'textarea',
        proposedAnswer:
          'I own the shared GitHub Actions workflow library that roughly forty services build on: the reusable jobs, the required security gates, and the release path through to deployment. Most of my security work lands there rather than as review comments — when a Veracode finding recurs, the fix goes into the shared template so the next team inherits it.',
        confidence: 'high',
        evidenceFactIds: ['f-resp-cicd-ownership', 'f-tech-github-actions', 'f-acc-veracode', 'f-acc-pipeline-time'],
        reasoning:
          'Four converging verified facts, all describing work you actually own. This is the strongest evidence area in the vault for this posting.',
        warnings: [],
      },
    },
    {
      id: 'select-notice',
      type: 'selectOption',
      field: 'noticePeriod',
      value: '2 weeks',
      timeline: {
        kind: 'answer-retrieved',
        status: 'ok',
        confidence: 'high',
        title: 'Notice period filled from a saved preference',
        details: 'Reused your stored default answer. Optional field, not a mandatory stop.',
        meta: [{ label: 'Preference', value: 'pref-notice (default scope)' }],
      },
    },
    {
      id: 'next-experience',
      type: 'clickAction',
      action: 'next-experience',
      expect: { page: 'application/unexpected-question', description: 'Reached the configured screening questions' },
      timeline: {
        kind: 'page-state-observed',
        source: 'page',
        status: 'warning',
        title: 'Unexpected screening page detected',
        details:
          'The wizard branched to a screening page that was not visible from the posting. Three additional required questions, one of which asks for experience the vault does not support.',
        meta: [
          { label: 'Page', value: 'application/unexpected-question' },
          { label: 'Required questions', value: '3' },
        ],
      },
    },

    /* ------------------------- the refusal itself -------------------------- */
    {
      id: 'refuse-k8s',
      type: 'requestApproval',
      stage: 'Evidence gap — waiting for you',
      question: {
        id: 'q-k8s-ownership-years',
        field: 'k8sOwnershipYears',
        question: 'How many years have you managed production Kubernetes clusters?',
        answerKind: 'select',
        options: ['None', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'],
        proposedAnswer: '',
        confidence: 'unsupported',
        evidenceFactIds: ['f-resp-k8s-exposure', 'f-cert-cka'],
        reasoning:
          'No answer above "None" can be supported. The page defines "managed" as being the owning engineer for cluster upgrades, capacity and on-call. Your vault records the opposite arrangement: you author and maintain Helm charts, tune resource limits and debug rollouts, while a separate Cloud Platform team provisions the clusters, runs upgrades and carries the pager. The only certification that might have supported a stronger answer, f-cert-cka, is in a conflicting state and cannot be cited by anything.',
        warnings: [
          'This is a required question. Answering "None" is honest and may still filter the application out.',
          'The agent will not select a non-zero band on your behalf under any autonomy setting.',
        ],
        mandatoryStop: 'unsupported-claims',
        evidenceGap: {
          requested: '3-5 years managing production Kubernetes clusters',
          whyGap:
            'Career Vault fact f-resp-k8s-exposure sets an explicit claim ceiling: the experience may be described as deploying to and debugging workloads on Kubernetes, and may NOT be described as managing, operating, owning or administering clusters. Cluster ownership has never been held. Certification f-cert-cka, which might otherwise be cited, is marked conflicting — an imported profile claims it, your own entry says the exam was never taken — so it supports nothing until you resolve it.',
          supportedAlternative:
            'None — I deploy to and operate workloads on Kubernetes rather than managing the clusters themselves. I author and maintain the Helm charts for my team\'s services, tune resource limits, and debug rollout and pod-level failures across a multi-region platform. Cluster provisioning, version upgrades and cluster on-call are owned by a separate platform team.',
          blockingFactIds: ['f-resp-k8s-exposure', 'f-cert-cka'],
        },
      },
    },
    {
      id: 'answer-k8s-detail',
      type: 'requestApproval',
      question: {
        id: 'q-k8s-detail',
        field: 'k8sOwnershipDetail',
        question: 'Describe the scope of your Kubernetes responsibility',
        answerKind: 'textarea',
        proposedAnswer:
          'Workload-side rather than cluster-side. I author and maintain the Helm charts for my team\'s services on a shared multi-region platform, tune resource requests and limits, and debug rollout and pod-level failures. Cluster provisioning, version upgrades, node pools and cluster on-call are owned by a separate Cloud Platform team, so I have consumed that platform rather than run it.',
        confidence: 'high',
        evidenceFactIds: ['f-resp-k8s-exposure', 'f-resp-deployments'],
        reasoning:
          'This is the follow-up field where the honest answer gains back some ground. It states exactly what the vault supports and names the boundary explicitly, which reads better to a technical reviewer than a hedge.',
        warnings: ['Written at the vault ceiling. Any stronger wording here would contradict the answer above.'],
      },
    },
    {
      id: 'answer-pipeline',
      type: 'requestApproval',
      question: {
        id: 'q-pipeline-ownership',
        field: 'pipelineOwnership',
        question: 'Describe your ownership of build and release pipelines',
        answerKind: 'textarea',
        proposedAnswer:
          'I own the shared GitHub Actions workflow library used by around forty services, including the required security gates and the path to deployment. I cut mean pipeline time by consolidating duplicated jobs and caching dependency resolution, and I run the migration work when the toolchain moves underneath us.',
        confidence: 'high',
        evidenceFactIds: ['f-resp-cicd-ownership', 'f-acc-pipeline-time', 'f-proj-poetry-uv'],
        reasoning: 'Directly supported. This is genuine ownership, in contrast to the Kubernetes question above.',
        warnings: [],
      },
    },
    {
      id: 'continue-screening',
      type: 'clickAction',
      stage: 'Returning to the wizard',
      action: 'continue',
      expect: {
        page: 'ats/multistep-application',
        flag: { name: 'screeningAnswered', value: 'true' },
        description: 'Screening answers accepted, back on the review step',
      },
      timeline: {
        kind: 'note',
        status: 'ok',
        title: 'Screening questions completed honestly',
        details:
          'All three screening answers were written from verified facts. One of them states a gap rather than filling it, which is the correct outcome here.',
      },
    },
    {
      id: 'final-approval',
      type: 'requestFinalApproval',
      stage: 'Waiting for your approval',
      submitAction: 'submit',
      summary: [
        'This is a stretch application: one required qualification is not met and the answer says so',
        'Kubernetes cluster management answered "None", with the supported scope stated in the follow-up field',
        'Resume attached: Alex_Rennick_DevSecOps_v2.pdf, with the refused ownership bullet excluded',
        'No claim anywhere in this application exceeds its Career Vault ceiling',
        'Submitting posts to the simulated Northwind ATS only — nothing leaves this machine',
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
      outcome: 'Submitted as a stretch application with the gap stated',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'CRM updated — Submitted, flagged as a stretch',
        details:
          'The refusal is retained in the audit history so that if this application is rejected, the reason can be checked against the gap that was declared up front.',
        meta: [
          { label: 'New status', value: 'Submitted' },
          { label: 'Flag', value: 'Stretch — declared gap: Kubernetes cluster ownership' },
          { label: 'Unsupported claims prevented', value: '1' },
        ],
      },
    },
  ],

  resumePoints: [
    {
      when: { page: 'application/unexpected-question', description: 'Still on the screening page' },
      stepId: 'refuse-k8s',
      note: 'The screening page is still open. The agent re-presents the evidence gap rather than assuming it was resolved.',
    },
    {
      when: {
        page: 'ats/multistep-application',
        flag: { name: 'screeningAnswered', value: 'true' },
        description: 'Screening already answered, back on the wizard',
      },
      stepId: 'final-approval',
      note: 'The screening questions were completed while you had control. The agent skips ahead to the final approval gate.',
    },
    {
      when: { page: 'ats/multistep-application', step: 'experience', description: 'On the experience step' },
      stepId: 'fill-title',
      note: 'Back on the experience step; the agent re-verifies the fields before advancing again.',
    },
  ],
};
