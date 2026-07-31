import React from 'react';
import { AppShell } from '@app/components/AppShell';
import { CommandCenter } from '@app/features/command-center/CommandCenter';
import { JobDiscovery } from '@app/features/job-discovery/JobDiscovery';
import { ApplicationsCrm } from '@app/features/crm/ApplicationsCrm';
import { CareerVault } from '@app/features/career-vault/CareerVault';
import { ResumeStudio } from '@app/features/resume-studio/ResumeStudio';
import { OutreachWorkspace } from '@app/features/outreach/OutreachWorkspace';
import { AnalyticsScreen } from '@app/features/analytics/AnalyticsScreen';
import { AutonomySettings } from '@app/features/autonomy/AutonomySettings';
import { ApplicationWorkspace } from '@app/features/workspace/ApplicationWorkspace';
import { AgentProvider } from './agent';
import { NavProvider, useNav, type NavParams, type ScreenId } from './nav';
import { StoreProvider, useStore } from './store';

const SCREENS: Record<ScreenId, React.ComponentType> = {
  'command-center': CommandCenter,
  'job-discovery': JobDiscovery,
  applications: ApplicationsCrm,
  'career-vault': CareerVault,
  'resume-studio': ResumeStudio,
  outreach: OutreachWorkspace,
  analytics: AnalyticsScreen,
  autonomy: AutonomySettings,
  workspace: ApplicationWorkspace,
};

export function App() {
  return (
    <StoreProvider>
      <Inner />
    </StoreProvider>
  );
}

function Inner() {
  const { state, update, screenshot } = useStore();
  const initialScreen = React.useRef<ScreenId>(
    screenshot?.screen && screenshot.screen in SCREENS
      ? (screenshot.screen as ScreenId)
      : (state.ui.lastScreen as ScreenId) in SCREENS
        ? (state.ui.lastScreen as ScreenId)
        : 'command-center',
  );
  const initialParams = React.useRef<NavParams>((screenshot?.params ?? {}) as NavParams);

  const onScreenChange = React.useCallback(
    (screen: ScreenId) => {
      // The workspace is transient — reopening the app should land on a real
      // screen rather than a half-finished agent run.
      if (screen === 'workspace') return;
      update((s) => (s.ui.lastScreen === screen ? s : { ...s, ui: { ...s.ui, lastScreen: screen } }));
    },
    [update],
  );

  return (
    <AgentProvider>
      <NavProvider
        initialScreen={initialScreen.current}
        initialParams={initialParams.current}
        onScreenChange={onScreenChange}
      >
        <Routed />
      </NavProvider>
    </AgentProvider>
  );
}

function Routed() {
  const { screen } = useNav();
  const [collapsed, setCollapsed] = React.useState(false);
  const Current = SCREENS[screen];

  // The embedded browser is a native child view, not a DOM node: it has to be
  // explicitly hidden whenever the workspace is not the visible screen,
  // otherwise it would float above whatever screen is showing.
  React.useEffect(() => {
    if (screen !== 'workspace') void window.jobcopilot.browser.setVisible(false);
  }, [screen]);

  return (
    <AppShell sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)}>
      <Current />
    </AppShell>
  );
}
