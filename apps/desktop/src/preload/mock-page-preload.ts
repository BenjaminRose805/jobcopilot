import { ipcRenderer } from 'electron';
import type { BrowserCommand, CommandResult } from '@shared/ipc';
import type { MockFieldState, MockPageState } from '@scenario-engine/types';

/**
 * Page-driver preload injected into the sandboxed mock browser surface.
 *
 * Mock pages stay plain static HTML. They only need to describe themselves
 * with data attributes; this script turns that into the typed `MockPageState`
 * the scenario engine reads, and executes the small command vocabulary the
 * engine is allowed to use.
 *
 * Contract:
 *   <body data-mock-page="ats/simple-application"
 *         data-page-step="contact"
 *         data-page-status="editing"
 *         data-requires-human="true"
 *         data-requires-human-reason="..."
 *         data-flags='{"captchaSolved":"false"}'>
 *   <input data-field="email" data-label="Email">
 *   <button data-action="submit" data-label="Submit application">
 */

const DRIVER = {
  command: 'mock-driver:command',
  result: 'mock-driver:result',
  state: 'mock-driver:state',
  setAgentEnabled: 'mock-driver:set-agent-enabled',
} as const;

const HIGHLIGHT_ID = '__jobcopilot_highlight';
const BANNER_ID = '__jobcopilot_control_banner';

type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

function fieldElements(): FieldEl[] {
  return Array.from(document.querySelectorAll<FieldEl>('[data-field]'));
}

function findField(name: string): FieldEl | null {
  return document.querySelector<FieldEl>(`[data-field="${CSS.escape(name)}"]`);
}

