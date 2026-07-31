import type { ScenarioDefinition } from '@scenario-engine';
import { STANDARD_APPLICATION } from './standard-application';
import { UNSUPPORTED_EXPERIENCE } from './unsupported-experience';
import { HUMAN_TAKEOVER } from './human-takeover';
import { NEW_PREFERENCE } from './new-preference';
import { REJECTED_BY_RESEARCH } from './rejected-by-research';
import { DEMOGRAPHIC_REVIEW } from './demographic-review';

export const SCENARIOS: ScenarioDefinition[] = [
  STANDARD_APPLICATION,
  UNSUPPORTED_EXPERIENCE,
  HUMAN_TAKEOVER,
  NEW_PREFERENCE,
  REJECTED_BY_RESEARCH,
  DEMOGRAPHIC_REVIEW,
];

export function getScenario(id: string | undefined): ScenarioDefinition | undefined {
  if (!id) return undefined;
  return SCENARIOS.find((s) => s.id === id);
}

export function scenarioForApplication(applicationId: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((s) => s.applicationId === applicationId);
}

export {
  STANDARD_APPLICATION,
  UNSUPPORTED_EXPERIENCE,
  HUMAN_TAKEOVER,
  NEW_PREFERENCE,
  REJECTED_BY_RESEARCH,
  DEMOGRAPHIC_REVIEW,
};
