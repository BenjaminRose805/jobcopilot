# Screenshots

Documentation captures of the running app. Every image is a real screenshot of the built
Electron application — nothing here is a mockup, a render or a retouch.

All shots are **1920×1080** except the one laptop-width capture, which is 1366×768.

## How these were made

`../../scripts/capture-screenshots.sh` builds nothing itself; it expects a completed
`npm run build:all`. For each entry in its manifest it launches the app under `xvfb-run`,
waits for the screen to settle, and photographs the X root window with ImageMagick's
`import`.

Reaching a specific screen normally takes several clicks, and the sandbox this repo was
built in has no synthetic input tool. So the app accepts a handful of **dev-only** capture
flags — `--initial-screen`, `--theme`, `--initial-params`, `--screenshot-open`,
`--screenshot-run`, `--capture-size`. They are parsed in
[`apps/desktop/src/main/screenshot-mode.ts`](../../apps/desktop/src/main/screenshot-mode.ts),
which returns `null` unconditionally when `app.isPackaged`, so none of them exist in a
shipped installer. They also grant no capability the UI does not: each one selects a
screen, a theme or a nav parameter a human could reach by clicking, and `--screenshot-url`
is still funnelled through `MockBrowser.navigate` and rejected by the same `mock:`
allowlist as any other navigation.

Two things about these images differ from what you see when you run the app yourself:

- **No menu bar.** Electron's stock File/Edit/View strip is suppressed while a capture flag
  is set. It is not part of the product's design and only added unrelated chrome.
- **Instant agent pacing.** The Application Workspace captures set pacing to Instant so the
  photograph lands on the stop the scenario actually reaches, rather than an arbitrary
  frame of the cosmetic step animation.

Each capture also runs against a throwaway `--user-data-dir`, so it never reads or writes a
real profile. That is why the demo data looks identical across every shot.

## The shots

| File | What it shows |
| --- | --- |
| `command-center-light.png` / `command-center-dark.png` | The daily triage screen. Counters are attention-shaped — *waiting for you*, *packages ready*, *recruiter responses* — with no applications-per-day throughput number anywhere. |
| `job-discovery-light.png` / `job-discovery-dark.png` | The job table with match scoring, fit signals and per-row status, plus the detail pane for the selected row. There is no card-view variant in the app; this screen is table-only. |
| `job-intelligence-light.png` / `job-intelligence-dark.png` | A single posting opened to its intelligence panel: the match breakdown and the *Why this recommendation?* reasoning, which is always expanded rather than hidden behind a disclosure. |
| `career-vault-light.png` / `career-vault-dark.png` | The evidence store, showing the three provenance states side by side — user-verified, agent-inferred/*needs confirmation*, and *conflicting*. The selected fact is the Kubernetes exposure entry, with its conflict and its related facts visible. |
| `resume-studio-light.png` / `resume-studio-dark.png` | The positioning list: one tailored strategy per role family, each scored against the target posting. |
| `resume-studio-refusal-light.png` / `resume-studio-refusal-dark.png` | The diff view with the **refusal card**. The assistant declines to rewrite "worked around Kubernetes deployments" as "owned production Kubernetes infrastructure", shows the exact wording it would not write, and explains which vault facts do and do not support the claim. |
| `application-workspace-light.png` / `application-workspace-dark.png` | The primary screen. Split pane: the agent's audit timeline and current decision on the left, the sandboxed `WebContentsView` rendering a mock ATS form on the right. The run has stopped at an approval gate — proposed answer, an *AI drafted, not yet approved* badge, the reasoning, the evidence chips it was built from, and approve / reject / skip. The control-owner indicator in the header reads *Waiting for your approval*. |
| `application-workspace-1366x768.png` | The same screen at laptop width, to show the split pane, sidebar and browser surface degrade cleanly rather than clipping. |
| `outreach-light.png` / `outreach-dark.png` | Contact list with a drafted message open. Note the *How this gets sent* panel: the only action is copy-to-clipboard, and the copy states plainly that the user sends it themselves and that nothing is transmitted by the application. |
| `crm-pipeline-light.png` / `crm-pipeline-dark.png` | The application pipeline board with a row selected, so the full audit trail is visible — including the entries where the agent refused the Kubernetes upgrade and where it stopped on a question it had no evidence to answer. |
| `crm-table-light.png` / `crm-table-dark.png` | The same data as a dense table, with *your minutes*, answers and corrections as columns. |
| `analytics-light.png` / `analytics-dark.png` | Effectiveness measured against the one metric the product cares about: qualified interviews per hour of your attention. Includes the pipeline funnel and the unsupported-claims-refused counter. |
| `autonomy-settings-light.png` / `autonomy-settings-dark.png` | The permission model. Presets default to *Approval before every application*; the mandatory-stops column cannot be switched off; auto-submit is *Always off* and disabled at the control. |

## Known gaps

- **The workspace shot stops at the first approval gate, not at the Kubernetes evidence
  gap.** Advancing past a gate requires a click, and there is no synthetic input tool in the
  capture environment. The gate itself is the more representative frame anyway, and the
  refusal narrative is covered by the two `resume-studio-refusal-*` shots and by the audit
  trail in the CRM pipeline captures.
- **No card view for Job Discovery.** The screen has one layout.
