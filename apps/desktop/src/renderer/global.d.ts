import type { JobCopilotBridge } from '@shared/ipc';

declare global {
  interface Window {
    jobcopilot: JobCopilotBridge;
  }
}

export {};
