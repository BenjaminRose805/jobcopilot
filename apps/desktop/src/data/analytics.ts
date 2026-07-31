import type { AnalyticsBundle, Breakdown, HeadlineMetric, InsightCard } from '@shared/analytics';
import { ago } from './util';

/**
 * Every number here is invented. The funnel and the headline metrics are
 * recomputed from live app state by `refreshAnalytics`; the breakdowns below
 * are a fixed simulated 90-day history that includes applications older than
 * the ones currently tracked in the CRM, which is why their totals are larger.
 */

const HEADLINE: HeadlineMetric[] = [
  {
    id: 'qualified-interviews-per-hour',
    label: 'Qualified interviews per hour of your time',
    value: '1.41',
    basis:
      'Interviews reached, divided by every minute you personally spent — reviewing, approving, correcting and taking over. Agent time is deliberately excluded: the point is to spend less of your attention, not more of the machine\'s.',
    trend: { direction: 'up', detail: 'Up from 0.62 over the previous 30 days' },
    emphasis: true,
  },
  {
    id: 'interviews-per-application',
    label: 'Interviews per submitted application',
    value: '0.50',
    basis: 'Applications that reached an interview stage, divided by applications submitted.',
    trend: { direction: 'up', detail: 'Up from 0.19 in the 30 days before targeting narrowed' },
  },
  {
    id: 'avg-user-minutes',
    label: 'Your minutes per submitted application',
    value: '10 min',
    basis: 'Mean of your own recorded attention across submitted applications, excluding agent runtime.',
    trend: { direction: 'down', detail: 'Down from 26 min once repeated answers began to be reused' },
  },
  {
    id: 'user-correction-rate',
    label: 'Answer correction rate',
    value: '8%',
    basis:
      'Share of agent-proposed screening answers you edited before approval. A rising number means the vault is drifting out of date, not that the agent is trying harder.',
    trend: { direction: 'down', detail: 'Down from 21% after four answers were saved as reusable preferences' },
  },
  {
    id: 'application-defect-rate',
    label: 'Application defect rate',
    value: '25%',
    basis:
      'Submitted applications with at least one recorded defect — a wrong field, a missed attachment, a truncated answer. Counted honestly rather than hidden.',
    trend: { direction: 'down', detail: 'Down from 44%; the three recorded defects are all older than 20 days' },
  },
  {
    id: 'unsupported-claims-prevented',
    label: 'Unsupported claims prevented',
    value: '7',
    basis:
      'Times the agent refused to write or answer something the Career Vault could not support, and stopped for you instead of guessing.',
    trend: { direction: 'flat', detail: 'Steady — mostly Kubernetes ownership and compliance-scope questions' },
  },
  {
    id: 'time-saved',
    label: 'Estimated time saved',
    value: '14.2 hrs',
    basis:
      'Simulated: agent runtime minus your attention, priced against a hand-timed 42-minute baseline for filling one application manually. Treat as an illustration, not a measurement.',
  },
  {
    id: 'response-rate',
    label: 'Employer response rate',
    value: '38%',
    basis: 'Submitted applications that produced any employer reply, including rejections that named a reason.',
    trend: { direction: 'up', detail: 'Up from 12% when applications were spread across all job families' },
  },
];

