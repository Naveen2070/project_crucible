import { ComponentName } from '../core/enums';
import { generateComponentFiles, ComponentDef } from './path-generator';
import buttonManifest from './manifests/components/button.json';
import inputManifest from './manifests/components/input.json';
import cardManifest from './manifests/components/card.json';
import dialogManifest from './manifests/components/dialog.json';
import selectManifest from './manifests/components/select.json';
import tableManifest from './manifests/components/table.json';
import popoverManifest from './manifests/components/popover.json';

export type { ComponentDef };

const manifests: Record<string, any> = {
  [ComponentName.Button]: buttonManifest,
  [ComponentName.Input]: inputManifest,
  [ComponentName.Card]: cardManifest,
  [ComponentName.Dialog]: dialogManifest,
  [ComponentName.Select]: selectManifest,
  [ComponentName.Table]: tableManifest,
  [ComponentName.Popover]: popoverManifest,
};

export const registry: Record<ComponentName, ComponentDef> = {} as any;

for (const [name, manifest] of Object.entries(manifests)) {
  registry[name as ComponentName] = generateComponentFiles(manifest.name, manifest.dependencies);
}
