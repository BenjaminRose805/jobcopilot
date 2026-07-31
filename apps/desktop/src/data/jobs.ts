import type {
  ApplicationEffort,
  EligibilityStatus,
  EmployerVerification,
  Job,
  JobFamily,
  JobIntelligence,
  JobRecommendation,
  JobSource,
  Qualification,
  ScoreDimension,
} from '@job-model';
import type { CompanySize, Money, RemoteStatus, Seniority } from '@shared/common';
import type { ResumeStrategyId } from '@career-model';
import { ago } from './util';

type Impact = 'positive' | 'negative' | 'neutral';
type FactorTuple = [label: string, impact: Impact, detail: string];

function dim(value: number, summary: string, factors: FactorTuple[]): ScoreDimension {
  return { value, summary, factors: factors.map(([label, impact, detail]) => ({ label, impact, detail })) };
}

function money(min: number, max: number, estimated = false): Money {
  return { min, max, currency: 'USD', estimated };
}

function q(
  text: string,
  required: boolean,
  match: Qualification['match'],
  evidenceFactIds: string[] = [],
  note?: string,
): Qualification {
  return { text, required, match, evidenceFactIds, note };
}

interface JobSeed {
  id: string;
  title: string;
  company: string;
  companySize: CompanySize;
  location: string;
  remote: RemoteStatus;
  seniority: Seniority;
  family: JobFamily;
  salary: Money | null;
  postedDays: number;
  discoveredDays: number;
  deadlineDays?: number;
  source: JobSource;
  verification: EmployerVerification;
  requiresClearance?: boolean;
  postingUrl: string;
  applyUrl: string;
  atsVendor: Job['atsVendor'];
  fit: ScoreDimension;
  direction: ScoreDimension;
  quality: ScoreDimension;
  effort: ApplicationEffort;
  eligibility?: EligibilityStatus;
  outreach?: boolean;
  strategy: ResumeStrategyId;
  recommendation: JobRecommendation;
  tags: string[];
  intelligence: JobIntelligence;
}

function mk(s: JobSeed): Job {
  return {
    id: s.id,
    title: s.title,
    company: s.company,
    companySize: s.companySize,
    location: s.location,
    remote: s.remote,
    seniority: s.seniority,
    family: s.family,
    salary: s.salary,
    postedAt: ago(s.postedDays),
    discoveredAt: ago(s.discoveredDays),
    deadline: s.deadlineDays == null ? null : ago(-s.deadlineDays),
    source: s.source,
    verification: s.verification,
    requiresClearance: s.requiresClearance ?? false,
    postingUrl: s.postingUrl,
    applyUrl: s.applyUrl,
    atsVendor: s.atsVendor,
    fitScore: s.fit,
    careerDirectionScore: s.direction,
    opportunityQualityScore: s.quality,
    effort: s.effort,
    eligibility: s.eligibility ?? 'eligible',
    hasOutreachOpportunity: s.outreach ?? false,
    recommendedStrategy: s.strategy,
    recommendation: s.recommendation,
    tags: s.tags,
    intelligence: s.intelligence,
  };
}

/** Compact intelligence for the long tail of listings. */
function intel(partial: Partial<JobIntelligence> & Pick<JobIntelligence, 'roleSummary' | 'recommendation' | 'recommendedStrategy' | 'recommendationRationale'>): JobIntelligence {
  return {
    companySummary: 'Fictional company generated for this demo. No real employer data is used.',
    teamSummary: 'Team details are inferred from the posting text only.',
    responsibilities: [],
    qualifications: [],
    hardGates: [],
    concerns: [],
    careerDirectionAnalysis: '',
    likelyInterviewThemes: [],
    difficulty: { level: 'medium', detail: 'Standard single-page application form.' },
    recommendedOutreach: 'No specific contact identified yet.',
    ...partial,
  };
}

const US_AUTH_GATE = {
  label: 'US work authorization',
  status: 'eligible' as EligibilityStatus,
  detail: 'Authorised without sponsorship (f-auth-us).',
};

// ---------------------------------------------------------------------------
// Hero jobs — these have bundled mock posting and application pages.
// ---------------------------------------------------------------------------

