# Testing checklist

A manual verification script. There is no automated test suite in this build — see
[ROADMAP.md](ROADMAP.md) Phase 5 — so this document is the acceptance criteria.

Work through it in order; later sections assume the app is running and seeded.

```bash
npm install
npm run verify     # must exit 0 before anything below is worth doing
npm start
```

**Reset between passes.** The header has a reset control (confirm dialog → reseed). It restores the
fixtures without restarting. Alternatively delete the state file, whose exact path is shown in the
app's footer/info panel — typically:

- Windows `%APPDATA%\JobCopilot\jobcopilot-state.json`
- macOS `~/Library/Application Support/JobCopilot/jobcopilot-state.json`
- Linux `~/.config/JobCopilot/jobcopilot-state.json`

Legend: `[ ]` to verify · **PASS** = the stated observation is true.

---

## 1. Build and launch

- [ ] `npm run typecheck` exits 0 with no output.
- [ ] `npm run lint` reports 0 problems.
- [ ] `rm -rf .vite && npm run build:all` succeeds and `.vite/build/` contains exactly `main.js`,
      `preload.js`, `mock-page-preload.js` and a `mock-sites/` directory.
- [ ] `npm start` opens a window titled **JobCopilot** with no white flash (the window is shown on
      `ready-to-show`).
- [ ] The window does **not** sit on "Loading local demo data…". If it does, the preload failed to
      load — check the console for `Unable to load preload script`.
- [ ] No uncaught exceptions in the terminal. GPU/dbus warnings on Linux are environmental.

## 2. Shell, navigation and theme

- [ ] All eight screens are reachable from the left nav: Command Center, Job Discovery,
      Applications, Career Vault, Resume Studio, Outreach, Analytics, Autonomy Settings.
- [ ] **Command Center is the landing screen** on a fresh launch.
- [ ] The theme toggle switches light ⇄ dark, every screen remains legible in both, and the choice
      survives an app restart.
- [ ] `Ctrl`/`Cmd` + `K` opens global search; it finds jobs, applications, facts and contacts, and
      selecting a result navigates to it.
- [ ] `Tab` alone reaches every interactive control on at least one dense screen (Autonomy is the
      best test), and focus rings are visible in both themes.
- [ ] Resize the window down to **1366×768**: no horizontal scrollbar on the shell, no clipped
      controls, panels reflow rather than overlap.
- [ ] At 1920×1080 the two-column layouts engage and no panel is stretched to absurdity.

## 3. Command Center

- [ ] Headline counters render and each one navigates to a relevant screen when clicked.
- [ ] Counter values agree with the corresponding screens (e.g. "Waiting for you" equals the number
      of `waiting-for-user` applications in the CRM).
- [ ] "Recommended" here matches the recommended count on **Analytics** — both come from
      `computeFunnel`, so a mismatch is a real bug.
- [ ] Action groups appear only when non-empty; each item's CTA deep-links correctly (Take over →
      Workspace, Review package → Workspace, Open application → CRM, Review → Job Discovery,
      Open draft → Outreach, See analytics → Analytics).
- [ ] "Continue where you left off" appears, names a real application, and opening it lands on that
      application's workspace. Visit a different application, return to Command Center, and confirm
      the panel now points at the most recent one.
- [ ] **There is no applications-sent counter and no activity graph.** The "What this screen is not"
      panel explains the omission.

## 4. Job Discovery

- [ ] 30 postings load.
- [ ] Every card shows **three separate scores** — fit, career direction, opportunity quality.
      **There is no single unexplained match percentage anywhere.**
- [ ] "Why this recommendation?" expands into per-dimension reasoning with contributing factors.
- [ ] Filtering and sorting work and the result count updates.
- [ ] Recommendations span the full range including `do-not-apply`, and a do-not-apply card states
      its reasons rather than just a label.
- [ ] Shortlisting and rejecting a job persists across a restart.

## 5. Scenario runs — the core of the build

Each scenario is reached from the Command Center or the CRM; open the application and press
**Start agent run**.

### 5a. Standard application — Meridian Freight Systems (`app-meridian`)

- [ ] The embedded browser navigates to the company posting, then to the ATS form.
- [ ] Fields fill **visibly, one at a time**, each with a highlight box on the field being touched.
- [ ] The command log records each command; the timeline gains an event per action with a status,
      a source and (where relevant) a confidence level.
- [ ] Evidence-backed answers link to Career Vault facts, and clicking through opens the fact.
- [ ] The run stops at a final approval gate. **It does not submit on its own.**
- [ ] Approving reaches `mock://application/submitted`, and the CRM status updates accordingly.

### 5b. Unsupported experience — Halcyon Grid (`app-halcyon`)

