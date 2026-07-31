# Mock vs Real

This build is a prototype. Some of it is genuine engineering that would survive into a product;
much of it is a hand-written fixture wearing a convincing costume. This document draws the line
mechanism by mechanism so nobody has to guess.

The one-sentence version:

> **The shell is real. The world it looks at is not. Nothing leaves the machine.**

---

## Real engineering

These parts are production-shaped. They are not simulations of themselves.

| Mechanism | What is genuinely real |
| --- | --- |
| **Electron process model** | A real main process, a real trusted renderer, and a real second web context. Not a single-page app pretending to have processes. |
| **`WebContentsView`** | A genuine Electron `WebContentsView` added via `contentView.addChildView()`. Not an iframe, not `<webview>`, not the deprecated `BrowserView`. It really is an out-of-DOM browser view positioned from the main process. |
| **Sandboxing** | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webviewTag: false` on both web contexts. Real Chromium sandboxing, not a convention. |
| **Session isolation** | The mock browser runs in a real non-persistent session partition (`mock-sandbox`) with its own protocol handler, permission handlers and request filter. |
| **Navigation allowlist** | Real `will-navigate` / `will-frame-navigate` / `will-redirect` guards plus a real `webRequest.onBeforeRequest` filter. Point the embedded browser at `https://example.com` by any means you can find — it is cancelled and reported to the UI, not merely discouraged. |
| **Permission denial** | Real `setPermissionRequestHandler`, `setPermissionCheckHandler`, `setDevicePermissionHandler`, all returning false. |
| **Custom protocol** | A real privileged scheme registered with `registerSchemesAsPrivileged` and served through `protocol.handle`, including a real directory-traversal guard and a real per-response CSP. |
| **IPC** | A real, narrow, fully typed `contextBridge` surface. No `ipcRenderer` and no channel-name passthrough reaches the renderer. |
| **Page-driver protocol** | Real correlated request/response messaging with monotonic ids and a 5-second timeout. No `executeJavaScript` exists anywhere in the codebase — the main process can send eight commands and nothing else. |
| **State-based waiting** | Real `MutationObserver`-driven page-state reporting and real predicate-based waiting. Scenario correctness never depends on a `setTimeout`. |
| **View geometry** | A real `ResizeObserver`. No polling. |
| **Persistence** | Real atomic JSON writes (temp file + `rename`) into Electron's `userData`, with corruption fallback to a fresh seed. |
| **Packaging** | Real Electron Forge configuration with real makers and real Electron Fuses hardening applied to packaged builds. |
| **The UI** | Real React 18 + Tailwind. Layout, theming, keyboard navigation, empty states and the information architecture are all genuine implementation work. |

If you are evaluating this repository for *how the shell is built*, the code above is the honest
part and it is the part worth reading.

---

## Fixtures and hand-written logic

These parts look like intelligence or integration and are neither.

| Mechanism | What it actually is |
| --- | --- |
| **The "AI"** | A deterministic scenario engine executing a hand-authored list of typed steps. There is no model, no inference, no API key, no network call. Given the same starting state, a scenario produces byte-identical output every time. |
| **Agent reasoning text** | Prose written by hand and stored in the scenario definition's `TimelineSeed.details` and `AgentQuestion.reasoning`. It reads like reasoning because a human wrote it to; it is not generated at runtime. |
| **Confidence levels** | Authored constants on each step, not calibrated probabilities. |
| **Job postings** | 30 fixture records in `apps/desktop/src/data/jobs.ts`. No job board is queried, scraped or contacted. |
| **The employers** | Meridian Freight Systems, Halcyon Grid, Northlake Mutual, Verdance Labs, Cobalt Harbor Systems, Corvid Analytics and every other company in the fixtures are invented. Any resemblance to a real firm is coincidence. |
| **The ATS vendors** | The three ATS layouts are original designs written for this repo. They mimic the *shape* of applicant-tracking software — a single-page form, a four-step wizard, a third house style — with no real vendor's branding, markup or behaviour. |
| **Job intelligence and research** | Fixture text. "Researched the company" means "read a string that was already in the file". |
| **Explainable scores** | Fit, career direction and opportunity quality are computed by `packages/scoring` from fixture inputs. The *computation* is real code; the *inputs* are invented, so the outputs are theatre with an audit trail. |
| **Career Vault facts** | 30+ hand-written facts about a fictional persona, including deliberately conflicting and deliberately unverified entries so the conflict and verification UI has something to render. |
| **`claimCeiling` / refusal** | The mechanism is real code, and it really does block the Kubernetes over-claim in both the workspace and Resume Studio. But the ceiling values were typed in by hand, not derived from any evidence source. |
| **Resume strategies and history** | Six positioning strategies with response/interview counts. The counts are fiction. |
| **Tailored resume diffs** | Pre-authored per-job diffs, not generated at runtime. |
| **Outreach contacts and drafts** | Eight fictional people with fictional roles, and message drafts written by hand. The "grounded personalization" points reference fixture facts — real grounding *plumbing*, fictional ground. |
| **Analytics** | `computeFunnel` and the derived metrics are real code recomputed live from current state, so approving something now genuinely moves the numbers. The underlying data is fixture data, and every surface says so. |
| **Recruiter responses, interviews** | Fixtures. Nobody replied to anything. |
| **CAPTCHA** | A grid of emoji tiles with a hard-coded correct answer, checked in client-side JavaScript. It proves nothing about who is clicking beyond `event.isTrusted`, and it is never solved by the agent — see below. |
| **Login page** | A form that accepts anything. There is no account, no credential store, no auth. |
| **File upload** | No file is read, written or attached. `upload` sets a `data-value` attribute on a mock element. The filesystem is never touched. |
| **The persona** | A fictional cybersecurity-focused software engineer at a fictional airline. Every name, email address, phone number and employer is invented. There is no real personal data in this repository. |