const heroJobs: Job[] = [
  mk({
    id: 'job-meridian-secplat',
    title: 'Security Platform Engineer',
    company: 'Meridian Compute',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(185_000, 225_000),
    postedDays: 3,
    discoveredDays: 0,
    source: 'employer-careers-page',
    verification: 'verified',
    postingUrl: 'mock://company/jobs/security-platform-engineer',
    applyUrl: 'mock://ats/simple-application?co=Meridian%20Compute&role=Security%20Platform%20Engineer&req=MC-4471',
    atsVendor: 'brightgate',
    fit: dim(91, 'Nearly every required item maps to verified vault evidence.', [
      ['SAST programme ownership', 'positive', 'Veracode backlog 214 → 19 is a direct match for the "own the scanning programme" bullet (f-acc-veracode).'],
      ['Terraform + policy-as-code', 'positive', '23 modules with OPA gates cover the IaC guardrail responsibility (f-proj-terraform-modules).'],
      ['CI/CD security integration', 'positive', 'Self-hosted runner fleet with OIDC maps to their pipeline-hardening work (f-tech-github-actions).'],
      ['Go proficiency', 'negative', 'Listed as preferred. Only the open-source drift reporter is in Go (f-gh-drift-detector).'],
    ]),
    direction: dim(78, 'Strong security-platform role, but adjacent to rather than inside agent infrastructure.', [
      ['Platform team with internal customers', 'positive', 'Matches the stated preference for a platform with a real feedback loop (f-pref-team-shape).'],
      ['Less repetitive maintenance', 'positive', 'Posting frames scanner work as automation, not triage rota (f-pref-away-from-maintenance).'],
      ['Not agent infrastructure', 'negative', 'No AI/agent surface. Secondary rather than primary target direction (f-pref-agent-infrastructure).'],
    ]),
    quality: dim(88, 'Fresh, verified, published band, healthy team signals.', [
      ['Posted 3 days ago', 'positive', 'Well inside the window where response rates hold up.'],
      ['Published salary band', 'positive', '$185k–$225k is disclosed in the posting, above the stated $205k target.'],
      ['Verified on employer site', 'positive', 'Posting reached directly from the Meridian careers domain.'],
      ['Single recruiter for the whole org', 'neutral', 'Response times may be slow; outreach is worth doing.'],
    ]),
    effort: 'medium',
    outreach: true,
    strategy: 'security-platform',
    recommendation: 'priority-apply',
    tags: ['appsec', 'terraform', 'policy-as-code', 'remote', 'published-band'],
    intelligence: {
      roleSummary:
        'Build the paved road for secure delivery: scanning in CI, IaC policy gates, and secrets handling for roughly 180 engineers. This is a builder role, not a reviewer role.',
      companySummary:
        'Meridian Compute (fictional) sells managed compute to mid-market engineering teams. ~600 employees, Series D, remote-first with two US hubs.',
      teamSummary:
        'Security Platform is six engineers inside a 40-person Platform org. Reports to a Director of Platform Security. The team publishes an internal SLA and runs office hours.',
      responsibilities: [
        'Own static analysis and dependency scanning end to end, including suppression policy.',
        'Extend the Terraform module library with policy gates that fail at plan time.',
        'Harden the CI/CD supply chain: signing, provenance, runner isolation.',
        'Run threat modelling for new services alongside the product teams.',
      ],
      qualifications: [
        q('5+ years building platform or infrastructure software', true, 'met', ['f-emp-vantage-senior', 'f-emp-ridgeline']),
        q('Production ownership of a SAST/SCA programme', true, 'met', ['f-acc-veracode', 'f-skill-secure-code-review']),
        q('Deep Terraform experience including module authorship', true, 'met', ['f-proj-terraform-modules', 'f-tech-terraform']),
        q('Experience hardening CI/CD pipelines', true, 'met', ['f-resp-cicd-ownership', 'f-tech-github-actions']),
        q('Comfort with Go', false, 'partial', ['f-gh-drift-detector'], 'One open-source project in Go; not a daily language.'),
        q('Prior security incident command', false, 'unsupported', ['f-skill-incident-response'], 'Vault records participation only, and that record still needs confirmation.'),
      ],
      hardGates: [
        US_AUTH_GATE,
        { label: 'Location', status: 'eligible', detail: 'Fully remote within the US.' },
        { label: 'Clearance', status: 'eligible', detail: 'None required.' },
      ],
      concerns: [
        'The posting mentions "occasional participation in the security on-call rotation" without defining the load.',
        'Go is listed under preferred qualifications three separate times, which may mean it matters more than "preferred" suggests.',
      ],
      careerDirectionAnalysis:
        'This is the strongest available match for the security-platform direction and it removes most of the repetitive maintenance load you want to leave behind. It does not advance the agent-infrastructure goal, so treat it as a strong lateral-plus rather than a direction change.',
      likelyInterviewThemes: [
        'Designing a policy gate that engineers do not route around',
        'How you decided which Veracode findings to suppress',
        'Supply-chain provenance for build artifacts',
        'A time you shipped a platform change without a migration meeting',
      ],
      difficulty: { level: 'medium', detail: 'Single-page Brightgate form, nine required fields, two free-text answers.' },
      recommendedStrategy: 'security-platform',
      recommendedOutreach:
        'Dana Whitfield (Engineering Manager, Security Platform) posted about the team\'s policy-gate rollout. Worth a short note before applying.',
      recommendation: 'priority-apply',
      recommendationRationale: [
        'Fit 91 — four of five required qualifications are backed by user-verified vault facts, not inference.',
        'Quality 88 — posted three days ago, verified on the employer domain, salary band published above your $205k target.',
        'Direction 78 — moves you away from maintenance work but does not advance the agent-infrastructure goal.',
        'Effort is medium and the form is a vendor you have completed before, so the cost of applying is low relative to the expected value.',
        'One outreach contact was identified, which historically doubles response rate in your own data.',
      ],
    },
  }),

  mk({
    id: 'job-halcyon-devsecops',
    title: 'Staff DevSecOps Engineer',
    company: 'Halcyon Grid',
    companySize: 'enterprise',
    location: 'Denver, CO — Hybrid',
    remote: 'hybrid',
    seniority: 'staff',
    family: 'devsecops',
    salary: money(195_000, 240_000),
    postedDays: 9,
    discoveredDays: 2,
    source: 'ats-feed',
    verification: 'verified',
    postingUrl: 'mock://company/jobs/staff-devsecops-engineer',
    applyUrl: 'mock://ats/multistep-application?co=Halcyon%20Grid&role=Staff%20DevSecOps%20Engineer&req=HG-2210',
    atsVendor: 'northwind',
    fit: dim(69, 'Pipeline and security work match well; the Kubernetes ownership requirement does not.', [
      ['CI/CD ownership at scale', 'positive', 'Six teams, self-hosted runners, release gates (f-resp-cicd-ownership).'],
      ['Security tooling depth', 'positive', 'SAST programme plus SBOM tooling (f-acc-veracode, f-gh-sbom-diff).'],
      ['Production Kubernetes ownership', 'negative', 'Required. Vault supports deployment onto clusters only, never cluster operation (f-resp-k8s-exposure).'],
      ['Service mesh operations', 'negative', 'Vault records familiarity, unconfirmed, explicitly capped (f-tech-service-mesh).'],
    ]),
    direction: dim(61, 'A staff title, but the day-to-day is closer to your current job than you want.', [
      ['Staff-level scope', 'positive', 'Would be a title and scope increase.'],
      ['Heavy compliance surface', 'negative', 'Posting lists FedRAMP evidence collection, which reads as recurring maintenance (f-pref-away-from-maintenance).'],
      ['Hybrid in Denver', 'negative', 'Outside the Seattle metro; you will not relocate for 18 months (f-loc-remote-first).'],
    ]),
    quality: dim(74, 'Real company, good band, but a hybrid location you cannot satisfy.', [
      ['Published band $195k–$240k', 'positive', 'Comfortably above target.'],
      ['Posted 9 days ago', 'positive', 'Still fresh.'],
      ['Denver hybrid, 3 days on-site', 'negative', 'Conflicts with your location constraint.'],
    ]),
    effort: 'high',
    eligibility: 'conditional',
    outreach: true,
    strategy: 'devsecops',
    recommendation: 'stretch',
    tags: ['kubernetes', 'fedramp', 'hybrid', 'staff', 'evidence-gap'],
    intelligence: {
      roleSummary:
        'Staff-level DevSecOps for a regulated cloud platform: pipeline security, cluster hardening and FedRAMP continuous-monitoring evidence.',
      companySummary:
        'Halcyon Grid (fictional) runs grid-management software for regional utilities. ~4,000 employees, publicly traded, heavily regulated.',
      teamSummary:
        'Platform Security sits under the CISO rather than under Engineering, which changes how much delivery leverage the role has.',
      responsibilities: [
        'Own the security posture of the Kubernetes platform across four regions.',
        'Maintain the pipeline security controls and the evidence trail behind them.',
        'Partner with compliance on FedRAMP continuous monitoring.',
        'Mentor two mid-level engineers.',
      ],
      qualifications: [
        q('7+ years in infrastructure or platform engineering', true, 'met', ['f-emp-vantage-senior', 'f-emp-ridgeline']),
        q('Production experience operating Kubernetes clusters', true, 'unsupported', ['f-resp-k8s-exposure'], 'The vault explicitly caps this claim: deployment and debugging only, never cluster ownership or cluster on-call.'),
        q('CI/CD security control ownership', true, 'met', ['f-resp-cicd-ownership', 'f-tech-github-actions']),
        q('Policy-as-code (OPA / Sentinel)', true, 'met', ['f-proj-terraform-modules']),
        q('FedRAMP or FISMA programme experience', false, 'missing', [], 'No regulated-federal exposure anywhere in the vault.'),
        q('Service mesh operations', false, 'unsupported', ['f-tech-service-mesh'], 'Familiarity only, and the record still needs confirmation.'),
      ],
      hardGates: [
        US_AUTH_GATE,
        { label: 'Location', status: 'ineligible', detail: 'Requires 3 days/week in Denver. You are Seattle-based and not relocating within 18 months (f-loc-remote-first).' },
        { label: 'Kubernetes cluster ownership', status: 'unknown', detail: 'Listed as required. The vault cannot support the claim and the agent will not fabricate it.' },
      ],
      concerns: [
        'A required qualification cannot be honestly satisfied. Applying means answering a direct screening question with "none".',
        'Reporting into the CISO rather than Engineering often means less say over the paved road.',
        'The hybrid requirement is a hard blocker unless they will convert the role to remote.',
      ],
      careerDirectionAnalysis:
        'The staff title is attractive but the substance — FedRAMP evidence, compliance monitoring — is exactly the recurring maintenance load you are trying to leave. Combined with the location conflict and the Kubernetes gap, this is a stretch that only makes sense with a referral and a remote conversion.',
      likelyInterviewThemes: [
        'How you would harden a multi-tenant cluster you did not build',
        'Evidence automation for continuous monitoring',
        'Working with compliance without becoming a ticket queue',
      ],
      difficulty: { level: 'high', detail: 'Four-step Northwind wizard plus a separate screening-question page added by the hiring manager.' },
      recommendedStrategy: 'devsecops',
      recommendedOutreach:
        'Ask about remote flexibility and the real Kubernetes ownership boundary before investing 35 minutes in the wizard.',
      recommendation: 'stretch',
      recommendationRationale: [
        'Fit 69 — held back by a required qualification the Career Vault explicitly cannot support.',
        'A screening question asks directly how many years you have managed production Kubernetes clusters. The honest answer is none.',
        'Direction 61 — staff scope, but FedRAMP evidence work is the repetitive maintenance you are moving away from.',
        'Location is a hard gate: three days a week in Denver against an 18-month no-relocation constraint.',
        'Recommended only with a referral who can confirm the Kubernetes requirement is softer than written.',
      ],
    },
  }),

  mk({
    id: 'job-verdance-aiplat',
    title: 'AI Platform Engineer — Agent Infrastructure',
    company: 'Verdance Labs',
    companySize: 'startup',
    location: 'Remote — US & Canada',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-agent-infrastructure',
    salary: money(190_000, 235_000),
    postedDays: 1,
    discoveredDays: 0,
    source: 'employer-careers-page',
    verification: 'verified',
    postingUrl: 'mock://company/jobs/ai-platform-engineer',
    applyUrl: 'mock://ats/lever-application?co=Verdance%20Labs&role=AI%20Platform%20Engineer%20%E2%80%94%20Agent%20Infrastructure&req=VL-118',
    atsVendor: 'lattis',
    fit: dim(84, 'The agent harness work is an unusually direct match for a rare requirement.', [
      ['Shipped agent orchestration', 'positive', 'Internal harness with tool calling, retries and an eval suite over 180 recorded cases (f-proj-agent-review-harness).'],
      ['Sandboxing and safety instincts', 'positive', 'Security-platform background maps onto agent isolation requirements (f-skill-threat-modeling).'],
      ['Developer-tooling depth', 'positive', 'Their users are engineers; you have shipped to engineers for six years (f-acc-pipeline-time).'],
      ['No customer-facing LLM product', 'negative', 'All agent work has been internal. The vault caps that claim (f-tech-llm-orchestration).'],
    ]),
    direction: dim(96, 'This is the stated target direction almost exactly.', [
      ['Agent infrastructure', 'positive', 'Sandboxing, tool contracts and evaluation are named in the posting (f-pref-agent-infrastructure).'],
      ['Platform with engineer customers', 'positive', 'Internal-developer-platform shape you prefer (f-pref-team-shape).'],
      ['Zero maintenance framing', 'positive', 'Posting contains no version-bump or scanner-backlog language.'],
    ]),
    quality: dim(79, 'Excellent role, early-stage risk, and equity-weighted comp you discount.', [
      ['Posted yesterday', 'positive', 'First-mover advantage on a small pipeline.'],
      ['Published band', 'positive', '$190k–$235k base disclosed.'],
      ['Series A, 60 people', 'negative', 'Equity is illiquid and you weight cash (f-comp-equity).'],
      ['Asks salary expectations up front', 'neutral', 'A compensation question will require your input.'],
    ]),
    effort: 'medium',
    outreach: true,
    strategy: 'ai-platform',
    recommendation: 'priority-apply',
    tags: ['ai-agents', 'sandboxing', 'evals', 'remote', 'startup', 'compensation-question'],
    intelligence: {
      roleSummary:
        'Build the runtime beneath customer agents: isolation boundaries, a typed tool contract, replayable traces and an evaluation harness.',
      companySummary:
        'Verdance Labs (fictional) sells an agent runtime to engineering organisations. Series A, ~60 people, remote across US and Canada.',
      teamSummary:
        'Agent Infrastructure is four engineers reporting to a founding engineer. The team owns the sandbox and the tool protocol.',
      responsibilities: [
        'Design and operate the execution sandbox agents run inside.',
        'Own the tool-contract schema and its compatibility guarantees.',
        'Build the offline evaluation harness that gates every runtime change.',
        'Make traces good enough that a customer engineer can debug their own agent.',
      ],
      qualifications: [
        q('Shipped agent or LLM orchestration in production', true, 'met', ['f-proj-agent-review-harness', 'f-tech-llm-orchestration'], 'Internal production use across four teams.'),
        q('Strong systems fundamentals, especially isolation', true, 'partial', ['f-skill-threat-modeling', 'f-tech-aws'], 'Security architecture background rather than hands-on hypervisor or container-runtime work.'),
        q('Python at depth', true, 'met', ['f-tech-python']),
        q('Experience building evaluation harnesses', true, 'met', ['f-gh-agent-harness'], 'Public toolcall-bench fork scores tool-calling agents on repository-maintenance tasks.'),
        q('Prior developer-platform ownership', false, 'met', ['f-resp-cicd-ownership', 'f-acc-pipeline-time']),
      ],
      hardGates: [
        US_AUTH_GATE,
        { label: 'Location', status: 'eligible', detail: 'Remote across US and Canada; you are US-based.' },
      ],
      concerns: [
        'Series A equity is a meaningful part of the package and you explicitly discount illiquid equity.',
        'The team is four people; the sandbox is a large surface for that headcount.',
        'The application asks for base salary expectations before any conversation.',
      ],
      careerDirectionAnalysis:
        'The closest thing in the current pipeline to the direction you named: agent infrastructure, safety envelope, engineer customers. The trade is stage risk and equity weighting against near-perfect direction alignment.',
      likelyInterviewThemes: [
        'How you would sandbox untrusted tool execution',
        'Designing a tool contract that survives version skew',
        'What your eval harness actually measured and what it missed',
        'Debuggability as a product requirement',
      ],
      difficulty: { level: 'medium', detail: 'Lattis single-page form with a compensation question and a long free-text answer.' },
      recommendedStrategy: 'ai-platform',
      recommendedOutreach:
        'Priya Raman (Founding Engineer) writes publicly about agent sandboxing. A short, specific note referencing your eval harness is likely to land.',
      recommendation: 'priority-apply',
      recommendationRationale: [
        'Direction 96 — the highest direction score in the pipeline and an exact match for the target you stated.',
        'Fit 84 — the agent-harness project satisfies a requirement most candidates cannot evidence at all.',
        'Posted yesterday, so the applicant pool is still small.',
        'Quality 79 rather than higher only because Series A equity is weighted against your stated cash preference.',
        'Expect a compensation question during the application; your target answer is $205,000 (f-comp-target-base).',
      ],
    },
  }),

  mk({
    id: 'job-northlake-cloudsec',
    title: 'Cloud Security Engineer II',
    company: 'Northlake Systems',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'cloud-security',
    salary: money(175_000, 210_000),
    postedDays: 6,
    discoveredDays: 1,
    source: 'ats-feed',
    verification: 'verified',
    postingUrl: 'mock://company/jobs/cloud-security-engineer',
    applyUrl: 'mock://auth/login?co=Northlake%20Systems&role=Cloud%20Security%20Engineer%20II&req=NL-8802',
    atsVendor: 'brightgate',
    fit: dim(86, 'AWS security depth and IaC guardrails line up cleanly.', [
      ['AWS multi-account security', 'positive', 'IAM boundaries, SCPs, KMS ownership (f-tech-aws).'],
      ['AWS Security Specialty', 'positive', 'Listed as preferred; you hold it and it is current (f-cert-aws-security).'],
      ['Terraform guardrails', 'positive', 'Policy-gated module library (f-proj-terraform-modules).'],
      ['Detection engineering', 'neutral', 'Some overlap through security tooling, but no SIEM ownership in the vault.'],
    ]),
    direction: dim(70, 'Solid cloud-security role; not a step toward agent infrastructure.', [
      ['Cloud security is a named target', 'positive', 'One of the six directions you are open to.'],
      ['Level II title', 'negative', 'Reads below your current scope despite the salary band.'],
      ['Detection rota', 'negative', 'Alert triage risks reproducing the maintenance treadmill.'],
    ]),
    quality: dim(72, 'Good employer, but an account wall and a challenge page before you can even see the form.', [
      ['Published band', 'positive', '$175k–$210k disclosed.'],
      ['Requires candidate account', 'negative', 'Sign-in plus a human-verification challenge before the form.'],
      ['Posted 6 days ago', 'positive', 'Fresh.'],
    ]),
    effort: 'high',
    outreach: false,
    strategy: 'cloud-security',
    recommendation: 'apply',
    tags: ['aws', 'requires-account', 'captcha', 'remote'],
    intelligence: {
      roleSummary:
        'Cloud security for a multi-account AWS estate: guardrails, IAM design, and the detection pipeline that catches what the guardrails miss.',
      companySummary:
        'Northlake Systems (fictional) provides logistics software to regional carriers. ~900 employees, private equity owned.',
      teamSummary: 'Cloud Security is three engineers inside a nine-person security organisation.',
      responsibilities: [
        'Design and enforce preventative guardrails across ~40 AWS accounts.',
        'Own IAM permission boundaries and the access-review process.',
        'Tune the detection pipeline and take part in the triage rota.',
      ],
      qualifications: [
        q('Multi-account AWS security experience', true, 'met', ['f-tech-aws']),
        q('Terraform at production scale', true, 'met', ['f-tech-terraform', 'f-proj-terraform-modules']),
        q('AWS Security Specialty certification', false, 'met', ['f-cert-aws-security']),
        q('Detection engineering / SIEM tuning', false, 'partial', ['f-skill-incident-response'], 'Related security work, but no SIEM ownership recorded.'),
      ],
      hardGates: [
        US_AUTH_GATE,
        { label: 'Candidate account', status: 'conditional', detail: 'The application is behind a sign-in and a human-verification challenge. Both require you personally.' },
      ],
      concerns: [
        'Two mandatory human handoffs before the form is even reachable.',
        '"Engineer II" may indicate a level mismatch worth clarifying before investing time.',
      ],
      careerDirectionAnalysis:
        'A comfortable, well-matched cloud-security role. It keeps you in the security-platform lane and pays close to target, but the detection rota carries some of the repetitive-work risk you are trying to reduce.',
      likelyInterviewThemes: [
        'Designing SCPs that do not break delivery teams',
        'Access review at 40-account scale',
        'A guardrail that failed and what you changed',
      ],
      difficulty: { level: 'high', detail: 'Sign-in, then a human-verification challenge, then a nine-field Brightgate form.' },
      recommendedStrategy: 'cloud-security',
      recommendedOutreach: 'No contact identified. The recruiter alias on the posting is a shared inbox.',
      recommendation: 'apply',
      recommendationRationale: [
        'Fit 86 — AWS security depth plus a current, relevant certification.',
        'Quality 72 — held down by the account wall and the verification challenge, not by the employer.',
        'Expect two takeovers: JobCopilot never enters credentials and never solves human-verification challenges.',
        'Direction 70 — inside your acceptable set but not toward the agent-infrastructure goal.',
      ],
    },
  }),

  mk({
    id: 'job-cobalt-reliability',
    title: 'Platform Reliability Engineer',
    company: 'Cobalt Freight',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'site-reliability',
    salary: null,
    postedDays: 94,
    discoveredDays: 1,
    source: 'aggregator',
    verification: 'aggregator-only',
    postingUrl: 'mock://company/jobs/platform-reliability-engineer',
    applyUrl: 'mock://company/jobs/platform-reliability-engineer',
    atsVendor: 'internal',
    fit: dim(58, 'Skills overlap, but the posting describes work you already do too much of.', [
      ['Deployment and pipeline work', 'positive', 'Direct overlap with current responsibilities (f-resp-cicd-ownership).'],
      ['Version-upgrade programme', 'negative', 'The posting lists "quarterly dependency and runtime upgrades" as a core duty (f-pref-away-from-maintenance).'],
      ['Cluster operations', 'negative', 'Requires cluster on-call, which the vault cannot support (f-resp-k8s-exposure).'],
    ]),
    direction: dim(22, 'Actively opposed to your stated direction.', [
      ['Repetitive maintenance is the job', 'negative', 'Four of six listed responsibilities are recurring upgrade or patching work.'],
      ['No platform-product framing', 'negative', 'Internal-tooling maintenance with no product surface.'],
      ['No AI/agent adjacency', 'negative', 'Nothing connects to the target direction.'],
    ]),
    quality: dim(18, 'Stale, unverified, no compensation, repeatedly reposted.', [
      ['Posted 94 days ago', 'negative', 'Well past the point where response rates collapse.'],
      ['Reposted 4 times', 'negative', 'Same requisition ID reappeared on 14 May, 2 Jun, 21 Jun and 9 Jul.'],
      ['No salary disclosed', 'negative', 'Aggregator listing carries no band and no estimate.'],
      ['Aggregator only', 'negative', 'No matching posting found on the Cobalt Freight careers site.'],
      ['Duplicate of an existing listing', 'negative', 'Same text as a listing already in your pipeline from a different aggregator.'],
    ]),
    effort: 'high',
    eligibility: 'unknown',
    outreach: false,
    strategy: 'general-senior-swe',
    recommendation: 'do-not-apply',
    tags: ['stale', 'duplicate', 'no-comp', 'aggregator', 'maintenance-heavy'],
    intelligence: {
      roleSummary:
        'Keep an internal deployment platform running: quarterly runtime upgrades, patch cycles, ticket-driven cluster support and an on-call rotation.',
      companySummary:
        'Cobalt Freight (fictional) is a regional freight broker. No engineering blog, no careers-site posting matching this listing.',
      teamSummary: 'Team size and reporting line are not stated anywhere in the posting.',
      responsibilities: [
        'Quarterly dependency and runtime upgrade programme.',
        'Patch management across the deployment fleet.',
        'Ticket-driven support for internal cluster users.',
        'Participate in a 1-in-4 on-call rotation.',
      ],
      qualifications: [
        q('5+ years SRE or platform experience', true, 'met', ['f-emp-vantage-senior']),
        q('Kubernetes cluster operations and on-call', true, 'unsupported', ['f-resp-k8s-exposure'], 'The vault caps this at deployment and workload debugging.'),
        q('Patch and upgrade programme ownership', true, 'met', ['f-proj-java-17', 'f-proj-python-311'], 'Met — but this is precisely the work you are trying to leave.'),
      ],
      hardGates: [
        US_AUTH_GATE,
        { label: 'Employer verification', status: 'unknown', detail: 'No corresponding posting on the employer domain. Aggregator listing only.' },
      ],
      concerns: [
        'Ninety-four days old and reposted four times under the same requisition ID — a common ghost-listing signature.',
        'No compensation disclosed and no estimate possible from the posting.',
        'Duplicate of a listing already in your pipeline from a different aggregator.',
        'Four of six responsibilities are recurring maintenance.',
        'Requires Kubernetes cluster on-call, which cannot be honestly claimed.',
      ],
      careerDirectionAnalysis:
        'This role would increase the share of your week spent on version bumps and patch cycles — the exact thing you recorded as your reason for leaving. Even if the offer came, it moves you backwards.',
      likelyInterviewThemes: [],
      difficulty: { level: 'very-high', detail: 'Not assessed. The application was not opened.' },
      recommendedStrategy: 'general-senior-swe',
      recommendedOutreach: 'None. No contact should be spent on this listing.',
      recommendation: 'do-not-apply',
      recommendationRationale: [
        'Quality 18 — stale at 94 days, reposted four times, no compensation, and not verifiable on the employer site.',
        'Duplicate: the same posting text is already in your pipeline from another aggregator.',
        'Direction 22 — four of six responsibilities are the repetitive maintenance work you explicitly want less of.',
        'A required qualification (Kubernetes cluster on-call) cannot be supported by the Career Vault.',
        'Recommendation is do-not-apply. No application scenario has been prepared and no outreach contact will be spent here.',
      ],
    },
  }),
];