- [ ] The run stops on *"How many years have you managed production Kubernetes clusters?"*
- [ ] The stop is an **evidence gap**, not an ordinary approval: it shows the requested claim, why
      the vault cannot support it, the blocking fact(s), and a supported alternative.
- [ ] **There is no approve-anyway button.** The only paths are: use the supported alternative,
      answer it yourself, or skip.
- [ ] Choosing "answer it yourself" records the answer as user-authored, not agent-authored, in the
      audit trail.
- [ ] The blocking fact `f-resp-k8s-exposure` in the Career Vault shows a `claimCeiling` that stops
      at exposure, not ownership.

### 5c. Human takeover — Northlake Mutual (`app-northlake`)

- [ ] The run reaches `mock://auth/login` and stops. Control transfers to you: the control chip
      flips, and a banner appears **inside the page** reading *"YOU HAVE CONTROL — the agent has
      stopped sending commands to this page"*.
- [ ] **The command log goes quiet.** No further agent commands are issued while you hold control.
- [ ] You can type into the login form yourself and sign in (any credentials).
- [ ] The CAPTCHA page appears and also stops the agent.
- [ ] **The agent cannot solve it.** The nine tiles are not agent-addressable, and if the agent were
      to click Verify the page would reject it as automated (`event.isTrusted` check).
- [ ] Selecting the three traffic lights yourself and clicking Verify succeeds.
- [ ] On resume, the timeline states **which resume point was chosen and why** — the agent re-read
      live page state rather than continuing from a remembered step.
- [ ] Sanity check the resumption logic: after signing in, navigate the embedded browser back one
      page before resuming. The agent should pick a *different* resume point matching what it now
      observes.

### 5d. New reusable preference — Verdance Labs (`app-verdance`)

- [ ] The run stops on base salary expectations (compensation is a mandatory stop).
- [ ] A proposed answer is shown with its reasoning and supporting facts.
- [ ] Accepting offers a **scope choice**: this once / this company / default everywhere / never
      auto-answer this again.
- [ ] Choosing "default everywhere" persists — the saved preference is visible after a restart.
- [ ] Choosing "never auto-answer this again" is honoured on subsequent runs.
- [ ] Editing the proposed answer before accepting records the correction in the audit trail as a
      user correction.

### 5e. Rejected by research — Cobalt Harbor Systems (`app-cobalt`)

- [ ] The agent recommends **do not apply** and gives specific reasons.
- [ ] **No application form is ever opened.** The point of this scenario is that it costs you
      nothing.
- [ ] You retain the ability to override and proceed anyway; the override is recorded.

### 5f. Always-human review — Corvid Analytics (`app-corvid`)

- [ ] The run reaches `mock://application/demographics` and stops.
- [ ] The stop is presented as **locked** — no autonomy setting can switch it off.
- [ ] The agent proposes nothing for the demographic fields; they are left entirely to you.
- [ ] Declining to answer is a first-class option, not a dead end.

## 6. Approval, control and interruption

- [ ] While an approval gate is open, the agent issues no commands.
- [ ] Pausing mid-run stops progress; resuming continues correctly.
- [ ] Navigating to another screen mid-run and coming back does not lose the run — the browser view
      is hidden, not destroyed.
- [ ] Aborting a run leaves the application in a coherent state, not a half-filled limbo.
- [ ] Closing and reopening the app after a completed run preserves the timeline and audit trail.

## 7. Security posture

- [ ] The embedded browser has **no editable address bar** — the URL is displayed, not typed.
- [ ] The URL is always `mock://…`, with a lock icon and a "Sandboxed" badge.
- [ ] **Exercise the navigation guard.** The mock pages contain no external links on purpose, so add
      one temporarily to `apps/desktop/src/mock-sites/ats/simple-application.html`:
      `<a href="https://example.com" data-action="escape" data-label="escape">go</a>`, restart, open
      that page and click it. Expected: the navigation is cancelled, the page does not change, and
      the header shows **"1 navigation blocked"** (hover for the URL). Revert the edit afterwards.
- [ ] `grep -rn "executeJavaScript" apps packages` returns nothing.
- [ ] `grep -rn "fetch(\|axios\|node-fetch" apps packages` returns only the `net.fetch` in
      `main/mock-protocol.ts`, which reads a bundled file via `file://`.
- [ ] Nothing in the app opens an external browser. `shell.openExternal` is a no-op by construction.

## 8. Career Vault

- [ ] 30+ facts across 15 categories load.
- [ ] Verified, unverified and **AI-inferred** facts are visually distinct.
- [ ] **An AI-inferred fact never renders as verified**, in either theme, in any view.
- [ ] Deliberate conflicts are surfaced as conflicts and can be inspected.
- [ ] Facts carry `claimCeiling` information where relevant, and the ceiling is legible in plain
      language.
