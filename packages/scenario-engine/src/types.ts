import type { ConfidenceLevel } from '@shared/common';
import type { TimelineEvent, TimelineEventKind, TimelineSource, TimelineStatus } from '@shared/timeline';
import type { MandatoryStopId } from '@shared/autonomy';
import type { PreferenceTopic } from '@shared/preferences';

/* ------------------------------------------------------------------ *
 * Page driver protocol — the only vocabulary the engine may use to
 * talk to the sandboxed mock pages inside the WebContentsView.
 * ------------------------------------------------------------------ */

export interface MockFieldState {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  value: string;
  required: boolean;
  options?: string[];
  filled: boolean;
}

/** Everything the engine can observe about the current mock page. */
export interface MockPageState {
  url: string;
  /** Logical page id, e.g. `ats/multistep-application`. */
  page: string;
  title: string;
  /** Wizard step / section id within the page. */
  step: string;
  /** Page-declared lifecycle status, e.g. `editing`, `submitted`, `blocked`. */
  status: string;
  fields: MockFieldState[];
  actions: { name: string; label: string; disabled: boolean }[];
  /** Page declares that no automation may proceed (login, CAPTCHA, EEO...). */
  requiresHuman: boolean;
  requiresHumanReason?: string;
  /** Free-form flags the page exposes, e.g. `captchaSolved`. */
  flags: Record<string, string>;
  observedAt: number;
}

export const EMPTY_PAGE_STATE: MockPageState = {
  url: '',
  page: 'about:blank',
  title: '',
  step: '',
  status: 'idle',
  fields: [],
  actions: [],
  requiresHuman: false,
  flags: {},
  observedAt: 0,
};

/** Declarative predicate over `MockPageState`, evaluated on every page event. */
export interface PageCondition {
  page?: string;
  step?: string;
  status?: string;
  requiresHuman?: boolean;
  /** Field must be non-empty. */
  fieldFilled?: string;
  /** Flag must equal this value. */
  flag?: { name: string; value: string };
  description: string;
}

export function matchesCondition(state: MockPageState, c: PageCondition): boolean {
  if (c.page !== undefined && state.page !== c.page) return false;
  if (c.step !== undefined && state.step !== c.step) return false;
  if (c.status !== undefined && state.status !== c.status) return false;
  if (c.requiresHuman !== undefined && state.requiresHuman !== c.requiresHuman) return false;
  if (c.fieldFilled !== undefined) {
    const f = state.fields.find((x) => x.name === c.fieldFilled);
    if (!f || !f.filled) return false;
  }
  if (c.flag !== undefined && state.flags[c.flag.name] !== c.flag.value) return false;
  return true;
}