// ---------------------------------------------------------------------------
// The rest of the discovery pipeline.
// ---------------------------------------------------------------------------

interface TailSeed {
  id: string;
  title: string;
  company: string;
  companySize: CompanySize;
  location: string;
  remote: RemoteStatus;
  seniority: Seniority;
  family: JobFamily;
  salary: Money | null;
  postedDays: number;
  discoveredDays: number;
  source: JobSource;
  verification: EmployerVerification;
  atsVendor: Job['atsVendor'];
  fit: [number, string, FactorTuple[]];
  direction: [number, string, FactorTuple[]];
  quality: [number, string, FactorTuple[]];
  effort: ApplicationEffort;
  eligibility?: EligibilityStatus;
  outreach?: boolean;
  strategy: ResumeStrategyId;
  recommendation: JobRecommendation;
  tags: string[];
  roleSummary: string;
  rationale: string[];
  concerns?: string[];
  requiresClearance?: boolean;
}

const TAIL: TailSeed[] = [
  {
    id: 'job-tidewater-secplat',
    title: 'Senior Security Platform Engineer',
    company: 'Tidewater Compute',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(180_000, 215_000),
    postedDays: 5,
    discoveredDays: 1,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [87, 'Close cousin of the Meridian role with the same evidence backing it.', [
      ['SAST programme ownership', 'positive', 'Backed by f-acc-veracode.'],
      ['Secrets management', 'positive', 'Vault-adjacent work through the runner fleet (f-tech-github-actions).'],
      ['Kubernetes admission control', 'negative', 'Preferred requirement the vault cannot fully support (f-resp-k8s-exposure).'],
    ]],
    direction: [75, 'Security platform, engineer customers, low maintenance framing.', [
      ['Paved-road framing', 'positive', 'Posting is written as a product for engineers.'],
      ['Not agent infrastructure', 'negative', 'Adjacent to the target direction only.'],
    ]],
    quality: [84, 'Fresh, verified, band published.', [
      ['Posted 5 days ago', 'positive', 'Inside the high-response window.'],
      ['Band published', 'positive', '$180k–$215k.'],
      ['Interview loop is five rounds', 'negative', 'Higher time cost than peers.'],
    ]],
    effort: 'medium',
    outreach: true,
    strategy: 'security-platform',
    recommendation: 'apply',
    tags: ['appsec', 'remote', 'published-band'],
    roleSummary: 'Own the secure-delivery paved road for a 200-engineer organisation.',
    rationale: [
      'Fit 87 — the same verified evidence that carries the Meridian application applies here.',
      'Quality 84 — fresh, verified and banded.',
      'Five-round loop is the main cost; worth applying but sequence it after Meridian.',
    ],
  },
  {
    id: 'job-basalt-appsec',
    title: 'Application Security Engineer',
    company: 'Basalt Security',
    companySize: 'startup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(170_000, 205_000),
    postedDays: 12,
    discoveredDays: 3,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [81, 'Strong appsec match; lighter on the platform-building side you prefer.', [
      ['Secure code review', 'positive', 'f-skill-secure-code-review.'],
      ['Threat modelling', 'positive', 'f-skill-threat-modeling.'],
      ['Pentesting', 'negative', 'Expected as 30% of the role; no offensive-security evidence in the vault.'],
    ]],
    direction: [58, 'Drifts toward review work rather than platform building.', [
      ['Reviewer-heavy', 'negative', 'Reads as a service function (f-pref-team-shape).'],
      ['Security domain', 'positive', 'Stays in a target family.'],
    ]],
    quality: [70, 'Good company signals, band slightly under target.', [
      ['Band $170k–$205k', 'neutral', 'Bottom of range sits below your $205k target.'],
      ['Posted 12 days ago', 'neutral', 'Mid-freshness.'],
    ]],
    effort: 'low',
    strategy: 'security-platform',
    recommendation: 'low-value',
    tags: ['appsec', 'pentest', 'remote'],
    roleSummary: 'Security review and testing for a security-tooling startup.',
    rationale: [
      'Direction 58 — reviewer-shaped role rather than a platform you build.',
      'Band starts below your stated $205k target.',
      'Low effort to apply, so keep it as a fallback rather than a priority.',
    ],
  },
  {
    id: 'job-kestrel-agentinfra',
    title: 'Agent Infrastructure Engineer',
    company: 'Kestrel Dynamics',
    companySize: 'startup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-agent-infrastructure',
    salary: money(195_000, 230_000),
    postedDays: 4,
    discoveredDays: 0,
    source: 'community-board',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [79, 'Agent runtime work matches; they want Rust, you do not write Rust.', [
      ['Agent orchestration shipped', 'positive', 'f-proj-agent-review-harness.'],
      ['Evaluation harness', 'positive', 'f-gh-agent-harness.'],
      ['Rust required', 'negative', 'No Rust anywhere in the vault.'],
    ]],
    direction: [93, 'Squarely the target direction.', [
      ['Agent infrastructure', 'positive', 'f-pref-agent-infrastructure.'],
      ['Sandboxing focus', 'positive', 'Security background transfers directly.'],
    ]],
    quality: [76, 'Strong role, small company, Rust gate.', [
      ['Posted 4 days ago', 'positive', 'Fresh.'],
      ['Band $195k–$230k', 'positive', 'Above target.'],
      ['Rust is a hard requirement', 'negative', 'Named three times in the posting.'],
    ]],
    effort: 'medium',
    eligibility: 'conditional',
    outreach: true,
    strategy: 'ai-platform',
    recommendation: 'apply-with-referral',
    tags: ['ai-agents', 'rust', 'sandboxing', 'remote'],
    roleSummary: 'Runtime, isolation and tooling for a customer-facing agent product written in Rust.',
    rationale: [
      'Direction 93 — one of the best direction matches available.',
      'Rust is stated as required and the vault has no Rust evidence, so a cold application is unlikely to clear screening.',
      'Recommended only with a referral who can vouch for systems transfer from Python and Go.',
    ],
    concerns: ['Rust is a genuine gap, not a phrasing problem. Do not let the resume imply otherwise.'],
  },
  {
    id: 'job-lanternfish-devprod',
    title: 'Developer Productivity Engineer',
    company: 'Lanternfish Labs',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'developer-productivity',
    salary: money(178_000, 212_000),
    postedDays: 7,
    discoveredDays: 1,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [92, 'The uv migration and CI time reduction are almost a line-by-line answer to this posting.', [
      ['Build performance', 'positive', '22 → 7 minute median CI (f-acc-pipeline-time).'],
      ['Toolchain migrations', 'positive', '41-repo uv migration (f-proj-poetry-uv).'],
      ['Monorepo tooling', 'positive', 'Dependency-graph-aware job selection (f-acc-pipeline-time).'],
    ]],
    direction: [80, 'Developer platform with real internal customers.', [
      ['Engineer customers', 'positive', 'f-pref-team-shape.'],
      ['Not agent infrastructure', 'negative', 'Secondary direction.'],
    ]],
    quality: [82, 'Verified, banded, reasonable process.', [
      ['Posted 7 days ago', 'positive', 'Fresh.'],
      ['Band $178k–$212k', 'positive', 'Straddles target.'],
      ['Three-round loop', 'positive', 'Low time cost.'],
    ]],
    effort: 'low',
    outreach: true,
    strategy: 'developer-productivity',
    recommendation: 'priority-apply',
    tags: ['build-systems', 'ci', 'remote', 'published-band'],
    roleSummary: 'Own build performance and the developer toolchain for a 300-engineer monorepo.',
    rationale: [
      'Fit 92 — the highest fit score in the pipeline; two accomplishments answer the posting almost verbatim.',
      'Effort is low and the loop is three rounds, so the cost per expected interview is the best available.',
      'Direction 80 — a genuine step away from maintenance work toward platform building.',
    ],
  },
  {
    id: 'job-umbra-cloudsec',
    title: 'Cloud Security Architect',
    company: 'Umbra Networks',
    companySize: 'enterprise',
    location: 'Seattle, WA — Hybrid',
    remote: 'hybrid',
    seniority: 'principal',
    family: 'cloud-security',
    salary: money(215_000, 260_000),
    postedDays: 15,
    discoveredDays: 4,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [66, 'Architecture depth is there; the scale and the org politics are a step up.', [
      ['AWS security architecture', 'positive', 'f-tech-aws, f-cert-aws-security.'],
      ['Review board experience', 'positive', 'f-resp-security-review.'],
      ['Multi-cloud (Azure + GCP)', 'negative', 'Required. Vault is AWS-only.'],
      ['Principal-level org influence', 'negative', 'A level jump from senior IC.'],
    ]],
    direction: [64, 'Architect track pulls away from hands-on building.', [
      ['Seattle hybrid', 'positive', 'Inside your acceptable commute (f-loc-remote-first).'],
      ['Less hands-on', 'negative', 'Design-review-heavy role.'],
    ]],
    quality: [80, 'Highest band in the pipeline; slow enterprise process.', [
      ['Band $215k–$260k', 'positive', 'Well above target.'],
      ['Posted 15 days ago', 'neutral', 'Ageing.'],
      ['Seven-stage interview process', 'negative', 'Very high time cost.'],
    ]],
    effort: 'very-high',
    outreach: true,
    strategy: 'cloud-security',
    recommendation: 'stretch',
    tags: ['architect', 'multi-cloud', 'seattle', 'hybrid', 'high-band'],
    roleSummary: 'Principal-level cloud security architecture across a multi-cloud enterprise estate.',
    rationale: [
      'Band is the highest available and the location works, which is why this stays in the pipeline.',
      'Multi-cloud is required and the vault is AWS-only — a genuine gap, not a phrasing gap.',
      'Seven interview stages against a very-high effort application makes this a poor use of hours unless the level jump is the goal.',
    ],
    concerns: ['Azure and GCP are required. Do not let the tailored resume imply multi-cloud depth.'],
  },
  {
    id: 'job-nimbus-devsecops',
    title: 'DevSecOps Engineer',
    company: 'Nimbus Ledger',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'devsecops',
    salary: money(172_000, 205_000),
    postedDays: 21,
    discoveredDays: 6,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [83, 'Pipeline security is a direct match.', [
      ['Pipeline hardening', 'positive', 'f-resp-cicd-ownership, f-tech-github-actions.'],
      ['SBOM / supply chain', 'positive', 'f-gh-sbom-diff.'],
      ['PCI-DSS scope', 'negative', 'No payments-compliance evidence.'],
    ]],
    direction: [62, 'Fintech compliance load is close to the maintenance work you are leaving.', [
      ['Compliance-heavy', 'negative', 'PCI evidence cycles (f-pref-away-from-maintenance).'],
      ['Supply-chain focus', 'positive', 'Genuinely interesting subset.'],
    ]],
    quality: [61, 'Ageing posting, band at the low end.', [
      ['Posted 21 days ago', 'negative', 'Past the freshness window in your own data.'],
      ['Band $172k–$205k', 'neutral', 'Target sits at the ceiling.'],
    ]],
    effort: 'medium',
    strategy: 'devsecops',
    recommendation: 'low-value',
    tags: ['fintech', 'pci', 'supply-chain', 'remote'],
    roleSummary: 'Pipeline and supply-chain security for a payments platform under PCI scope.',
    rationale: [
      'Quality 61 — 21 days old, and your own analytics show response rate halves past 14 days.',
      'Direction 62 — PCI evidence cycles are recurring compliance maintenance.',
      'Fit is good, so keep it as a fallback if the priority applications go quiet.',
    ],
  },
  {
    id: 'job-orchardgate-swe',
    title: 'Senior Software Engineer, Platform',
    company: 'Orchard Gate',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'senior-software-engineering',
    salary: money(180_000, 220_000),
    postedDays: 8,
    discoveredDays: 2,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [85, 'Generalist platform role that most of the vault supports.', [
      ['Backend depth', 'positive', 'f-tech-java, f-tech-python.'],
      ['Platform ownership', 'positive', 'f-resp-cicd-ownership.'],
      ['Product-facing work', 'neutral', 'Half the role is customer-facing features.'],
    ]],
    direction: [55, 'A safe lateral move rather than a direction change.', [
      ['Generalist scope', 'negative', 'Does not advance a named direction.'],
      ['Strong engineering culture', 'positive', 'Public engineering blog with real technical depth.'],
    ]],
    quality: [83, 'Healthy signals across the board.', [
      ['Posted 8 days ago', 'positive', 'Fresh.'],
      ['Band published', 'positive', '$180k–$220k.'],
    ]],
    effort: 'low',
    strategy: 'general-senior-swe',
    recommendation: 'apply',
    tags: ['generalist', 'platform', 'remote'],
    roleSummary: 'Platform and product engineering for a scheduling product.',
    rationale: [
      'Fit 85 with low application effort makes this cheap to keep in the pipeline.',
      'Direction 55 — a lateral move; use the general strategy rather than a specialised one.',
    ],
  },
  {
    id: 'job-fenwick-aiplat',
    title: 'AI Platform Engineer',
    company: 'Fenwick Robotics',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-platform',
    salary: money(185_000, 225_000),
    postedDays: 2,
    discoveredDays: 0,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [76, 'LLM tooling matches; robotics simulation stack does not.', [
      ['LLM orchestration', 'positive', 'f-tech-llm-orchestration.'],
      ['Eval harnesses', 'positive', 'f-gh-agent-harness.'],
      ['ROS / simulation', 'negative', 'No robotics evidence in the vault.'],
    ]],
    direction: [82, 'AI platform work with an interesting adjacency.', [
      ['AI platform', 'positive', 'Named target direction.'],
      ['Embodied/spatial angle', 'positive', 'Overlaps your VR interest (f-pref-agent-infrastructure).'],
    ]],
    quality: [85, 'Very fresh, verified, banded.', [
      ['Posted 2 days ago', 'positive', 'Earliest possible entry.'],
      ['Band $185k–$225k', 'positive', 'Above target.'],
    ]],
    effort: 'medium',
    outreach: true,
    strategy: 'ai-platform',
    recommendation: 'apply',
    tags: ['ai-platform', 'robotics', 'remote', 'fresh'],
    roleSummary: 'Build the model-serving and evaluation platform behind a robotics fleet.',
    rationale: [
      'Direction 82 and quality 85 — a strong combination and only two days old.',
      'Fit 76 — the robotics simulation stack is unfamiliar, which the cover note should address honestly.',
    ],
  },
  {
    id: 'job-alderwood-secplat',
    title: 'Security Platform Engineer, Detection',
    company: 'Alderwood Analytics',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(168_000, 198_000),
    postedDays: 30,
    discoveredDays: 7,
    source: 'aggregator',
    verification: 'unverified',
    atsVendor: 'northwind',
    fit: [64, 'Detection engineering is the weakest area in the vault.', [
      ['Security tooling', 'positive', 'General appsec depth transfers.'],
      ['Detection engineering', 'negative', 'No SIEM or detection-rule ownership recorded.'],
    ]],
    direction: [48, 'Alert-triage shape.', [
      ['Triage rota', 'negative', 'Reproduces the treadmill.'],
    ]],
    quality: [38, 'Stale and unverified with a below-target band.', [
      ['Posted 30 days ago', 'negative', 'Well past the freshness window.'],
      ['Not verified on employer site', 'negative', 'Aggregator listing only.'],
      ['Band below target', 'negative', 'Ceiling of $198k is under your $205k number.'],
    ]],
    effort: 'medium',
    strategy: 'security-platform',
    recommendation: 'do-not-apply',
    tags: ['detection', 'stale', 'unverified'],
    roleSummary: 'Detection engineering and alert triage for an analytics vendor.',
    rationale: [
      'Quality 38 — 30 days old, unverified, and banded below your target.',
      'Fit 64 — detection engineering is a genuine gap.',
      'Direction 48 — triage rota conflicts with the maintenance preference.',
    ],
  },
  {
    id: 'job-stratus-devprod',
    title: 'Staff Engineer, Developer Experience',
    company: 'Stratus Fold',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'staff',
    family: 'developer-productivity',
    salary: money(200_000, 245_000),
    postedDays: 6,
    discoveredDays: 1,
    source: 'referral-network',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [88, 'Build systems, migrations and internal advocacy all map cleanly.', [
      ['Build performance', 'positive', 'f-acc-pipeline-time.'],
      ['Migration without meetings', 'positive', 'f-story-uv-migration.'],
      ['Staff-level influence', 'positive', 'Mentoring and org-wide rollouts recorded (f-skill-mentoring, f-acc-ai-adoption).'],
    ]],
    direction: [84, 'Developer platform at staff level.', [
      ['Platform product framing', 'positive', 'f-pref-team-shape.'],
      ['Scope increase', 'positive', 'Staff title with org-wide remit.'],
    ]],
    quality: [90, 'Referral-sourced, fresh, highest-quality signal in the pipeline.', [
      ['Referral route available', 'positive', 'Former colleague is on the team.'],
      ['Posted 6 days ago', 'positive', 'Fresh.'],
      ['Band $200k–$245k', 'positive', 'Above target.'],
    ]],
    effort: 'medium',
    outreach: true,
    strategy: 'developer-productivity',
    recommendation: 'priority-apply',
    tags: ['staff', 'devex', 'referral', 'remote'],
    roleSummary: 'Own developer experience across a 400-engineer organisation at staff level.',
    rationale: [
      'Quality 90 — a warm referral route exists, which is the single strongest signal in your own analytics.',
      'Fit 88 and direction 84 — a scope increase in a direction you want.',
      'Contact the referral before submitting; referral-attached applications in your history convert far better.',
    ],
  },
  {
    id: 'job-corvid-agentsec',
    title: 'Security Engineer, AI Systems',
    company: 'Corvid Systems',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-agent-infrastructure',
    salary: money(190_000, 228_000),
    postedDays: 10,
    discoveredDays: 2,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [89, 'The rare role where the security background and the agent work both count.', [
      ['Agent sandboxing', 'positive', 'f-proj-agent-review-harness plus f-skill-threat-modeling.'],
      ['Threat modelling', 'positive', 'Directly named in the posting.'],
      ['Prompt-injection research', 'neutral', 'No published work, but the security reasoning transfers.'],
    ]],
    direction: [91, 'Agent infrastructure with a security lens — the intersection you want.', [
      ['Agent safety', 'positive', 'f-pref-agent-infrastructure.'],
      ['Security domain retained', 'positive', 'Keeps six years of security depth relevant.'],
    ]],
    quality: [81, 'Solid, slightly ageing.', [
      ['Posted 10 days ago', 'neutral', 'Mid-freshness.'],
      ['Band $190k–$228k', 'positive', 'Above target.'],
    ]],
    effort: 'medium',
    outreach: true,
    strategy: 'ai-platform',
    recommendation: 'priority-apply',
    tags: ['ai-security', 'agents', 'threat-modeling', 'remote'],
    roleSummary: 'Security for agentic systems: sandbox boundaries, tool permissions and prompt-injection defence.',
    rationale: [
      'Fit 89 and direction 91 — the best combined score in the pipeline.',
      'This is the only role where both your security depth and your agent work are load-bearing.',
      'Apply before it ages past 14 days.',
    ],
  },
  {
    id: 'job-vireo-devsecops',
    title: 'DevSecOps Lead',
    company: 'Vireo Health Systems',
    companySize: 'enterprise',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'lead',
    family: 'devsecops',
    salary: money(190_000, 225_000),
    postedDays: 18,
    discoveredDays: 5,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [72, 'Pipeline leadership matches; HIPAA and clinical systems do not.', [
      ['Team leadership', 'positive', 'f-skill-mentoring.'],
      ['Pipeline security', 'positive', 'f-resp-cicd-ownership.'],
      ['HIPAA / clinical systems', 'negative', 'No healthcare-regulatory evidence.'],
    ]],
    direction: [50, 'People-management drift plus a heavy compliance surface.', [
      ['Lead role', 'neutral', 'Partly a management track you have not chosen.'],
      ['HIPAA evidence cycles', 'negative', 'Recurring compliance maintenance.'],
    ]],
    quality: [66, 'Fine employer, ageing posting.', [
      ['Posted 18 days ago', 'negative', 'Past the freshness window.'],
      ['Band $190k–$225k', 'positive', 'Above target.'],
    ]],
    effort: 'high',
    strategy: 'devsecops',
    recommendation: 'low-value',
    tags: ['healthcare', 'hipaa', 'lead', 'remote'],
    roleSummary: 'Lead a four-person DevSecOps team inside a healthcare platform organisation.',
    rationale: [
      'Direction 50 — a management-track role you have not said you want, with a compliance-heavy remit.',
      'Posted 18 days ago against a high-effort application.',
    ],
  },
  {
    id: 'job-marlowe-cloudsec',
    title: 'Cloud Security Engineer',
    company: 'Marlowe Bank',
    companySize: 'enterprise',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'cloud-security',
    salary: money(182_000, 216_000),
    postedDays: 13,
    discoveredDays: 3,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [80, 'AWS depth carries it; regulated-banking context is new.', [
      ['AWS guardrails', 'positive', 'f-tech-aws, f-proj-terraform-modules.'],
      ['Banking regulation', 'negative', 'No FFIEC or SOX evidence.'],
    ]],
    direction: [52, 'Bank platform work with a large audit surface.', [
      ['Audit-driven', 'negative', 'Evidence collection is a named responsibility.'],
    ]],
    quality: [69, 'Stable employer, slow process, ageing posting.', [
      ['Posted 13 days ago', 'neutral', 'At the edge of the freshness window.'],
      ['Background check required', 'neutral', 'Standard for the sector; requires your consent.'],
    ]],
    effort: 'high',
    strategy: 'cloud-security',
    recommendation: 'low-value',
    tags: ['banking', 'audit', 'background-check', 'remote'],
    roleSummary: 'Cloud security controls and audit evidence for a regional bank.',
    rationale: [
      'Direction 52 — audit evidence collection is the maintenance pattern you are moving away from.',
      'Requires background-check consent, which is always handed to you.',
    ],
  },
  {
    id: 'job-highvane-secplat',
    title: 'Platform Security Engineer',
    company: 'Highvane Aerospace',
    companySize: 'enterprise',
    location: 'Everett, WA — Onsite',
    remote: 'onsite',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(175_000, 210_000),
    postedDays: 11,
    discoveredDays: 3,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [77, 'Good technical match behind a clearance wall.', [
      ['Secure delivery', 'positive', 'f-resp-cicd-ownership, f-acc-veracode.'],
      ['Cleared work', 'negative', 'Requires an active clearance you do not hold.'],
    ]],
    direction: [45, 'Onsite defence work, far from the target direction.', [
      ['Fully onsite', 'negative', 'Conflicts with remote-first preference (f-loc-remote-first).'],
    ]],
    quality: [55, 'Real role, but gated in two ways you cannot clear.', [
      ['Clearance required', 'negative', 'Hard gate.'],
      ['Onsite five days', 'negative', 'Hard gate.'],
    ]],
    effort: 'very-high',
    eligibility: 'ineligible',
    strategy: 'security-platform',
    recommendation: 'do-not-apply',
    tags: ['clearance', 'onsite', 'aerospace'],
    requiresClearance: true,
    roleSummary: 'Secure software delivery for aerospace programmes requiring an active clearance.',
    rationale: [
      'Eligibility is ineligible: an active security clearance is required and the vault records none.',
      'Fully onsite in Everett conflicts with your remote-first constraint.',
      'No application will be prepared.',
    ],
    concerns: ['Hard clearance gate — the agent will not submit an application that cannot clear a stated legal requirement.'],
  },
  {
    id: 'job-saltmarsh-devprod',
    title: 'Build Systems Engineer',
    company: 'Saltmarsh Media',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'developer-productivity',
    salary: money(165_000, 195_000),
    postedDays: 16,
    discoveredDays: 4,
    source: 'aggregator',
    verification: 'unverified',
    atsVendor: 'brightgate',
    fit: [86, 'Build systems is your strongest evidenced area.', [
      ['Build caching and sharding', 'positive', 'f-acc-pipeline-time.'],
      ['Monorepo tooling', 'positive', 'Direct match.'],
    ]],
    direction: [63, 'Right shape, unambitious scope.', [
      ['Narrow remit', 'neutral', 'Build systems only, no wider platform surface.'],
    ]],
    quality: [44, 'Unverified aggregator listing, band below target.', [
      ['Not verified on employer site', 'negative', 'No matching careers-page posting found.'],
      ['Band tops out at $195k', 'negative', 'Below your $205k target.'],
      ['Posted 16 days ago', 'negative', 'Ageing.'],
    ]],
    effort: 'medium',
    strategy: 'developer-productivity',
    recommendation: 'low-value',
    tags: ['build-systems', 'unverified', 'below-band'],
    roleSummary: 'Own the build system for a media-streaming monorepo.',
    rationale: [
      'Fit 86 but quality 44 — unverified listing with a band that tops out below target.',
      'Verify the posting on the employer site before spending effort here.',
    ],
  },
  {
    id: 'job-thornbury-swe',
    title: 'Senior Backend Engineer',
    company: 'Thornbury Retail',
    companySize: 'enterprise',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'senior-software-engineering',
    salary: money(170_000, 200_000),
    postedDays: 24,
    discoveredDays: 6,
    source: 'aggregator',
    verification: 'aggregator-only',
    atsVendor: 'northwind',
    fit: [74, 'Straightforward backend work well inside your ability.', [
      ['Java / Spring', 'positive', 'f-tech-java.'],
      ['No security or platform surface', 'neutral', 'Uses a narrow slice of the vault.'],
    ]],
    direction: [31, 'A step sideways and slightly down.', [
      ['Product feature work', 'negative', 'No platform or security dimension.'],
      ['No direction alignment', 'negative', 'None of the six target directions.'],
    ]],
    quality: [40, 'Stale aggregator listing with a below-target band.', [
      ['Posted 24 days ago', 'negative', 'Stale.'],
      ['Aggregator only', 'negative', 'Not verified on the employer domain.'],
    ]],
    effort: 'medium',
    strategy: 'general-senior-swe',
    recommendation: 'do-not-apply',
    tags: ['backend', 'retail', 'stale'],
    roleSummary: 'Backend feature development for an e-commerce platform.',
    rationale: [
      'Direction 31 — no alignment with any stated target direction.',
      'Quality 40 — stale and unverified.',
    ],
  },
  {
    id: 'job-duskwood-devprod',
    title: 'Engineering Tools Developer',
    company: 'Duskwood Games',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'developer-productivity',
    salary: money(160_000, 190_000),
    postedDays: 5,
    discoveredDays: 1,
    source: 'community-board',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [70, 'Tooling skills transfer; the engine and C++ stack do not.', [
      ['Internal tooling', 'positive', 'f-acc-pipeline-time.'],
      ['C++ / engine work', 'negative', 'No C++ in the vault.'],
    ]],
    direction: [59, 'Interesting adjacency to the VR interest, wrong stack.', [
      ['Spatial/real-time adjacency', 'positive', 'Touches the VR interest (f-pref-agent-infrastructure).'],
      ['Band below target', 'negative', 'Tops out at $190k.'],
    ]],
    quality: [64, 'Fresh and verified but under-banded.', [
      ['Posted 5 days ago', 'positive', 'Fresh.'],
      ['Band $160k–$190k', 'negative', 'Below your target.'],
    ]],
    effort: 'low',
    strategy: 'developer-productivity',
    recommendation: 'low-value',
    tags: ['games', 'tooling', 'cpp', 'below-band'],
    roleSummary: 'Internal tooling for a game studio pipeline.',
    rationale: [
      'Band tops out $15k below your stated target.',
      'C++ and engine internals are a real gap.',
    ],
  },
  {
    id: 'job-copperline-cloudsec',
    title: 'Senior Cloud Security Engineer',
    company: 'Copperline Energy',
    companySize: 'enterprise',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'cloud-security',
    salary: money(186_000, 220_000),
    postedDays: 4,
    discoveredDays: 0,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [84, 'AWS security and IaC guardrails match well.', [
      ['Multi-account AWS', 'positive', 'f-tech-aws.'],
      ['Policy-as-code', 'positive', 'f-proj-terraform-modules.'],
      ['OT/ICS security', 'negative', 'Preferred requirement with no supporting evidence.'],
    ]],
    direction: [66, 'Solid cloud security in an unfamiliar industry.', [
      ['Greenfield guardrail programme', 'positive', 'Building rather than maintaining.'],
      ['Energy sector', 'neutral', 'New domain to learn.'],
    ]],
    quality: [86, 'Fresh, verified, well banded.', [
      ['Posted 4 days ago', 'positive', 'Fresh.'],
      ['Band $186k–$220k', 'positive', 'Above target.'],
    ]],
    effort: 'medium',
    outreach: true,
    strategy: 'cloud-security',
    recommendation: 'apply',
    tags: ['aws', 'energy', 'greenfield', 'remote'],
    roleSummary: 'Stand up a cloud security guardrail programme for an energy utility.',
    rationale: [
      'Quality 86 and fit 84 — fresh, verified, banded above target.',
      'The greenfield framing means building rather than maintaining, which fits your direction.',
    ],
  },
  {
    id: 'job-quillon-aiplat',
    title: 'ML Platform Engineer',
    company: 'Quillon Health',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-platform',
    salary: money(180_000, 215_000),
    postedDays: 14,
    discoveredDays: 3,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [63, 'Platform skills transfer, ML training infrastructure does not.', [
      ['Platform engineering', 'positive', 'General infrastructure depth.'],
      ['Training infrastructure / GPUs', 'negative', 'No training-cluster or GPU-scheduling evidence.'],
      ['Feature stores', 'negative', 'No ML data-platform experience.'],
    ]],
    direction: [68, 'AI-adjacent but the wrong half of the stack.', [
      ['AI platform family', 'positive', 'Named direction.'],
      ['Training rather than inference/agents', 'negative', 'Not the agent-infrastructure layer you want.'],
    ]],
    quality: [67, 'Reasonable, ageing.', [
      ['Posted 14 days ago', 'neutral', 'At the freshness boundary.'],
      ['HIPAA environment', 'neutral', 'Adds compliance overhead.'],
    ]],
    effort: 'medium',
    strategy: 'ai-platform',
    recommendation: 'low-value',
    tags: ['ml-platform', 'healthcare', 'gpu'],
    roleSummary: 'Training and serving infrastructure for clinical ML models.',
    rationale: [
      'Fit 63 — training infrastructure is a genuine gap, not a phrasing problem.',
      'Direction 68 — AI-adjacent, but the training layer rather than the agent layer.',
    ],
  },
  {
    id: 'job-peregrine-sre',
    title: 'Site Reliability Engineer',
    company: 'Peregrine Freight',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'site-reliability',
    salary: money(168_000, 200_000),
    postedDays: 19,
    discoveredDays: 5,
    source: 'aggregator',
    verification: 'unverified',
    atsVendor: 'internal',
    fit: [61, 'Deployment work overlaps; cluster operations do not.', [
      ['Release engineering', 'positive', 'f-resp-deployments.'],
      ['Cluster operations and on-call', 'negative', 'Cannot be supported (f-resp-k8s-exposure).'],
    ]],
    direction: [29, 'On-call heavy operations role.', [
      ['1-in-3 on-call', 'negative', 'Heavy operational load.'],
      ['No platform-product surface', 'negative', 'Ticket-driven.'],
    ]],
    quality: [35, 'Unverified, ageing, below band.', [
      ['Unverified', 'negative', 'Aggregator only.'],
      ['Posted 19 days ago', 'negative', 'Ageing.'],
    ]],
    effort: 'medium',
    strategy: 'general-senior-swe',
    recommendation: 'do-not-apply',
    tags: ['sre', 'on-call', 'unverified'],
    roleSummary: 'Reliability and on-call for a freight logistics platform.',
    rationale: [
      'Direction 29 — heavy on-call operations against your stated preference.',
      'Requires cluster operations the vault cannot support.',
    ],
  },
  {
    id: 'job-kilnwood-devsecops',
    title: 'Security Automation Engineer',
    company: 'Kilnwood Manufacturing',
    companySize: 'enterprise',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'devsecops',
    salary: money(174_000, 206_000),
    postedDays: 7,
    discoveredDays: 2,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'brightgate',
    fit: [82, 'Security automation is a direct description of your current work.', [
      ['Security automation', 'positive', 'f-acc-veracode, f-gh-sbom-diff.'],
      ['Python tooling', 'positive', 'f-tech-python.'],
      ['OT network segmentation', 'negative', 'Preferred; no evidence.'],
    ]],
    direction: [57, 'Same work you do now, different employer.', [
      ['Lateral', 'negative', 'Does not change the shape of the week.'],
    ]],
    quality: [78, 'Fresh and verified, band around target.', [
      ['Posted 7 days ago', 'positive', 'Fresh.'],
      ['Band $174k–$206k', 'neutral', 'Target sits near the ceiling.'],
    ]],
    effort: 'low',
    strategy: 'devsecops',
    recommendation: 'apply',
    tags: ['automation', 'manufacturing', 'remote'],
    roleSummary: 'Automate security controls and reporting across a manufacturing IT estate.',
    rationale: [
      'Fit 82 with low effort — cheap to add to the pipeline.',
      'Direction 57 — lateral. Worth applying only while higher-direction roles are pending.',
    ],
  },
  {
    id: 'job-brightwater-swe',
    title: 'Senior Engineer, Internal Platform',
    company: 'Brightwater Analytics',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'senior-software-engineering',
    salary: money(176_000, 208_000),
    postedDays: 3,
    discoveredDays: 0,
    source: 'employer-careers-page',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [84, 'Internal platform work with a security thread.', [
      ['Internal platform', 'positive', 'f-resp-cicd-ownership.'],
      ['Python and Terraform', 'positive', 'f-tech-python, f-tech-terraform.'],
    ]],
    direction: [72, 'Platform with engineer customers.', [
      ['Engineer customers', 'positive', 'f-pref-team-shape.'],
      ['Generalist title', 'neutral', 'Scope depends on the team.'],
    ]],
    quality: [87, 'Very fresh, verified, banded.', [
      ['Posted 3 days ago', 'positive', 'Fresh.'],
      ['Band $176k–$208k', 'positive', 'Straddles target.'],
    ]],
    effort: 'low',
    strategy: 'general-senior-swe',
    recommendation: 'apply',
    tags: ['platform', 'remote', 'fresh'],
    roleSummary: 'Internal developer platform for a data analytics company.',
    rationale: [
      'Quality 87 and low effort — a good use of a spare application slot.',
      'Direction 72 — platform shape you like, generalist framing.',
    ],
  },
  {
    id: 'job-solstice-agentinfra',
    title: 'Infrastructure Engineer, Agent Runtime',
    company: 'Solstice Robotics',
    companySize: 'startup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'ai-agent-infrastructure',
    salary: money(185_000, 220_000, true),
    postedDays: 8,
    discoveredDays: 2,
    source: 'community-board',
    verification: 'verified',
    atsVendor: 'lattis',
    fit: [80, 'Agent runtime work with a hardware edge you have not touched.', [
      ['Agent orchestration', 'positive', 'f-proj-agent-review-harness.'],
      ['Edge/embedded deployment', 'negative', 'No embedded evidence.'],
    ]],
    direction: [87, 'Agent infrastructure, target direction.', [
      ['Agent runtime', 'positive', 'f-pref-agent-infrastructure.'],
      ['Robotics adjacency', 'positive', 'Interesting but unfamiliar.'],
    ]],
    quality: [68, 'Good role, estimated band, seed-stage risk.', [
      ['Band is estimated, not published', 'negative', 'Inferred from market data rather than disclosed.'],
      ['Seed stage, 22 people', 'negative', 'Highest stage risk in the pipeline.'],
    ]],
    effort: 'low',
    strategy: 'ai-platform',
    recommendation: 'apply',
    tags: ['ai-agents', 'robotics', 'seed', 'estimated-band'],
    roleSummary: 'Agent runtime and deployment infrastructure for robotics fleets.',
    rationale: [
      'Direction 87 — strong alignment with the agent-infrastructure goal.',
      'Quality 68 — the salary band is estimated rather than published and the company is seed stage.',
    ],
  },
  {
    id: 'job-ironvale-secplat',
    title: 'Security Platform Engineer, Identity',
    company: 'Ironvale Systems',
    companySize: 'scaleup',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'security-platform',
    salary: money(183_000, 218_000),
    postedDays: 12,
    discoveredDays: 3,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [78, 'IAM depth is there; identity-provider internals are not.', [
      ['IAM boundaries at scale', 'positive', 'f-tech-aws.'],
      ['OIDC in CI', 'positive', 'f-tech-github-actions.'],
      ['SCIM / directory sync internals', 'negative', 'No evidence.'],
    ]],
    direction: [67, 'Security platform, narrower identity focus.', [
      ['Identity specialism', 'neutral', 'Narrows rather than broadens.'],
    ]],
    quality: [73, 'Solid but ageing.', [
      ['Posted 12 days ago', 'neutral', 'Near the boundary.'],
      ['Band $183k–$218k', 'positive', 'Above target.'],
    ]],
    effort: 'medium',
    strategy: 'security-platform',
    recommendation: 'apply',
    tags: ['identity', 'iam', 'remote'],
    roleSummary: 'Identity and access platform engineering for a B2B SaaS company.',
    rationale: [
      'Fit 78 — IAM at scale is well evidenced; identity-provider internals are not.',
      'Apply soon; the posting is approaching the two-week freshness boundary.',
    ],
  },
  {
    id: 'job-brambleton-devsecops',
    title: 'DevSecOps Engineer (Public Sector)',
    company: 'Brambleton Civic Systems',
    companySize: 'midmarket',
    location: 'Remote — US',
    remote: 'remote',
    seniority: 'senior',
    family: 'devsecops',
    salary: money(160_000, 188_000),
    postedDays: 26,
    discoveredDays: 7,
    source: 'ats-feed',
    verification: 'verified',
    atsVendor: 'northwind',
    fit: [71, 'Pipeline work matches; the compliance framework does not.', [
      ['Pipeline security', 'positive', 'f-resp-cicd-ownership.'],
      ['StateRAMP', 'negative', 'No evidence.'],
    ]],
    direction: [41, 'Compliance-dominated public-sector work.', [
      ['Evidence collection', 'negative', 'Recurring maintenance.'],
      ['Below-target band', 'negative', 'Tops out at $188k.'],
    ]],
    quality: [42, 'Ageing with a below-target band.', [
      ['Posted 26 days ago', 'negative', 'Stale.'],
      ['Band below target', 'negative', '$188k ceiling.'],
    ]],
    effort: 'high',
    strategy: 'devsecops',
    recommendation: 'do-not-apply',
    tags: ['public-sector', 'stateramp', 'below-band', 'stale'],
    roleSummary: 'DevSecOps for state-government software under StateRAMP.',
    rationale: [
      'Quality 42 and direction 41 — stale, below band, and compliance-dominated.',
      'High application effort for a role that scores poorly on every dimension that matters to you.',
    ],
  },
];