- [ ] Editing a fact persists across a restart.
- [ ] Facts used by a scenario show where they were used.

## 9. Resume Studio

- [ ] Six positioning strategies, each with response/interview history.
- [ ] Selecting a strategy immediately shows a tailored diff — no empty pane requiring an extra
      click.
- [ ] Diffs are per-job and show added/removed/changed bullets distinctly.
- [ ] Per-bullet evidence links resolve to Career Vault facts.
- [ ] **The refusal card renders** (DevSecOps strategy): the requested rewrite *"Owned production
      Kubernetes infrastructure across four regions"* is shown struck through under "Requested, not
      written", with a "Why it was refused" explanation.
- [ ] **The refusal card has no approve-anyway control.**

## 10. Outreach

- [ ] Eight contacts load, covering **all seven contact roles**: recruiter, hiring manager, team
      director, potential peer, former colleague, alumni connection, second-degree connection.
- [ ] Each contact shows role, company, why they are relevant, contact source, confidence,
      recommended channel, outreach goal, approval state and follow-up date.
- [ ] Personalization points are **grounded** — each cites a specific fixture fact, not generic
      flattery.
- [ ] Network/profile contacts offer **copy-to-clipboard only**, with explicit copy stating that you
      send the message yourself.
- [ ] **There is no send button anywhere** — not enabled, not disabled, not stubbed.
- [ ] Email contacts stop at an approved draft.
- [ ] All five approval states — draft, needs-review, approved, sent-manually, declined — are
      present in the fixtures, so every state's badge and behaviour can be checked without editing
      anything. The status filter has an option for each.
- [ ] The low-confidence second-degree contact (Basalt Security) states its weak link honestly
      rather than implying a direct relationship — grounding is supposed to constrain the copy, not
      decorate it.
- [ ] Approving a draft persists across a restart.

## 11. Analytics

- [ ] Every panel is labelled as simulated data.
- [ ] The funnel renders and its "recommended" figure matches Job Discovery and Command Center.
- [ ] **Qualified interviews per hour of your attention** is present, with the denominator visible.
- [ ] Written insight cards read as specific observations about this pipeline, not generic advice.
- [ ] Approving something elsewhere in the app and returning here **moves the numbers** — metrics are
      recomputed live, not snapshotted.

## 12. Autonomy Settings

- [ ] 11 automation toggles and 14 mandatory stops render.
- [ ] **10 stops are locked** and visibly read-only, with an explanation that they are enforced in
      the engine rather than checked in the UI.
- [ ] `auto-submit` is permanently off and disabled, with copy explaining why a switch would be
      meaningless against a locked final-submission stop.
- [ ] The default preset on a fresh seed is **Approval before every application** (badged "Default").
- [ ] Selecting each of the four presets changes the toggles/stops appropriately.
- [ ] Changing any individual switch flips the active preset to **Custom**.
- [ ] Re-creating a preset's exact configuration by hand flips the preset label back to that preset.
- [ ] Changes persist across a restart.
- [ ] **Relaxing every unlocked setting does not let the agent past a locked stop.** Set the most
      permissive configuration available, then re-run 5f (demographics) and 5c (CAPTCHA) and confirm
      both still stop.

## 13. Persistence and recovery

- [ ] State saves without a visible stall; the header shows a saved-at indicator.
- [ ] Force-quitting mid-save never leaves a corrupt file (writes are temp-file + rename).
- [ ] Hand-corrupting the state file (e.g. truncate it) and relaunching falls back to a fresh seed
      rather than crashing.
- [ ] The reset control restores fixtures and returns the app to a clean demo state.

## 14. Packaging

- [ ] `npm run package` produces an unpacked app in `out/` that launches.
- [ ] `npm run make:win` (on Windows, or with Wine+Mono on PATH) produces
      `out/make/squirrel.windows/x64/JobCopilot-Setup.exe` and a ZIP under `out/make/zip/win32/x64/`.
- [ ] The installed app launches, seeds state and reaches Command Center.
- [ ] **Re-run §5a and §7 against the packaged build.** Packaged builds resolve preloads and mock
      pages from inside the ASAR; a path bug here is invisible in development.

---

## Known-good baseline for this build

Verified in a Linux sandbox on a virtual framebuffer (`xvfb-run`, software rendering), 2026-07-31:

- `npm run verify` exits clean — typecheck, lint and all four Vite builds.
- The Electron window genuinely launches, seeds state and renders. Command Center, Autonomy
  Settings, Outreach and Resume Studio (including the Kubernetes refusal card) were confirmed by
  screenshot, not inferred from a successful build.
- Not verified in that environment: interactive scenario runs end-to-end (no synthetic input tool
  was available), Windows packaging (no Windows host, no Wine/Mono), and rendering under hardware
  GPU acceleration.
