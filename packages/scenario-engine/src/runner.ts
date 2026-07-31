import type { ConfidenceLevel } from '@shared/common';
import type { TimelineEvent } from '@shared/timeline';
import type { PreferenceScope } from '@shared/preferences';
import {
  EMPTY_PAGE_STATE,
  matchesCondition,
  type AgentQuestion,
  type MockPageState,
  type PageDriver,
  type PendingAction,
  type RunnerSnapshot,
  type RunnerStatus,
  type ScenarioDefinition,
  type ScenarioStep,
  type TimelineSeed,
} from './types';

export interface RunnerHooks {
  onSnapshot(snapshot: RunnerSnapshot): void;
  onAnswerCommitted(payload: {
    applicationId: string;
    question: AgentQuestion;
    answer: string;
    correctedByUser: boolean;
    confidence: ConfidenceLevel;
  }): void;
  onPreferenceSaved(payload: {
    applicationId: string;
    question: AgentQuestion;
    answer: string;
    scope: Exclude<PreferenceScope, 'once'>;
  }): void;
  onTimeline(applicationId: string, event: TimelineEvent): void;
  onStatusChange(payload: { applicationId: string; status: RunnerStatus; outcome?: string }): void;
}

type GateResult =
  | { type: 'approved'; answer: string; edited: boolean }
  | { type: 'rejected' }
  | { type: 'skipped' }
  | { type: 'manual-answer'; answer: string }
  | { type: 'scope'; scope: PreferenceScope }
  | { type: 'resume' }
  | { type: 'abort' };

interface Gate {
  resolve: (r: GateResult) => void;
  promise: Promise<GateResult>;
}

function makeGate(): Gate {
  let resolve!: (r: GateResult) => void;
  const promise = new Promise<GateResult>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}

