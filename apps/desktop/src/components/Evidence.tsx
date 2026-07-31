import { Link2, AlertTriangle } from 'lucide-react';
import { Badge, VerificationChip } from '@ui';
import { CAREER_FACT_CATEGORY_LABEL, FACT_SOURCE_LABEL, type CareerFact } from '@career-model';
import { useStore } from '../renderer/store';
import { useNav } from '../renderer/nav';

/**
 * Renders the evidence chain behind a generated answer, resume bullet or
 * timeline event. Every chip is a live link into the Career Vault: if an answer
 * cannot show its evidence here, the product considers it unsupported.
 */
export function EvidenceLinks({
  factIds,
  label = 'Evidence',
  compact,
}: {
  factIds: string[] | undefined;
  label?: string;
  compact?: boolean;
}) {
  const { state } = useStore();
  const { go } = useNav();
  if (!factIds || factIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!compact ? (
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</span>
      ) : null}
      {factIds.map((id) => {
        const fact = state.facts.find((f) => f.id === id);
        if (!fact) {
          return (
            <Badge key={id} tone="danger" title={`Unknown fact id ${id}`}>
              <AlertTriangle size={10} />
              {id}
            </Badge>
          );
        }
        const tone =
          fact.verification === 'user-verified'
            ? 'ok'
            : fact.verification === 'ai-inferred'
              ? 'ai'
              : fact.verification === 'conflicting'
                ? 'danger'
                : fact.verification === 'needs-confirmation'
                  ? 'warn'
                  : 'info';
        return (
          <button
            key={id}
            onClick={() => go('career-vault', { factId: id })}
            title={`${fact.title} — ${fact.description}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <Badge tone={tone} className="hover:brightness-110">
              <Link2 size={10} />
              {fact.title}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

/** Compact card used inside popovers and detail panes. */
export function FactCard({ fact, onOpen }: { fact: CareerFact; onOpen?: () => void }) {
  return (
    <div className="rounded border border-border bg-surface p-2">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpen}
          disabled={!onOpen}
          className="min-w-0 text-left text-xs font-medium hover:underline disabled:no-underline"
        >
          {fact.title}
        </button>
        <VerificationChip status={fact.verification} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground" data-selectable>
        {fact.description}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground">
        <span>{CAREER_FACT_CATEGORY_LABEL[fact.category]}</span>
        <span>·</span>
        <span>{FACT_SOURCE_LABEL[fact.source]}</span>
        {fact.context ? (
          <>
            <span>·</span>
            <span>{fact.context}</span>
          </>
        ) : null}
      </div>
      {fact.claimCeiling ? (
        <p className="mt-1.5 rounded border border-[hsl(var(--warn)/0.4)] bg-warn/10 px-1.5 py-1 text-2xs text-[hsl(var(--warn))]">
          <strong>Claim ceiling:</strong> {fact.claimCeiling}
        </p>
      ) : null}
      {fact.conflictNote ? (
        <p className="mt-1.5 rounded border border-[hsl(var(--danger)/0.4)] bg-danger/10 px-1.5 py-1 text-2xs text-[hsl(var(--danger))]">
          <strong>Conflict:</strong> {fact.conflictNote}
        </p>
      ) : null}
    </div>
  );
}
