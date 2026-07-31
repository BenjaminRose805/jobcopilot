import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Inbox,
  Lightbulb,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Send,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Badge, Button, EmptyState, Panel, PanelHeader, SimulatedNotice } from '@ui';
import { daysAgo, formatDate, formatDateTime } from '@shared/common';
import { RECOMMENDATION_LABEL } from '@job-model';
import { computeFunnel } from '@scoring';
import { Screen } from '../../components/Screen';
import { useNav, type NavParams, type ScreenId } from '../../renderer/nav';
import { useStore } from '../../renderer/store';

/** A single thing the user could do next. Every card on this screen is one of these. */
interface ActionItem {
  id: string;
  primary: string;
  secondary: string;
  meta?: string;
  cta: string;
  screen: ScreenId;
  params?: NavParams;
  urgent?: boolean;
}

interface ActionGroup {
  id: string;
  title: string;
  hint: string;
  icon: React.ReactNode;
  tone: 'urgent' | 'normal';
  items: ActionItem[];
}

export function CommandCenter() {
  const { state } = useStore();
  const { go } = useNav();

  const groups = React.useMemo<ActionGroup[]>(() => {
    const job = (id: string) => state.jobs.find((j) => j.id === id);
    const jobLabel = (id: string) => {
      const j = job(id);
      return j ? `${j.title} — ${j.company}` : id;
    };

    const newJobs = state.jobs
      .filter(
        (j) =>
          daysAgo(j.discoveredAt) <= 2 &&
          !state.shortlistedJobIds.includes(j.id) &&
          !state.rejectedJobIds.includes(j.id) &&
          j.recommendation !== 'do-not-apply',
      )
      .slice(0, 5);

    const waitingForUser = state.applications.filter((a) => a.status === 'waiting-for-user');
    const awaitingApproval = state.applications.filter((a) => a.status === 'awaiting-approval');
    const outreachReady = state.outreach.filter((c) => c.approvalState === 'approved');
    const unhandledResponses = state.recruiterResponses.filter((r) => !r.handled);
    const upcoming = [...state.interviews].sort((a, b) => a.at.localeCompare(b.at));

    const followUps = state.applications
      .filter((a) => a.nextFollowUp && daysAgo(a.nextFollowUp) >= 0)
      .sort((a, b) => (a.nextFollowUp ?? '').localeCompare(b.nextFollowUp ?? ''));

    const expiring = state.jobs
      .filter((j) => j.deadline && state.shortlistedJobIds.includes(j.id))
      .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
      .slice(0, 4);

    const strategyInsights = state.analytics.insights
      .filter((i) => i.suggestedAction)
      .slice(0, 3);

    const all: ActionGroup[] = [
      {
        id: 'waiting',
        title: 'Browser sessions waiting on you',
        hint: 'The agent stopped and is holding. Nothing advances until you act.',
        icon: <PauseCircle size={13} />,
        tone: 'urgent',
        items: waitingForUser.map((a) => ({
          id: a.id,
          primary: jobLabel(a.jobId),
          secondary:
            a.timeline.filter((e) => e.status === 'action-required').at(-1)?.title ??
            'Handed control back to you',
          meta: `Paused ${formatDateTime(a.updatedAt)}`,
          cta: 'Take over',
          screen: 'workspace' as ScreenId,
          params: { applicationId: a.id },
          urgent: true,
        })),
      },
      {
        id: 'approvals',
        title: 'Packages ready for your approval',
        hint: 'Resume, answers and evidence are prepared. Submission is gated on you.',
        icon: <CheckCircle2 size={13} />,
        tone: 'urgent',
        items: awaitingApproval.map((a) => ({
          id: a.id,
          primary: jobLabel(a.jobId),
          secondary: `${a.screeningAnswers.length} screening answers · ${a.defects.length} flagged issue${a.defects.length === 1 ? '' : 's'}`,
          meta: `Prepared ${formatDateTime(a.updatedAt)}`,
          cta: 'Review package',
          screen: 'workspace' as ScreenId,
          params: { applicationId: a.id },
          urgent: true,
        })),
      },
      {
        id: 'responses',
        title: 'Recruiter responses',
        hint: 'A human replied. These decay fast.',
        icon: <Inbox size={13} />,
        tone: 'urgent',
        items: unhandledResponses.map((r) => ({
          id: r.id,
          primary: r.subject,
          secondary: `${r.from} · ${r.sentiment}`,
          meta: formatDateTime(r.at),
          cta: 'Open application',
          screen: 'applications' as ScreenId,
          params: { applicationId: r.applicationId },
          urgent: true,
        })),
      },
      {
        id: 'interviews',
        title: 'Upcoming interviews',
        hint: 'The only outcome the north-star metric counts.',
        icon: <CalendarClock size={13} />,
        tone: 'normal',
        items: upcoming.map((i) => ({
          id: i.id,
          primary: `${i.stage} — ${i.company}`,
          secondary: `${i.role} · with ${i.interviewer}`,
          meta: `${formatDateTime(i.at)} · ${i.prepNotes.length} prep notes`,
          cta: 'Open application',
          screen: 'applications' as ScreenId,
          params: { applicationId: i.applicationId },
        })),
      },
      {
        id: 'new-jobs',
        title: 'New jobs to review',
        hint: 'Discovered in the last 48 hours and not yet triaged by you.',
        icon: <Sparkles size={13} />,
        tone: 'normal',
        items: newJobs.map((j) => ({
          id: j.id,
          primary: `${j.title} — ${j.company}`,
          secondary: `Fit ${j.fitScore.value} · Direction ${j.careerDirectionScore.value} · Quality ${j.opportunityQualityScore.value}`,
          meta: `${RECOMMENDATION_LABEL[j.recommendation]} · posted ${formatDate(j.postedAt)}`,
          cta: 'Review',
          screen: 'job-discovery' as ScreenId,
          params: { jobId: j.id },
        })),
      },
      {
        id: 'outreach',
        title: 'Outreach drafts ready to send',
        hint: 'Approved by you. This app hands them back — it never sends them.',
        icon: <Send size={13} />,
        tone: 'normal',
        items: outreachReady.map((c) => ({
          id: c.id,
          primary: `${c.name} — ${c.company}`,
          secondary: `${c.title} · ${c.personalization.length} grounded personalization points`,
          meta: `You send this yourself · updated ${formatDate(c.lastUpdated)}`,
          cta: 'Open draft',
          screen: 'outreach' as ScreenId,
          params: { contactId: c.id },
        })),
      },
      {
        id: 'follow-ups',
        title: 'Follow-ups due',
        hint: 'Reminders only. Nothing is sent on your behalf.',
        icon: <Timer size={13} />,
        tone: 'normal',
        items: followUps.map((a) => ({
          id: a.id,
          primary: jobLabel(a.jobId),
          secondary: 'Follow-up reminder',
          meta: a.nextFollowUp ? `Due ${formatDate(a.nextFollowUp)}` : undefined,
          cta: 'Open application',
          screen: 'applications' as ScreenId,
          params: { applicationId: a.id },
        })),
      },
      {
        id: 'expiring',
        title: 'Shortlisted jobs expiring soon',
        hint: 'Deadlines on postings you said you cared about.',
        icon: <Clock size={13} />,
        tone: 'normal',
        items: expiring.map((j) => ({
          id: j.id,
          primary: `${j.title} — ${j.company}`,
          secondary: 'Shortlisted, not yet applied',
          meta: j.deadline ? `Closes ${formatDate(j.deadline)}` : undefined,
          cta: 'Open job',
          screen: 'job-discovery' as ScreenId,
          params: { jobId: j.id },
        })),
      },
      {
        id: 'strategy',
        title: 'Strategy recommendations',
        hint: 'Written from your own simulated funnel, not from generic advice.',
        icon: <Lightbulb size={13} />,
        tone: 'normal',
        items: strategyInsights.map((i) => ({
          id: i.id,
          primary: i.title,
          secondary: i.suggestedAction ?? i.body,
          meta: `${i.confidence} confidence · written ${formatDate(i.createdAt)}`,
          cta: 'See analytics',
          screen: 'analytics' as ScreenId,
        })),
      },
    ];
    return all.filter((g) => g.items.length > 0);
  }, [state]);

  const headline = React.useMemo(() => {
    // Reuses the same funnel computation the Analytics screen renders, so the
    // two screens can never disagree about how many jobs were recommended.
    const discoveredToday = state.jobs.filter((j) => daysAgo(j.discoveredAt) <= 1).length;
    const funnel = computeFunnel(state.jobs, state.applications, discoveredToday);
    return [
      { label: 'Discovered today', value: funnel.discovered, screen: 'job-discovery' as ScreenId },
      { label: 'Recommended', value: funnel.recommended, screen: 'job-discovery' as ScreenId },
      {
        label: 'Packages ready',
        value: state.applications.filter((a) => a.status === 'awaiting-approval').length,
        screen: 'applications' as ScreenId,
        emphasis: true,
      },
      {
        label: 'Waiting for you',
        value: state.applications.filter((a) => a.status === 'waiting-for-user').length,
        screen: 'applications' as ScreenId,
        emphasis: true,
      },
      {
        label: 'Outreach ready',
        value: state.outreach.filter((c) => c.approvalState === 'approved').length,
        screen: 'outreach' as ScreenId,
      },
      {
        label: 'Recruiter responses',
        value: state.recruiterResponses.filter((r) => !r.handled).length,
        screen: 'applications' as ScreenId,
      },
      {
        label: 'Interviews scheduled',
        value: state.interviews.length,
        screen: 'applications' as ScreenId,
      },
    ];
  }, [state]);

  const resume = React.useMemo(() => {
    const id = state.ui.lastApplicationId;
    const app = id ? state.applications.find((a) => a.id === id) : undefined;
    return app ?? state.applications.find((a) => a.status === 'waiting-for-user');
  }, [state.ui.lastApplicationId, state.applications]);

  const resumeJob = resume ? state.jobs.find((j) => j.id === resume.jobId) : undefined;
  const totalActions = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Screen
      title={`Good to see you, ${state.profile.name.split(' ')[0]}`}
      description="Everything below is a decision only you can make. The agent has already done the parts that do not need you."
      actions={
        <Badge tone={totalActions ? 'accent' : 'ok'}>
          {totalActions ? `${totalActions} things need you` : 'Nothing needs you'}
        </Badge>
      }
    >
      <div className="space-y-3">
        <SimulatedNotice>
          Simulated workspace. Discovery, research, form filling and submission all run against
          bundled mock pages — no real job board, ATS, inbox or network is contacted.
        </SimulatedNotice>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-7">
          {headline.map((h) => (
            <button
              key={h.label}
              onClick={() => go(h.screen)}
              className={[
                'rounded border p-2.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                h.emphasis && h.value > 0
                  ? 'border-primary/60 bg-primary/10 hover:bg-primary/20'
                  : 'border-border bg-surface hover:bg-surface-2',
              ].join(' ')}
            >
              <div className="text-xl font-semibold tabular-nums">{h.value}</div>
              <div className="mt-0.5 text-2xs uppercase tracking-wide text-muted-foreground">
                {h.label}
              </div>
            </button>
          ))}
        </div>

        {resume ? (
          <Panel className="border-primary/50">
            <PanelHeader
              icon={<PlayCircle size={13} />}
              title="Continue where you left off"
              subtitle={
                resumeJob ? `${resumeJob.title} — ${resumeJob.company}` : resume.jobId
              }
              actions={
                <Button variant="primary" onClick={() => go('workspace', { applicationId: resume.id })}>
                  Open workspace
                  <ArrowRight size={13} />
                </Button>
              }
            />
            <div className="flex flex-wrap items-center gap-3 p-3 text-2xs text-muted-foreground">
              <span>Status: {resume.status}</span>
              <span>·</span>
              <span>{resume.timeline.length} timeline events</span>
              <span>·</span>
              <span>{resume.userMinutesSpent} minutes of your attention so far</span>
              <span>·</span>
              <button
                className="underline-offset-2 hover:underline"
                onClick={() => go('applications', { applicationId: resume.id })}
              >
                Open in CRM instead
              </button>
            </div>
          </Panel>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            title="Nothing is waiting on you"
            hint="New discoveries and prepared packages will appear here."
            icon={<CheckCircle2 size={22} />}
          />
        ) : (
          <div className="grid gap-3 2xl:grid-cols-2">
            {groups.map((group) => (
              <Panel
                key={group.id}
                className={group.tone === 'urgent' ? 'border-primary/50' : undefined}
              >
                <PanelHeader
                  icon={group.icon}
                  title={group.title}
                  subtitle={group.hint}
                  actions={
                    <Badge tone={group.tone === 'urgent' ? 'accent' : 'muted'}>
                      {group.items.length}
                    </Badge>
                  }
                />
                <div className="divide-y divide-border">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{item.primary}</div>
                        <div className="text-2xs text-muted-foreground">{item.secondary}</div>
                        {item.meta ? (
                          <div className="mt-0.5 text-2xs text-muted-foreground">{item.meta}</div>
                        ) : null}
                      </div>
                      <Button
                        variant={item.urgent ? 'primary' : 'outline'}
                        onClick={() => go(item.screen, item.params)}
                      >
                        {item.cta}
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        )}

        <Panel>
          <PanelHeader
            icon={<MessageSquare size={13} />}
            title="What this screen is not"
            subtitle="A deliberate omission"
          />
          <p className="p-3 text-xs text-muted-foreground">
            There is no applications-sent counter and no activity graph here. Volume is not the
            goal — the metric this product optimises is qualified interviews per hour of your
            attention, and a dashboard that celebrates throughput would quietly push you the other
            way. Throughput numbers live on the Analytics screen, next to the denominator that makes
            them meaningful.
          </p>
        </Panel>
      </div>
    </Screen>
  );
}