let eventSeq = 0;
function nextId(prefix: string): string {
  eventSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${eventSeq}`;
}

export interface RunnerOptions {
  /**
   * Cosmetic pacing between agent actions so a human can follow along. All
   * *correctness*-relevant waiting is state-based via `PageDriver.waitFor`.
   */
  pacingMs?: number;
}

export class ScenarioRunner {
  private readonly scenario: ScenarioDefinition;
  private readonly driver: PageDriver;
  private readonly hooks: RunnerHooks;
  private readonly pacingMs: number;

  private index = 0;
  private status: RunnerStatus = 'idle';
  private stage = 'Not started';
  private currentAction = 'Idle';
  private pending: PendingAction | null = null;
  private pageState: MockPageState = EMPTY_PAGE_STATE;
  private timeline: TimelineEvent[] = [];
  private warnings: string[] = [];
  private error?: string;

  private gate: Gate | null = null;
  private pauseGate: Gate | null = null;
  private jumpToStepId: string | null = null;
  private disposed = false;
  private started = false;

  constructor(
    scenario: ScenarioDefinition,
    driver: PageDriver,
    hooks: RunnerHooks,
    options: RunnerOptions = {},
  ) {
    this.scenario = scenario;
    this.driver = driver;
    this.hooks = hooks;
    this.pacingMs = options.pacingMs ?? 700;
  }

  /* ----------------------------- snapshot ----------------------------- */

  snapshot(): RunnerSnapshot {
    return {
      scenarioId: this.scenario.id,
      applicationId: this.scenario.applicationId,
      jobId: this.scenario.jobId,
      status: this.status,
      stage: this.stage,
      stepIndex: this.index,
      totalSteps: this.scenario.steps.length,
      currentAction: this.currentAction,
      pending: this.pending,
      controlOwner:
        this.status === 'human-takeover'
          ? 'user'
          : this.status === 'waiting-for-approval' || this.status === 'waiting-for-user-state'
            ? 'waiting-for-approval'
            : 'agent',
      pageState: this.pageState,
      timeline: this.timeline,
      warnings: this.warnings,
      error: this.error,
    };
  }

  private emit(): void {
    if (!this.disposed) this.hooks.onSnapshot(this.snapshot());
  }

  private setStatus(status: RunnerStatus, outcome?: string): void {
    if (this.status === status) return;
    this.status = status;
    this.hooks.onStatusChange({ applicationId: this.scenario.applicationId, status, outcome });
  }

  /** Called by the transport whenever the mock page reports new state. */
  observePageState(state: MockPageState): void {
    this.pageState = state;
    if (this.pending?.kind === 'takeover') {
      const met = matchesCondition(state, this.pending.doneWhen);
      if (met !== this.pending.objectiveMet) this.pending = { ...this.pending, objectiveMet: met };
    }
    if (this.pending?.kind === 'wait-for-user-state') {
      const met = matchesCondition(state, this.pending.condition);
      if (met !== this.pending.satisfied) {
        this.pending = { ...this.pending, satisfied: met };
        if (met && this.gate) this.resolveGate({ type: 'resume' });
      }
    }
    this.emit();
  }

  private addTimeline(seed: TimelineSeed): TimelineEvent {
    const event: TimelineEvent = {
      id: nextId('tl'),
      timestamp: new Date().toISOString(),
      kind: seed.kind,
      status: seed.status ?? 'ok',
      source: seed.source ?? 'agent',
      title: seed.title,
      confidence: seed.confidence,
      details: seed.details,
      evidenceFactIds: seed.evidenceFactIds,
      meta: seed.meta,
      expandable: Boolean(seed.details || seed.meta?.length || seed.evidenceFactIds?.length),
    };
    this.timeline = [...this.timeline, event];
    this.hooks.onTimeline(this.scenario.applicationId, event);
    return event;
  }

  /* ------------------------------ control ----------------------------- */

  async start(seedTimeline: TimelineEvent[] = []): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.timeline = seedTimeline;
    this.setStatus('running');
    this.emit();
    await this.loop();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.pauseGate = makeGate();
    this.setStatus('paused');
    this.currentAction = 'Paused by user';
    this.addTimeline({
      kind: 'agent-paused',
      source: 'user',
      status: 'info',
      title: 'Agent paused',
      details: 'The agent stopped issuing commands to the browser. No page state was changed.',
    });
    this.emit();
  }

  resume(): void {
    if (this.status !== 'paused' || !this.pauseGate) return;
    this.setStatus('running');
    this.addTimeline({
      kind: 'agent-resumed',
      source: 'user',
      status: 'info',
      title: 'Agent resumed',
      details: 'The agent re-read the current page state before continuing.',
    });
    const gate = this.pauseGate;
    this.pauseGate = null;
    gate.resolve({ type: 'resume' });
    this.emit();
  }

  /** Human takeover requested by the user rather than by the scenario. */
  async takeOver(reason = 'You requested manual control.'): Promise<void> {
    if (this.status === 'completed' || this.status === 'aborted') return;
    await this.driver.clearHighlight();
    await this.driver.setAgentEnabled(false);
    this.pending = {
      kind: 'takeover',
      stepId: this.scenario.steps[this.index]?.id ?? 'user-initiated',
      reason,
      instructions: [
        'The agent has stopped sending commands to the page.',
        'Interact with the browser on the right as you normally would.',
        'Press "Return control to agent" when you are done — the agent will re-read the page before continuing.',
      ],
      doneWhen: { description: 'You decide when you are done.' },
      objectiveMet: true,
    };
    this.setStatus('human-takeover');
    this.currentAction = 'Waiting — you have control of the browser';
    this.addTimeline({
      kind: 'user-took-control',
      source: 'user',
      status: 'action-required',
      title: 'You took control of the browser',
      details: `${reason} The agent is not sending any commands to the page while you hold control.`,
    });
    if (!this.gate) this.gate = makeGate();
    this.emit();
  }

  async returnControl(): Promise<void> {
    if (this.status !== 'human-takeover') return;
    this.resolveGate({ type: 'resume' });
  }

  approve(answer?: string): void {
    const p = this.pending;
    if (!p) return;
    if (p.kind === 'approve-answer') {
      const finalAnswer = answer ?? p.question.proposedAnswer;
      this.resolveGate({
        type: 'approved',
        answer: finalAnswer,
        edited: finalAnswer.trim() !== p.question.proposedAnswer.trim(),
      });
    } else if (p.kind === 'final-approval') {
      this.resolveGate({ type: 'approved', answer: '', edited: false });
    } else if (p.kind === 'evidence-gap') {
      this.resolveGate({ type: 'manual-answer', answer: answer ?? '' });
    }
  }

  reject(): void {
    if (!this.pending) return;
    this.resolveGate({ type: 'rejected' });
  }

  skip(): void {
    if (!this.pending) return;
    this.resolveGate({ type: 'skipped' });
  }

  choosePreferenceScope(scope: PreferenceScope): void {
    if (this.pending?.kind !== 'preference-scope') return;
    this.resolveGate({ type: 'scope', scope });
  }

  abort(): void {
    if (this.status === 'completed' || this.status === 'aborted') return;
    if (this.gate) this.resolveGate({ type: 'abort' });
    else {
      this.finishAborted();
    }
  }

  dispose(): void {
    this.disposed = true;
    if (this.gate) this.gate.resolve({ type: 'abort' });
    if (this.pauseGate) this.pauseGate.resolve({ type: 'abort' });
  }

  private resolveGate(result: GateResult): void {
    const g = this.gate;
    if (!g) return;
    this.gate = null;
    g.resolve(result);
  }

  private async waitGate(): Promise<GateResult> {
    this.gate = makeGate();
    this.emit();
    return this.gate.promise;
  }

  private async pacing(): Promise<void> {
    if (this.pacingMs <= 0) return;
    await new Promise((r) => setTimeout(r, this.pacingMs));
  }

  private async checkPause(): Promise<GateResult | null> {
    while (this.pauseGate) {
      const r = await this.pauseGate.promise;
      if (r.type === 'abort') return r;
      // On resume, re-read the page so the agent never acts on stale state.
      this.pageState = await this.driver.describe();
      this.emit();
    }
    return null;
  }

  /* ------------------------------- loop ------------------------------- */

  private async loop(): Promise<void> {
    try {
      while (this.index < this.scenario.steps.length) {
        if (this.disposed) return;
        const paused = await this.checkPause();
        if (paused?.type === 'abort') return this.finishAborted();

        const step = this.scenario.steps[this.index];
        const outcome = await this.execute(step);
        if (outcome === 'abort') return this.finishAborted();
        if (outcome === 'stop') return;

        if (this.jumpToStepId) {
          const target = this.scenario.steps.findIndex((s) => s.id === this.jumpToStepId);
          this.jumpToStepId = null;
          this.index = target >= 0 ? target : this.index + 1;
        } else {
          this.index += 1;
        }
        this.emit();
      }
      this.setStatus('completed');
      this.currentAction = 'Scenario complete';
      this.emit();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.setStatus('error');
      this.currentAction = 'Agent stopped after an error';
      this.addTimeline({
        kind: 'note',
        status: 'blocked',
        source: 'system',
        title: 'Agent halted',
        details: this.error,
      });
      this.emit();
    }
  }

  private finishAborted(): void {
    this.setStatus('aborted');
    this.pending = null;
    this.currentAction = 'Application aborted by user';
    this.addTimeline({
      kind: 'application-aborted',
      source: 'user',
      status: 'blocked',
      title: 'Application aborted',
      details: 'Nothing was submitted. The application was returned to the CRM without changes.',
    });
    void this.driver.clearHighlight();
    this.emit();
  }

  /* ------------------------------ steps ------------------------------- */

  private async execute(step: ScenarioStep): Promise<'next' | 'stop' | 'abort'> {
    if (step.stage) this.stage = step.stage;
    this.pending = null;

    switch (step.type) {
      case 'note':
        this.currentAction = step.timeline.title;
        this.emit();
        await this.pacing();
        this.addTimeline(step.timeline);
        return 'next';

      case 'navigate': {
        this.currentAction = `Opening ${step.url}`;
        this.setStatus('running');
        this.emit();
        this.pageState = await this.driver.navigate(step.url);
        if (step.expect) this.pageState = await this.driver.waitFor(step.expect);
        this.addTimeline(step.timeline);
        this.emit();
        return 'next';
      }

      case 'focusElement': {
        this.currentAction = step.note ?? `Focusing ${step.field ?? step.action}`;
        this.emit();
        await this.driver.highlight({ field: step.field, action: step.action, note: step.note });
        await this.driver.focus({ field: step.field, action: step.action });
        if (step.timeline) this.addTimeline(step.timeline);
        await this.pacing();
        return 'next';
      }

      case 'fillInput': {
        this.currentAction = `Filling “${step.field}”`;
        this.emit();
        await this.driver.highlight({ field: step.field });
        await this.pacing();
        this.pageState = await this.driver.fill(step.field, step.value);
        this.addTimeline(step.timeline);
        this.emit();
        return 'next';
      }

      case 'selectOption': {
        this.currentAction = `Selecting “${step.value}”`;
        this.emit();
        await this.driver.highlight({ field: step.field });
        await this.pacing();
        this.pageState = await this.driver.select(step.field, step.value);
        this.addTimeline(step.timeline);
        this.emit();
        return 'next';
      }

      case 'uploadMockFile': {
        this.currentAction = `Attaching ${step.fileName}`;
        this.emit();
        await this.driver.highlight({ field: step.field });
        await this.pacing();
        this.pageState = await this.driver.upload(step.field, step.fileName);
        this.addTimeline(step.timeline);
        this.emit();
        return 'next';
      }

      case 'clickAction': {
        this.currentAction = `Activating “${step.action}”`;
        this.emit();
        await this.driver.highlight({ action: step.action });
        await this.pacing();
        this.pageState = await this.driver.click(step.action);
        if (step.expect) this.pageState = await this.driver.waitFor(step.expect);
        if (step.timeline) this.addTimeline(step.timeline);
        this.emit();
        return 'next';
      }

      case 'requestApproval':
        return this.handleApproval(step.id, step.question);

      case 'requestTakeover':
        return this.handleTakeover(step);

      case 'waitForUserState':
        return this.handleWaitForUserState(step);

      case 'requestFinalApproval':
        return this.handleFinalApproval(step);

      case 'complete': {
        await this.driver.clearHighlight();
        this.addTimeline(step.timeline);
        this.currentAction = step.outcome;
        this.setStatus('completed', step.outcome);
        this.emit();
        return 'stop';
      }

      default: {
        const never: never = step;
        throw new Error(`Unhandled scenario step: ${JSON.stringify(never)}`);
      }
    }
  }

  private async handleApproval(stepId: string, question: AgentQuestion): Promise<'next' | 'stop' | 'abort'> {
    const isGap = Boolean(question.evidenceGap);

    if (question.field) await this.driver.highlight({ field: question.field, note: question.question });

    if (isGap) {
      this.addTimeline({
        kind: 'unsupported-claim-detected',
        status: 'blocked',
        title: 'Stopped: evidence does not support an answer',
        details: `${question.evidenceGap!.whyGap}\n\nThe agent will not fabricate an answer. Supported alternative: “${question.evidenceGap!.supportedAlternative}”`,
        confidence: 'unsupported',
        evidenceFactIds: question.evidenceGap!.blockingFactIds,
        meta: [
          { label: 'Question', value: question.question },
          { label: 'What the ATS wants', value: question.evidenceGap!.requested },
        ],
      });
      this.warnings = [...this.warnings, `Unsupported claim blocked: ${question.question}`];
      this.pending = { kind: 'evidence-gap', stepId, question };
      this.currentAction = 'Blocked — the Career Vault cannot support this answer';
    } else {
      this.addTimeline({
        kind: 'answer-retrieved',
        title: `Answer prepared: ${question.question}`,
        details: question.reasoning,
        confidence: question.confidence,
        evidenceFactIds: question.evidenceFactIds,
        meta: [{ label: 'Proposed answer', value: question.proposedAnswer }],
      });
      if (question.confidence === 'high' || question.confidence === 'medium') {
        this.addTimeline({
          kind: 'confidence-check-passed',
          title: `Confidence check: ${question.confidence}`,
          details: 'Every clause in the proposed answer maps to at least one verified Career Vault fact.',
          confidence: question.confidence,
          evidenceFactIds: question.evidenceFactIds,
        });
      }
      this.addTimeline({
        kind: 'approval-requested',
        status: 'action-required',
        title: 'Approval requested',
        details: question.mandatoryStop
          ? `A mandatory stop is configured for "${question.mandatoryStop}". The agent will not answer this without you.`
          : 'The agent will not write this answer into the form until you approve it.',
        confidence: question.confidence,
      });
      this.pending = { kind: 'approve-answer', stepId, question };
      this.currentAction = 'Waiting for your approval';
    }

    this.setStatus('waiting-for-approval');
    const result = await this.waitGate();

    if (result.type === 'abort') return 'abort';

    if (result.type === 'rejected') {
      this.addTimeline({
        kind: 'question-skipped',
        source: 'user',
        status: 'warning',
        title: 'Answer rejected',
        details: 'You rejected the proposed answer. The field was left blank for you to complete.',
      });
      this.setStatus('running');
      return 'next';
    }

    if (result.type === 'skipped') {
      this.addTimeline({
        kind: 'question-skipped',
        source: 'user',
        status: 'warning',
        title: 'Question skipped',
        details: `“${question.question}” was skipped. If the ATS requires it, submission will be blocked until it is answered.`,
      });
      this.setStatus('running');
      return 'next';
    }

    if (result.type !== 'approved' && result.type !== 'manual-answer') {
      this.setStatus('running');
      return 'next';
    }

    const answer = result.answer;
    const edited = result.type === 'manual-answer' ? true : result.edited;

    if (edited) {
      this.addTimeline({
        kind: 'user-corrected-answer',
        source: 'user',
        status: 'info',
        title: 'You corrected the answer',
        details: `Proposed: “${question.proposedAnswer || '(none — evidence gap)'}”\nYours: “${answer}”`,
      });
    }

    if (question.field && answer) {
      this.setStatus('running');
      this.currentAction = `Writing your approved answer into “${question.field}”`;
      this.emit();
      this.pageState = await this.driver.fill(question.field, answer);
    }

    this.hooks.onAnswerCommitted({
      applicationId: this.scenario.applicationId,
      question,
      answer,
      correctedByUser: edited,
      confidence: question.evidenceGap ? 'unsupported' : question.confidence,
    });

    // Scenario 4: an edited answer on a reusable topic offers to persist a preference.
    if (edited && question.preferenceTopic && answer) {
      this.pending = { kind: 'preference-scope', stepId, question, chosenAnswer: answer };
      this.currentAction = 'How should this answer be reused?';
      this.setStatus('waiting-for-approval');
      const scopeResult = await this.waitGate();
      if (scopeResult.type === 'abort') return 'abort';
      if (scopeResult.type === 'scope' && scopeResult.scope !== 'once') {
        this.hooks.onPreferenceSaved({
          applicationId: this.scenario.applicationId,
          question,
          answer,
          scope: scopeResult.scope,
        });
        this.addTimeline({
          kind: 'reusable-preference-saved',
          source: 'user',
          status: 'ok',
          title: 'Reusable preference saved',
          details:
            scopeResult.scope === 'company'
              ? 'Saved for this employer only. The next application to a different company will ask again.'
              : scopeResult.scope === 'default'
                ? 'Saved as your default. Future applications will pre-fill this answer, still subject to your mandatory stops.'
                : 'The agent will never auto-answer this topic again and will always hand it to you.',
          meta: [
            { label: 'Question', value: question.question },
            { label: 'Answer', value: answer },
            { label: 'Scope', value: scopeResult.scope },
          ],
        });
      } else {
        this.addTimeline({
          kind: 'note',
          source: 'user',
          status: 'info',
          title: 'Answer used once',
          details: 'Nothing was stored. The next application will ask about this again.',
        });
      }
    }

    this.setStatus('running');
    this.pending = null;
    this.emit();
    return 'next';
  }

  private async handleTakeover(
    step: Extract<ScenarioStep, { type: 'requestTakeover' }>,
  ): Promise<'next' | 'stop' | 'abort'> {
    await this.driver.clearHighlight();
    await this.driver.setAgentEnabled(false);
    this.addTimeline(step.timeline);
    this.addTimeline({
      kind: 'user-took-control',
      source: 'system',
      status: 'action-required',
      title: 'Control transferred to you',
      details: `${step.reason}\n\nThe agent has stopped sending commands to the browser. It will not resume until you hand control back.`,
    });
    this.pending = {
      kind: 'takeover',
      stepId: step.id,
      reason: step.reason,
      instructions: step.instructions,
      doneWhen: step.doneWhen,
      objectiveMet: matchesCondition(this.pageState, step.doneWhen),
    };
    this.setStatus('human-takeover');
    this.currentAction = 'You have control of the browser';

    const result = await this.waitGate();
    if (result.type === 'abort') return 'abort';

    await this.driver.setAgentEnabled(true);
    this.setStatus('running');
    this.currentAction = 'Re-reading the page after takeover';
    this.pending = null;
    this.emit();

    const state = await this.driver.describe();
    this.pageState = state;
    this.addTimeline({
      kind: 'control-returned',
      source: 'user',
      status: 'ok',
      title: 'Control returned to the agent',
      details: 'The agent re-inspected the live page instead of resuming a memorised step.',
    });
    this.addTimeline({
      kind: 'page-state-observed',
      source: 'page',
      status: 'info',
      title: `Observed page: ${state.page}`,
      details: `The agent re-read the DOM to decide where to continue.`,
      meta: [
        { label: 'Page', value: state.page },
        { label: 'Step', value: state.step || '—' },
        { label: 'Status', value: state.status },
        { label: 'Filled fields', value: String(state.fields.filter((f) => f.filled).length) },
      ],
    });

    const resumePoint = this.scenario.resumePoints.find((rp) => matchesCondition(state, rp.when));
    if (resumePoint) {
      this.jumpToStepId = resumePoint.stepId;
      this.addTimeline({
        kind: 'note',
        source: 'agent',
        status: 'ok',
        title: 'Resume point selected from live page state',
        details: resumePoint.note,
        meta: [
          { label: 'Matched condition', value: resumePoint.when.description },
          { label: 'Continuing at step', value: resumePoint.stepId },
        ],
      });
    } else {
      this.addTimeline({
        kind: 'note',
        source: 'agent',
        status: 'warning',
        title: 'No resume point matched — continuing conservatively',
        details:
          'The live page did not match any known re-entry point, so the agent continues with the next scripted step and will re-verify every field before submitting.',
      });
    }
    this.emit();
    return 'next';
  }

  private async handleWaitForUserState(
    step: Extract<ScenarioStep, { type: 'waitForUserState' }>,
  ): Promise<'next' | 'stop' | 'abort'> {
    const satisfied = matchesCondition(this.pageState, step.condition);
    if (satisfied) {
      if (step.timeline) this.addTimeline(step.timeline);
      return 'next';
    }
    this.pending = {
      kind: 'wait-for-user-state',
      stepId: step.id,
      message: step.message,
      condition: step.condition,
      satisfied: false,
    };
    this.setStatus('waiting-for-user-state');
    this.currentAction = step.message;
    const result = await this.waitGate();
    if (result.type === 'abort') return 'abort';
    if (step.timeline) this.addTimeline(step.timeline);
    this.setStatus('running');
    this.pending = null;
    return 'next';
  }

  private async handleFinalApproval(
    step: Extract<ScenarioStep, { type: 'requestFinalApproval' }>,
  ): Promise<'next' | 'stop' | 'abort'> {
    await this.driver.highlight({ action: step.submitAction, note: 'Awaiting your final approval' });
    this.addTimeline({
      kind: 'approval-requested',
      status: 'action-required',
      title: 'Final submission approval requested',
      details:
        'Final submission is a locked mandatory stop. The agent cannot submit this application without your explicit approval.',
      meta: step.summary.map((s, i) => ({ label: `Check ${i + 1}`, value: s })),
    });
    this.pending = { kind: 'final-approval', stepId: step.id, summary: step.summary };
    this.setStatus('waiting-for-approval');
    this.currentAction = 'Waiting for your final submission approval';

    const result = await this.waitGate();
    if (result.type === 'abort') return 'abort';
    if (result.type === 'rejected' || result.type === 'skipped') {
      this.addTimeline({
        kind: 'note',
        source: 'user',
        status: 'warning',
        title: 'Submission declined',
        details: 'The application was left unsubmitted and stays in the CRM as "Awaiting approval".',
      });
      this.setStatus('paused');
      this.pauseGate = makeGate();
      this.pending = null;
      this.emit();
      return 'next';
    }

    this.setStatus('running');
    this.pending = null;
    this.addTimeline({
      kind: 'submission-approved',
      source: 'user',
      status: 'ok',
      title: 'Submission approved',
      details: 'You approved the final package. The agent is now clicking submit on the mock ATS page.',
    });
    this.currentAction = 'Submitting the application';
    this.emit();
    this.pageState = await this.driver.click(step.submitAction);
    if (step.expect) this.pageState = await this.driver.waitFor(step.expect);
    await this.driver.clearHighlight();
    this.emit();
    return 'next';
  }
}
