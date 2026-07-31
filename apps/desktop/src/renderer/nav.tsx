import React from 'react';
import {
  BarChart3,
  Briefcase,
  Compass,
  FileText,
  LayoutDashboard,
  Send,
  SlidersHorizontal,
  Vault,
} from 'lucide-react';

export type ScreenId =
  | 'command-center'
  | 'job-discovery'
  | 'applications'
  | 'career-vault'
  | 'resume-studio'
  | 'outreach'
  | 'analytics'
  | 'autonomy'
  | 'workspace';

export interface NavParams {
  jobId?: string;
  applicationId?: string;
  factId?: string;
  strategyId?: string;
  contactId?: string;
}

export const NAV_ITEMS: {
  id: ScreenId;
  label: string;
  icon: typeof Compass;
  hint: string;
}[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, hint: 'Everything waiting on you' },
  { id: 'job-discovery', label: 'Job Discovery', icon: Compass, hint: 'Queue and job intelligence' },
  { id: 'applications', label: 'Applications', icon: Briefcase, hint: 'Pipeline and audit history' },
  { id: 'career-vault', label: 'Career Vault', icon: Vault, hint: 'Evidence behind every answer' },
  { id: 'resume-studio', label: 'Resume Studio', icon: FileText, hint: 'Strategies and tailored diffs' },
  { id: 'outreach', label: 'Outreach', icon: Send, hint: 'Drafts you send yourself' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, hint: 'Interviews per hour of your time' },
  { id: 'autonomy', label: 'Autonomy Settings', icon: SlidersHorizontal, hint: 'What the agent may do alone' },
];

export const SCREEN_TITLE: Record<ScreenId, string> = {
  'command-center': 'Command Center',
  'job-discovery': 'Job Discovery',
  applications: 'Applications',
  'career-vault': 'Career Vault',
  'resume-studio': 'Resume Studio',
  outreach: 'Outreach',
  analytics: 'Analytics',
  autonomy: 'Autonomy Settings',
  workspace: 'Application Workspace',
};

interface NavValue {
  screen: ScreenId;
  params: NavParams;
  go(screen: ScreenId, params?: NavParams): void;
  back(): void;
  canGoBack: boolean;
}

const NavContext = React.createContext<NavValue | null>(null);

export function NavProvider({
  initialScreen,
  children,
  onScreenChange,
}: {
  initialScreen: ScreenId;
  children: React.ReactNode;
  onScreenChange?: (screen: ScreenId) => void;
}) {
  const [stack, setStack] = React.useState<{ screen: ScreenId; params: NavParams }[]>([
    { screen: initialScreen, params: {} },
  ]);

  const current = stack[stack.length - 1];

  const go = React.useCallback(
    (screen: ScreenId, params: NavParams = {}) => {
      setStack((s) => [...s, { screen, params }]);
      onScreenChange?.(screen);
    },
    [onScreenChange],
  );

  const back = React.useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const value = React.useMemo<NavValue>(
    () => ({
      screen: current.screen,
      params: current.params,
      go,
      back,
      canGoBack: stack.length > 1,
    }),
    [current, go, back, stack.length],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavValue {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>.');
  return ctx;
}
