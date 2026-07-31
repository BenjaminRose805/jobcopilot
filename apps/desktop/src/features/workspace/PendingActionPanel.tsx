import React from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Hand,
  Lock,
  ShieldQuestion,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfidenceChip,
  Input,
  Panel,
  PanelHeader,
  Select,
  Textarea,
} from '@ui';
import { MANDATORY_STOPS } from '@shared/autonomy';
import {
  PREFERENCE_SCOPE_DETAIL,
  PREFERENCE_SCOPE_LABEL,
  type PreferenceScope,
} from '@shared/preferences';
import type { AgentQuestion, PendingAction, ScenarioRunner } from '@scenario-engine';
import { EvidenceLinks } from '../../components/Evidence';

function stopLabel(id: string): string {
  return MANDATORY_STOPS.find((s) => s.id === id)?.label ?? id;
}

function isLocked(id: string): boolean {
  return MANDATORY_STOPS.find((s) => s.id === id)?.locked ?? false;
}

export function PendingActionPanel({
  pending,
  runner,
}: {
  pending: PendingAction;
  runner: ScenarioRunner;
}) {
  switch (pending.kind) {
    case 'approve-answer':
      return <ApproveAnswer question={pending.question} runner={runner} />;
    case 'evidence-gap':
      return <EvidenceGapCard question={pending.question} runner={runner} />;
    case 'preference-scope':
      return (
        <PreferenceScopeCard
          question={pending.question}
          answer={pending.chosenAnswer}
          runner={runner}
        />
      );
    case 'takeover':
      return <TakeoverCard pending={pending} runner={runner} />;
    case 'wait-for-user-state':
      return <WaitCard pending={pending} />;
    case 'final-approval':
      return <FinalApproval summary={pending.summary} runner={runner} />;
    default:
      return null;
  }
}

/* --------------------------- approve an answer --------------------------- */

function MandatoryStopNote({ stop }: { stop: string }) {
  const locked = isLocked(stop);
  return (
    <div className="flex items-start gap-1.5 rounded border border-[hsl(var(--warn)/0.4)] bg-warn/10 px-2 py-1.5 text-2xs text-[hsl(var(--warn))]">
      {locked ? <Lock size={11} className="mt-[1px] shrink-0" /> : <Hand size={11} className="mt-[1px] shrink-0" />}
      <span>
        <strong>Mandatory stop — {stopLabel(stop)}.</strong>{' '}
        {locked
          ? 'This stop is locked. No autonomy setting can switch it off.'
          : 'You can change this in Autonomy Settings, but it is on by default.'}
      </span>
    </div>
  );
}

