# Architecture

JobCopilot is an Electron desktop app with three distinct trust zones, a custom protocol for its
bundled mock web, and a deterministic scenario engine that drives that web through a typed command
vocabulary. This document describes each of those, in the order you would meet them if you traced a
single agent run from click to submission.

---

## 1. Process and trust model

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MAIN PROCESS  (Node, full privilege)                                    │
│                                                                          │
│  main/index.ts         window lifecycle, IPC handlers, security defaults │
│  main/mock-protocol.ts mock: scheme registration + request handler       │
│  main/store.ts         atomic JSON persistence in userData               │
│  browser/mock-browser.ts  owns the single WebContentsView                │
└───────────┬─────────────────────────────────────┬───────────────────────┘
            │ contextBridge (preload/preload.ts)  │ contentView.addChildView
            │ window.jobcopilot — narrow + typed  │ + typed driver channels
┌───────────▼──────────────────────┐  ┌───────────▼───────────────────────┐
│ RENDERER  (trusted)              │  │ WebContentsView  (untrusted)      │
│                                  │  │                                   │
│  React 18 + Tailwind             │  │  session: partition 'mock-sandbox'│
│  contextIsolation: true          │  │  contextIsolation: true           │
│  nodeIntegration: false          │  │  nodeIntegration: false           │
│  sandbox: true                   │  │  sandbox: true                    │
│  webviewTag: false               │  │  navigation allowlist: mock:// only│
│                                  │  │  permissions: deny everything     │
│  scenario runner lives here      │  │  preload: mock-page-preload.ts    │
└──────────────────────────────────┘  └───────────────────────────────────┘
```

**Why the runner lives in the renderer.** The scenario engine is UI-facing: every step it takes
produces a timeline event, a command-log line and possibly an approval gate that blocks on a React
interaction. Running it in the renderer means the pause/resume gates are ordinary promises resolved
by button handlers, with no cross-process state machine to keep in sync. It has no extra privilege
there — it can only speak the same narrow bridge API any other renderer code can.

**What the renderer cannot do.** `window.jobcopilot` (`packages/shared/src/ipc.ts`,
`JobCopilotBridge`) is the complete surface. There is no `ipcRenderer`, no `require`, no `fs`, no
channel-name passthrough. Adding a capability means adding a typed method in three files — which is
the point.

### Security defaults, and where each one is enforced

| Control | Where | Effect |
| --- | --- | --- |
| `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` | `main/index.ts` (app window), `browser/mock-browser.ts` (mock view) | Both web contexts run without Node. |
| `webviewTag: false` | both | The `<webview>` tag is unavailable, so no second embedding path exists. |
| Navigation allowlist | `mock-browser.ts` — `will-navigate`, `will-frame-navigate`, `will-redirect` | Any URL that does not resolve to a bundled mock file is `preventDefault()`ed and reported to the renderer as a blocked navigation. |
| `setWindowOpenHandler` → deny | mock view, app window, **and** every `web-contents-created` | No popups, no `target=_blank` escape. |
| Permission handlers | mock session | `setPermissionRequestHandler(cb(false))`, `setPermissionCheckHandler(() => false)`, `setDevicePermissionHandler(() => false)`. Camera, geolocation, clipboard-read, notifications, USB, serial — all refused without a prompt. |
| `webRequest.onBeforeRequest` filter | mock session | Cancels every request whose URL is not `mock:`, `devtools:`, `blob:` or `data:`. This is the backstop that catches subresources, not just top-level navigations. |
| Per-response CSP | `mock-protocol.ts` | Served on every mock page: `connect-src 'none'; form-action 'none'; frame-src 'none'`. A mock page physically cannot `fetch` or post a form off-origin. |
| `shell.openExternal` disabled | `main/index.ts` | Redefined to a logging no-op so no future code path can open a real browser. |
| Isolated session | `MOCK_PARTITION = 'mock-sandbox'`, non-persistent | The deny-all handlers apply to the mock browser only and cannot degrade the trusted window; nothing is written to disk by the mock web. |
| Electron Fuses | `forge.config.ts` | `RunAsNode` off, `EnableNodeOptionsEnvironmentVariable` off, `EnableNodeCliInspectArguments` off, `OnlyLoadAppFromAsar` on, `EnableEmbeddedAsarIntegrityValidation` on, cookie encryption on. |

The app window has its own `will-navigate` guard: in development it may only stay within the Vite
dev-server origin, and in a packaged build it may not navigate at all.

---

## 2. The `mock:` protocol

Mock pages are not files loaded over `file:` and not documents in an iframe. They are served over a
custom scheme registered **before** `app.ready`:

```ts
protocol.registerSchemesAsPrivileged([{
  scheme: 'mock',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);
```

Declaring it `standard` and `secure` gives mock pages a real origin, so relative URLs resolve, the
pages are not treated as insecure content, and per-origin browser behaviour matches what a real ATS
would see. The handler is installed on the mock session only:

```ts
registerMockProtocolHandler(getMockSession());
```

`resolveMockPath()` maps `mock://host/path` to a file under `<__dirname>/mock-sites/<host>/<path>`:

- The host must be one of `company`, `ats`, `auth`, `challenge`, `application`, `static`.
- A trailing `/` becomes `/index`; a missing extension becomes `.html`.
- The normalised result must still start with the site root — a directory-traversal guard, so
  `mock://ats/../../../etc/passwd` resolves to `null` and is refused.
- `null` from this function is what `isAllowedMockUrl()` reports, so **the allowlist and the
  resolver are the same code**. There is no way for a URL to be navigable but unservable, or vice
  versa.

Unknown paths get a bundled 404 page rather than a network error, so a mistyped scenario URL is
visibly a mistake rather than a silent hang.

`copyMockSites()` in `vite.shared.ts` is a small Vite plugin that emits `apps/desktop/src/mock-sites/**`
as assets next to the compiled main process, which is why `__dirname/mock-sites` resolves identically
in dev and inside the ASAR.

### Routes

| URL | Page | Notes |
| --- | --- | --- |
| `mock://company/jobs/security-platform-engineer` | Meridian Freight Systems posting | Discovery source for the standard run |
| `mock://company/jobs/staff-devsecops-engineer` | Halcyon Grid posting | Kubernetes-years question originates here |
| `mock://company/jobs/cloud-security-engineer` | Northlake Mutual posting | Behind login + CAPTCHA |
| `mock://company/jobs/ai-platform-engineer` | Verdance Labs posting | Compensation question |
| `mock://company/jobs/platform-reliability-engineer` | Cobalt Harbor posting | The one the agent declines |
| `mock://ats/simple-application` | Single-page fictional ATS | |
| `mock://ats/multistep-application` | Four-step wizard, different vendor styling | Exercises `step` transitions |
| `mock://ats/lever-application` | Third vendor style | |
| `mock://auth/login` | Sign-in wall | `data-requires-human="true"` |
| `mock://challenge/captcha` | Human-verification challenge | Tiles carry no `data-action`; `verify` requires `event.isTrusted` |
| `mock://application/unexpected-question` | A question with no vault precedent | |
| `mock://application/demographics` | Voluntary EEO-style self-identification | `data-requires-human="true"`, always |
| `mock://application/submitted` | Terminal confirmation | |
| `mock://static/css/base.css`, `vendors.css` | Shared page styling | The only subresources |

The three ATS pages deliberately use different layouts, typography and control styling so the agent
is visibly not pattern-matching one vendor's DOM. All branding is invented.

---

## 3. The page-driver protocol

Mock pages stay plain static HTML. They describe themselves with data attributes; the preload
(`apps/desktop/src/preload/mock-page-preload.ts`) turns that into typed state and executes a small
fixed command vocabulary. **There is no `executeJavaScript` anywhere in the codebase** — the main
process cannot inject arbitrary script into the mock web, only send one of eight commands.

### The DOM contract

```html
<body data-mock-page="ats/multistep-application"
      data-page-step="screening"
      data-page-status="editing"
      data-requires-human="true"
      data-requires-human-reason="This page asks for voluntary demographic information."
      data-flags='{"captchaSolved":"false"}'>

  <input data-field="email" data-label="Work email" required>
  <select data-field="authorization" data-label="Work authorization">…</select>
  <button data-action="continue" data-label="Continue to screening">
```

The preload reads those into a `MockPageState`:

```ts
interface MockPageState {
  url: string; page: string; title: string; step: string; status: string;
  fields: MockFieldState[];
  actions: { name: string; label: string; disabled: boolean }[];
  requiresHuman: boolean; requiresHumanReason?: string;
  flags: Record<string, string>;
  observedAt: number;
}
```

State is pushed on a 40 ms debounce from a `MutationObserver` (watching exactly the attributes
above), plus capture-phase `input`/`change` listeners. So a **human** typing into the page produces
the same state stream the agent sees — which is what makes state-based resumption after a takeover
work at all.

### The command vocabulary

`describe`, `fill`, `select`, `upload`, `click`, `focus`, `highlight`, `clearHighlight`. That is the
entire set (`BrowserCommand` in `packages/shared/src/ipc.ts`).

- Each command is sent with a monotonically increasing correlation id and resolved by a matching
  `mock-driver:result`. Unanswered commands reject after `COMMAND_TIMEOUT_MS = 5_000` rather than
  hanging the run.
- `upload` never touches the filesystem. Real file inputs cannot be scripted, so the mock pages
  model an attachment as a `data-value` attribute.
- `click` refuses disabled actions and returns an error naming the action, so a page that is
  deliberately blocking the agent produces a legible failure instead of a silent no-op.
- **The agent gate.** `setAgentEnabled(false)` makes `MockBrowser.command()` reject every mutating
  command with *"Agent control is disabled while the user holds the browser."* Only `describe` and
  `clearHighlight` remain legal. This is enforced in the **main process**, not the renderer, so a
  bug in the runner cannot type into a login form during a takeover. The preload simultaneously
  paints a full-width banner reading `YOU HAVE CONTROL — the agent has stopped sending commands to
  this page`.

---

## 4. View geometry — ResizeObserver, not timers

A `WebContentsView` is a sibling of the DOM, not part of it, so it has to be positioned manually.
`features/workspace/BrowserSurface.tsx` renders a placeholder div, observes it with a
`ResizeObserver`, and pushes `getBoundingClientRect()` through `browser.setBounds()`. `document.body`
is observed as well as the placeholder itself, because collapsing the sidebar moves the placeholder's
x-offset without changing its own size; a `window.resize` listener feeds the same path. There is no
polling loop anywhere: if the layout does not change, no IPC is sent.

When the workspace unmounts or the user switches screens, `setVisible(false)` parks the view at
`x: -20000` rather than destroying it, so navigating away and back does not lose page state
mid-scenario.

---

## 5. The scenario engine

`packages/scenario-engine` is pure logic with no Electron import. It talks to the page through the
`PageDriver` interface, which `apps/desktop/src/renderer/page-driver.ts` implements over the bridge.
That separation is what makes the engine testable and what guarantees it has no privileged access.

### Steps

A `ScenarioDefinition` is a list of typed steps:

`note` · `navigate` · `focusElement` · `fillInput` · `selectOption` · `uploadMockFile` ·
`clickAction` · `requestApproval` · `requestTakeover` · `waitForUserState` · `requestFinalApproval` ·
`complete`

Every step that changes anything carries a `TimelineSeed` — the engine cannot mutate the page
without emitting a corresponding timeline event with a status, a source, optional confidence and
optional evidence fact ids. Timeline events are typed
(`packages/shared/src/timeline.ts`) and rendered by a single `Timeline` component, so the audit
trail in the CRM and the live log in the workspace are the same data.

### State-based transitions

Every navigation and click may declare an `expect: PageCondition`, and the runner awaits
`driver.waitFor(condition, 12_000)` before advancing. A `PageCondition` is a declarative predicate:

```ts
{ page?, step?, status?, requiresHuman?, fieldFilled?, flag?: { name, value }, description }
```

`waitFor` evaluates it against every inbound page-state event and resolves the moment it holds.
Nothing in the correctness path is a `setTimeout`. The only timer is `pacingMs` (default 700 ms), a
purely cosmetic delay between actions so a human can follow along; deleting it would change the
speed of a run and nothing else.

### Approval gates

`requestApproval`, `requestTakeover`, `waitForUserState` and `requestFinalApproval` all publish a
`PendingAction` in the snapshot and then `await` a promise gate that only a user interaction
resolves. The runner's status becomes `waiting-for-approval` / `human-takeover` /
`waiting-for-user-state`, and `controlOwner` flips away from `agent`. Because the gate is a promise,
there is no "resume from step N" bookkeeping for the ordinary approval case — execution is literally
suspended at the `await`.

### Resumption after a takeover

Takeover is the one case where the previously-executing step is *not* the right place to resume: the
human may have logged in, solved the CAPTCHA, navigated, or done all three. So `ScenarioDefinition`
carries a `resumePoints` map:

```ts
resumePoints: { when: PageCondition; stepId: string; note: string }[]
```

On resume the runner reads live page state, walks `resumePoints` in order, and jumps to the first
entry whose condition matches — recording the chosen entry's `note` in the timeline so the user can
see *why* it picked that point. If nothing matches, it re-describes and reports rather than guessing.

### Refusal, structurally

Refusal is not a string check on the question text. `CareerFact` carries a `claimCeiling` — the
strongest claim the underlying evidence supports. The Halcyon scenario's `requestApproval` step
carries an `evidenceGap`:

```ts
{ requested, whyGap, supportedAlternative, blockingFactIds }
```

When a question's honest answer would exceed the ceiling of every supporting fact, the engine emits
an `evidence-gap` pending action instead of `approve-answer`. The UI for that pending kind has no
approve control — only "use the supported alternative", "answer it yourself", or "skip". The same
`claimCeiling` data drives the Resume Studio refusal card. The mechanism is one concept applied in
two screens, not two hard-coded demos.

### The six scenarios

| Scenario id | Application | Demonstrates |
| --- | --- | --- |
| `scenario-standard-application` | `app-meridian` | Normal successful application with evidence-backed answers |
| `scenario-unsupported-experience` | `app-halcyon` | Refusing to fabricate experience the evidence does not support |
| `scenario-human-takeover` | `app-northlake` | Control transfer for login and CAPTCHA, then state-based resumption |
| `scenario-new-preference` | `app-verdance` | Learning a reusable answer with an explicit, user-chosen scope |
| `scenario-rejected-by-research` | `app-cobalt` | Declining to apply, with reasons, before spending any of your time |
| `scenario-demographic-review` | `app-corvid` | A locked stop that no autonomy setting can switch off |

---

## 6. Autonomy enforcement

`packages/shared/src/autonomy.ts` defines 11 automation toggles, 14 mandatory stops (10 `locked`) and
5 presets. The default is `approval-before-every-application`.

Two properties matter more than the list itself:

1. **Locked stops are not enforced by the settings screen.** They are properties of the scenario
   definitions and of the mock pages themselves. On `mock://challenge/captcha` the challenge tiles
   are not exposed as `data-action` elements, so the agent has no command that can reach them, and
   the `verify` button rejects any click where `event.isTrusted` is false. Removing every gate in
   the UI would not get the agent past that page. The Autonomy screen renders locked rows read-only
   and says so.
2. **`auto-submit` is unconditionally off**, rendered `checked={false}` and disabled, because
   `final-submission` is a locked stop — an auto-submit switch would have nothing to act on. The UI
   states that reasoning rather than presenting a switch that silently does nothing.

The Autonomy screen derives the active preset from the toggle/stop values (`matchPreset`) rather than
storing a preset independently, so hand-editing any switch resolves to `Custom` and re-creating a
preset's exact shape resolves back to that preset. The two can never disagree.

---

## 7. Data flow and persistence

```
buildSeedState()  ──►  JsonStore.write()  ──►  <userData>/jobcopilot-state.json
       ▲                                                   │
       │ (only when no file exists, or on reset)            │ state:load
       │                                                    ▼
       └────────────────  React store (renderer/store.tsx)  ◄── state:save (debounced)
```

- **Seed.** `apps/desktop/src/data/*.ts` are hand-written fixtures: 30 jobs, 13 applications, 30+
  career facts across 15 categories (with deliberate conflicts and unverified entries), 6 resume
  strategies with response history, 8 outreach contacts covering all seven contact roles,
  analytics, recruiter responses, interviews.
- **Store.** `renderer/store.tsx` holds the whole `AppState` and exposes `update(fn)`. Every write
  goes through the bridge to the main process, which persists atomically (temp file + `rename`), so a
  crash mid-save cannot leave a truncated JSON.
- **Read-back on corruption.** `JsonStore.read()` validates that the parsed object has an array
  `jobs` and otherwise returns `null`, which makes `state:load` fall back to a fresh seed rather than
  crash on a hand-edited file.
- **Derived, never duplicated.** Counts shown on the Command Center headline come from
  `computeFunnel()` in `packages/scoring`, the same function the Analytics screen renders. The two
  screens cannot disagree about how many jobs were recommended, because there is only one
  computation.

---

## 8. Package layout

```
packages/
  shared/          types + constants shared by all three processes
                   ipc.ts (channels + bridge type), state.ts, timeline.ts,
                   autonomy.ts, preferences.ts, outreach.ts, analytics.ts,
                   application.ts, common.ts
  career-model/    CareerFact, categories, claimCeiling, verification status
  job-model/       Job, scores, recommendation enum + labels
  scoring/         explainable score computation + computeFunnel
  scenario-engine/ types.ts (protocol + step union), runner.ts (execution)
  ui/              primitives.tsx, chips.tsx, cn.ts — the shared component kit

apps/desktop/src/
  main/            entry, mock protocol, JSON store
  browser/         MockBrowser — the WebContentsView owner
  preload/         preload.ts (bridge), mock-page-preload.ts (page driver)
  renderer/        App, nav, store, agent context, PageDriver impl
  components/      AppShell, Screen, Timeline, Evidence, Scores, GlobalSearch
  features/        one folder per screen
  data/            fixtures
  mock-sites/      the bundled mock web
```

Path aliases (`@shared/*`, `@career-model`, `@job-model`, `@scoring`, `@scenario-engine`, `@ui`,
`@app/*`) are declared once in `tsconfig.json` and mirrored in `vite.shared.ts` so all four Vite
builds and `tsc` agree.

TypeScript runs with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
and `isolatedModules`. `npm run verify` (typecheck → lint → four builds) is the gate.

### Build outputs

Electron Forge's Vite plugin names preload bundles after their **entry filename**, ignoring
`build.lib.fileName`. That is why the preload sources are named `preload.ts` and
`mock-page-preload.ts` rather than `index.ts` — the main process loads
`path.join(__dirname, 'preload.js')` and `path.join(__dirname, 'mock-page-preload.js')`, and the
names have to line up. `.vite/build/` after a clean build contains exactly:

```
main.js  preload.js  mock-page-preload.js  mock-sites/…
```
