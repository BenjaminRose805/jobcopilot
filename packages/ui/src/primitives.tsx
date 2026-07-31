import React from 'react';
import { cn } from './cn';

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn' | 'ok' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:brightness-110 border border-transparent shadow-sm',
  secondary:
    'bg-surface-2 text-foreground hover:bg-[hsl(var(--surface-2)/0.7)] border border-border',
  outline: 'bg-transparent text-foreground hover:bg-surface-2 border border-border',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent',
  danger: 'bg-danger text-danger-foreground hover:brightness-110 border border-transparent',
  warn: 'bg-warn text-warn-foreground hover:brightness-110 border border-transparent',
  ok: 'bg-ok text-ok-foreground hover:brightness-110 border border-transparent',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-2xs gap-1',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'sm', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------- Badge -------------------------------- */

export type BadgeTone =
  | 'neutral'
  | 'ok'
  | 'warn'
  | 'danger'
  | 'info'
  | 'accent'
  | 'ai'
  | 'muted';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-foreground border-border',
  muted: 'bg-transparent text-muted-foreground border-border',
  ok: 'bg-[hsl(var(--ok)/0.14)] text-[hsl(var(--ok))] border-[hsl(var(--ok)/0.35)]',
  warn: 'bg-[hsl(var(--warn)/0.14)] text-[hsl(var(--warn))] border-[hsl(var(--warn)/0.35)]',
  danger: 'bg-[hsl(var(--danger)/0.14)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.35)]',
  info: 'bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.35)]',
  accent: 'bg-[hsl(var(--accent)/0.16)] text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.4)]',
  ai: 'bg-[hsl(var(--ai)/0.14)] text-[hsl(var(--ai))] border-[hsl(var(--ai)/0.4)] border-dashed',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  title,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-[1px] text-2xs font-medium leading-4',
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Panel -------------------------------- */

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md border border-border bg-surface', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border px-3 py-2',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </div>
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground/80">{subtitle}</div>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------ Section ------------------------------- */

export function SectionTitle({
  children,
  className,
  right,
}: {
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={cn('mb-2 flex items-center justify-between gap-2', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h3>
      {right}
    </div>
  );
}

/* ------------------------------ Form bits ------------------------------ */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-8 w-full rounded border border-input bg-background px-2 text-sm text-foreground',
          'placeholder:text-muted-foreground/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground',
        'placeholder:text-muted-foreground/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-8 w-full rounded border border-input bg-background px-1.5 text-sm text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-4.5 w-8 shrink-0 rounded-full border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        checked ? 'border-primary bg-primary' : 'border-border bg-surface-2',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      style={{ height: 18, width: 32 }}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white transition-transform',
          checked ? 'translate-x-[17px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  );
}

/* ------------------------------ Expandable ----------------------------- */

export function Expandable({
  summary,
  children,
  defaultOpen = false,
  className,
  contentClassName,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-1.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            'mt-[3px] shrink-0 text-2xs text-muted-foreground transition-transform',
            open && 'rotate-90',
          )}
        >
          ▶
        </span>
        <span className="min-w-0 flex-1">{summary}</span>
      </button>
      {open ? <div className={cn('mt-1.5 pl-4', contentClassName)}>{children}</div> : null}
    </div>
  );
}

/* --------------------------------- Tabs -------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-0.5 border-b border-border', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === t.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.count !== undefined ? (
            <span className="ml-1.5 rounded bg-surface-2 px-1 text-2xs text-muted-foreground">
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Score bar ------------------------------ */

export function ScoreBar({
  value,
  tone = 'primary',
  className,
}: {
  value: number;
  tone?: 'primary' | 'ok' | 'warn' | 'danger';
  className?: string;
}) {
  const color =
    tone === 'ok'
      ? 'hsl(var(--ok))'
      : tone === 'warn'
        ? 'hsl(var(--warn))'
        : tone === 'danger'
          ? 'hsl(var(--danger))'
          : 'hsl(var(--primary))';
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

/* ------------------------------- Empty --------------------------------- */

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {hint ? <div className="max-w-md text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/* -------------------------------- Modal -------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-10">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="text-sm font-semibold">{title}</div>
          <Button variant="ghost" size="xs" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="max-h-[65vh] overflow-auto px-4 py-3">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------ Data table ----------------------------- */

export function DataTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  onClick,
  sorted,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  sorted?: 'asc' | 'desc' | null;
  title?: string;
}) {
  return (
    <th
      onClick={onClick}
      title={title}
      className={cn(
        'sticky top-0 z-10 whitespace-nowrap border-b border-border bg-surface px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-muted-foreground',
        onClick && 'cursor-pointer select-none hover:text-foreground',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted ? <span className="text-[9px]">{sorted === 'asc' ? '▲' : '▼'}</span> : null}
      </span>
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
  title,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLTableCellElement>;
}) {
  return (
    <td
      colSpan={colSpan}
      title={title}
      onClick={onClick}
      className={cn('border-b border-border/60 px-2 py-1.5 align-middle', className)}
    >
      {children}
    </td>
  );
}
