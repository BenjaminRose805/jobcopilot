import type { ResumeSection, ResumeStrategy, TailoredResume } from '@career-model';
import { ago } from './util';

function section(
  id: string,
  heading: string,
  kind: ResumeSection['kind'],
  bullets: [id: string, text: string, facts: string[], keywords: string[]][],
  subtitle?: string,
): ResumeSection {
  return {
    id,
    heading,
    kind,
    subtitle,
    bullets: bullets.map(([bid, text, evidenceFactIds, keywords]) => ({ id: bid, text, evidenceFactIds, keywords })),
  };
}

const CURRENT_ROLE = 'Senior Software Engineer, Platform Security · Vantage Skyways';

export const SEED_STRATEGIES: ResumeStrategy[] = [
  {
    id: 'security-platform',
    name: 'Security Platform',
    positioning:
      'A platform engineer who happens to own security, not a security reviewer. Leads with programme ownership and measurable backlog reduction.',
    targetJobFamilies: ['security-platform', 'cloud-security', 'devsecops'],
    includedSkills: ['SAST/SCA programmes', 'Policy-as-code', 'Threat modelling', 'Supply-chain security', 'Terraform', 'AWS'],
    preferredFactIds: ['f-acc-veracode', 'f-proj-terraform-modules', 'f-skill-threat-modeling', 'f-gh-sbom-diff', 'f-resp-security-review'],
    baseResume: [
      section('sp-sum', 'Summary', 'summary', [
        ['sp-sum-1', 'Platform engineer specialising in secure software delivery. Six years building the paved road — scanning, policy gates and pipeline hardening — for a 240-engineer aviation platform organisation.', ['f-emp-vantage-senior', 'f-resp-cicd-ownership'], ['platform', 'secure delivery']],
      ]),
      section('sp-exp', 'Experience', 'experience', [
        ['sp-exp-1', 'Reduced the static-analysis backlog from 214 findings to 19 and held it under 25 for eleven months by introducing a triage taxonomy, a security-approved suppression policy and a weekly burn-down.', ['f-acc-veracode'], ['SAST', 'Veracode', 'remediation']],
        ['sp-exp-2', 'Authored a 23-module Terraform library where every module ships an OPA policy bundle, moving misconfiguration detection from code review to plan time.', ['f-proj-terraform-modules'], ['Terraform', 'OPA', 'policy-as-code']],
        ['sp-exp-3', 'Own CI/CD for six product teams: an autoscaling self-hosted runner fleet with OIDC cloud access, a shared workflow library and the release approval gates.', ['f-resp-cicd-ownership', 'f-tech-github-actions'], ['CI/CD', 'OIDC', 'supply chain']],
        ['sp-exp-4', 'Standing member of the architecture security review board; facilitate STRIDE threat-modelling sessions using a template now used across the Platform org.', ['f-resp-security-review', 'f-skill-threat-modeling'], ['threat modelling', 'STRIDE']],
      ], CURRENT_ROLE),
      section('sp-skills', 'Skills', 'skills', [
        ['sp-sk-1', 'Terraform · AWS (IAM, SCP, KMS) · GitHub Actions · Python · Java · OPA/conftest · CycloneDX SBOM · Veracode', ['f-tech-terraform', 'f-tech-aws', 'f-tech-python', 'f-tech-java'], ['Terraform', 'AWS', 'Python']],
      ]),
      section('sp-proj', 'Projects', 'projects', [
        ['sp-pr-1', 'sbom-diff — CLI that diffs CycloneDX SBOMs and surfaces newly introduced transitive dependencies carrying known advisories.', ['f-gh-sbom-diff'], ['SBOM', 'supply chain']],
      ]),
    ],
    performance: { applicationsSubmitted: 9, recruiterResponses: 4, interviews: 3, offers: 0 },
    lastUpdated: ago(12),
  },
  {
    id: 'devsecops',
    name: 'DevSecOps',
    positioning:
      'Delivery-pipeline first. Leads with CI/CD ownership and the measurable engineering-velocity effect of security controls that do not slow teams down.',
    targetJobFamilies: ['devsecops', 'security-platform', 'site-reliability'],
    includedSkills: ['CI/CD ownership', 'Supply-chain security', 'Release engineering', 'Policy-as-code', 'Container deployment'],
    preferredFactIds: ['f-resp-cicd-ownership', 'f-acc-pipeline-time', 'f-resp-deployments', 'f-gh-sbom-diff', 'f-proj-terraform-modules'],
    baseResume: [
      section('ds-sum', 'Summary', 'summary', [
        ['ds-sum-1', 'DevSecOps engineer who owns the delivery pipeline end to end and treats security controls as a latency budget: every gate must pay for the seconds it costs.', ['f-resp-cicd-ownership'], ['DevSecOps', 'pipeline']],
      ]),
      section('ds-exp', 'Experience', 'experience', [
        ['ds-exp-1', 'Cut median CI wall-clock from 22 to 7 minutes across 6,400 pipeline runs using remote build caching, test sharding and dependency-graph-aware job selection.', ['f-acc-pipeline-time'], ['CI', 'build performance']],
        ['ds-exp-2', 'Own the GitHub Actions runner fleet, shared workflow library, artifact registry and release approval gates for six product teams.', ['f-resp-cicd-ownership', 'f-tech-github-actions'], ['GitHub Actions', 'release engineering']],
        ['ds-exp-3', 'Named production deployment approver for the booking and check-in services; run the change-review call and hold the rollback decision.', ['f-resp-deployments'], ['deployments', 'production']],
        ['ds-exp-4', 'Embedded security scanning into every pipeline and drove the resulting backlog from 214 findings to 19.', ['f-acc-veracode'], ['SAST', 'remediation']],
        ['ds-exp-5', 'Deploy and debug containerised services on the shared internal Kubernetes platform via Helm charts owned by my team.', ['f-resp-k8s-exposure'], ['Kubernetes', 'Helm']],
      ], CURRENT_ROLE),
      section('ds-skills', 'Skills', 'skills', [
        ['ds-sk-1', 'GitHub Actions · Terraform · AWS · Helm · Python · OPA/conftest · Artifact signing and provenance', ['f-tech-github-actions', 'f-tech-terraform', 'f-tech-aws'], ['CI/CD', 'Terraform']],
      ]),
    ],
    performance: { applicationsSubmitted: 6, recruiterResponses: 3, interviews: 2, offers: 1 },
    lastUpdated: ago(9),
  },
  {
    id: 'ai-platform',
    name: 'AI Platform',
    positioning:
      'Leads with the agent harness and the evaluation work, framing six years of platform-security experience as the safety instinct agent infrastructure needs.',
    targetJobFamilies: ['ai-platform', 'ai-agent-infrastructure', 'developer-productivity'],
    includedSkills: ['LLM orchestration', 'Tool-calling contracts', 'Evaluation harnesses', 'Sandboxing', 'Python'],
    preferredFactIds: ['f-proj-agent-review-harness', 'f-tech-llm-orchestration', 'f-gh-agent-harness', 'f-acc-ai-adoption', 'f-skill-threat-modeling'],
    baseResume: [
      section('ai-sum', 'Summary', 'summary', [
        ['ai-sum-1', 'Platform engineer building agent infrastructure: tool contracts, execution safety and the evaluation harnesses that make agent changes reviewable. Six years of security-platform work behind the safety instincts.', ['f-proj-agent-review-harness', 'f-emp-vantage-senior'], ['agents', 'platform']],
      ]),
      section('ai-exp', 'Experience', 'experience', [
        ['ai-exp-1', 'Built an internal LLM agent harness that reviews dependency-bump pull requests: reads changelogs, runs the affected test subset and writes a risk summary. Adopted by four teams; a human approves every merge.', ['f-proj-agent-review-harness'], ['LLM', 'agents', 'tool calling']],
        ['ai-exp-2', 'Wrote the offline evaluation harness that gates every change to the agent: 180 recorded cases scored on tool-selection accuracy and false-confidence rate.', ['f-gh-agent-harness', 'f-tech-llm-orchestration'], ['evals', 'benchmarking']],
        ['ai-exp-3', 'Led the organisation-wide AI coding-assistant rollout, including the acceptable-use policy written with legal and security and the acceptance telemetry behind it. 240 engineers onboarded.', ['f-acc-ai-adoption'], ['AI tooling', 'governance']],
        ['ai-exp-4', 'Apply threat modelling to agent designs: tool permission boundaries, untrusted-input handling and blast-radius limits.', ['f-skill-threat-modeling'], ['threat modelling', 'sandboxing']],
      ], CURRENT_ROLE),
      section('ai-skills', 'Skills', 'skills', [
        ['ai-sk-1', 'Python · structured tool calling · offline evals · Terraform · AWS · GitHub Actions · threat modelling', ['f-tech-python', 'f-tech-llm-orchestration'], ['Python', 'evals']],
      ]),
      section('ai-proj', 'Projects', 'projects', [
        ['ai-pr-1', 'toolcall-bench — public harness scoring tool-calling agents on repository-maintenance tasks.', ['f-gh-agent-harness'], ['agents', 'evals']],
      ]),
    ],
    performance: { applicationsSubmitted: 4, recruiterResponses: 3, interviews: 2, offers: 0 },
    lastUpdated: ago(4),
  },
  {
    id: 'developer-productivity',
    name: 'Developer Productivity',
    positioning:
      'Leads with measured developer-time savings and migrations completed without asking teams for meetings.',
    targetJobFamilies: ['developer-productivity', 'senior-software-engineering', 'ai-platform'],
    includedSkills: ['Build systems', 'Toolchain migrations', 'Monorepo tooling', 'Developer telemetry', 'Python'],
    preferredFactIds: ['f-acc-pipeline-time', 'f-proj-poetry-uv', 'f-proj-python-311', 'f-story-uv-migration', 'f-acc-ai-adoption'],
    baseResume: [
      section('dp-sum', 'Summary', 'summary', [
        ['dp-sum-1', 'Developer productivity engineer. I measure engineering time, remove the largest cost, and ship the migration so that nobody has to attend a meeting about it.', ['f-acc-pipeline-time'], ['developer productivity']],
      ]),
      section('dp-exp', 'Experience', 'experience', [
        ['dp-exp-1', 'Cut median CI wall-clock from 22 to 7 minutes across 6,400 runs — roughly 90 engineer-hours returned per week.', ['f-acc-pipeline-time'], ['CI', 'build performance']],
        ['dp-exp-2', 'Migrated 41 Python repositories from Poetry to uv with a codemod, CI-verified lockfile equivalence and a one-line rollback. Median install time fell from 96s to 11s; adoption hit 100% in six weeks with no migration meetings.', ['f-proj-poetry-uv', 'f-story-uv-migration'], ['uv', 'Poetry', 'migration']],
        ['dp-exp-3', 'Ran the Python 3.8 → 3.11 and Java 11 → 17 upgrade programmes across the booking and data-integration estates, with a compatibility scanner that flagged deprecated APIs before each repo was touched.', ['f-proj-python-311', 'f-proj-java-17'], ['migration', 'Python', 'Java']],
        ['dp-exp-4', 'Rolled out AI coding assistants to 240 engineers with usage telemetry showing which repositories actually accept suggestions.', ['f-acc-ai-adoption'], ['AI tooling', 'adoption']],
      ], CURRENT_ROLE),
      section('dp-skills', 'Skills', 'skills', [
        ['dp-sk-1', 'Build caching and test sharding · uv/Poetry · GitHub Actions · Python · Java · developer telemetry', ['f-tech-python', 'f-tech-java', 'f-tech-github-actions'], ['build systems', 'Python']],
      ]),
    ],
    performance: { applicationsSubmitted: 5, recruiterResponses: 3, interviews: 2, offers: 0 },
    lastUpdated: ago(7),
  },
  {
    id: 'cloud-security',
    name: 'Cloud Security',
    positioning: 'AWS-first. Leads with multi-account guardrails, IAM design and the Security Specialty certification.',
    targetJobFamilies: ['cloud-security', 'security-platform', 'devsecops'],
    includedSkills: ['AWS multi-account', 'IAM boundaries', 'KMS', 'Terraform guardrails', 'OPA'],
    preferredFactIds: ['f-tech-aws', 'f-cert-aws-security', 'f-proj-terraform-modules', 'f-gh-drift-detector'],
    baseResume: [
      section('cs-sum', 'Summary', 'summary', [
        ['cs-sum-1', 'Cloud security engineer working across a multi-account AWS estate: preventative guardrails first, detection second, review last.', ['f-tech-aws'], ['AWS', 'cloud security']],
      ]),
      section('cs-exp', 'Experience', 'experience', [
        ['cs-exp-1', 'Own IAM permission boundaries, Organizations SCPs and KMS key policy for the platform estate.', ['f-tech-aws'], ['IAM', 'SCP', 'KMS']],
        ['cs-exp-2', 'Authored 23 Terraform modules with bundled OPA policy so misconfigurations fail at plan time rather than in review.', ['f-proj-terraform-modules'], ['Terraform', 'OPA']],
        ['cs-exp-3', 'Published terraform-drift-reporter, a scheduled drift detector that posts a readable summary rather than a raw plan diff (340 stars).', ['f-gh-drift-detector'], ['Terraform', 'drift']],
        ['cs-exp-4', 'Drove the static-analysis backlog from 214 findings to 19 and established the weekly burn-down that keeps it there.', ['f-acc-veracode'], ['remediation']],
      ], CURRENT_ROLE),
      section('cs-skills', 'Skills', 'skills', [
        ['cs-sk-1', 'AWS Certified Security — Specialty · Terraform · OPA/conftest · Python · GitHub Actions OIDC', ['f-cert-aws-security', 'f-tech-terraform'], ['AWS', 'certification']],
      ]),
    ],
    performance: { applicationsSubmitted: 3, recruiterResponses: 1, interviews: 0, offers: 0 },
    lastUpdated: ago(21),
  },
  {
    id: 'general-senior-swe',
    name: 'General Senior SWE',
    positioning: 'Broad engineering résumé for roles where the security and platform specialisation is not the point.',
    targetJobFamilies: ['senior-software-engineering', 'developer-productivity', 'site-reliability'],
    includedSkills: ['Java', 'Python', 'AWS', 'Terraform', 'Distributed systems'],
    preferredFactIds: ['f-tech-java', 'f-tech-python', 'f-proj-java-17', 'f-story-rollback', 'f-skill-mentoring'],
    baseResume: [
      section('gs-sum', 'Summary', 'summary', [
        ['gs-sum-1', 'Senior software engineer with nine years across backend services, infrastructure and developer platforms in aviation and logistics.', ['f-emp-vantage-senior', 'f-emp-ridgeline'], ['senior engineer']],
      ]),
      section('gs-exp', 'Experience', 'experience', [
        ['gs-exp-1', 'Coordinated a 14-service Java 11 → 17 migration across the booking fleet with zero customer-facing incidents.', ['f-proj-java-17'], ['Java', 'migration']],
        ['gs-exp-2', 'Named production deployment approver for booking and check-in; called a rollback fifteen minutes into a revenue-critical release when checkout errors rose 0.4%.', ['f-resp-deployments', 'f-story-rollback'], ['production', 'judgement']],
        ['gs-exp-3', 'Cut median CI wall-clock from 22 to 7 minutes across the monorepo pipelines.', ['f-acc-pipeline-time'], ['CI']],
        ['gs-exp-4', 'Mentored three engineers through their first year; two now own services.', ['f-skill-mentoring'], ['mentoring']],
      ], CURRENT_ROLE),
      section('gs-skills', 'Skills', 'skills', [
        ['gs-sk-1', 'Java · Spring Boot · Python · Terraform · AWS · GitHub Actions · PostgreSQL', ['f-tech-java', 'f-tech-python', 'f-tech-terraform', 'f-tech-aws'], ['Java', 'Python']],
      ]),
      section('gs-edu', 'Education', 'education', [
        ['gs-ed-1', 'BSc Computer Science, Cascadia State University.', ['f-edu-bs'], ['education']],
      ]),
    ],
    performance: { applicationsSubmitted: 4, recruiterResponses: 1, interviews: 0, offers: 0 },
    lastUpdated: ago(48),
  },
];