const BREAKDOWNS: Breakdown[] = [
  {
    dimension: 'resume-strategy',
    rows: [
      { label: 'Security Platform', submitted: 9, responses: 4, interviews: 3, userMinutes: 96 },
      { label: 'DevSecOps', submitted: 6, responses: 3, interviews: 2, userMinutes: 78 },
      { label: 'AI Platform', submitted: 4, responses: 3, interviews: 2, userMinutes: 41 },
      { label: 'Developer Productivity', submitted: 5, responses: 3, interviews: 2, userMinutes: 52 },
      { label: 'Cloud Security', submitted: 3, responses: 1, interviews: 0, userMinutes: 44 },
      { label: 'General Senior SWE', submitted: 4, responses: 1, interviews: 0, userMinutes: 61 },
    ],
  },
  {
    dimension: 'job-family',
    rows: [
      { label: 'Security platform', submitted: 8, responses: 4, interviews: 3, userMinutes: 88 },
      { label: 'DevSecOps', submitted: 7, responses: 3, interviews: 2, userMinutes: 84 },
      { label: 'AI / agent infrastructure', submitted: 5, responses: 3, interviews: 2, userMinutes: 47 },
      { label: 'Developer productivity', submitted: 5, responses: 3, interviews: 2, userMinutes: 55 },
      { label: 'Cloud security', submitted: 3, responses: 1, interviews: 0, userMinutes: 44 },
      { label: 'General backend', submitted: 3, responses: 1, interviews: 0, userMinutes: 54 },
    ],
  },
  {
    dimension: 'fit-score-range',
    rows: [
      { label: '85–100', submitted: 7, responses: 5, interviews: 4, userMinutes: 64 },
      { label: '70–84', submitted: 12, responses: 6, interviews: 3, userMinutes: 148 },
      { label: '55–69', submitted: 9, responses: 3, interviews: 0, userMinutes: 122 },
      { label: 'Below 55', submitted: 3, responses: 1, interviews: 0, userMinutes: 38 },
    ],
  },
  {
    dimension: 'career-direction-range',
    rows: [
      { label: '85–100 — squarely on the target path', submitted: 9, responses: 6, interviews: 5, userMinutes: 91 },
      { label: '70–84 — adjacent', submitted: 10, responses: 5, interviews: 2, userMinutes: 126 },
      { label: '55–69 — sideways', submitted: 8, responses: 3, interviews: 0, userMinutes: 111 },
      { label: 'Below 55 — maintenance-heavy', submitted: 4, responses: 1, interviews: 0, userMinutes: 44 },
    ],
  },
  {
    dimension: 'source',
    rows: [
      { label: 'Company careers page', submitted: 11, responses: 7, interviews: 4, userMinutes: 121 },
      { label: 'Aggregator feed', submitted: 12, responses: 4, interviews: 2, userMinutes: 158 },
      { label: 'Referral / network', submitted: 4, responses: 3, interviews: 3, userMinutes: 36 },
      { label: 'Recruiter inbound', submitted: 4, responses: 1, interviews: 0, userMinutes: 57 },
    ],
  },
  {
    dimension: 'company-size',
    rows: [
      { label: 'Startup (<100)', submitted: 4, responses: 2, interviews: 1, userMinutes: 42 },
      { label: 'Scale-up (100–800)', submitted: 12, responses: 8, interviews: 5, userMinutes: 132 },
      { label: 'Mid-market (800–5k)', submitted: 9, responses: 4, interviews: 2, userMinutes: 118 },
      { label: 'Enterprise (5k+)', submitted: 6, responses: 1, interviews: 1, userMinutes: 80 },
    ],
  },
  {
    dimension: 'salary-range',
    rows: [
      { label: 'Published, at or above target', submitted: 10, responses: 7, interviews: 5, userMinutes: 104 },
      { label: 'Published, below target', submitted: 5, responses: 2, interviews: 1, userMinutes: 63 },
      { label: 'Not disclosed', submitted: 16, responses: 6, interviews: 3, userMinutes: 205 },
    ],
  },
  {
    dimension: 'remote-status',
    rows: [
      { label: 'Remote', submitted: 15, responses: 9, interviews: 6, userMinutes: 168 },
      { label: 'Hybrid', submitted: 12, responses: 5, interviews: 3, userMinutes: 154 },
      { label: 'On-site', submitted: 4, responses: 1, interviews: 0, userMinutes: 50 },
    ],
  },
  {
    dimension: 'posting-age',
    rows: [
      { label: 'Under 3 days old', submitted: 8, responses: 6, interviews: 4, userMinutes: 84 },
      { label: '3–7 days', submitted: 10, responses: 5, interviews: 3, userMinutes: 118 },
      { label: '8–21 days', submitted: 9, responses: 3, interviews: 2, userMinutes: 120 },
      { label: 'Over 21 days', submitted: 4, responses: 1, interviews: 0, userMinutes: 50 },
    ],
  },
  {
    dimension: 'outreach',
    rows: [
      { label: 'Outreach sent before applying', submitted: 9, responses: 7, interviews: 5, userMinutes: 118 },
      { label: 'Outreach sent after applying', submitted: 6, responses: 4, interviews: 2, userMinutes: 71 },
      { label: 'No outreach', submitted: 16, responses: 4, interviews: 2, userMinutes: 183 },
    ],
  },
  {
    dimension: 'contact-type',
    rows: [
      { label: 'Former colleague (referral)', submitted: 3, responses: 3, interviews: 2, userMinutes: 28 },
      { label: 'Hiring manager', submitted: 4, responses: 3, interviews: 2, userMinutes: 44 },
      { label: 'Team director', submitted: 3, responses: 2, interviews: 1, userMinutes: 39 },
      { label: 'Recruiter', submitted: 5, responses: 3, interviews: 2, userMinutes: 62 },
      { label: 'Potential peer', submitted: 2, responses: 1, interviews: 0, userMinutes: 26 },
      { label: 'Alumni connection', submitted: 1, responses: 0, interviews: 0, userMinutes: 12 },
      { label: 'Second-degree connection', submitted: 1, responses: 0, interviews: 0, userMinutes: 9 },
    ],
  },
];

