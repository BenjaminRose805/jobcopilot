import React from 'react';
import { Lock, RotateCcw, ShieldCheck, Sliders } from 'lucide-react';
import { Badge, Button, LockedBadge, Panel, PanelHeader, SimulatedNotice, Toggle } from '@ui';
import {
  AUTONOMY_PRESET_LABEL,
  AUTONOMY_PRESETS,
  AUTONOMY_TOGGLES,
  DEFAULT_AUTONOMY,
  MANDATORY_STOPS,
  type AutonomyPresetId,
  type AutonomySettings as AutonomySettingsValue,
  type AutonomyToggleId,
  type MandatoryStopId,
} from '@shared/autonomy';
import { Screen } from '../../components/Screen';
import { useStore } from '../../renderer/store';

const PRESET_ORDER: Exclude<AutonomyPresetId, 'custom'>[] = [
  'research-only',
  'copilot',
  'approval-before-every-application',
  'trusted-forms-only',
];

const PRESET_HINT: Record<Exclude<AutonomyPresetId, 'custom'>, string> = {
  'research-only': 'Discovery, research and recommendations. The agent never touches a form.',
  copilot: 'Prepares packages and drafts; you drive every field on the page.',
  'approval-before-every-application':
    'The default. Everything is prepared for you, nothing is sent for you.',
  'trusted-forms-only':
    'Adds multi-step form advancement on ATS layouts you have already used. Submission still stops.',
};

/** Two settings objects are equal if every toggle and stop matches. */
function sameSettings(a: AutonomySettingsValue, b: AutonomySettingsValue) {
  return (
    AUTONOMY_TOGGLES.every((t) => a.toggles[t.id] === b.toggles[t.id]) &&
    MANDATORY_STOPS.every((s) => a.stops[s.id] === b.stops[s.id])
  );
}

function matchPreset(next: Omit<AutonomySettingsValue, 'preset'>): AutonomyPresetId {
  for (const id of PRESET_ORDER) {
    if (sameSettings({ ...next, preset: id }, AUTONOMY_PRESETS[id])) return id;
  }
  return 'custom';
}

export function AutonomySettings() {
  const { state, update } = useStore();
  const autonomy = state.autonomy;

  const apply = React.useCallback(
    (next: Omit<AutonomySettingsValue, 'preset'>) => {
      update((s) => ({ ...s, autonomy: { ...next, preset: matchPreset(next) } }));
    },
    [update],
  );

  const setPreset = React.useCallback(
    (id: Exclude<AutonomyPresetId, 'custom'>) => {
      update((s) => ({ ...s, autonomy: { ...AUTONOMY_PRESETS[id] } }));
    },
    [update],
  );

  const setToggle = (id: AutonomyToggleId, value: boolean) =>
    apply({ toggles: { ...autonomy.toggles, [id]: value }, stops: autonomy.stops });

  const setStop = (id: MandatoryStopId, value: boolean) =>
    apply({ toggles: autonomy.toggles, stops: { ...autonomy.stops, [id]: value } });

  const enabledCount = AUTONOMY_TOGGLES.filter((t) => autonomy.toggles[t.id]).length;
  const stopsOff = MANDATORY_STOPS.filter((s) => !s.locked && !autonomy.stops[s.id]);
  const isDefault = sameSettings(autonomy, DEFAULT_AUTONOMY);

  return (
    <Screen
      title="Autonomy"
      description="What the agent may do on its own, and where it must stop and hand control back to you. Stops are checked before an action, not after."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={autonomy.preset === 'custom' ? 'info' : 'accent'}>
            {AUTONOMY_PRESET_LABEL[autonomy.preset]}
          </Badge>
          <Button
            variant="ghost"
            disabled={isDefault}
            onClick={() => setPreset('approval-before-every-application')}
          >
            <RotateCcw size={13} />
            Reset to default
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <SimulatedNotice>
          These settings govern a simulated agent driving bundled mock pages. No preset — including
          the most permissive one — can cause a real application to be submitted, a real message to
          be sent, or a real website to be opened.
        </SimulatedNotice>

        <Panel>
          <PanelHeader
            icon={<Sliders size={13} />}
            title="Presets"
            subtitle="A starting point. Changing any switch below moves you to Custom."
          />
          <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-4">
            {PRESET_ORDER.map((id) => {
              const active = autonomy.preset === id;
              return (
                <button
                  key={id}
                  onClick={() => setPreset(id)}
                  className={[
                    'rounded border p-2.5 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border bg-surface hover:bg-surface-2',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium">{AUTONOMY_PRESET_LABEL[id]}</span>
                    {id === 'approval-before-every-application' ? (
                      <Badge tone="ok">Default</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-2xs text-muted-foreground">{PRESET_HINT[id]}</p>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-3 xl:grid-cols-2">
          <Panel>
            <PanelHeader
              title="What the agent may do unattended"
              subtitle={`${enabledCount} of ${AUTONOMY_TOGGLES.length} enabled`}
            />
            <div className="divide-y divide-border">
              {AUTONOMY_TOGGLES.map((t) => {
                const isSubmit = t.id === 'auto-submit';
                return (
                  <div key={t.id} className="flex items-start gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium">{t.label}</span>
                        {isSubmit ? <LockedBadge reason="Blocked in this build" /> : null}
                      </div>
                      <p className="mt-0.5 text-2xs text-muted-foreground">{t.description}</p>
                      {isSubmit ? (
                        <p className="mt-1 text-2xs text-[hsl(var(--danger))]">
                          Unconditionally off. The final-submission stop is a locked product
                          guarantee, so an auto-submit switch would have nothing to act on.
                        </p>
                      ) : null}
                    </div>
                    <Toggle
                      checked={isSubmit ? false : autonomy.toggles[t.id]}
                      disabled={isSubmit}
                      onChange={(v) => setToggle(t.id, v)}
                      label={t.label}
                      id={`toggle-${t.id}`}
                    />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={<ShieldCheck size={13} />}
              title="Mandatory stops"
              subtitle="Where the agent hands control back to you"
              actions={
                <Badge tone={stopsOff.length ? 'warn' : 'ok'}>
                  {stopsOff.length ? `${stopsOff.length} relaxed` : 'All active'}
                </Badge>
              }
            />
            <div className="divide-y divide-border">
              {MANDATORY_STOPS.map((s) => (
                <div key={s.id} className="flex items-start gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-medium">{s.label}</span>
                      {s.locked ? (
                        <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                          <Lock size={10} />
                          Always on
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-2xs text-muted-foreground">{s.description}</p>
                  </div>
                  <Toggle
                    checked={s.locked ? true : autonomy.stops[s.id]}
                    disabled={s.locked}
                    onChange={(v) => setStop(s.id, v)}
                    label={s.label}
                    id={`stop-${s.id}`}
                  />
                </div>
              ))}
            </div>
            <p className="border-t border-border px-3 py-2 text-2xs text-muted-foreground">
              Ten of these fourteen cannot be switched off. They are enforced in the scenario engine
              itself rather than checked in the UI, so relaxing a setting cannot reach them.
            </p>
          </Panel>
        </div>
      </div>
    </Screen>
  );
}
