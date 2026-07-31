# Roadmap

What it would actually take to turn this prototype into a product someone could trust with their job
search. This is not a feature wishlist; it is an honest estimate of the work hiding behind each
fixture, ordered by what blocks what.

A recurring theme: **the hard problems are legal, ethical and evidential, not technical.** The
Electron shell in this repo is close to production shape. Almost everything below is about earning
the right to act on someone's behalf.

---

## Phase 0 — Decide what you are willing to do

Before a line of integration code, three questions need answers, because they determine the
architecture.

**1. Will the product ever submit an application without a human seeing it?**
This build says no, and that is load-bearing. Every locked stop, the absence of an auto-submit
switch, and the "interviews per hour of attention" metric all follow from it. If the answer becomes
yes, this is a different product with a different risk profile and a different liability story, and
most of the trust-building work below stops making sense.

**2. Whose terms of service are you prepared to violate?**
Most job boards and ATS vendors prohibit automated access. A product that drives a headless browser
against them is one enforcement action from having no product. The defensible paths are official
APIs, partner integrations, and user-driven automation running locally in the user's own
authenticated session where the user is genuinely present. Pick one before building.

**3. What is the liability model when the agent gets a fact wrong on a legal attestation?**
A false answer to a work-authorization or background-check question is the user's problem legally,
and the product's problem reputationally. This is the real reason those stops are locked.

---

## Phase 1 — Make the evidence layer real

Everything else depends on this. The Career Vault is currently 30 hand-written facts; it is also
the single most important component, because **the refusal mechanism is only as honest as the
evidence behind it.**

- **Ingestion.** Parse resumes (PDF/DOCX), let users import from profile exports, and support manual
  entry. Extraction from a PDF resume is genuinely hard — multi-column layouts, tables and
  inconsistent date formats all break naive parsers.
- **Provenance for every fact.** Each fact needs a source, an extraction confidence, an extraction
  timestamp, and a user verification state. The current three-state model (verified / unverified /
  AI-inferred) is the right shape and needs to be enforced end-to-end, not just rendered.
- **`claimCeiling`, derived rather than typed.** Today the ceiling on `f-resp-k8s-exposure` is a
  hand-written string. In a real system it has to be inferred from the evidence — a bullet saying
  "worked around Kubernetes deployments" supports "exposure", not "ownership" — and then confirmed
  by the user. This is the core research problem of the product. Getting it wrong in the permissive
  direction turns the app into a résumé-inflation machine; getting it wrong in the restrictive
  direction makes it useless.
- **Conflict detection and resolution.** The fixtures contain deliberate conflicts. Real vaults will
  contain many more, and users need a workflow to resolve them, not just a badge.
- **Recency decay.** A verified fact from four years ago is not a verified fact today.

Until this phase is real, no amount of model quality helps: an agent reasoning over unverified facts
produces confident fabrication.

---

## Phase 2 — Replace the scenario engine with a real agent

The engine's *interface* survives; its implementation does not.

- **Keep the typed step vocabulary as the action space.** A real model should emit
  `fill`/`select`/`click`/`requestApproval` — a constrained set with a schema — not free-form code.
  This is the single most valuable piece of the current design to carry forward.
- **Keep `PageDriver` as the boundary.** Swapping deterministic step execution for model-driven step
  selection should not require touching the browser layer.
- **Real page understanding.** Mock pages describe themselves with data attributes. Real ATS pages
  do not. You need accessibility-tree extraction, DOM summarisation within a context budget, and
  robust field-label association — the actual difficulty of browser agents lives here.
- **Grounding and refusal at inference time.** Every proposed answer must cite the fact ids that
  support it, and the system must detect when no fact does. This is retrieval plus a verification
  pass, and it needs to fail closed.
- **Determinism where it matters.** Users will not tolerate an agent that answers the same question
  differently on Tuesday. Cache approved answers by question fingerprint and treat the model as the
  fallback, not the default path.
- **Cost and latency.** A multi-page application is dozens of model calls. At scale that is the
  dominant unit cost, and it argues for aggressive caching of exactly the sort the preference system
  already models.
