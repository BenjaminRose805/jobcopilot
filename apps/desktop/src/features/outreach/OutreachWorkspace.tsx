import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  ShieldOff,
  Users,
} from 'lucide-react';
import {
  AiSuggestedBadge,
  Badge,
  Button,
  ConfidenceChip,
  EmptyState,
  Expandable,
  Panel,
  PanelHeader,
  Select,
  Textarea,
} from '@ui';
import {
  CONTACT_ROLE_LABEL,
  OUTREACH_APPROVAL_LABEL,
  OUTREACH_CHANNEL_LABEL,
  OUTREACH_GOAL_LABEL,
  type OutreachApprovalState,
  type OutreachContact,
} from '@shared/outreach';
import { formatDate, formatDateTime } from '@shared/common';
import { Screen, KeyValue } from '../../components/Screen';
import { useNav } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

const APPROVAL_TONE = {
  draft: 'muted',
  'needs-review': 'warn',
  approved: 'ok',
  'sent-manually': 'info',
  declined: 'danger',
} as const;

/**
 * Outreach is draft-only by construction. There is no send path in this app:
 * network-channel messages are copied to the clipboard for the user to paste
 * themselves, and email drafts stop at approval.
 */
export function OutreachWorkspace() {
  const { state, update } = useStore();
  const { params, go } = useNav();

  const [selectedId, setSelectedId] = React.useState<string | undefined>(params.contactId);
  const [filter, setFilter] = React.useState<'all' | OutreachApprovalState>('all');

  React.useEffect(() => {
    if (params.contactId) setSelectedId(params.contactId);
  }, [params.contactId]);

  // A jobId deep-link (from Job Discovery or the CRM) selects that job's first contact.
  React.useEffect(() => {
    if (!params.jobId) return;
    const first = state.outreach.find((c) => c.jobId === params.jobId);
    if (first) setSelectedId(first.id);
  }, [params.jobId, state.outreach]);

  const contacts = React.useMemo(
    () => (filter === 'all' ? state.outreach : state.outreach.filter((c) => c.approvalState === filter)),
    [state.outreach, filter],
  );

  const byJob = React.useMemo(() => {
    const map = new Map<string, OutreachContact[]>();
    for (const contact of contacts) {
      const list = map.get(contact.jobId);
      if (list) list.push(contact);
      else map.set(contact.jobId, [contact]);
    }
    return [...map.entries()];
  }, [contacts]);

  const selected = state.outreach.find((c) => c.id === selectedId) ?? contacts[0];

  const setContact = React.useCallback(
    (contactId: string, patch: Partial<OutreachContact>) => {
      update((s) => ({
        ...s,
        outreach: s.outreach.map((c) =>
          c.id === contactId ? { ...c, ...patch, lastUpdated: new Date().toISOString() } : c,
        ),
      }));
    },
    [update],
  );

  const readyCount = state.outreach.filter((c) => c.approvalState === 'approved').length;

  return (
    <Screen
      title="Outreach"
      description="Researched contacts and grounded drafts. Nothing here can send a message — approved drafts are handed back to you to send yourself."
      padded={false}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="ai">
            <ShieldOff size={10} />
            No send capability
          </Badge>
          <Select
            className="h-7 w-52 text-2xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            aria-label="Filter by approval state"
          >
            <option value="all">All contacts ({state.outreach.length})</option>
            <option value="draft">Drafts</option>
            <option value="needs-review">Needs review</option>
            <option value="approved">Approved ({readyCount})</option>
            <option value="sent-manually">Marked sent</option>
            <option value="declined">Declined</option>
          </Select>
        </div>
      }
      bodyClassName="flex"
    >
      <div className="scrollable w-[340px] shrink-0 border-r border-border">
        {byJob.length === 0 ? (
          <EmptyState title="No contacts match" hint="Change the filter." icon={<Users size={22} />} />
        ) : (
          byJob.map(([jobId, list]) => {
            const job = state.jobs.find((j) => j.id === jobId);
            return (
              <div key={jobId}>
                <div className="sticky top-0 z-[5] border-y border-border bg-surface px-3 py-1.5">
                  <div className="truncate text-2xs font-medium">{job?.title ?? jobId}</div>
                  <div className="truncate text-2xs text-muted-foreground">{job?.company}</div>
                </div>
                {list.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedId(contact.id)}
                    className={[
                      'block w-full border-b border-border px-3 py-2 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      selected?.id === contact.id ? 'bg-primary/10' : 'hover:bg-surface-2',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {contact.name}
                      </span>
                      <Badge tone={APPROVAL_TONE[contact.approvalState]}>
                        {contact.approvalState === 'approved' ? 'Ready' : contact.approvalState}
                      </Badge>
                    </div>
                    <div className="truncate text-2xs text-muted-foreground">{contact.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone="muted">{CONTACT_ROLE_LABEL[contact.role]}</Badge>
                      {contact.response ? <Badge tone="ok">Replied</Badge> : null}
                    </div>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="scrollable min-w-0 flex-1">
        {selected ? (
          <ContactDetail
            contact={selected}
            onChange={(patch) => setContact(selected.id, patch)}
            onOpenJob={() => go('job-discovery', { jobId: selected.jobId })}
          />
        ) : (
          <EmptyState
            title="Select a contact"
            hint="Drafts, personalization evidence and the manual-send handoff appear here."
            icon={<Send size={22} />}
          />
        )}
      </div>
    </Screen>
  );
}

/* -------------------------------- detail --------------------------------- */

function ContactDetail({
  contact,
  onChange,
  onOpenJob,
}: {
  contact: OutreachContact;
  onChange(patch: Partial<OutreachContact>): void;
  onOpenJob(): void;
}) {
  const { state } = useStore();
  const job = state.jobs.find((j) => j.id === contact.jobId);
  const [draft, setDraft] = React.useState(contact.draftMessage);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => setDraft(contact.draftMessage), [contact.id, contact.draftMessage]);

  const edited = draft.trim() !== contact.draftMessage.trim();
  const isNetwork = contact.recommendedChannel === 'linkedin';
  const isEmail = contact.recommendedChannel === 'email';
  const approved = contact.approvalState === 'approved' || contact.approvalState === 'sent-manually';

  const copy = () => {
    void navigator.clipboard?.writeText(draft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-3 p-3">
      <Panel>
        <PanelHeader
          title={contact.name}
          subtitle={`${contact.title} · ${contact.company}`}
          actions={
            <div className="flex items-center gap-1.5">
              <ConfidenceChip level={contact.confidence} compact />
              <Badge tone={APPROVAL_TONE[contact.approvalState]}>
                {OUTREACH_APPROVAL_LABEL[contact.approvalState]}
              </Badge>
            </div>
          }
        />
        <div className="space-y-2 p-3">
          <KeyValue
            rows={[
              { label: 'Role', value: CONTACT_ROLE_LABEL[contact.role] },
              {
                label: 'Target job',
                value: (
                  <button className="text-left underline-offset-2 hover:underline" onClick={onOpenJob}>
                    {job ? `${job.title} — ${job.company}` : contact.jobId}
                  </button>
                ),
              },
              { label: 'Why relevant', value: contact.whyRelevant },
              { label: 'How they were found', value: contact.contactSource },
              { label: 'Channel', value: OUTREACH_CHANNEL_LABEL[contact.recommendedChannel] },
              { label: 'Goal', value: OUTREACH_GOAL_LABEL[contact.goal] },
              {
                label: 'Follow-up',
                value: contact.followUpDate ? formatDate(contact.followUpDate) : 'None set',
              },
              { label: 'Updated', value: formatDate(contact.lastUpdated) },
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon={<MessageSquare size={13} />}
          title="Draft message"
          subtitle="Every sentence has to justify itself below"
          actions={<AiSuggestedBadge label={edited ? 'Edited by you' : 'AI drafted'} />}
        />
        <div className="space-y-2.5 p-3">
          <Textarea
            rows={10}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Draft message"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="ok"
              disabled={!draft.trim()}
              onClick={() =>
                onChange({ draftMessage: draft, approvalState: 'approved' })
              }
            >
              <CheckCircle2 size={13} />
              {edited ? 'Save and approve' : 'Approve draft'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onChange({ draftMessage: draft, approvalState: 'needs-review' })}
            >
              Save as needs review
            </Button>
            <Button variant="ghost" onClick={() => onChange({ approvalState: 'declined' })}>
              Decline this contact
            </Button>
            {edited ? (
              <Button variant="ghost" onClick={() => setDraft(contact.draftMessage)}>
                Revert my edits
              </Button>
            ) : null}
          </div>
        </div>
      </Panel>

      {/* The manual-send handoff. This is the only "send" affordance in the app. */}
      <Panel className={approved ? 'border-[hsl(var(--ok)/0.5)]' : undefined}>
        <PanelHeader
          icon={isEmail ? <Mail size={13} /> : <ExternalLink size={13} />}
          title="How this gets sent"
          subtitle="By you, in your own client — never by this app"
        />
        <div className="space-y-2.5 p-3">
          {isNetwork ? (
            <>
              <p className="text-xs">
                This is a professional-network message. JobCopilot has no automation against any
                network: approving a draft copies it to your clipboard and opens the profile so you
                can paste and send it yourself, having read it first.
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="primary" disabled={!approved} onClick={copy}>
                  <Copy size={13} />
                  {copied ? 'Copied to clipboard' : 'Open profile and copy approved message'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={contact.approvalState === 'sent-manually'}
                  onClick={() => onChange({ approvalState: 'sent-manually' })}
                >
                  I sent it — mark as sent
                </Button>
              </div>
              {contact.profileUrl ? (
                <p className="text-2xs text-muted-foreground">
                  Simulated profile:{' '}
                  <code className="font-mono" data-selectable>
                    {contact.profileUrl}
                  </code>{' '}
                  — a bundled mock page, not a real profile.
                </p>
              ) : null}
              {!approved ? (
                <p className="text-2xs text-muted-foreground">
                  Approve the draft first. The copy action is deliberately gated on you having read
                  it.
                </p>
              ) : null}
            </>
          ) : isEmail ? (
            <>
              <p className="text-xs">
                Email stops at approval. There is no SMTP client, no mail API and no queued send in
                this build — the approved text is yours to paste into your own mail client.
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="primary" disabled={!approved} onClick={copy}>
                  <Copy size={13} />
                  {copied ? 'Copied' : 'Copy approved email body'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={contact.approvalState === 'sent-manually'}
                  onClick={() => onChange({ approvalState: 'sent-manually' })}
                >
                  I sent it — mark as sent
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs">
                {OUTREACH_CHANNEL_LABEL[contact.recommendedChannel]} — an in-person or portal
                channel. The draft is talking points for you, not a message this app can transmit.
              </p>
              <Button variant="outline" disabled={!approved} onClick={copy}>
                <Copy size={13} />
                {copied ? 'Copied' : 'Copy talking points'}
              </Button>
            </>
          )}

          <div className="flex items-start gap-2 rounded border border-dashed border-[hsl(var(--ai)/0.5)] bg-[hsl(var(--ai)/0.07)] px-2 py-1.5 text-2xs text-muted-foreground">
            <AlertTriangle size={12} className="mt-[1px] shrink-0 text-[hsl(var(--ai))]" />
            <span>
              Simulated outreach. No message is transmitted anywhere by this application under any
              setting, including the most permissive autonomy preset.
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Why each sentence is here (${contact.personalization.length})`}
          subtitle="Generic filler is a defect — every line traces to research or the vault"
        />
        <div className="divide-y divide-border">
          {contact.personalization.map((p, i) => (
            <div key={i} className="space-y-1 px-3 py-2">
              <p className="text-xs italic" data-selectable>
                “{p.sentence}”
              </p>
              <p className="text-2xs text-muted-foreground" data-selectable>
                {p.basis}
              </p>
              <div className="flex items-center gap-1.5">
                <Badge tone="info">{p.sourceLabel}</Badge>
                <ConfidenceChip level={p.confidence} compact />
              </div>
            </div>
          ))}
          {contact.personalization.length === 0 ? (
            <p className="px-3 py-3 text-2xs text-muted-foreground">
              No personalization recorded — this draft would be rejected as generic.
            </p>
          ) : null}
        </div>
      </Panel>

      {contact.response ? (
        <Panel>
          <PanelHeader
            icon={<Mail size={13} />}
            title="They replied"
            subtitle={formatDateTime(contact.response.at)}
            actions={
              <Badge
                tone={
                  contact.response.sentiment === 'positive'
                    ? 'ok'
                    : contact.response.sentiment === 'negative'
                      ? 'danger'
                      : 'muted'
                }
              >
                {contact.response.sentiment}
              </Badge>
            }
          />
          <p className="whitespace-pre-line p-3 text-xs" data-selectable>
            {contact.response.body}
          </p>
        </Panel>
      ) : null}

      {contact.followUpDate ? (
        <Expandable
          summary={
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <CalendarClock size={12} />
              Follow-up scheduled for {formatDate(contact.followUpDate)}
            </span>
          }
        >
          <p className="text-2xs text-muted-foreground">
            A reminder only. The app will surface it in the Command Center — it will not follow up
            on your behalf.
          </p>
        </Expandable>
      ) : null}
    </div>
  );
}
