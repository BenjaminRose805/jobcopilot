import type { ScenarioDefinition } from '@scenario-engine';

/**
 * Scenario 5 — the application that never happens.
 *
 * Research runs against the posting and returns "do not apply" with five
 * independent reasons. The scenario deliberately contains no form interaction:
 * it opens the posting, reads it, and stops. Protecting the user's attention is
 * the product's whole thesis, so declining to apply is a first-class outcome
 * rather than a failure path.
 */
export const REJECTED_BY_RESEARCH: ScenarioDefinition = {
  id: 'scenario-rejected-by-research',
  title: 'Rejected by research — Cobalt Harbor Systems',
  description:
    'Job intelligence recommends against this posting and explains why. No application flow is opened and no form is ever touched.',
  jobId: 'job-cobalt-reliability',
  applicationId: 'app-cobalt',
  demonstrates: 'Declining to apply, with reasons, before spending any of your time',

  steps: [
    {
      id: 'open-posting',
      type: 'navigate',
      stage: 'Reading the posting',
      url: 'mock://company/jobs/platform-reliability-engineer',
      expect: { page: 'company/jobs/platform-reliability-engineer', description: 'Employer posting is loaded' },
      timeline: {
        kind: 'job-opened',
        status: 'info',
        title: 'Opened Platform Reliability Engineer at Cobalt Harbor Systems for research',
        details:
          'Opened in read-only mode. No application flow is started until a recommendation exists, so nothing here can accidentally begin an application.',
        meta: [{ label: 'Mode', value: 'Research only — no form interaction' }],
      },
    },
    {
      id: 'check-freshness',
      type: 'note',
      stage: 'Checking the posting',
      timeline: {
        kind: 'research-completed',
        status: 'warning',
        confidence: 'high',
        title: 'Detractor 1 — the posting is stale',
        details:
          'First seen 94 days ago and still open. In your own history, postings older than 21 days produced 1 response from 4 submissions and never reached an interview.',
        meta: [
          { label: 'Age', value: '94 days' },
          { label: 'Your response rate at this age', value: '25%, 0 interviews' },
        ],
      },
    },
    {
      id: 'check-reposts',
      type: 'note',
      timeline: {
        kind: 'research-completed',
        status: 'warning',
        confidence: 'high',
        title: 'Detractor 2 — reposted four times',
        details:
          'The requisition has been closed and reopened four times in 94 days with essentially unchanged text. That pattern usually means an unfilled role with an unresolved internal problem — budget, level, or an interview loop nobody is passing.',
        meta: [{ label: 'Reposts', value: '4 in 94 days' }],
      },
    },
    {
      id: 'check-duplicate',
      type: 'note',
      timeline: {
        kind: 'research-completed',
        status: 'warning',
        confidence: 'high',
        title: 'Detractor 3 — duplicate of a listing already in your queue',
        details:
          'The same requisition is already present in the discovery queue from a different aggregator under a different title. Applying to both would be visible to the employer as two applications for one role.',
        meta: [{ label: 'Duplicate of', value: 'Aggregator listing "Site Reliability Engineer II"' }],
      },
    },
    {
      id: 'check-comp',
      type: 'note',
      timeline: {
        kind: 'research-completed',
        status: 'warning',
        confidence: 'medium',
        title: 'Detractor 4 — no compensation published, and the estimate is below target',
        details:
          'No range is published. The inferred market estimate for this level in this location sits meaningfully below your recorded target of $205,000. That estimate is AI-inferred, not verified, and is treated as a soft signal rather than a hard filter.',
        evidenceFactIds: ['f-comp-target-base', 'f-comp-market-estimate'],
        meta: [
          { label: 'Published range', value: 'None' },
          { label: 'Estimate provenance', value: 'AI-inferred — not verified' },
        ],
      },
    },
    {
      id: 'check-direction',
      type: 'note',
      timeline: {
        kind: 'research-completed',
        status: 'blocked',
        confidence: 'high',
        title: 'Detractor 5 — the work is the work you are leaving',
        details:
          'The responsibilities are maintenance and support of existing infrastructure with an on-call rotation, and there is no platform-building or security-automation scope in the posting. Your recorded preference f-pref-away-from-maintenance names repetitive maintenance as the specific thing you are moving away from, and f-pref-agent-infrastructure names where you are moving to. This posting scores 18 on career direction — the lowest in the queue.',
        evidenceFactIds: ['f-pref-away-from-maintenance', 'f-pref-agent-infrastructure'],
        meta: [
          { label: 'Career-direction score', value: '18 / 100' },
          { label: 'Conflicts with', value: 'f-pref-away-from-maintenance' },
        ],
      },
    },
    {
      id: 'verdict',
      type: 'note',
      stage: 'Recommendation',
      timeline: {
        kind: 'research-completed',
        status: 'blocked',
        confidence: 'high',
        title: 'Recommendation: do not apply',
        details:
          'Five independent detractors and no offsetting strengths. Fit is mediocre, career direction is actively wrong, and the posting shows every sign of a requisition that will not close. An application here would cost roughly 20 minutes of your attention against a near-zero expected return.\n\nNo application flow was opened, no form was touched, and nothing was submitted. The posting has been moved to the rejected list, where you can override this decision at any time.',
        evidenceFactIds: ['f-pref-away-from-maintenance', 'f-comp-target-base'],
        meta: [
          { label: 'Fit score', value: '41 / 100' },
          { label: 'Career direction', value: '18 / 100' },
          { label: 'Opportunity quality', value: '18 / 100' },
          { label: 'Detractors', value: '5' },
          { label: 'Estimated time saved', value: '~20 minutes' },
        ],
      },
    },
    {
      id: 'complete',
      type: 'complete',
      stage: 'Complete',
      outcome: 'Do not apply — recommended against with reasons',
      timeline: {
        kind: 'crm-updated',
        source: 'system',
        status: 'ok',
        title: 'Moved to the rejected list',
        details:
          'The reasons are retained so that if you see this posting again from another source, the queue can show that it was already assessed and why. You can override the decision from Job Discovery.',
        meta: [
          { label: 'New state', value: 'Rejected by research' },
          { label: 'Reversible', value: 'Yes — override from Job Discovery' },
        ],
      },
    },
  ],

  resumePoints: [],
};
