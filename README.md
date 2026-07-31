# JobCopilot

A high-fidelity **mock** desktop application for an AI-assisted job search. It looks and behaves
like a real product, and it cannot touch a real one: there is no network egress, no job board, no
ATS, no mail client and no LLM API. Every posting, every form and every "submission" is a bundled
local page served over a custom `mock:` protocol.

The product it prototypes optimises one thing:

> **Qualified interviews per hour of the user's attention — not applications submitted per day.**

That metric is not a slogan on the dashboard. It shapes the screens: the Command Center refuses to
show a throughput counter, the CRM tracks *your minutes* as the denominator, and the agent's job is
to spend its own time so it doesn't have to spend yours.

---

## Quick start

```bash
npm install
npm start          # Electron Forge dev: Vite dev server + main + preloads, with HMR
```

Verification without launching a window:

```bash
npm run verify     # typecheck + lint + build main, preload, mock-page preload, renderer
```

Individual steps:

| Command | What it does |
| --- | --- |
| `npm start` | Run the app in development (Electron Forge + Vite). |
| `npm run typecheck` | `tsc --noEmit` across the app and all workspace packages. |
| `npm run lint` | ESLint over every `.ts`/`.tsx` file. |
| `npm run build:all` | Build main, both preloads and the renderer via their Vite configs. |
| `npm run verify` | typecheck → lint → build:all. The gate to run before committing. |
| `npm run package` | Package the app for the current platform (no installer). |
| `npm run make` | Build distributables for the current platform. |
| `npm run make:win` | **Build the Windows distributables** (Squirrel `.exe` + ZIP). |

### Packaging for Windows

```bash
npm run make:win
```

Output lands in `out/make/`:

- `out/make/squirrel.windows/x64/JobCopilot-Setup.exe` — the Squirrel installer
- `out/make/zip/win32/x64/JobCopilot-win32-x64-*.zip` — a portable ZIP

Cross-compiling the Squirrel maker from Linux/macOS requires Wine and Mono on `PATH`; without them,
run `npm run make:win` on a Windows host, or use `npm run make -- --targets @electron-forge/maker-zip`
to get the ZIP alone. The Electron Fuses plugin hardens every packaged build: `RunAsNode` off,
`OnlyLoadAppFromAsar` on, ASAR integrity validation on, Node CLI inspect arguments off.

---

## What you can actually do

Six deterministic scenarios drive the embedded browser. Each is wired to one application; open it
from the Command Center or the Applications CRM and press **Start agent run**.

| Scenario | Application | What it demonstrates |
| --- | --- | --- |
| Standard application — Meridian Freight Systems | `app-meridian` | A normal successful run with evidence-backed answers |
| Unsupported experience — Halcyon Grid | `app-halcyon` | Refusing to fabricate experience the evidence does not support |
| Human takeover — Northlake Mutual | `app-northlake` | Control transfer for login **and** CAPTCHA, then state-based resumption |
| New reusable preference — Verdance Labs | `app-verdance` | Learning a reusable answer with an explicit, user-chosen scope |
| Rejected by research — Cobalt Harbor Systems | `app-cobalt` | Declining to apply, with reasons, before spending any of your time |
| Always-human review — Corvid Analytics | `app-corvid` | A locked stop that no autonomy setting can switch off |

The three that are worth watching closely:

**Unsupported experience.** The form asks "How many years have you managed production Kubernetes
clusters?" The Career Vault supports *exposure* — `f-resp-k8s-exposure` carries a `claimCeiling`
that stops at "worked around", not "owned". The agent does not answer. It stops, shows you the
ceiling, and offers a supported alternative. The same mechanism blocks Resume Studio from rewriting
"Worked around Kubernetes deployments" into "Owned production Kubernetes infrastructure across four
regions"; that diff renders as a refusal card with **no approve-anyway button**, because the only
honest way to make the claim is to change the underlying fact.

