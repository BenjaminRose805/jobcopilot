import React from 'react';

/** Standard screen frame: fixed header, scrolling body. */
export function Screen({
  title,
  description,
  actions,
  children,
  bodyClassName,
  padded = true,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-0.5 max-w-4xl text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div
        className={[
          'scrollable min-h-0 flex-1',
          padded ? 'p-4' : '',
          bodyClassName ?? '',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

/** Two-column layout used by the list/detail screens. */
export function SplitColumns({
  left,
  right,
  leftWidth = 380,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div
        className="scrollable shrink-0 border-r border-border"
        style={{ width: leftWidth }}
      >
        {left}
      </div>
      <div className="scrollable min-w-0 flex-1">{right}</div>
    </div>
  );
}

export function KeyValue({
  rows,
  className,
}: {
  rows: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={['grid grid-cols-[minmax(120px,auto)_1fr] gap-x-3 gap-y-1 text-xs', className ?? ''].join(' ')}>
      {rows.map((row) => (
        <React.Fragment key={row.label}>
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 text-foreground" data-selectable>
            {row.value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
