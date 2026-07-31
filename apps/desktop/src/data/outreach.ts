import type { OutreachContact } from '@shared/outreach';
import { ago } from './util';

/**
 * Eight mock contacts spread across the active pipeline, covering all seven
 * contact roles and all five approval states. Every draft is a draft: nothing
 * in this app can send a message. Network contacts are always "open the profile
 * and paste it yourself" — there is no simulated auto-send.
 */
export const SEED_OUTREACH: OutreachContact[] = [
  {
    id: 'oc-meridian-dana',
    jobId: 'job-meridian-secplat',
    name: 'Dana Okafor',
    title: 'Director of Security Platform',
    company: 'Meridian Freight Systems',
    role: 'team-director',
    whyRelevant:
      'Owns the team this role reports into. Wrote the engineering-blog post on paved-road build provenance that the posting is clearly derived from, so she is the person who can say whether the team wants a builder or an auditor.',
    contactSource: 'Named as the hiring team lead in the job posting itself',
    confidence: 'high',
    recommendedChannel: 'linkedin',
    goal: 'intro-to-hiring-manager',
    profileUrl: 'mock://profile/dana-okafor',
    draftMessage: [
      'Hi Dana — I read your write-up on making the paved road the cheapest path rather than the mandated one, and it lines up with how I have been running security tooling at an airline for the last four years.',
      'I have spent most of that time on the boring half of the problem: cutting Veracode remediation backlog by writing the fixes into shared build templates instead of filing tickets at teams.',
      'I am applying for the Security Platform Engineer role this week. Before I do, is the team optimising more for someone who builds the guardrails or someone who runs the review programme?',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'I read your write-up on making the paved road the cheapest path rather than the mandated one...',
        basis: 'Company research surfaced a public engineering-blog post authored by this contact, and the job posting reuses its language.',
        sourceLabel: 'Job intelligence — company signals',
        confidence: 'high',
      },
      {
        sentence: 'I have spent most of that time on the boring half of the problem: cutting Veracode remediation backlog...',
        basis: 'Career Vault accomplishment f-acc-veracode records a measured reduction achieved through shared build templates.',
        sourceLabel: 'Career Vault — f-acc-veracode',
        confidence: 'high',
      },
      {
        sentence: 'is the team optimising more for someone who builds the guardrails or someone who runs the review programme?',
        basis: 'The posting mixes platform-build and programme-management responsibilities; the ambiguity was flagged during research and is worth resolving before applying.',
        sourceLabel: 'Job intelligence — open questions',
        confidence: 'medium',
      },
    ],
    approvalState: 'approved',
    followUpDate: ago(-3),
    lastUpdated: ago(0, 4),
  },

  {
    id: 'oc-halcyon-marcus',
    jobId: 'job-halcyon-devsecops',
    name: 'Marcus Vey',
    title: 'Staff DevSecOps Engineer',
    company: 'Halcyon Grid',
    role: 'potential-peer',
    whyRelevant:
      'Would be a direct peer on the team. Best-placed person to answer the question that is currently blocking this application: whether "manage production Kubernetes clusters" means cluster ownership or workload ownership.',
    contactSource: 'Conference talk listing — spoke on supply-chain attestation at a regional DevSecOps meetup',
    confidence: 'medium',
    recommendedChannel: 'linkedin',
    goal: 'ask-for-info',
    profileUrl: 'mock://profile/marcus-vey',
    draftMessage: [
      'Hi Marcus — caught your meetup talk on attestation and the point about signing artefacts nobody can trace back to a build. That is the exact wall I hit last year.',
      'I am looking at the Senior DevSecOps role on your team and want to get one thing straight before I apply. The posting asks for production Kubernetes cluster management. My experience is workload-side: I write and own the Helm charts, tune limits and debug rollouts, but a separate platform team owns provisioning, upgrades and cluster on-call.',
      'Is the requirement genuinely cluster operations, or is it about being fluent shipping onto them? I would rather ask than stretch the wording.',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'caught your meetup talk on attestation and the point about signing artefacts nobody can trace back to a build',
        basis: 'Contact was located via a public conference listing; the talk topic overlaps with vault fact f-gh-sbom-diff.',
        sourceLabel: 'Job intelligence — contact discovery',
        confidence: 'medium',
      },
      {
        sentence: 'My experience is workload-side: I write and own the Helm charts, tune limits and debug rollouts...',
        basis: 'Stated at exactly the ceiling set by f-resp-k8s-exposure. The vault forbids describing this as managing or operating clusters.',
        sourceLabel: 'Career Vault — f-resp-k8s-exposure (claim ceiling)',
        confidence: 'high',
      },
      {
        sentence: 'I would rather ask than stretch the wording.',
        basis: 'Written deliberately: this application is blocked on an unsupported-claim stop, so the outreach names the gap instead of papering over it.',
        sourceLabel: 'Application app-halcyon — unsupported claim detected',
        confidence: 'high',
      },
    ],
    approvalState: 'needs-review',
    followUpDate: ago(-2),
    lastUpdated: ago(0, 2),
  },

  {
    id: 'oc-verdance-priya',
    jobId: 'job-verdance-aiplat',
    name: 'Priya Raghunathan',
    title: 'Technical Recruiter, Platform',
    company: 'Verdance Labs',
    role: 'recruiter',
    whyRelevant:
      'Handles all platform-team requisitions at Verdance. The posting has no published compensation range, and the recruiter is the only reliable route to one before the application asks for a number.',
    contactSource: 'Listed as the requisition contact on the posting',
    confidence: 'high',
    recommendedChannel: 'email',
    goal: 'contact-recruiter',
    draftMessage: [
      'Hi Priya,',
      'I am putting together an application for the AI Platform Engineer role and wanted to introduce myself first. I currently build internal agent-orchestration tooling and the security automation around it at an airline — evaluation harnesses, prompt-versioned pipelines, the whole unglamorous middle layer.',
      'The posting does not list a range. Before I put a number on the form, could you share the band you are working to for this level? My own target is $205,000 base, and I would rather find out now if that is outside what the requisition allows.',
      'Happy to send the resume across either way.',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'I currently build internal agent-orchestration tooling and the security automation around it at an airline...',
        basis: 'Vault fact f-tech-llm-orchestration, quoted within its ceiling: internal, non-customer-facing deployments only.',
        sourceLabel: 'Career Vault — f-tech-llm-orchestration',
        confidence: 'high',
      },
      {
        sentence: 'My own target is $205,000 base...',
        basis: 'User-verified compensation target f-comp-target-base. Named up front because compensation is a mandatory stop on the application form.',
        sourceLabel: 'Career Vault — f-comp-target-base',
        confidence: 'high',
      },
      {
        sentence: 'The posting does not list a range.',
        basis: 'Job intelligence flagged missing compensation as a quality detractor on this posting.',
        sourceLabel: 'Job intelligence — opportunity quality',
        confidence: 'high',
      },
    ],
    approvalState: 'draft',
    followUpDate: null,
    lastUpdated: ago(0, 6),
  },

  {
    id: 'oc-stratus-jenna',
    jobId: 'job-stratus-devprod',
    name: 'Jenna Alcott',
    title: 'Principal Engineer, Developer Platform',
    company: 'Stratus Rail Group',
    role: 'former-colleague',
    whyRelevant:
      'Worked with you on the internal build-tooling migration two employers ago and can refer you directly. Referral is the strongest converting path in your own history: 2 of 3 referred applications reached a screen.',
    contactSource: 'Shared employment history in the Career Vault (f-emp-ridgeline)',
    confidence: 'high',
    recommendedChannel: 'referral-portal',
    goal: 'request-referral',
    draftMessage: [
      'Jenna — long time. I saw Stratus is hiring on the developer-platform side and it reads like the work we were doing on the build migration, except with an actual mandate.',
      'Since then I have run two language-version migrations across roughly 40 services and moved the Python estate from Poetry to uv, which cut cold CI installs by a bit over half.',
      'Would you be willing to put a referral in for the Senior Developer Productivity Engineer role? Happy to send you the resume and a two-line summary you can paste.',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'it reads like the work we were doing on the build migration',
        basis: 'Shared project recorded in employment history fact f-emp-ridgeline.',
        sourceLabel: 'Career Vault — f-emp-ridgeline',
        confidence: 'high',
      },
      {
        sentence: 'moved the Python estate from Poetry to uv, which cut cold CI installs by a bit over half',
        basis: 'Quantified accomplishment f-proj-poetry-uv. The figure is the user-verified measured number, not a rounded-up estimate.',
        sourceLabel: 'Career Vault — f-proj-poetry-uv',
        confidence: 'high',
      },
      {
        sentence: 'Happy to send you the resume and a two-line summary you can paste.',
        basis: 'Referral requests convert better when the referrer has copy to reuse; drawn from the outreach analytics breakdown.',
        sourceLabel: 'Analytics — contact-type breakdown',
        confidence: 'medium',
      },
    ],
    approvalState: 'approved',
    followUpDate: ago(-4),
    lastUpdated: ago(0, 9),
  },

  {
    id: 'oc-tidewater-sam',
    jobId: 'job-tidewater-secplat',
    name: 'Sam Iverson',
    title: 'Senior Technical Recruiter',
    company: 'Tidewater Logistics',
    role: 'recruiter',
    whyRelevant:
      'Owns the requisition and has already moved this application to an onsite loop. Outreach is now scheduling and prep, not persuasion.',
    contactSource: 'Replied to the application acknowledgement email',
    confidence: 'high',
    recommendedChannel: 'email',
    goal: 'follow-up-after-applying',
    draftMessage: [
      'Hi Sam,',
      'Thanks for setting up the platform interview. Confirming I am good for the slot, and I have blocked prep time for the build-provenance discussion.',
      'One question so I prepare the right material: is the systems-design portion focused on CI/CD supply-chain controls, or broader cloud security architecture?',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'I have blocked prep time for the build-provenance discussion.',
        basis: 'Interview prep notes on this application list build provenance as the named topic.',
        sourceLabel: 'Application app-tidewater — interview prep notes',
        confidence: 'high',
      },
      {
        sentence: 'is the systems-design portion focused on CI/CD supply-chain controls, or broader cloud security architecture?',
        basis: 'The two areas differ sharply in vault coverage: supply chain is well evidenced, cloud security architecture is thinner.',
        sourceLabel: 'Career Vault — coverage gap analysis',
        confidence: 'medium',
      },
    ],
    approvalState: 'sent-manually',
    followUpDate: ago(-3),
    lastUpdated: ago(2, 1),
    response: {
      at: ago(1, 6),
      body: 'Systems design is CI/CD supply chain — think signing, provenance and how you would roll it out without stopping delivery. Dana from the platform team will run it. See you Thursday.',
      sentiment: 'positive',
    },
  },

  {
    id: 'oc-lanternfish-erin',
    jobId: 'job-lanternfish-devprod',
    name: 'Erin Boateng',
    title: 'Engineering Manager, Developer Experience',
    company: 'Lanternfish Analytics',
    role: 'hiring-manager',
    whyRelevant:
      'Hiring manager for the role and already replied asking for availability. This thread is the live one in the pipeline.',
    contactSource: 'Introduced herself in the reply to the application',
    confidence: 'high',
    recommendedChannel: 'email',
    goal: 'follow-up-after-applying',
    draftMessage: [
      'Hi Erin,',
      'Thanks for coming back so quickly. I am free Tuesday or Wednesday afternoon this week, and most of Thursday.',
      'On your question about migration rollouts: the pattern I have used is to land the change behind a per-service opt-in flag, take the two loudest teams first so the objections surface early, then flip the default once the failure modes are documented. Happy to walk through the Java 17 rollout in detail.',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'On your question about migration rollouts...',
        basis: 'Directly answers the question asked in the recruiter response on this application rather than restating the resume.',
        sourceLabel: 'Application app-lanternfish — recruiter response',
        confidence: 'high',
      },
      {
        sentence: 'Happy to walk through the Java 17 rollout in detail.',
        basis: 'Accomplishment f-proj-java-17 covers a 40-service rollout with recorded before/after failure rates.',
        sourceLabel: 'Career Vault — f-proj-java-17',
        confidence: 'high',
      },
    ],
    approvalState: 'needs-review',
    followUpDate: ago(-1),
    lastUpdated: ago(0, 3),
    response: {
      at: ago(1, 5),
      body: 'Great application — the uv migration numbers stood out. Can you share availability for a 45-minute chat this week? I am curious how you handle rollout resistance on migrations that touch every team.',
      sentiment: 'positive',
    },
  },

  {
    id: 'oc-kestrel-tobi',
    jobId: 'job-kestrel-agentinfra',
    name: 'Tobi Aranda',
    title: 'Founding Engineer, Agent Infrastructure',
    company: 'Kestrel Dynamics',
    role: 'alumni-connection',
    whyRelevant:
      'Same university programme, four years ahead of you. Kestrel is small enough that a founding engineer is effectively the hiring bar, and this is the role that most directly matches your stated direction away from maintenance work.',
    contactSource: 'Alumni directory match against education fact f-edu-bs',
    confidence: 'medium',
    recommendedChannel: 'linkedin',
    goal: 'ask-for-info',
    draftMessage: [
      'Hi Tobi — we overlapped at the same programme, a few years apart. I came across Kestrel through the Agent Infrastructure posting.',
      'The thing that caught me is that the role is about the harness rather than the model. I built an internal review harness for agent output at my current employer — replayable evaluation cases, versioned prompts, a human-review queue for anything the graders disagreed on. It is the part of the work I actually want more of.',
      'Would you be open to fifteen minutes on what the first six months there look like? I would rather understand the shape of the work before I apply than after.',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'we overlapped at the same programme, a few years apart',
        basis: 'Education fact f-edu-bs matches this contact in the alumni directory. Stated as an overlap in institution only — there is no evidence you know each other.',
        sourceLabel: 'Career Vault — f-edu-bs',
        confidence: 'medium',
      },
      {
        sentence: 'I built an internal review harness for agent output at my current employer — replayable evaluation cases, versioned prompts, a human-review queue...',
        basis: 'Project fact f-proj-agent-review-harness, described at its recorded scope: internal tooling, not a published product.',
        sourceLabel: 'Career Vault — f-proj-agent-review-harness',
        confidence: 'high',
      },
      {
        sentence: 'It is the part of the work I actually want more of.',
        basis: 'Stated preference f-pref-agent-infrastructure, paired with f-pref-away-from-maintenance.',
        sourceLabel: 'Career Vault — f-pref-agent-infrastructure',
        confidence: 'high',
      },
    ],
    approvalState: 'approved',
    followUpDate: ago(-5),
    lastUpdated: ago(0, 7),
  },

  {
    id: 'oc-basalt-nadia',
    jobId: 'job-basalt-appsec',
    name: 'Nadia Kerrigan',
    title: 'Security Engineer',
    company: 'Basalt Security',
    role: 'second-degree-connection',
    whyRelevant:
      'Connected through a former colleague at Ridgeline rather than directly. Basalt is a security vendor, so an application-security role there is closer to the review-and-audit work you have said you want less of — the value of this contact is a reality check, not a referral.',
    contactSource: 'Second-degree connection via f-emp-ridgeline; no direct relationship on record',
    confidence: 'low',
    recommendedChannel: 'linkedin',
    goal: 'ask-for-info',
    draftMessage: [
      'Hi Nadia — we are connected through a colleague from my Ridgeline days. I saw Basalt is hiring an Application Security Engineer.',
      'I have run secure code review and threat modelling as part of a platform role, but not as the whole job. Before I take it further: how much of the work is building tooling versus reviewing other teams\' code?',
    ].join('\n\n'),
    personalization: [
      {
        sentence: 'we are connected through a colleague from my Ridgeline days',
        basis: 'Employment fact f-emp-ridgeline is the only link on record. Deliberately not overstated as a direct relationship.',
        sourceLabel: 'Career Vault — f-emp-ridgeline',
        confidence: 'low',
      },
      {
        sentence: 'I have run secure code review and threat modelling as part of a platform role, but not as the whole job.',
        basis: 'Facts f-skill-secure-code-review and f-skill-threat-modeling are recorded as responsibilities within a broader role, not as a specialism. Stated at that ceiling.',
        sourceLabel: 'Career Vault — f-skill-secure-code-review',
        confidence: 'high',
      },
    ],
    approvalState: 'declined',
    followUpDate: null,
    lastUpdated: ago(1, 2),
  },
];