const INSIGHTS: InsightCard[] = [
  {
    id: 'insight-strategy-spread',
    title: 'Targeted strategies convert; the general SWE resume does not',
    body:
      'The three security- and platform-oriented strategies produced 7 of your 9 interviews from 19 submissions. The General Senior SWE strategy produced 1 response and 0 interviews from 4 submissions, while consuming 61 minutes of your attention — the highest per-application cost in the dataset. The general resume is not a safety net, it is a tax.',
    evidence: [
      'Security Platform: 9 submitted → 3 interviews',
      'General Senior SWE: 4 submitted → 0 interviews, 61 user minutes',
      'Correction rate on general-strategy applications is 3× the security-platform rate',
    ],
    suggestedAction: 'Retire the General Senior SWE strategy, or restrict it to roles scoring above 80 on career direction.',
    confidence: 'high',
    createdAt: ago(2, 3),
  },
  {
    id: 'insight-posting-freshness',
    title: 'Applying within three days roughly doubles the response rate',
    body:
      'Postings under 3 days old responded 75% of the time; postings over 21 days old responded 25% of the time and never reached an interview. This is the single cheapest lever available, because it costs no extra effort — only ordering. Discovery already runs daily; the queue just is not being worked in age order.',
    evidence: [
      'Under 3 days: 8 submitted → 6 responses → 4 interviews',
      'Over 21 days: 4 submitted → 1 response → 0 interviews',
      'Median delay between discovery and submission is currently 5.4 days',
    ],
    suggestedAction: 'Sort the Job Discovery queue by posting age within the recommended set, and de-prioritise anything past 21 days.',
    confidence: 'high',
    createdAt: ago(4, 1),
  },
  {
    id: 'insight-k8s-gap',
    title: 'Kubernetes cluster ownership is the recurring blocker',
    body:
      'Four of the seven prevented unsupported claims were the same gap: postings asking for production Kubernetes cluster management, against a vault that records deployment and workload debugging only. The agent will keep refusing this correctly, but the refusal costs you a stop every time. Either close the gap or filter on it.',
    evidence: [
      'Career Vault f-resp-k8s-exposure sets an explicit claim ceiling excluding cluster operations',
      'Certification f-cert-cka is in conflict and cannot support the claim',
      'app-halcyon is currently blocked waiting for your decision on exactly this question',
    ],
    suggestedAction:
      'Either add a Kubernetes cluster-ownership filter to discovery, or resolve the conflicting CKA entry so the vault is unambiguous.',
    confidence: 'high',
    createdAt: ago(0, 5),
  },
  {
    id: 'insight-referral-conversion',
    title: 'Referrals are the highest-yield outreach and the least used',
    body:
      'Former-colleague referrals converted 3 of 3 into responses and 2 of 3 into interviews, at 9 user minutes each — the best ratio of any contact type. They are also the rarest: 3 of 35 submissions. Applications with no outreach at all account for nearly half the pipeline and a quarter of the responses.',
    evidence: [
      'Former colleague: 3 submitted → 3 responses → 2 interviews, 28 user minutes total',
      'No outreach: 16 submitted → 4 responses → 2 interviews',
      'One referral contact (Jenna Alcott, Stratus Rail Group) is approved and unsent',
    ],
    suggestedAction: 'Work the approved referral drafts before submitting anything else this week.',
    confidence: 'medium',
    createdAt: ago(1, 7),
  },
  {
    id: 'insight-undisclosed-comp',
    title: 'Undisclosed salary ranges cost time without costing outcomes',
    body:
      'Postings with no published range absorbed 205 of your 372 recorded minutes and returned a response rate of 38% — indistinguishable from the published-range group, but at higher effort, because each one triggers a compensation stop that you have to answer personally.',
    evidence: [
      'Not disclosed: 16 submitted, 205 user minutes, 6 responses',
      'Published at or above target: 10 submitted, 104 user minutes, 7 responses',
      'Compensation is a mandatory stop, so every undisclosed posting costs at least one interruption',
    ],
    suggestedAction: 'Your saved $205,000 default already answers most of these automatically — extend it from company scope to default scope.',
    confidence: 'medium',
    createdAt: ago(3, 2),
  },
  {
    id: 'insight-defects-aging',
    title: 'Every recorded defect predates the current answer-reuse behaviour',
    body:
      'Three submitted applications carry defects: a truncated motivation answer, a resume attached under the wrong strategy, and a referral field left blank. All three were submitted more than 20 days ago, before approved answers began to be stored and reused. No defect has been recorded since.',
    evidence: [
      'app-nimbus, app-marlowe and app-quillon each carry one defect',
      'Most recent defect recorded 24 days ago',
      'Defect rate over the last 20 days: 0%',
    ],
    confidence: 'low',
    createdAt: ago(5, 4),
  },
];

export const SEED_ANALYTICS: AnalyticsBundle = {
  funnel: {
    discovered: 18,
    recommended: 7,
    approved: 5,
    submitted: 4,
    recruiterResponses: 3,
    screens: 2,
    interviews: 2,
    offers: 0,
  },
  headline: HEADLINE,
  breakdowns: BREAKDOWNS,
  insights: INSIGHTS,
};

/** Count surfaced by the "unsupported claims prevented" headline metric. */
export const UNSUPPORTED_CLAIMS_PREVENTED = 7;
