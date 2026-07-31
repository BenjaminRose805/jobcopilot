/** Primitive vocabulary shared by every layer of the app. */

export type ISODate = string;

/** How much the system trusts a piece of generated or retrieved content. */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unsupported';

export const CONFIDENCE_ORDER: Record<ConfidenceLevel, number> = {
  unsupported: 0,
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Provenance of a fact or an answer. The UI must never render `ai-inferred`
 * content with the same affordance as `user-verified` content.
 */
export type VerificationStatus =
  | 'user-verified'
  | 'imported'
  | 'ai-inferred'
  | 'needs-confirmation'
  | 'conflicting'
  | 'archived';

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  'user-verified': 'User verified',
  imported: 'Imported',
  'ai-inferred': 'AI inferred',
  'needs-confirmation': 'Needs confirmation',
  conflicting: 'Conflicting',
  archived: 'Archived',
};

/** Who is currently allowed to drive the embedded browser. */
export type ControlOwner = 'agent' | 'user' | 'waiting-for-approval';

/** Global automation state surfaced in the top bar at all times. */
export type AutomationMode =
  | 'manual'
  | 'assisted'
  | 'agent-running'
  | 'waiting-for-approval'
  | 'human-takeover'
  | 'paused'
  | 'completed';

export const AUTOMATION_MODE_LABEL: Record<AutomationMode, string> = {
  manual: 'Manual',
  assisted: 'Assisted',
  'agent-running': 'Agent running',
  'waiting-for-approval': 'Waiting for approval',
  'human-takeover': 'Human takeover',
  paused: 'Paused',
  completed: 'Completed',
};

export type RemoteStatus = 'remote' | 'hybrid' | 'onsite';

export type Seniority = 'mid' | 'senior' | 'staff' | 'principal' | 'lead' | 'manager';

export type CompanySize = 'startup' | 'scaleup' | 'midmarket' | 'enterprise';

export interface Money {
  min: number;
  max: number;
  currency: 'USD';
  /** True when the range was inferred from market data rather than published. */
  estimated: boolean;
}

export function formatMoney(m?: Money | null): string {
  if (!m) return 'Not disclosed';
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  return `${fmt(m.min)}–${fmt(m.max)}${m.estimated ? ' (est.)' : ''}`;
}

export function daysAgo(iso: ISODate, now: Date = new Date()): number {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.round((now.getTime() - then) / 86_400_000));
}

export function formatAge(iso: ISODate, now?: Date): string {
  const d = daysAgo(iso, now);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  const months = Math.round(d / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function formatDateTime(iso: ISODate): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: ISODate): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