function AnswerEditor({
  question,
  value,
  onChange,
}: {
  question: AgentQuestion;
  value: string;
  onChange(next: string): void;
}) {
  if (question.answerKind === 'select' && question.options) {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Answer">
        <option value="">— Choose an answer —</option>
        {question.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }
  if (question.answerKind === 'textarea') {
    return (
      <Textarea rows={6} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Answer" />
    );
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} aria-label="Answer" />;
}

function ApproveAnswer({ question, runner }: { question: AgentQuestion; runner: ScenarioRunner }) {
  const [value, setValue] = React.useState(question.proposedAnswer);
  React.useEffect(() => setValue(question.proposedAnswer), [question.id, question.proposedAnswer]);

  const edited = value.trim() !== question.proposedAnswer.trim();

  return (
    <Panel className="border-[hsl(var(--warn)/0.5)]">
      <PanelHeader
        icon={<ShieldQuestion size={13} />}
        title="Approval requested"
        subtitle={question.question}
        actions={<ConfidenceChip level={question.confidence} />}
      />
      <div className="space-y-2.5 p-3">
        {question.mandatoryStop ? <MandatoryStopNote stop={question.mandatoryStop} /> : null}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              Proposed answer
            </span>
            <Badge tone="ai">
              <Sparkles size={10} />
              {edited ? 'Edited by you' : 'AI drafted, not yet approved'}
            </Badge>
          </div>
          <AnswerEditor question={question} value={value} onChange={setValue} />
        </div>

        <div>
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            Why this answer
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground" data-selectable>
            {question.reasoning}
          </p>
        </div>

        <EvidenceLinks factIds={question.evidenceFactIds} />

        {question.warnings.length > 0 ? (
          <ul className="space-y-1">
            {question.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-1.5 text-2xs text-[hsl(var(--warn))]">
                <AlertTriangle size={11} className="mt-[1px] shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {question.preferenceTopic ? (
          <p className="text-2xs text-muted-foreground">
            Editing this answer will ask whether to reuse it, and you choose the scope.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <Button variant="primary" onClick={() => runner.approve(value)} disabled={!value.trim()}>
            <CheckCircle2 size={13} />
            {edited ? 'Use my answer' : 'Approve answer'}
          </Button>
          <Button variant="outline" onClick={() => runner.reject()}>
            Reject — leave blank
          </Button>
          <Button variant="ghost" onClick={() => runner.skip()}>
            Skip question
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ evidence gap ----------------------------- */

function EvidenceGapCard({ question, runner }: { question: AgentQuestion; runner: ScenarioRunner }) {
  const gap = question.evidenceGap;
  const [value, setValue] = React.useState('');
  if (!gap) return null;

  return (
    <Panel className="border-[hsl(var(--danger)/0.55)]">
      <PanelHeader
        icon={<Ban size={13} className="text-[hsl(var(--danger))]" />}
        title="The agent refused to answer"
        subtitle={question.question}
        actions={<ConfidenceChip level="unsupported" />}
      />
      <div className="space-y-2.5 p-3">
        <div className="rounded border border-[hsl(var(--danger)/0.4)] bg-danger/10 p-2">
          <div className="text-2xs uppercase tracking-wide text-[hsl(var(--danger))]">
            What the form asked for
          </div>
          <p className="mt-0.5 text-xs" data-selectable>
            {gap.requested}
          </p>
        </div>

        <div>
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            Why the Career Vault cannot support it
          </span>
          <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground" data-selectable>
            {gap.whyGap}
          </p>
        </div>

        <EvidenceLinks factIds={gap.blockingFactIds} label="Blocking facts" />

        <div className="rounded border border-[hsl(var(--ok)/0.4)] bg-ok/10 p-2">
          <div className="text-2xs uppercase tracking-wide text-[hsl(var(--ok))]">
            Supported alternative
          </div>
          <p className="mt-0.5 text-xs" data-selectable>
            {gap.supportedAlternative}
          </p>
          <Button
            variant="ok"
            className="mt-2"
            onClick={() => runner.approve(supportedValue(question, gap.supportedAlternative))}
          >
            <CheckCircle2 size={13} />
            Use the supported answer
          </Button>
        </div>

        <div>
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            Or answer it yourself
          </span>
          <div className="mt-1">
            <AnswerEditor question={question} value={value} onChange={setValue} />
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">
            Anything you enter here is recorded as answered by you, not by the agent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <Button variant="primary" disabled={!value.trim()} onClick={() => runner.approve(value)}>
            Submit my own answer
          </Button>
          <Button variant="ghost" onClick={() => runner.skip()}>
            Skip — leave unanswered
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Select fields can only hold one of their listed options, so the prose
 * alternative is mapped back onto the matching option when one exists.
 */
function supportedValue(question: AgentQuestion, alternative: string): string {
  if (question.answerKind !== 'select' || !question.options) return alternative;
  const lower = alternative.toLowerCase();
  const match = question.options.find((o) => lower.startsWith(o.toLowerCase()));
  return match ?? question.options[0];
}

/* --------------------------- preference scope ---------------------------- */

const SCOPES: PreferenceScope[] = ['once', 'company', 'default', 'never-auto-answer'];

function PreferenceScopeCard({
  question,
  answer,
  runner,
}: {
  question: AgentQuestion;
  answer: string;
  runner: ScenarioRunner;
}) {
  const [choice, setChoice] = React.useState<PreferenceScope>('default');
  return (
    <Panel className="border-[hsl(var(--primary)/0.5)]">
      <PanelHeader
        icon={<Sparkles size={13} />}
        title="Reuse this answer?"
        subtitle={question.question}
      />
      <div className="space-y-2.5 p-3">
        <div className="rounded border border-border bg-surface-2 px-2 py-1.5">
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">Your answer</div>
          <p className="text-xs font-medium" data-selectable>
            {answer}
          </p>
        </div>

        <div className="space-y-1" role="radiogroup" aria-label="Reuse scope">
          {SCOPES.map((scope) => (
            <label
              key={scope}
              className={[
                'flex cursor-pointer items-start gap-2 rounded border p-2 transition-colors',
                choice === scope ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-2',
              ].join(' ')}
            >
              <input
                type="radio"
                name="preference-scope"
                className="mt-[3px]"
                checked={choice === scope}
                onChange={() => setChoice(scope)}
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{PREFERENCE_SCOPE_LABEL[scope]}</span>
                <span className="block text-2xs text-muted-foreground">
                  {PREFERENCE_SCOPE_DETAIL[scope]}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="border-t border-border pt-2.5">
          <Button variant="primary" onClick={() => runner.choosePreferenceScope(choice)}>
            Save choice and continue
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------- takeover ------------------------------- */

function TakeoverCard({
  pending,
  runner,
}: {
  pending: Extract<PendingAction, { kind: 'takeover' }>;
  runner: ScenarioRunner;
}) {
  return (
    <Panel className="border-[hsl(var(--warn)/0.6)]">
      <PanelHeader
        icon={<Hand size={13} className="text-[hsl(var(--warn))]" />}
        title="You have control of the browser"
        subtitle="The agent has stopped sending commands"
        actions={
          <Badge tone={pending.objectiveMet ? 'ok' : 'warn'}>
            {pending.objectiveMet ? 'Objective met' : 'Waiting on you'}
          </Badge>
        }
      />
      <div className="space-y-2.5 p-3">
        <p className="text-xs" data-selectable>
          {pending.reason}
        </p>

        <ul className="space-y-1">
          {pending.instructions.map((instruction, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{instruction}</span>
            </li>
          ))}
        </ul>

        <div className="rounded border border-dashed border-border px-2 py-1.5 text-2xs text-muted-foreground">
          <strong>Detected when:</strong> {pending.doneWhen.description}
          <br />
          <strong>Currently:</strong>{' '}
          {pending.objectiveMet
            ? 'the page reports this is done — you can hand control back.'
            : 'not yet satisfied. You can still hand control back early.'}
        </div>

        <div className="border-t border-border pt-2.5">
          <Button
            variant={pending.objectiveMet ? 'primary' : 'outline'}
            onClick={() => void runner.returnControl()}
          >
            Return control to the agent
          </Button>
          <p className="mt-1.5 text-2xs text-muted-foreground">
            The agent re-reads the live page before it does anything else, so it will not overwrite
            what you just entered.
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------- wait for page state -------------------------- */

function WaitCard({ pending }: { pending: Extract<PendingAction, { kind: 'wait-for-user-state' }> }) {
  return (
    <Panel>
      <PanelHeader
        icon={<Timer size={13} />}
        title="Waiting on the page"
        subtitle={pending.message}
        actions={<Badge tone={pending.satisfied ? 'ok' : 'info'}>{pending.satisfied ? 'Satisfied' : 'Watching'}</Badge>}
      />
      <div className="p-3 text-2xs text-muted-foreground">
        The agent is not polling on a timer. It is subscribed to the page's own state
        notifications and will continue the moment this condition holds:{' '}
        <strong>{pending.condition.description}</strong>
      </div>
    </Panel>
  );
}

/* ----------------------------- final approval ---------------------------- */

function FinalApproval({ summary, runner }: { summary: string[]; runner: ScenarioRunner }) {
  return (
    <Panel className="border-[hsl(var(--primary)/0.6)]">
      <PanelHeader
        icon={<Lock size={13} />}
        title="Final submission approval"
        subtitle="Locked mandatory stop — the agent cannot submit without you"
      />
      <div className="space-y-2.5 p-3">
        <ul className="space-y-1">
          {summary.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              <CheckCircle2 size={12} className="mt-[2px] shrink-0 text-[hsl(var(--ok))]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="rounded border border-dashed border-[hsl(var(--ai)/0.5)] bg-ai/10 px-2 py-1.5 text-2xs text-muted-foreground">
          Submitting posts to the bundled mock ATS page only. No network request leaves this
          machine and no real employer receives anything.
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <Button variant="primary" onClick={() => runner.approve()}>
            <CheckCircle2 size={13} />
            Approve and submit
          </Button>
          <Button variant="outline" onClick={() => runner.reject()}>
            Not yet — hold this application
          </Button>
        </div>
      </div>
    </Panel>
  );
}
