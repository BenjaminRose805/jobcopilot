import React from 'react';
import {
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Hand,
  Info,
  Monitor,
  Settings,
} from 'lucide-react';
import { ConfidenceChip } from '@ui';
import { TIMELINE_KIND_LABEL, type TimelineEvent, type TimelineStatus } from '@shared/timeline';
import { formatDateTime } from '@shared/common';
import { EvidenceLinks } from './Evidence';

const STATUS_STYLE: Record<TimelineStatus, { dot: string; text: string; Icon: typeof Info }> = {
  ok: { dot: 'bg-ok', text: 'text-foreground', Icon: CheckCircle2 },
  info: { dot: 'bg-info', text: 'text-foreground', Icon: Info },
  warning: { dot: 'bg-warn', text: 'text-[hsl(var(--warn))]', Icon: AlertTriangle },
  blocked: { dot: 'bg-danger', text: 'text-[hsl(var(--danger))]', Icon: Ban },
  'action-required': { dot: 'bg-warn', text: 'text-[hsl(var(--warn))]', Icon: Hand },
};

const SOURCE_ICON = {
  agent: Bot,
  user: Hand,
  system: Settings,
  page: Monitor,
} as const;

/**
 * The audit trail. Every agent and user action in a run produces exactly one
 * row here, and each row can be expanded to show the reasoning and the vault
 * facts it depended on.
 */
export function Timeline({
  events,
  emptyHint,
  autoScroll,
  filter,
}: {
  events: TimelineEvent[];
  emptyHint?: string;
  autoScroll?: boolean;
  filter?: 'all' | 'decisions' | 'user';
}) {
  const endRef = React.useRef<HTMLDivElement>(null);

  const visible = React.useMemo(() => {
    if (!filter || filter === 'all') return events;
    if (filter === 'user') return events.filter((e) => e.source === 'user');
    return events.filter(
      (e) =>
        e.status === 'action-required' ||
        e.status === 'blocked' ||
        e.status === 'warning' ||
        e.kind === 'answer-retrieved' ||
        e.kind === 'submission-approved' ||
        e.kind === 'crm-updated',
    );
  }, [events, filter]);

  React.useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ block: 'end' });
  }, [visible.length, autoScroll]);

  if (visible.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
        {emptyHint ?? 'Nothing recorded yet.'}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 px-3 py-2">
      {visible.map((event) => (
        <TimelineRow key={event.id} event={event} />
      ))}
      <div ref={endRef} />
    </ol>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const [open, setOpen] = React.useState(false);
  const style = STATUS_STYLE[event.status];
  const SourceIcon = SOURCE_ICON[event.source];

  return (
    <li className="relative flex gap-2.5 pb-2">
      <div className="flex flex-col items-center">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => event.expandable && setOpen((o) => !o)}
          aria-expanded={event.expandable ? open : undefined}
          className={[
            'flex w-full items-start gap-1.5 rounded text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            event.expandable ? 'cursor-pointer' : 'cursor-default',
          ].join(' ')}
        >
          {event.expandable ? (
            <ChevronRight
              size={12}
              className={`mt-[3px] shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
            />
          ) : (
            <CircleDot size={12} className="mt-[3px] shrink-0 text-muted-foreground/40" />
          )}
          <span className="min-w-0 flex-1">
            <span className={`block text-xs font-medium ${style.text}`}>{event.title}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground">
              <SourceIcon size={10} />
              <span className="capitalize">{event.source}</span>
              <span>·</span>
              <span>{TIMELINE_KIND_LABEL[event.kind]}</span>
              <span>·</span>
              <time dateTime={event.timestamp}>{formatDateTime(event.timestamp)}</time>
            </span>
          </span>
          {event.confidence ? <ConfidenceChip level={event.confidence} compact /> : null}
        </button>

        {open ? (
          <div className="mt-1.5 space-y-2 rounded border border-border bg-surface-2/50 p-2">
            {event.details ? (
              <p className="whitespace-pre-line text-xs text-muted-foreground" data-selectable>
                {event.details}
              </p>
            ) : null}
            {event.meta?.length ? (
              <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-2 gap-y-0.5 text-2xs">
                {event.meta.map((m, i) => (
                  <React.Fragment key={`${m.label}-${i}`}>
                    <dt className="text-muted-foreground">{m.label}</dt>
                    <dd className="min-w-0 break-words" data-selectable>
                      {m.value}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : null}
            <EvidenceLinks factIds={event.evidenceFactIds} />
          </div>
        ) : null}
      </div>
    </li>
  );
}