---

## Things that are deliberately, structurally impossible

Not "not implemented" — actively prevented, with the enforcement point named.

| | Why it cannot happen here |
| --- | --- |
| **Reaching a real website** | `resolveMockPath()` returns `null` for anything that is not a bundled mock file, and that same function backs both the navigation allowlist and the protocol handler. On top of it, `webRequest.onBeforeRequest` cancels every non-`mock:` request, and every served page carries `connect-src 'none'; form-action 'none'; frame-src 'none'`. |
| **Submitting a real application** | There is no HTTP client in the app. The only "submission" is a click on a bundled page that swaps its own `data-page-status` to `submitted` and shows `mock://application/submitted`. |
| **Sending an email** | No SMTP, no mail API, no `mailto:` handoff. The Outreach screen stops at an approved draft. There is no send button — not a disabled one, not a stubbed one. |
| **LinkedIn automation** | No LinkedIn integration of any kind. Network messages are copy-to-clipboard only, with explicit copy stating that the user sends them manually. The stored `profileUrl` values are `mock://profile/...` strings rendered as *text* — `profile` is not even in the protocol's host allowlist, so they are unreachable by construction. |
| **Solving a CAPTCHA** | Two independent barriers. The nine challenge tiles carry **no** `data-action` attribute, and the agent's entire click vocabulary is "click the action named X" — so the tiles are not addressable at all. The `verify` button *is* addressable, and it checks `event.isTrusted`: a synthetic click from the page driver is rejected with *"Automated interaction detected. This challenge requires a human."* and flips the page to `data-page-status="automation-rejected"`. Only a real user's input device can satisfy it. |
| **Auto-submitting** | `final-submission` is a locked mandatory stop. The `auto-submit` toggle is rendered permanently off and disabled, and the screen explains that a switch acting on a locked stop would be meaningless. |
| **Skipping a locked stop** | The 10 locked stops are enforced in the scenario definitions and in the mock pages' `data-requires-human` attributes, not by an `if` in the settings screen. Editing the settings file cannot reach them. |
| **Opening an external browser** | `shell.openExternal` is redefined at startup to a logging no-op, and `setWindowOpenHandler` denies on every `web-contents-created`. |
| **Escalating out of the renderer** | The bridge exposes exactly the methods in `JobCopilotBridge`. There is no `require`, no `fs`, no `ipcRenderer`, and no dynamic channel name. |
| **An LLM call** | There is no HTTP client, no API key handling and no model dependency in `package.json`. |
| **Cloud sync, accounts, billing, OAuth** | None of these exist in any form. State is one JSON file on your disk. |

---

## How to convince yourself, rather than take our word for it

1. **Look for outbound calls.** `grep -rn "fetch\|https://\|axios\|node-fetch" apps packages` — the
   only `net.fetch` is the protocol handler reading a bundled file via a `file://` URL.
2. **Try to escape the sandbox.** The embedded browser has no editable address bar and the mock
   pages contain no external links, so you have to introduce one deliberately: add
   `<a href="https://example.com" data-action="escape" data-label="escape">go</a>` to
   `apps/desktop/src/mock-sites/ats/simple-application.html`, restart, and click it. The navigation
   is cancelled and the header chip reports *"1 navigation blocked"*. See
   [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) §7.
3. **Check the CAPTCHA page.** Open `apps/desktop/src/mock-sites/challenge/captcha.html`. The tiles
   are built without `data-action`, and the `verify` handler's first line is `if (!e.isTrusted)`.
4. **Check for script injection.** `grep -rn "executeJavaScript" apps packages` returns nothing.
5. **Inspect your own state file.** The path is shown in the app; it is a single JSON file in
   `userData`. Deleting it reseeds from fixtures.

---

## What this means for evaluation

Take this repository as evidence about **desktop application architecture, Electron security posture,
agent–UI interaction design, and product judgement about where a human must stay in the loop.**

Do not take it as evidence about model quality, retrieval, extraction accuracy, ATS compatibility, or
anything else that would require the world outside this window to exist. Turning those into real
capabilities is the subject of [ROADMAP.md](ROADMAP.md), and it is most of the work.
