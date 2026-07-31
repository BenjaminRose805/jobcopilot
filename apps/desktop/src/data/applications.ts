import type {
  Application,
  AuditEntry,
  ScreeningAnswer,
  TimelineEvent,
  TimelineEventKind,
  TimelineSource,
  TimelineStatus,
} from '@shared';
import type { ConfidenceLevel } from '@shared/common';
import { ago } from './util';

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(++seq).toString(36)}`;

interface EvSeed {
  kind: TimelineEventKind;
  title: string;
  details: string;
  status?: TimelineStatus;
  source?: TimelineSource;
  confidence?: ConfidenceLevel;
  facts?: string[];
  meta?: { label: string; value: string }[];
  /** Days ago, with optional hour offset, so a timeline reads in order. */
  at: [days: number, hours: number];
}

function timeline(seeds: EvSeed[]): TimelineEvent[] {
  return seeds.map((s) => ({
    id: nextId('ev'),
    timestamp: ago(s.at[0], s.at[1]),
    kind: s.kind,
    status: s.status ?? 'ok',
    source: s.source ?? 'agent',
    title: s.title,
    confidence: s.confidence,
    details: s.details,
    evidenceFactIds: s.facts,
    meta: s.meta,
    expandable: true,
  }));
}

function audit(rows: [days: number, hours: number, actor: AuditEntry['actor'], action: string, detail?: string][]): AuditEntry[] {
  return rows.map(([d, h, actor, action, detail]) => ({
    id: nextId('au'),
    at: ago(d, h),
    actor,
    action,
    detail,
  }));
}

function answer(
  id: string,
  question: string,
  ans: string,
  confidence: ConfidenceLevel,
  facts: string[],
  reasoning: string,
  at: [number, number],
  opts: { proposed?: string; by?: 'agent' | 'user'; corrected?: boolean } = {},
): ScreeningAnswer {
  return {
    id,
    question,
    answer: ans,
    proposedAnswer: opts.proposed,
    confidence,
    evidenceFactIds: facts,
    reasoning,
    answeredBy: opts.by ?? 'agent',
    correctedByUser: opts.corrected ?? false,
    answeredAt: ago(at[0], at[1]),
  };
}

// ---------------------------------------------------------------------------
// Active applications
// ---------------------------------------------------------------------------

const active: Application[] = [
  {
    id: 'app-meridian',
    jobId: 'job-meridian-secplat',
    status: 'awaiting-approval',
    createdAt: ago(0, 5),
    updatedAt: ago(0, 3),
    submittedAt: null,
    strategyId: 'security-platform',
    tailoredResumeId: 'tr-meridian-secplat',
    postingSnapshot:
      'Security Platform Engineer — Meridian Compute. Remote (US). $185,000–$225,000. Build the paved road for secure delivery: scanning in CI, IaC policy gates and secrets handling for ~180 engineers.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Meridian Compute posting', details: 'Reached mock://company/jobs/security-platform-engineer directly from the employer careers domain rather than through an aggregator.', at: [0, 5] },
      { kind: 'employer-page-verified', title: 'Employer page verified', details: 'The posting is hosted on the Meridian careers domain and the requisition ID MC-4471 matches the ATS feed entry. No aggregator intermediary.', confidence: 'high', at: [0, 5] },
      { kind: 'research-completed', title: 'Job intelligence built', details: 'Four of five required qualifications map to user-verified Career Vault facts. One preferred qualification (Go) is only partially supported and one (incident command) is unsupported.', confidence: 'high', facts: ['f-acc-veracode', 'f-proj-terraform-modules', 'f-resp-cicd-ownership'], at: [0, 4] },
      { kind: 'resume-strategy-selected', title: 'Security Platform strategy selected', details: 'Chosen over DevSecOps because the posting weights programme ownership and policy gates above pipeline velocity. Security Platform has a 44% recruiter-response rate across 9 submissions.', confidence: 'high', meta: [{ label: 'Strategy', value: 'Security Platform' }, { label: 'Response rate', value: '4 of 9' }], at: [0, 4] },
      { kind: 'note', title: 'Tailored resume drafted — 1 change awaiting your review', details: 'Three of four proposed changes are approved or edited. The supply-chain provenance bullet is still pending because artifact signing is the weakest part of the claim.', status: 'action-required', at: [0, 3] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-meridian-dana'],
    interviewNotes: [],
    audit: audit([
      [0, 5, 'agent', 'Discovered posting', 'Employer careers page'],
      [0, 5, 'agent', 'Verified employer page'],
      [0, 4, 'agent', 'Built job intelligence'],
      [0, 4, 'agent', 'Selected resume strategy', 'Security Platform'],
      [0, 3, 'agent', 'Drafted tailored resume', 'tr-meridian-secplat'],
      [0, 3, 'user', 'Edited proposed change', 'Qualified the Go skills mention'],
    ]),
    scenarioId: 'scenario-standard-application',
    userMinutesSpent: 4,
    nextFollowUp: null,
    defects: [],
  },
  {
    id: 'app-halcyon',
    jobId: 'job-halcyon-devsecops',
    status: 'waiting-for-user',
    createdAt: ago(2, 6),
    updatedAt: ago(0, 1),
    submittedAt: null,
    strategyId: 'devsecops',
    tailoredResumeId: 'tr-halcyon-devsecops',
    postingSnapshot:
      'Staff DevSecOps Engineer — Halcyon Grid. Denver, CO (hybrid, 3 days on-site). $195,000–$240,000. Own the security posture of the Kubernetes platform across four regions. Required: production experience operating Kubernetes clusters.',
    screeningAnswers: [
      answer(
        'sa-hg-1',
        'Which CI/CD platforms have you owned end to end?',
        'GitHub Actions — I own the self-hosted autoscaling runner fleet, the shared workflow library, the artifact registry and the release approval gates for six product teams. Previously Jenkins during the consolidation onto Actions.',
        'high',
        ['f-resp-cicd-ownership', 'f-tech-github-actions'],
        'Directly supported by a user-verified responsibility fact. No inference required.',
        [0, 2],
      ),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Halcyon Grid posting', details: 'Reached via the Northwind ATS feed. Requisition HG-2210.', at: [2, 6] },
      { kind: 'employer-page-verified', title: 'Employer page verified', details: 'Matching posting found on the Halcyon Grid careers site with the same requisition ID.', confidence: 'high', at: [2, 6] },
      { kind: 'research-completed', title: 'Job intelligence built — one required qualification unsupported', details: 'The posting requires production experience operating Kubernetes clusters. Career Vault fact f-resp-k8s-exposure caps the claim at deployment and workload debugging on a cluster owned by another team.', status: 'warning', confidence: 'high', facts: ['f-resp-k8s-exposure'], at: [2, 5] },
      { kind: 'resume-strategy-selected', title: 'DevSecOps strategy selected', details: 'DevSecOps leads with CI/CD ownership, which is the strongest supported area for this posting.', confidence: 'high', at: [2, 5] },
      { kind: 'unsupported-claim-detected', title: 'Refused to upgrade the Kubernetes bullet', details: 'A stronger bullet ("Owned production Kubernetes infrastructure across four regions") was requested to match the required qualification. The Career Vault explicitly forbids that phrasing. A supported alternative was drafted instead.', status: 'blocked', confidence: 'unsupported', facts: ['f-resp-k8s-exposure', 'f-cert-cka'], at: [1, 4] },
      { kind: 'contact-field-completed', title: 'Contact details filled from the Career Vault', details: 'First name, last name, email, phone, city and state completed from the verified profile record. Six fields, no inference.', confidence: 'high', at: [0, 3] },
      { kind: 'resume-uploaded', title: 'Resume attached', details: 'Attached the DevSecOps tailored resume. Simulated upload — no file leaves the machine.', confidence: 'high', at: [0, 3] },
      { kind: 'answer-retrieved', title: 'Answered "Which CI/CD platforms have you owned end to end?"', details: 'Retrieved from f-resp-cicd-ownership and f-tech-github-actions. Both user-verified.', confidence: 'high', facts: ['f-resp-cicd-ownership', 'f-tech-github-actions'], at: [0, 2] },
      { kind: 'unsupported-claim-detected', title: 'Stopped on "How many years have you managed production Kubernetes clusters?"', details: 'This screening question asks directly for cluster management years. The Career Vault records exposure only: you author Helm charts and debug your own workloads, while a separate Cloud Platform team provisions, upgrades and carries the pager for the clusters. The honest answer is "None". No answer will be entered without your decision.', status: 'blocked', confidence: 'unsupported', facts: ['f-resp-k8s-exposure', 'f-cert-cka'], meta: [{ label: 'Question', value: 'How many years have you managed production Kubernetes clusters?' }, { label: 'Supported ceiling', value: 'Deployment and workload debugging only' }], at: [0, 1] },
      { kind: 'approval-requested', title: 'Waiting for your decision', details: 'Three options offered: answer "None" and add the supported context in the follow-up field, enter your own answer, or skip the question and abandon the application.', status: 'action-required', source: 'agent', at: [0, 1] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-halcyon-marcus'],
    interviewNotes: [],
    audit: audit([
      [2, 6, 'agent', 'Discovered posting', 'Northwind ATS feed'],
      [2, 5, 'agent', 'Flagged unsupported required qualification', 'Kubernetes cluster operations'],
      [1, 4, 'agent', 'Refused resume claim upgrade', 'f-resp-k8s-exposure claim ceiling'],
      [0, 3, 'agent', 'Filled 6 contact fields'],
      [0, 2, 'agent', 'Answered 1 screening question'],
      [0, 1, 'agent', 'Paused for human decision', 'Kubernetes ownership question'],
    ]),
    scenarioId: 'scenario-unsupported-experience',
    userMinutesSpent: 6,
    nextFollowUp: null,
    defects: [],
  },
  {
    id: 'app-northlake',
    jobId: 'job-northlake-cloudsec',
    status: 'preparing',
    createdAt: ago(1, 3),
    updatedAt: ago(1, 2),
    submittedAt: null,
    strategyId: 'cloud-security',
    postingSnapshot:
      'Cloud Security Engineer II — Northlake Systems. Remote (US). $175,000–$210,000. Guardrails, IAM design and detection for a ~40-account AWS estate. A candidate account is required to apply.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Northlake Systems posting', details: 'Requisition NL-8802 from the Brightgate ATS feed, verified against the employer careers page.', at: [1, 3] },
      { kind: 'employer-page-verified', title: 'Employer page verified', details: 'Posting confirmed on the Northlake careers domain.', confidence: 'high', at: [1, 3] },
      { kind: 'research-completed', title: 'Job intelligence built', details: 'Strong AWS match including a current Security Specialty certification. Application is gated behind a candidate account and a human-verification challenge.', confidence: 'high', facts: ['f-tech-aws', 'f-cert-aws-security'], at: [1, 2] },
      { kind: 'human-review-required', title: 'Two mandatory human handoffs identified before the form', details: 'Sign-in and a human-verification challenge both sit between the agent and the application form. JobCopilot never enters credentials and never solves verification challenges, so you will be asked to take control twice.', status: 'warning', meta: [{ label: 'Handoff 1', value: 'Candidate account sign-in' }, { label: 'Handoff 2', value: 'Human-verification challenge' }], at: [1, 2] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [1, 3, 'agent', 'Discovered posting', 'Brightgate ATS feed'],
      [1, 2, 'agent', 'Built job intelligence'],
      [1, 2, 'agent', 'Flagged 2 mandatory human handoffs'],
    ]),
    scenarioId: 'scenario-human-takeover',
    userMinutesSpent: 2,
    nextFollowUp: null,
    defects: [],
  },
  {
    id: 'app-verdance',
    jobId: 'job-verdance-aiplat',
    status: 'awaiting-approval',
    createdAt: ago(0, 8),
    updatedAt: ago(0, 2),
    submittedAt: null,
    strategyId: 'ai-platform',
    tailoredResumeId: 'tr-verdance-aiplat',
    postingSnapshot:
      'AI Platform Engineer — Agent Infrastructure. Verdance Labs. Remote (US & Canada). $190,000–$235,000. Build the runtime beneath customer agents: isolation, tool contracts, replayable traces and evaluation.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Verdance Labs posting', details: 'Posted yesterday. Reached directly from the employer careers domain.', at: [0, 8] },
      { kind: 'employer-page-verified', title: 'Employer page verified', details: 'Requisition VL-118 confirmed on the Verdance careers site.', confidence: 'high', at: [0, 8] },
      { kind: 'research-completed', title: 'Job intelligence built — highest direction score in the pipeline', details: 'Direction score 96. The agent-harness project satisfies a requirement most candidates cannot evidence at all.', confidence: 'high', facts: ['f-proj-agent-review-harness', 'f-pref-agent-infrastructure'], at: [0, 7] },
      { kind: 'resume-strategy-selected', title: 'AI Platform strategy selected', details: 'AI Platform has the best response rate per submission of any strategy (3 of 4), though on a small sample.', confidence: 'high', at: [0, 7] },
      { kind: 'unsupported-claim-detected', title: 'Refused a customer-facing LLM claim', details: 'A bullet claiming operation of a customer-facing LLM product at scale was requested. All agent work in the vault is internal-only and fact f-tech-llm-orchestration caps the claim accordingly. A supported alternative was drafted.', status: 'blocked', confidence: 'unsupported', facts: ['f-tech-llm-orchestration'], at: [0, 6] },
      { kind: 'note', title: 'Application form requires base salary expectations', details: 'Lattis marks the compensation question as required. Compensation is a mandatory stop, so the agent will propose an answer from the vault and wait for you.', status: 'info', facts: ['f-comp-target-base'], at: [0, 2] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-verdance-priya'],
    interviewNotes: [],
    audit: audit([
      [0, 8, 'agent', 'Discovered posting', 'Employer careers page'],
      [0, 7, 'agent', 'Built job intelligence'],
      [0, 6, 'agent', 'Refused resume claim', 'No customer-facing LLM evidence'],
      [0, 2, 'agent', 'Flagged compensation mandatory stop'],
    ]),
    scenarioId: 'scenario-new-preference',
    userMinutesSpent: 3,
    nextFollowUp: null,
    defects: [],
  },
  {
    id: 'app-corvid',
    jobId: 'job-corvid-agentsec',
    status: 'preparing',
    createdAt: ago(2, 2),
    updatedAt: ago(0, 4),
    submittedAt: null,
    strategyId: 'ai-platform',
    postingSnapshot:
      'Security Engineer, AI Systems — Corvid Systems. Remote (US). $190,000–$228,000. Sandbox boundaries, tool permissions and prompt-injection defence for agentic systems.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Corvid Systems posting', details: 'Best combined fit and direction score in the pipeline (89 / 91).', at: [2, 2] },
      { kind: 'employer-page-verified', title: 'Employer page verified', details: 'Confirmed on the Corvid careers domain.', confidence: 'high', at: [2, 2] },
      { kind: 'research-completed', title: 'Job intelligence built', details: 'The only role in the pipeline where both the security depth and the agent work are load-bearing rather than incidental.', confidence: 'high', facts: ['f-skill-threat-modeling', 'f-proj-agent-review-harness'], at: [2, 1] },
      { kind: 'human-review-required', title: 'Voluntary self-identification page detected in this application flow', details: 'The Lattis flow ends on an EEO-style demographics page. Demographic, disability and veteran questions are a locked mandatory stop: they are handed to you regardless of autonomy settings, and the agent leaves every field blank.', status: 'warning', meta: [{ label: 'Stop', value: 'demographics (locked)' }, { label: 'Also locked', value: 'disability-veteran' }], at: [0, 4] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [2, 2, 'agent', 'Discovered posting'],
      [2, 1, 'agent', 'Built job intelligence'],
      [0, 4, 'agent', 'Flagged locked mandatory stop', 'demographics'],
    ]),
    scenarioId: 'scenario-demographic-review',
    userMinutesSpent: 1,
    nextFollowUp: null,
    defects: [],
  },
  {
    id: 'app-stratus',
    jobId: 'job-stratus-devprod',
    status: 'researching',
    createdAt: ago(1, 1),
    updatedAt: ago(0, 9),
    submittedAt: null,
    strategyId: 'developer-productivity',
    postingSnapshot:
      'Staff Engineer, Developer Experience — Stratus Fold. Remote (US). $200,000–$245,000. Own developer experience across a 400-engineer organisation.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Stratus Fold posting', details: 'Surfaced through the referral network rather than a job board.', at: [1, 1] },
      { kind: 'research-completed', title: 'Referral route identified', details: 'A former colleague is on the target team. Applications with an attached referral in your own history convert at roughly three times the rate of cold applications.', confidence: 'medium', facts: ['f-story-uv-migration'], at: [0, 9] },
      { kind: 'note', title: 'Holding the application until outreach lands', details: 'Recommended sequence: send the referral message first, wait up to four days, then submit with the referral named in the application.', status: 'info', at: [0, 9] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-stratus-jenna'],
    interviewNotes: [],
    audit: audit([
      [1, 1, 'agent', 'Discovered posting', 'Referral network'],
      [0, 9, 'agent', 'Identified referral contact'],
    ]),
    userMinutesSpent: 2,
    nextFollowUp: ago(-4),
    defects: [],
  },
  {
    // Research-only record. This one never becomes an application: job
    // intelligence recommends against it and the scenario ends on that verdict.
    id: 'app-cobalt',
    jobId: 'job-cobalt-reliability',
    status: 'researching',
    createdAt: ago(0, 7),
    updatedAt: ago(0, 6),
    submittedAt: null,
    strategyId: 'general-senior-swe',
    postingSnapshot:
      'Platform Reliability Engineer — Cobalt Harbor Systems. Hybrid, Charlotte NC. Compensation not disclosed. Maintain and support existing platform infrastructure, participate in the on-call rotation.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Cobalt Harbor Systems posting for research', details: 'Surfaced by the aggregator feed. Opened for research only — no application flow was started.', at: [0, 7] },
      { kind: 'research-completed', title: 'Recommendation: do not apply', details: 'Five independent detractors. The posting is 94 days old, has been reposted four times, duplicates a listing already in the queue, publishes no compensation, and describes maintenance work you have explicitly recorded as the thing you are moving away from.', status: 'blocked', confidence: 'high', facts: ['f-pref-away-from-maintenance', 'f-pref-agent-infrastructure'], at: [0, 6] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [0, 7, 'agent', 'Opened posting for research'],
      [0, 6, 'agent', 'Recommended against applying', 'Five detractors recorded'],
    ]),
    outcome: 'Do not apply — recommended against by job intelligence',
    scenarioId: 'scenario-rejected-by-research',
    userMinutesSpent: 1,
    defects: [],
  },
];

// ---------------------------------------------------------------------------
// Completed / submitted applications with mixed outcomes
// ---------------------------------------------------------------------------

const completed: Application[] = [
  {
    id: 'app-tidewater',
    jobId: 'job-tidewater-secplat',
    status: 'interviewing',
    createdAt: ago(16, 2),
    updatedAt: ago(2, 3),
    submittedAt: ago(15, 1),
    strategyId: 'security-platform',
    postingSnapshot: 'Senior Security Platform Engineer — Tidewater Compute. Remote (US). $180,000–$215,000.',
    coverLetter:
      'Short note referencing their published post on moving policy checks from review time to plan time, and the 23-module library that does the same thing at Vantage.',
    screeningAnswers: [
      answer('sa-tw-1', 'Describe a security control you shipped that engineers did not route around.', 'The Terraform policy bundles. Because the check runs at plan time and prints the exact resource and the fix, the failure looks like a compiler error rather than a review comment. Nobody asks for an exception because the fix is faster than the exception.', 'high', ['f-proj-terraform-modules'], 'Backed by a user-verified project fact.', [15, 2]),
      answer('sa-tw-2', 'Years of professional Python experience', '7+', 'high', ['f-tech-python'], 'Vault records 8 years.', [15, 2]),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Tidewater Compute posting', details: 'Employer careers page, 1 day after posting.', at: [16, 2] },
      { kind: 'resume-strategy-selected', title: 'Security Platform strategy selected', details: 'Same strategy as the Meridian application.', confidence: 'high', at: [16, 1] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Reviewed 9 fields and 2 free-text answers, then approved.', source: 'user', at: [15, 1] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Confirmation reference TW-88214 captured from the confirmation page.', confidence: 'high', meta: [{ label: 'Reference', value: 'TW-88214' }], at: [15, 1] },
      { kind: 'crm-updated', title: 'CRM updated to Submitted', details: 'Follow-up scheduled for 7 days out.', source: 'system', at: [15, 1] },
      { kind: 'note', title: 'Recruiter replied', details: 'Recruiter reached out 4 days after submission to schedule a screen.', status: 'info', source: 'system', at: [11, 0] },
      { kind: 'crm-updated', title: 'CRM updated to Interviewing', details: 'Technical screen scheduled.', source: 'system', at: [2, 3] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-tidewater-sam'],
    interviewNotes: [
      { id: 'in-tw-1', at: ago(7, 2), stage: 'Recruiter screen', interviewer: 'Sam Okafor', notes: 'Confirmed remote-first and the band is real. Asked about the Veracode numbers in detail. Five-round loop: recruiter, hiring manager, systems design, security deep dive, values.' },
    ],
    audit: audit([
      [16, 2, 'agent', 'Discovered posting'],
      [15, 1, 'user', 'Approved submission'],
      [15, 1, 'agent', 'Detected confirmation', 'TW-88214'],
      [11, 0, 'system', 'Recorded recruiter response'],
      [2, 3, 'system', 'Advanced pipeline stage', 'Interviewing'],
    ]),
    outcome: 'Technical screen scheduled.',
    userMinutesSpent: 11,
    nextFollowUp: null,
    interviewAt: ago(-3),
    defects: [],
  },
  {
    id: 'app-orchardgate',
    jobId: 'job-orchardgate-swe',
    status: 'interviewing',
    createdAt: ago(23, 4),
    updatedAt: ago(4, 1),
    submittedAt: ago(22, 2),
    strategyId: 'general-senior-swe',
    postingSnapshot: 'Senior Software Engineer, Platform — Orchard Gate. Remote (US). $180,000–$220,000.',
    screeningAnswers: [
      answer('sa-og-1', 'Why are you interested in this role?', 'The platform half of the role is what I do now; the product half is what I have been missing. Your engineering blog posts about scheduling conflicts read like real problems rather than recruiting content.', 'medium', ['f-pref-team-shape'], 'Drawn from a career-preference fact plus the posting text. Medium confidence because the motivation statement is partly inferred.', [22, 3], { proposed: 'I am excited about the opportunity to work on a modern platform team.', by: 'user', corrected: true }),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Orchard Gate posting', details: 'Employer careers page.', at: [23, 4] },
      { kind: 'answer-retrieved', title: 'Drafted "Why are you interested in this role?"', details: 'Initial draft was generic because no strong motivation fact matched this employer.', confidence: 'low', at: [22, 3] },
      { kind: 'user-corrected-answer', title: 'You rewrote the motivation answer', details: 'Replaced a generic opener with a specific reference to their engineering blog. Recorded as a correction so the pattern feeds the analytics correction rate.', status: 'warning', source: 'user', at: [22, 3] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Approved after the rewrite.', source: 'user', at: [22, 2] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Reference OG-33019.', confidence: 'high', meta: [{ label: 'Reference', value: 'OG-33019' }], at: [22, 2] },
      { kind: 'crm-updated', title: 'CRM updated to Interviewing', details: 'Hiring-manager conversation scheduled after a positive recruiter screen.', source: 'system', at: [4, 1] },
    ]),
    corrections: [
      { id: 'uc-og-1', at: ago(22, 3), field: 'whyInterested', before: 'I am excited about the opportunity to work on a modern platform team.', after: 'The platform half of the role is what I do now; the product half is what I have been missing. Your engineering blog posts about scheduling conflicts read like real problems rather than recruiting content.', reason: 'Too generic. Nothing in it was specific to Orchard Gate.' },
    ],
    outreachContactIds: [],
    interviewNotes: [
      { id: 'in-og-1', at: ago(9, 1), stage: 'Recruiter screen', interviewer: 'Tomas Lind', notes: 'Comp band confirmed at $180k–$220k. Team is 8 engineers. Next step is a 60-minute hiring-manager conversation.' },
    ],
    audit: audit([
      [23, 4, 'agent', 'Discovered posting'],
      [22, 3, 'user', 'Corrected answer', 'whyInterested'],
      [22, 2, 'user', 'Approved submission'],
      [4, 1, 'system', 'Advanced pipeline stage', 'Interviewing'],
    ]),
    outcome: 'Hiring-manager conversation scheduled.',
    userMinutesSpent: 14,
    nextFollowUp: null,
    interviewAt: ago(-6),
    defects: [],
  },
  {
    id: 'app-lanternfish',
    jobId: 'job-lanternfish-devprod',
    status: 'recruiter-response',
    createdAt: ago(7, 3),
    updatedAt: ago(1, 5),
    submittedAt: ago(6, 2),
    strategyId: 'developer-productivity',
    tailoredResumeId: 'tr-lanternfish-devprod',
    postingSnapshot: 'Developer Productivity Engineer — Lanternfish Labs. Remote (US). $178,000–$212,000.',
    screeningAnswers: [
      answer('sa-lf-1', 'Describe a migration you led across many teams.', 'Poetry to uv across 41 repositories. I wrote a codemod, proved lockfile equivalence in CI, and opened pull requests that were already green. Median install time went from 96s to 11s and adoption reached 100% in six weeks without a single migration meeting.', 'high', ['f-proj-poetry-uv', 'f-story-uv-migration'], 'Two user-verified facts, one of them a prepared interview story.', [6, 3]),
      answer('sa-lf-2', 'What are your base salary expectations?', '$205,000', 'high', ['f-comp-target-base'], 'Taken from the stored compensation preference after you approved it for this application.', [6, 3]),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Lanternfish Labs posting', details: 'Highest fit score in the pipeline at 92.', at: [7, 3] },
      { kind: 'resume-strategy-selected', title: 'Developer Productivity strategy selected', details: 'Two accomplishments answer the posting almost verbatim.', confidence: 'high', at: [7, 2] },
      { kind: 'answer-retrieved', title: 'Answered the salary question from a saved preference', details: 'Reused the stored default of $205,000 rather than asking again.', confidence: 'high', facts: ['f-comp-target-base'], at: [6, 3] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Approved in 3 minutes; nothing required correction.', source: 'user', at: [6, 2] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Reference LF-51180.', confidence: 'high', meta: [{ label: 'Reference', value: 'LF-51180' }], at: [6, 2] },
      { kind: 'note', title: 'Recruiter replied within 2 days', details: 'Fastest response in the dataset. Asked for availability this week.', status: 'action-required', source: 'system', at: [1, 5] },
    ]),
    corrections: [],
    outreachContactIds: ['oc-lanternfish-erin'],
    interviewNotes: [],
    audit: audit([
      [7, 3, 'agent', 'Discovered posting'],
      [6, 3, 'agent', 'Reused stored compensation preference', '$205,000'],
      [6, 2, 'user', 'Approved submission'],
      [1, 5, 'system', 'Recorded recruiter response'],
    ]),
    outcome: 'Recruiter asked for availability. Awaiting your reply.',
    userMinutesSpent: 5,
    nextFollowUp: ago(-1),
    defects: [],
  },
  {
    id: 'app-nimbus',
    jobId: 'job-nimbus-devsecops',
    status: 'rejected',
    createdAt: ago(38, 2),
    updatedAt: ago(19, 3),
    submittedAt: ago(37, 1),
    strategyId: 'devsecops',
    postingSnapshot: 'DevSecOps Engineer — Nimbus Ledger. Remote (US). $172,000–$205,000.',
    screeningAnswers: [
      answer('sa-nl-1', 'Do you have PCI-DSS experience?', 'No direct PCI-DSS programme experience. My compliance work has been internal audit support and SBOM/supply-chain evidence rather than card-data scope.', 'high', [], 'No supporting fact exists, so the answer states the gap plainly rather than stretching adjacent work.', [37, 2]),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Nimbus Ledger posting', details: 'Posting was already 15 days old at discovery.', status: 'warning', at: [38, 2] },
      { kind: 'unsupported-claim-detected', title: 'PCI-DSS question answered as a gap', details: 'Rather than stretching adjacent compliance work into a PCI claim, the answer stated the absence directly.', status: 'warning', confidence: 'unsupported', at: [37, 2] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Approved with the honest PCI answer intact.', source: 'user', at: [37, 1] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Reference NL-70233.', confidence: 'high', at: [37, 1] },
      { kind: 'note', title: 'Rejected after 18 days', details: 'Rejection email cited "candidates with direct payments-compliance experience". Consistent with the flagged gap.', status: 'blocked', source: 'system', at: [19, 3] },
      { kind: 'crm-updated', title: 'CRM updated to Rejected', details: 'Recorded with the stated reason for the analytics breakdown.', source: 'system', at: [19, 3] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [38, 2, 'agent', 'Discovered posting', 'Already 15 days old'],
      [37, 1, 'user', 'Approved submission'],
      [19, 3, 'system', 'Recorded rejection', 'Lacked direct PCI-DSS experience'],
    ]),
    outcome: 'Rejected — no direct payments-compliance experience.',
    userMinutesSpent: 9,
    nextFollowUp: null,
    defects: ['Applied to a posting that was already 15 days old; the freshness rule should have deprioritised it.'],
  },
  {
    id: 'app-marlowe',
    jobId: 'job-marlowe-cloudsec',
    status: 'withdrawn',
    createdAt: ago(29, 5),
    updatedAt: ago(24, 2),
    submittedAt: ago(28, 3),
    strategyId: 'cloud-security',
    postingSnapshot: 'Cloud Security Engineer — Marlowe Bank. Remote (US). $182,000–$216,000.',
    screeningAnswers: [],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Marlowe Bank posting', details: 'ATS feed.', at: [29, 5] },
      { kind: 'human-review-required', title: 'Background-check consent handed to you', details: 'Background-check consent is a locked mandatory stop. The agent stopped and you completed the consent section yourself.', status: 'warning', at: [28, 4] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Approved after completing the consent section.', source: 'user', at: [28, 3] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Reference MB-11902.', confidence: 'high', at: [28, 3] },
      { kind: 'application-aborted', title: 'You withdrew the application', details: 'Withdrawn after the recruiter confirmed the role required quarterly on-site audit weeks in Charlotte.', status: 'warning', source: 'user', at: [24, 2] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [29, 5, 'agent', 'Discovered posting'],
      [28, 4, 'agent', 'Stopped for background-check consent'],
      [28, 3, 'user', 'Approved submission'],
      [24, 2, 'user', 'Withdrew application', 'Undisclosed on-site requirement'],
    ]),
    outcome: 'Withdrawn — undisclosed quarterly on-site requirement.',
    userMinutesSpent: 16,
    nextFollowUp: null,
    defects: ['The on-site audit requirement was not in the posting text, so research could not surface it before applying.'],
  },
  {
    id: 'app-quillon',
    jobId: 'job-quillon-aiplat',
    status: 'stale',
    createdAt: ago(45, 3),
    updatedAt: ago(10, 0),
    submittedAt: ago(44, 1),
    strategyId: 'ai-platform',
    postingSnapshot: 'ML Platform Engineer — Quillon Health. Remote (US). $180,000–$215,000.',
    screeningAnswers: [
      answer('sa-qh-1', 'Describe your experience with GPU training infrastructure.', 'None directly. My platform work has been CI/CD, IaC and agent orchestration rather than training clusters or GPU scheduling.', 'unsupported', [], 'No supporting fact. Stated as an absence rather than stretched from adjacent platform work.', [44, 2]),
    ],
    timeline: timeline([
      { kind: 'job-opened', title: 'Opened Quillon Health posting', details: 'ATS feed.', at: [45, 3] },
      { kind: 'unsupported-claim-detected', title: 'GPU training question answered as a gap', details: 'No training-infrastructure evidence exists in the vault.', status: 'warning', confidence: 'unsupported', at: [44, 2] },
      { kind: 'submission-approved', title: 'You approved submission', details: 'Approved despite the flagged gap.', source: 'user', at: [44, 1] },
      { kind: 'confirmation-detected', title: 'Confirmation detected', details: 'Reference QH-40556.', confidence: 'high', at: [44, 1] },
      { kind: 'crm-updated', title: 'Marked stale after 34 days with no response', details: 'Two follow-ups sent with no reply. Moved out of the active pipeline.', status: 'warning', source: 'system', at: [10, 0] },
    ]),
    corrections: [],
    outreachContactIds: [],
    interviewNotes: [],
    audit: audit([
      [45, 3, 'agent', 'Discovered posting'],
      [44, 1, 'user', 'Approved submission'],
      [10, 0, 'system', 'Marked stale', 'No response after 34 days'],
    ]),
    outcome: 'No response after 34 days.',
    userMinutesSpent: 12,
    nextFollowUp: null,
    defects: ['Fit score of 63 was below the 70 threshold you later set; the application should not have been prepared.'],
  },
];

export const SEED_APPLICATIONS: Application[] = [...active, ...completed];