function findAction(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-action="${CSS.escape(name)}"]`);
}

function fieldType(el: FieldEl): MockFieldState['type'] {
  const declared = el.dataset.type as MockFieldState['type'] | undefined;
  if (declared) return declared;
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  if (el instanceof HTMLSelectElement) return 'select';
  if (el instanceof HTMLInputElement) {
    const t = el.type;
    if (t === 'email' || t === 'tel' || t === 'url' || t === 'checkbox' || t === 'radio') return t;
    if (t === 'file') return 'file';
  }
  return 'text';
}

function readValue(el: FieldEl): string {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? 'true' : '';
    return el.value;
  }
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return el.value;
  return el.dataset.value ?? '';
}

function describe(): MockPageState {
  const body = document.body;
  let flags: Record<string, string> = {};
  if (body?.dataset.flags) {
    try {
      flags = JSON.parse(body.dataset.flags) as Record<string, string>;
    } catch {
      flags = {};
    }
  }

  const fields: MockFieldState[] = fieldElements().map((el) => {
    const value = readValue(el);
    const options =
      el instanceof HTMLSelectElement
        ? Array.from(el.options).map((o) => o.value).filter(Boolean)
        : el.dataset.options
          ? el.dataset.options.split('|')
          : undefined;
    return {
      name: el.dataset.field ?? '',
      label: el.dataset.label ?? el.getAttribute('aria-label') ?? el.dataset.field ?? '',
      type: fieldType(el),
      value,
      required: el.hasAttribute('required') || el.dataset.required === 'true',
      options,
      filled: value.trim().length > 0,
    };
  });

  const actions = Array.from(document.querySelectorAll<HTMLElement>('[data-action]')).map((el) => ({
    name: el.dataset.action ?? '',
    label: el.dataset.label ?? el.textContent?.trim() ?? '',
    disabled:
      el instanceof HTMLButtonElement ? el.disabled : el.getAttribute('aria-disabled') === 'true',
  }));

  return {
    url: location.href,
    page: body?.dataset.mockPage ?? 'unknown',
    title: document.title,
    step: body?.dataset.pageStep ?? '',
    status: body?.dataset.pageStatus ?? 'idle',
    fields,
    actions,
    requiresHuman: body?.dataset.requiresHuman === 'true',
    requiresHumanReason: body?.dataset.requiresHumanReason,
    flags,
    observedAt: Date.now(),
  };
}

/* ------------------------------ mutations ------------------------------ */

function setFieldValue(name: string, value: string): CommandResult {
  const el = findField(name);
  if (!el) return { ok: false, error: `No field named "${name}" on this page.` };

  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = value === 'true' || value === 'on';
    } else if (el.type === 'file') {
      // Real file pickers cannot be scripted; mock pages model uploads with a
      // data attribute so the demo never touches the filesystem.
      el.dataset.value = value;
    } else {
      el.value = value;
    }
  } else if (el instanceof HTMLTextAreaElement) {
    el.value = value;
  } else if (el instanceof HTMLSelectElement) {
    const match = Array.from(el.options).find(
      (o) => o.value === value || o.textContent?.trim() === value,
    );
    if (!match) return { ok: false, error: `Option "${value}" not available in "${name}".` };
    el.value = match.value;
  } else {
    el.dataset.value = value;
    el.setAttribute('data-value', value);
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new CustomEvent('mock:field', { bubbles: true, detail: { name, value } }));
  return { ok: true, state: describe() };
}

function clickAction(name: string): CommandResult {
  const el = findAction(name);
  if (!el) return { ok: false, error: `No action named "${name}" on this page.` };
  if (el instanceof HTMLButtonElement && el.disabled) {
    return { ok: false, error: `Action "${name}" is disabled — the page is blocking it.` };
  }
  el.click();
  return { ok: true, state: describe() };
}

/* ------------------------------ highlight ------------------------------ */

function ensureHighlight(): HTMLElement {
  let el = document.getElementById(HIGHLIGHT_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = HIGHLIGHT_ID;
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483646',
    border: '2px solid #7c5cff',
    borderRadius: '6px',
    boxShadow: '0 0 0 9999px rgba(15,17,26,0.28), 0 0 14px rgba(124,92,255,0.65)',
    transition: 'top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease',
    display: 'none',
  } satisfies Partial<CSSStyleDeclaration>);

  const note = document.createElement('div');
  note.dataset.role = 'note';
  Object.assign(note.style, {
    position: 'absolute',
    top: '-24px',
    left: '-2px',
    background: '#7c5cff',
    color: '#fff',
    font: '600 11px/1.6 system-ui, sans-serif',
    padding: '1px 7px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  } satisfies Partial<CSSStyleDeclaration>);
  el.appendChild(note);
  document.documentElement.appendChild(el);
  return el;
}

let highlightTarget: HTMLElement | null = null;

function positionHighlight(): void {
  const box = document.getElementById(HIGHLIGHT_ID);
  if (!box) return;
  if (!highlightTarget || !highlightTarget.isConnected) {
    box.style.display = 'none';
    return;
  }
  const r = highlightTarget.getBoundingClientRect();
  box.style.display = 'block';
  box.style.top = `${r.top - 3}px`;
  box.style.left = `${r.left - 3}px`;
  box.style.width = `${r.width + 6}px`;
  box.style.height = `${r.height + 6}px`;
}

function highlight(target: { field?: string; action?: string; note?: string }): CommandResult {
  const el = target.field ? findField(target.field) : target.action ? findAction(target.action) : null;
  if (!el) {
    return { ok: false, error: `Nothing to highlight for ${JSON.stringify(target)}.` };
  }
  const box = ensureHighlight();
  const note = box.querySelector<HTMLElement>('[data-role="note"]')!;
  note.textContent = target.note ?? `Agent: ${target.field ?? target.action}`;
  highlightTarget = el as HTMLElement;
  (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
  positionHighlight();
  return { ok: true, state: describe() };
}

function clearHighlight(): CommandResult {
  highlightTarget = null;
  const box = document.getElementById(HIGHLIGHT_ID);
  if (box) box.style.display = 'none';
  return { ok: true, state: describe() };
}

/* --------------------------- control banner ---------------------------- */

function setBanner(agentEnabled: boolean): void {
  let el = document.getElementById(BANNER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = BANNER_ID;
    Object.assign(el.style, {
      position: 'fixed',
      insetInline: '0',
      top: '0',
      zIndex: '2147483647',
      font: '600 12px/1 system-ui, sans-serif',
      padding: '7px 12px',
      textAlign: 'center',
      letterSpacing: '.02em',
    } satisfies Partial<CSSStyleDeclaration>);
    document.documentElement.appendChild(el);
  }
  if (agentEnabled) {
    el.style.display = 'none';
    document.documentElement.style.paddingTop = '';
  } else {
    el.style.display = 'block';
    el.style.background = '#f59e0b';
    el.style.color = '#1c1300';
    el.textContent = 'YOU HAVE CONTROL — the agent has stopped sending commands to this page';
    document.documentElement.style.paddingTop = '26px';
    clearHighlight();
  }
}

/* ------------------------------ transport ------------------------------ */

function run(cmd: BrowserCommand): CommandResult {
  try {
    switch (cmd.type) {
      case 'describe':
        return { ok: true, state: describe() };
      case 'fill':
        return setFieldValue(cmd.field, cmd.value);
      case 'select':
        return setFieldValue(cmd.field, cmd.value);
      case 'upload':
        return setFieldValue(cmd.field, cmd.fileName);
      case 'click':
        return clickAction(cmd.action);
      case 'focus': {
        const el = cmd.field ? findField(cmd.field) : cmd.action ? findAction(cmd.action) : null;
        if (!el) return { ok: false, error: 'Focus target not found.' };
        (el as HTMLElement).focus?.();
        return { ok: true, state: describe() };
      }
      case 'highlight':
        return highlight(cmd);
      case 'clearHighlight':
        return clearHighlight();
      default:
        return { ok: false, error: `Unknown command` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function pushState(): void {
  if (pushTimer) clearTimeout(pushTimer);
  // Coalesce bursts of DOM mutations into a single state report.
  pushTimer = setTimeout(() => {
    pushTimer = null;
    positionHighlight();
    ipcRenderer.send(DRIVER.state, describe());
  }, 40);
}

ipcRenderer.on(DRIVER.command, (_e, payload: { id: number; cmd: BrowserCommand }) => {
  const result = run(payload.cmd);
  ipcRenderer.send(DRIVER.result, { id: payload.id, result });
  if (result.ok) pushState();
});

ipcRenderer.on(DRIVER.setAgentEnabled, (_e, enabled: boolean) => {
  setBanner(enabled);
  pushState();
});

function boot(): void {
  ensureHighlight();
  const observer = new MutationObserver(pushState);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'data-page-step',
      'data-page-status',
      'data-requires-human',
      'data-requires-human-reason',
      'data-flags',
      'data-value',
      'disabled',
      'aria-disabled',
    ],
  });
  document.addEventListener('input', pushState, true);
  document.addEventListener('change', pushState, true);
  window.addEventListener('scroll', positionHighlight, true);
  window.addEventListener('resize', positionHighlight);
  pushState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