/** Transport the engine uses. Implemented in the renderer over typed IPC. */
export interface PageDriver {
  navigate(url: string): Promise<MockPageState>;
  describe(): Promise<MockPageState>;
  fill(field: string, value: string): Promise<MockPageState>;
  select(field: string, value: string): Promise<MockPageState>;
  upload(field: string, fileName: string): Promise<MockPageState>;
  click(action: string): Promise<MockPageState>;
  focus(target: { field?: string; action?: string }): Promise<void>;
  highlight(target: { field?: string; action?: string; note?: string }): Promise<void>;
  clearHighlight(): Promise<void>;
  /** Resolves when `condition` holds, rejects on timeout. */
  waitFor(condition: PageCondition, timeoutMs?: number): Promise<MockPageState>;
  /** Blocks/unblocks agent-originated commands during human takeover. */
  setAgentEnabled(enabled: boolean): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Scenario definitions
 * ------------------------------------------------------------------ */

export interface EvidenceGap {
  requested: string;
  whyGap: string;
  supportedAlternative: string;
  blockingFactIds: string[];
}

export interface AgentQuestion {
  id: string;
  /** Mock-page field the approved answer is written into (omit for meta questions). */
  field?: string;
  question: string;
  proposedAnswer: string;
  answerKind: 'text' | 'textarea' | 'select';
  options?: string[];
  confidence: ConfidenceLevel;
  evidenceFactIds: string[];
  reasoning: string;
  warnings: string[];
  /** When set, editing the proposal offers to save a reusable preference. */
  preferenceTopic?: PreferenceTopic;
  /** Present when the agent refuses to answer because evidence is missing. */
  evidenceGap?: EvidenceGap;
  mandatoryStop?: MandatoryStopId;
}

export interface TimelineSeed {
  kind: TimelineEventKind;
  status?: TimelineStatus;
  source?: TimelineSource;
  title: string;
  details: string;
  confidence?: ConfidenceLevel;
  evidenceFactIds?: string[];
  meta?: { label: string; value: string }[];
}

export type ScenarioStep =
  | { id: string; type: 'note'; stage?: string; timeline: TimelineSeed }
  | { id: string; type: 'navigate'; stage?: string; url: string; expect?: PageCondition; timeline: TimelineSeed }
  | { id: string; type: 'focusElement'; stage?: string; field?: string; action?: string; note?: string; timeline?: TimelineSeed }
  | {
      id: string;
      type: 'fillInput';
      stage?: string;
      field: string;
      value: string;
      confidence?: ConfidenceLevel;
      evidenceFactIds?: string[];
      timeline: TimelineSeed;
    }
  | { id: string; type: 'selectOption'; stage?: string; field: string; value: string; timeline: TimelineSeed }
  | { id: string; type: 'uploadMockFile'; stage?: string; field: string; fileName: string; timeline: TimelineSeed }
  | { id: string; type: 'clickAction'; stage?: string; action: string; expect?: PageCondition; timeline?: TimelineSeed }
  | { id: string; type: 'requestApproval'; stage?: string; question: AgentQuestion }
  | {
      id: string;
      type: 'requestTakeover';
      stage?: string;
      reason: string;
      instructions: string[];
      /** The engine watches for this before it offers to resume. */
      doneWhen: PageCondition;
      timeline: TimelineSeed;
    }
  | { id: string; type: 'waitForUserState'; stage?: string; condition: PageCondition; message: string; timeline?: TimelineSeed }
  | { id: string; type: 'requestFinalApproval'; stage?: string; summary: string[]; submitAction: string; expect?: PageCondition }
  | { id: string; type: 'complete'; stage?: string; outcome: string; timeline: TimelineSeed };

export interface ScenarioDefinition {
  id: string;
  title: string;
  description: string;
  jobId: string;
  applicationId: string;
  /** Human-readable label for the kind of behaviour being demonstrated. */
  demonstrates: string;
  steps: ScenarioStep[];
  /**
   * Re-entry map used after a human takeover. The engine inspects live page
   * state and picks the first matching entry rather than blindly resuming the
   * previously executing step.
   */
  resumePoints: { when: PageCondition; stepId: string; note: string }[];
}

/* ------------------------------------------------------------------ *
 * Runtime
 * ------------------------------------------------------------------ */

export type RunnerStatus =
  | 'idle'
  | 'running'
  | 'waiting-for-approval'
  | 'waiting-for-user-state'
  | 'human-takeover'
  | 'paused'
  | 'completed'
  | 'aborted'
  | 'error';

export type PendingAction =
  | { kind: 'approve-answer'; stepId: string; question: AgentQuestion }
  | { kind: 'evidence-gap'; stepId: string; question: AgentQuestion }
  | {
      kind: 'preference-scope';
      stepId: string;
      question: AgentQuestion;
      chosenAnswer: string;
    }
  | {
      kind: 'takeover';
      stepId: string;
      reason: string;
      instructions: string[];
      doneWhen: PageCondition;
      /** Flips true once the page reports the takeover objective is met. */
      objectiveMet: boolean;
    }
  | { kind: 'wait-for-user-state'; stepId: string; message: string; condition: PageCondition; satisfied: boolean }
  | { kind: 'final-approval'; stepId: string; summary: string[] };

export interface RunnerSnapshot {
  scenarioId: string;
  applicationId: string;
  jobId: string;
  status: RunnerStatus;
  stage: string;
  stepIndex: number;
  totalSteps: number;
  currentAction: string;
  pending: PendingAction | null;
  controlOwner: 'agent' | 'user' | 'waiting-for-approval';
  pageState: MockPageState;
  timeline: TimelineEvent[];
  warnings: string[];
  error?: string;
}