- **Evaluation.** You need a held-out set of real application forms and a scored harness measuring
  answer accuracy, refusal precision (did it refuse when it should have?) and, critically, refusal
  recall (did it ever *not* refuse when it should have?). The last number is the safety metric.

---

## Phase 3 — Real integrations, chosen carefully

- **Job sources.** Official APIs and partner feeds first. Deduplication across sources is a
  surprising amount of work: the same role appears with different titles, locations and salary
  bands, and users lose trust fast when they see the same job three times.
- **Real browser automation.** Playwright or CDP against real pages, with the navigation allowlist
  becoming a per-application domain allowlist rather than a single-scheme allowlist. Session and
  credential handling becomes a genuine security problem the moment real logins are involved — at
  minimum OS keychain storage, never plaintext, and ideally never storing them at all by keeping the
  user's own browser session in the loop.
- **Email.** Gmail/Outlook OAuth with the narrowest scopes that work, and a draft-only default. The
  jump from "creates a draft in your account" to "sends on your behalf" should be an explicit,
  revocable, per-message decision for a long time.
- **Professional networks.** There is no compliant automation path for most of them. Copy-to-
  clipboard with an open-profile deep link is not a limitation to be engineered around; it is
  probably the permanent correct answer.
- **Calendar.** Interview scheduling is a high-value, low-risk integration and a good early win.

---

## Phase 4 — Trust, safety and the things that make it shippable

- **Full audit trail.** Every field the agent filled, the evidence behind it, the model version, the
  prompt, and the user's decision — exportable. If a user is ever asked "why did your application
  say this?", they need an answer.
- **Rate limiting and volume ethics.** The product's stated metric is interviews per hour of
  attention, not applications per day. Enforce that: cap applications per company, detect spray-and-
  pray patterns, and be willing to tell a user their strategy is counterproductive.
- **Employer-side fairness.** Mass AI-assisted applications impose a real cost on the other side of
  the market. A product optimising for qualified matches rather than volume is better for employers
  too, and should be able to say so credibly — ideally with disclosure that AI assistance was used.
- **PII handling.** Career vaults are among the most sensitive personal datasets a consumer product
  can hold: employment history, salary, work authorization, disability and veteran status. Encrypt
  at rest, minimise what leaves the device, and have a real deletion story. Consider on-device
  inference for the demographic and legal categories specifically.
- **Accessibility.** Keyboard navigation exists in this build; screen-reader support, focus
  management across the `WebContentsView` boundary, and reduced-motion support do not yet.
- **Compliance.** GDPR/CCPA, EEO data handling rules, and the emerging AI-disclosure requirements in
  hiring — several jurisdictions now regulate automated employment decision tools directly.

---

## Phase 5 — Platform and operations

- **Auto-update.** Squirrel on Windows, and a real signing story: an EV certificate for Windows,
  notarisation for macOS. Unsigned installers are a non-starter for a product handling this data.
- **Crash and error telemetry**, opt-in, with career data scrubbed from every payload.
- **Sync.** Users want the same vault on their laptop and phone. This turns a single local JSON file
  into a distributed-state problem with conflict resolution, and should be deferred as long as
  possible.
- **Tests.** This prototype has none. A real build needs unit tests on scoring and the claim-ceiling
  logic, integration tests on the scenario engine against fixture pages, and Playwright end-to-end
  tests driving the real Electron app. The refusal path deserves the heaviest coverage in the
  codebase, because it is the feature that makes the product defensible.

---

## Explicitly not on the roadmap

These are not "later"; they are declined.

- **Auto-submitting without human approval.** The final-submission stop is a product guarantee.
- **CAPTCHA solving**, in-house or via a third-party service.
- **Any automation of a platform that prohibits it in its terms**, however easy it would be.
- **Fabricating or inflating experience**, including "optimistic" phrasing that outruns the
  evidence. The refusal card has no approve-anyway button and should never get one; the only honest
  way to make a stronger claim is to change the underlying fact.
- **Selling or brokering user career data**, in any aggregated or anonymised form.