const tailJobs: Job[] = TAIL.map((t) =>
  mk({
    id: t.id,
    title: t.title,
    company: t.company,
    companySize: t.companySize,
    location: t.location,
    remote: t.remote,
    seniority: t.seniority,
    family: t.family,
    salary: t.salary,
    postedDays: t.postedDays,
    discoveredDays: t.discoveredDays,
    source: t.source,
    verification: t.verification,
    requiresClearance: t.requiresClearance,
    postingUrl: 'mock://company/jobs/security-platform-engineer',
    applyUrl: 'mock://ats/simple-application',
    atsVendor: t.atsVendor,
    fit: dim(t.fit[0], t.fit[1], t.fit[2]),
    direction: dim(t.direction[0], t.direction[1], t.direction[2]),
    quality: dim(t.quality[0], t.quality[1], t.quality[2]),
    effort: t.effort,
    eligibility: t.eligibility,
    outreach: t.outreach,
    strategy: t.strategy,
    recommendation: t.recommendation,
    tags: t.tags,
    intelligence: intel({
      roleSummary: t.roleSummary,
      companySummary: `${t.company} is a fictional employer created for this demo. Company research shown here is simulated.`,
      teamSummary: 'Team shape inferred from the posting text.',
      concerns: t.concerns ?? [],
      difficulty: { level: t.effort, detail: 'Effort estimated from the form vendor and question count.' },
      recommendedStrategy: t.strategy,
      recommendation: t.recommendation,
      recommendationRationale: t.rationale,
      hardGates: [US_AUTH_GATE],
    }),
  }),
);

export const SEED_JOBS: Job[] = [...heroJobs, ...tailJobs];

/** Jobs the user has explicitly shortlisted. */
export const SEED_SHORTLIST: string[] = [
  'job-meridian-secplat',
  'job-verdance-aiplat',
  'job-corvid-agentsec',
  'job-stratus-devprod',
  'job-lanternfish-devprod',
  'job-northlake-cloudsec',
  'job-copperline-cloudsec',
  'job-fenwick-aiplat',
];

/** Jobs research has ruled out. */
export const SEED_REJECTED: string[] = [
  'job-cobalt-reliability',
  'job-alderwood-secplat',
  'job-highvane-secplat',
  'job-thornbury-swe',
  'job-peregrine-sre',
  'job-brambleton-devsecops',
];
