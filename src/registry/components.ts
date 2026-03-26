import { ComponentName } from '../core/enums';
import { generateComponentFiles, ComponentDef } from './path-generator';

export type { ComponentDef };

export const registry: Record<ComponentName, ComponentDef> = {
  [ComponentName.Button]: generateComponentFiles('Button'),
  [ComponentName.Input]: generateComponentFiles('Input'),
  [ComponentName.Card]: generateComponentFiles('Card'),
  [ComponentName.Dialog]: generateComponentFiles('Dialog', ['Button']),
  [ComponentName.Select]: generateComponentFiles('Select', ['Button']),
};
