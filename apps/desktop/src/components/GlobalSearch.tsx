import React from 'react';
import { Briefcase, Compass, FileText, Send, Vault } from 'lucide-react';
import { Input, Modal } from '@ui';
import { CAREER_FACT_CATEGORY_LABEL } from '@career-model';
import { APPLICATION_STATUS_LABEL } from '@shared/application';
import { useStore } from '../renderer/store';
import { useNav, type NavParams, type ScreenId } from '../renderer/nav';

interface Hit {
  id: string;
  kind: 'Job' | 'Application' | 'Vault fact' | 'Resume strategy' | 'Contact';
  title: string;
  subtitle: string;
  screen: ScreenId;
  params: NavParams;
}

const KIND_ICON = {
  Job: Compass,
  Application: Briefcase,
  'Vault fact': Vault,
  'Resume strategy': FileText,
  Contact: Send,
} as const;

export function GlobalSearch({ open, onClose }: { open: boolean; onClose(): void }) {
  const { state } = useStore();
  const { go } = useNav();
  const [query, setQuery] = React.useState('');
  const [cursor, setCursor] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const hits = React.useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Hit[] = [];
    const match = (...parts: (string | undefined)[]) =>
      parts.some((p) => p?.toLowerCase().includes(q));

    for (const job of state.jobs) {
      if (match(job.title, job.company, job.location, ...job.tags)) {
        out.push({
          id: job.id,
          kind: 'Job',
          title: `${job.title} — ${job.company}`,
          subtitle: `${job.location} · ${job.tags.slice(0, 3).join(', ')}`,
          screen: 'job-discovery',
          params: { jobId: job.id },
        });
      }
    }
    for (const app of state.applications) {
      const job = state.jobs.find((j) => j.id === app.jobId);
      if (match(job?.title, job?.company, app.outcome)) {
        out.push({
          id: app.id,
          kind: 'Application',
          title: `${job?.title ?? app.jobId} — ${job?.company ?? ''}`,
          subtitle: APPLICATION_STATUS_LABEL[app.status],
          screen: 'applications',
          params: { applicationId: app.id },
        });
      }
    }
    for (const fact of state.facts) {
      if (match(fact.title, fact.description, fact.context, ...fact.tags)) {
        out.push({
          id: fact.id,
          kind: 'Vault fact',
          title: fact.title,
          subtitle: `${CAREER_FACT_CATEGORY_LABEL[fact.category]} · ${fact.context ?? 'No context'}`,
          screen: 'career-vault',
          params: { factId: fact.id },
        });
      }
    }
    for (const strategy of state.strategies) {
      if (match(strategy.name, strategy.positioning)) {
        out.push({
          id: strategy.id,
          kind: 'Resume strategy',
          title: strategy.name,
          subtitle: strategy.positioning,
          screen: 'resume-studio',
          params: { strategyId: strategy.id },
        });
      }
    }
    for (const contact of state.outreach) {
      if (match(contact.name, contact.title, contact.company)) {
        out.push({
          id: contact.id,
          kind: 'Contact',
          title: contact.name,
          subtitle: `${contact.title} · ${contact.company}`,
          screen: 'outreach',
          params: { contactId: contact.id },
        });
      }
    }
    return out.slice(0, 40);
  }, [query, state]);

  const choose = React.useCallback(
    (hit: Hit) => {
      go(hit.screen, hit.params);
      onClose();
    },
    [go, onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && hits[cursor]) {
      e.preventDefault();
      choose(hits[cursor]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Search" width={720}>
      <Input
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setCursor(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search jobs, applications, vault facts, resume strategies and contacts…"
        aria-label="Search"
      />
      <div className="mt-2 max-h-80 overflow-auto">
        {query.trim().length < 2 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            Type at least two characters. Results come only from the local demo fixture.
          </p>
        ) : hits.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">No matches.</p>
        ) : (
          hits.map((hit, i) => {
            const Icon = KIND_ICON[hit.kind];
            return (
              <button
                key={`${hit.kind}-${hit.id}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(hit)}
                className={[
                  'flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left',
                  i === cursor ? 'bg-surface-2' : '',
                ].join(' ')}
              >
                <Icon size={14} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{hit.title}</span>
                  <span className="block truncate text-2xs text-muted-foreground">
                    {hit.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
                  {hit.kind}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