// ---------------------------------------------------------------------------
// Tailored resumes. `tr-halcyon-devsecops` carries the mandatory refusal.
// ---------------------------------------------------------------------------

export const SEED_TAILORED_RESUMES: TailoredResume[] = [
  {
    id: 'tr-meridian-secplat',
    jobId: 'job-meridian-secplat',
    strategyId: 'security-platform',
    createdAt: ago(0, 3),
    changes: [
      {
        id: 'tr-mc-1',
        kind: 'reworded',
        sectionHeading: 'Summary',
        baseText:
          'Platform engineer specialising in secure software delivery. Six years building the paved road — scanning, policy gates and pipeline hardening — for a 240-engineer aviation platform organisation.',
        proposedText:
          'Platform engineer who builds the secure paved road for other engineers. Six years owning scanning programmes, IaC policy gates and CI/CD supply-chain hardening for a 240-engineer organisation.',
        evidenceFactIds: ['f-emp-vantage-senior', 'f-resp-cicd-ownership', 'f-acc-veracode'],
        confidence: 'high',
        rationale:
          'Meridian uses "paved road" twice in the posting and frames the role as builder rather than reviewer. Mirroring their language without changing any claim.',
        concerns: [],
        keywordsCovered: ['paved road', 'supply chain', 'policy gates'],
        decision: 'approved',
      },
      {
        id: 'tr-mc-2',
        kind: 'reordered',
        sectionHeading: 'Experience',
        baseText: 'Terraform module library bullet appears second.',
        proposedText: 'Move the Terraform + OPA policy-gate bullet above the Veracode bullet.',
        evidenceFactIds: ['f-proj-terraform-modules'],
        confidence: 'high',
        rationale:
          'The posting lists IaC policy gates as the first responsibility and scanning as the second. Matching their ordering.',
        concerns: [],
        keywordsCovered: ['Terraform', 'OPA', 'policy-as-code'],
        decision: 'approved',
      },
      {
        id: 'tr-mc-3',
        kind: 'added',
        sectionHeading: 'Skills',
        proposedText: 'Add "Go (open-source project)" to the skills line.',
        evidenceFactIds: ['f-gh-drift-detector'],
        confidence: 'medium',
        rationale:
          'Go is listed three times under preferred qualifications. terraform-drift-reporter is written in Go, which supports a qualified mention.',
        concerns: [
          'Go is not a daily language. The qualifier "(open-source project)" must stay so the claim is not read as production depth.',
        ],
        keywordsCovered: ['Go'],
        decision: 'edited',
        userEditedText: 'Add "Go (one open-source project)" to the skills line.',
      },
      {
        id: 'tr-mc-4',
        kind: 'added',
        sectionHeading: 'Experience',
        proposedText:
          'Hardened the CI/CD supply chain with artifact signing, build provenance and isolated self-hosted runners.',
        evidenceFactIds: ['f-resp-cicd-ownership', 'f-tech-github-actions'],
        confidence: 'medium',
        rationale: 'Supply-chain provenance is a named responsibility in the posting and the runner fleet supports it.',
        concerns: ['The vault records OIDC and runner isolation. "Artifact signing" is the weakest part of this claim — confirm before approving.'],
        keywordsCovered: ['supply chain', 'provenance', 'signing'],
        decision: 'pending',
      },
    ],
    keywordCoverage: [
      { keyword: 'paved road', inBase: false, inTailored: true, requiredByJob: false },
      { keyword: 'policy-as-code', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'SAST', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'Terraform', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'supply chain', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'Go', inBase: false, inTailored: true, requiredByJob: false },
      { keyword: 'incident command', inBase: false, inTailored: false, requiredByJob: false },
    ],
  },
  {
    id: 'tr-halcyon-devsecops',
    jobId: 'job-halcyon-devsecops',
    strategyId: 'devsecops',
    createdAt: ago(1, 4),
    changes: [
      {
        id: 'tr-hg-refusal-k8s',
        kind: 'reworded',
        sectionHeading: 'Experience',
        baseText:
          'Deploy and debug containerised services on the shared internal Kubernetes platform via Helm charts owned by my team.',
        evidenceFactIds: ['f-resp-k8s-exposure'],
        confidence: 'unsupported',
        rationale:
          'The posting requires production experience operating Kubernetes clusters, so a stronger bullet was requested. The Career Vault cannot support it.',
        concerns: [
          'Halcyon lists cluster operation as a required qualification. Rewriting the bullet would misrepresent the boundary between deploying workloads and owning clusters.',
          'A screening question later in this application asks the same thing directly. Answering it honestly is the only consistent option.',
        ],
        keywordsCovered: ['Kubernetes'],
        decision: 'pending',
        refusal: {
          requestedText: 'Owned production Kubernetes infrastructure across four regions.',
          reason:
            'The Career Vault records Kubernetes exposure, not ownership: you write Helm charts and debug your own workloads on a shared cluster that a separate Cloud Platform team provisions, upgrades and carries the pager for. Fact f-resp-k8s-exposure sets an explicit ceiling forbidding "manage", "operate", "own" or "administer" for clusters, and the only certification that might support the claim (f-cert-cka) is in conflict and unusable. Writing the requested bullet would be a fabrication that the first technical screen would expose.',
          supportedAlternative:
            'Deployed and operated containerised workloads on a shared multi-region Kubernetes platform: authored and maintained the Helm charts for my team\'s services, tuned resource limits, and debugged rollout and pod-level failures. Cluster provisioning and upgrades were owned by a separate platform team.',
          blockingFactIds: ['f-resp-k8s-exposure', 'f-cert-cka'],
        },
      },
      {
        id: 'tr-hg-1',
        kind: 'reworded',
        sectionHeading: 'Summary',
        baseText:
          'DevSecOps engineer who owns the delivery pipeline end to end and treats security controls as a latency budget: every gate must pay for the seconds it costs.',
        proposedText:
          'Staff-level DevSecOps engineer owning delivery pipelines and their security controls for six product teams in a regulated aviation environment.',
        evidenceFactIds: ['f-resp-cicd-ownership', 'f-emp-vantage-senior'],
        confidence: 'high',
        rationale: 'Halcyon is a staff-level requisition in a regulated sector; leading with regulated scale is closer to their framing.',
        concerns: ['"Staff-level" describes scope, not title. Your current title is Senior — keep the distinction if asked.'],
        keywordsCovered: ['staff', 'regulated', 'pipeline'],
        decision: 'pending',
      },
      {
        id: 'tr-hg-2',
        kind: 'added',
        sectionHeading: 'Experience',
        proposedText:
          'Built the SBOM tooling used to track newly introduced transitive dependencies with known advisories across the estate.',
        evidenceFactIds: ['f-gh-sbom-diff'],
        confidence: 'high',
        rationale: 'Halcyon lists SBOM generation and review under continuous monitoring.',
        concerns: [],
        keywordsCovered: ['SBOM', 'supply chain'],
        decision: 'approved',
      },
      {
        id: 'tr-hg-3',
        kind: 'removed',
        sectionHeading: 'Experience',
        baseText: 'Cut median CI wall-clock from 22 to 7 minutes across 6,400 pipeline runs...',
        evidenceFactIds: ['f-acc-pipeline-time'],
        confidence: 'medium',
        rationale: 'Space. The posting weights control ownership far above velocity.',
        concerns: ['This is your strongest quantified result. Removing it for a compliance-weighted posting may be the wrong trade.'],
        keywordsCovered: [],
        decision: 'rejected',
      },
    ],
    keywordCoverage: [
      { keyword: 'Kubernetes', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'cluster operations', inBase: false, inTailored: false, requiredByJob: true },
      { keyword: 'FedRAMP', inBase: false, inTailored: false, requiredByJob: true },
      { keyword: 'SBOM', inBase: false, inTailored: true, requiredByJob: true },
      { keyword: 'policy-as-code', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'CI/CD', inBase: true, inTailored: true, requiredByJob: true },
    ],
  },
  {
    id: 'tr-verdance-aiplat',
    jobId: 'job-verdance-aiplat',
    strategyId: 'ai-platform',
    createdAt: ago(0, 6),
    changes: [
      {
        id: 'tr-vl-1',
        kind: 'reworded',
        sectionHeading: 'Experience',
        baseText:
          'Wrote the offline evaluation harness that gates every change to the agent: 180 recorded cases scored on tool-selection accuracy and false-confidence rate.',
        proposedText:
          'Built the offline evaluation harness gating every agent change: 180 recorded cases scored on tool-selection accuracy and false-confidence rate, run in CI before any prompt or tool-contract change merges.',
        evidenceFactIds: ['f-gh-agent-harness', 'f-tech-llm-orchestration'],
        confidence: 'high',
        rationale: 'Verdance names "evaluation harness that gates every runtime change" as a core responsibility. Adding the CI detail matches it precisely.',
        concerns: [],
        keywordsCovered: ['evals', 'tool contract', 'CI'],
        decision: 'approved',
      },
      {
        id: 'tr-vl-2',
        kind: 'added',
        sectionHeading: 'Summary',
        proposedText:
          'Security-platform background applied to agent execution safety: tool permission boundaries, untrusted-input handling and blast-radius limits.',
        evidenceFactIds: ['f-skill-threat-modeling', 'f-proj-agent-review-harness'],
        confidence: 'high',
        rationale: 'Sandboxing is their first listed responsibility, and the security background is the differentiator against typical AI-platform candidates.',
        concerns: [],
        keywordsCovered: ['sandboxing', 'isolation', 'permissions'],
        decision: 'approved',
      },
      {
        id: 'tr-vl-3',
        kind: 'added',
        sectionHeading: 'Experience',
        proposedText: 'Operated a customer-facing LLM product at scale.',
        evidenceFactIds: [],
        confidence: 'unsupported',
        rationale: 'Requested to strengthen the match against their "production agent runtime" language.',
        concerns: ['No supporting fact exists. All agent work in the vault is internal-only.'],
        keywordsCovered: [],
        decision: 'pending',
        refusal: {
          requestedText: 'Operated a customer-facing LLM product at scale.',
          reason:
            'Every agent deployment in the Career Vault is internal to your employer and used by four teams. Fact f-tech-llm-orchestration carries an explicit ceiling limiting the claim to internal, non-customer-facing deployments. There is no evidence of external users, scale or an SLA.',
          supportedAlternative:
            'Shipped an internal agent product used daily by four engineering teams, with an offline eval suite gating every change.',
          blockingFactIds: ['f-tech-llm-orchestration', 'f-proj-agent-review-harness'],
        },
      },
    ],
    keywordCoverage: [
      { keyword: 'agent runtime', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'sandboxing', inBase: false, inTailored: true, requiredByJob: true },
      { keyword: 'tool contract', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'evaluation harness', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'Python', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'customer-facing LLM', inBase: false, inTailored: false, requiredByJob: false },
    ],
  },
  {
    id: 'tr-lanternfish-devprod',
    jobId: 'job-lanternfish-devprod',
    strategyId: 'developer-productivity',
    createdAt: ago(1, 2),
    changes: [
      {
        id: 'tr-lf-1',
        kind: 'reworded',
        sectionHeading: 'Summary',
        baseText:
          'Developer productivity engineer. I measure engineering time, remove the largest cost, and ship the migration so that nobody has to attend a meeting about it.',
        proposedText:
          'Developer productivity engineer for monorepo-scale teams. I measure where engineering time goes, remove the largest cost, and land the migration without asking teams for meetings.',
        evidenceFactIds: ['f-acc-pipeline-time', 'f-story-uv-migration'],
        confidence: 'high',
        rationale: 'Lanternfish runs a 300-engineer monorepo and leads the posting with it.',
        concerns: [],
        keywordsCovered: ['monorepo', 'build performance'],
        decision: 'approved',
      },
      {
        id: 'tr-lf-2',
        kind: 'reordered',
        sectionHeading: 'Experience',
        baseText: 'uv migration bullet appears second.',
        proposedText: 'Lead with the uv migration bullet; it is the closest match to their stated toolchain problem.',
        evidenceFactIds: ['f-proj-poetry-uv'],
        confidence: 'high',
        rationale: 'Their posting explicitly mentions an in-flight Python packaging migration.',
        concerns: [],
        keywordsCovered: ['uv', 'toolchain migration'],
        decision: 'approved',
      },
    ],
    keywordCoverage: [
      { keyword: 'monorepo', inBase: false, inTailored: true, requiredByJob: true },
      { keyword: 'build caching', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'uv', inBase: true, inTailored: true, requiredByJob: true },
      { keyword: 'Bazel', inBase: false, inTailored: false, requiredByJob: false },
    ],
  },
];
