import { Framework, ComponentName } from '../core/enums';

export interface PeerDependencyMap {
  [component: string]: {
    [framework in Framework]?: string[];
  };
}

export const PEER_DEPENDENCIES: PeerDependencyMap = {
  [ComponentName.Dialog]: {
    [Framework.React]: ['focus-trap-react'],
  },
};

export function getPeerDependencies(component: ComponentName, framework: Framework): string[] {
  return PEER_DEPENDENCIES[component]?.[framework] || [];
}