**Human takeover.** The Northlake flow puts a sign-in page and a human-verification challenge
between the agent and the form. Both are locked stops. The agent visibly stops issuing commands —
the command log goes quiet, the control chip flips to you — and the CAPTCHA is unsolvable by the
agent by construction: the challenge tiles are not exposed as addressable actions at all, and the
Verify button rejects any click where `event.isTrusted` is false. When you finish, the agent does
not resume from a remembered step: it re-reads the live page state and picks a resume point from
what it observes.

**New reusable preference.** The Verdance form asks for base salary expectations. Compensation is a
mandatory stop, so the agent proposes an answer from the vault and waits. When you accept, you
choose the scope it is remembered at — this once / this company / default everywhere / never
auto-answer this again — and that choice is persisted.

---

## Screens

| Screen | Purpose |
| --- | --- |
| **Command Center** | Prioritised list of decisions only you can make, plus "continue where you left off". Deliberately no throughput chart. |
| **Job Discovery** | 30 postings ranked by **three separate explainable scores** — fit, career direction, opportunity quality — never one unexplained match percentage. Each has a "Why this recommendation?" panel. |
| **Application Workspace** | The embedded `WebContentsView`, the agent command log, the live page state, and the approval gates. |
| **Applications CRM** | Board and table over 13 applications, with timeline, answers, corrections, audit trail and the posting snapshot captured at discovery. |
| **Career Vault** | 30+ facts across 15 categories, with deliberate conflicts and unverified entries. AI-inferred facts render in a reserved colour and can never appear as verified. |
| **Resume Studio** | Six positioning strategies with real response/interview history, per-job tailored diffs, per-bullet evidence, and the refusal card. |
| **Outreach** | Seven contact types with grounded per-sentence personalization. Network messages are copy-to-clipboard only; email stops at approval. |
| **Analytics** | Funnel, breakdowns and written insight cards, recomputed live so an approval you make now moves the north-star metric. All labelled simulated. |
| **Autonomy** | 11 automation toggles, 14 mandatory stops (10 locked), 5 presets, conservative default. |

Light and dark themes, keyboard-navigable, laid out for 1920×1080 and usable at 1366×768.

---

## Architecture in one paragraph

A trusted React renderer talks to the main process over a narrow, typed `contextBridge` API. The
embedded browser is a real Electron **`WebContentsView`** — not a `<webview>`, not the deprecated
`BrowserView`, not an iframe — added as a child view of the window and positioned from the main
process using bounds the renderer measures with a `ResizeObserver`. It runs in its own non-persistent
session partition where a navigation allowlist, a deny-everything permission handler and a
`webRequest` filter make non-`mock:` URLs unreachable. A deterministic scenario engine issues typed
commands (`fill`, `select`, `click`, `upload`, `highlight`) against the page through a correlated
request/response protocol, and waits on **observed page state**, never on timers. See
[ARCHITECTURE.md](ARCHITECTURE.md).

## What is real and what is not

Every mechanism in this build is classified in [MOCK_VS_REAL.md](MOCK_VS_REAL.md). The short version:
the Electron shell, the process model, the sandbox, the IPC, the state persistence and the UI are
real engineering. The employers, postings, ATS vendors, recruiters, career history, analytics and
the "AI" are all fixtures and hand-written deterministic logic. **No message, application or request
of any kind leaves the machine, under any autonomy preset.**

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — process model, security posture, scenario engine, data flow
- [MOCK_VS_REAL.md](MOCK_VS_REAL.md) — the honest boundary, mechanism by mechanism
- [ROADMAP.md](ROADMAP.md) — what turning this into a real product would actually require
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) — manual verification script

## Persona and data

The bundled candidate is a fictional cybersecurity-focused software engineer at a fictional airline:
Terraform module ownership, CI/CD pipeline security, Java and Python migrations, a Poetry→uv
migration, Veracode remediation, cloud infrastructure and developer tooling, and an internal agent
review harness. Every company, recruiter, email address and phone number is invented. There is no
real personal data anywhere in this repository.
