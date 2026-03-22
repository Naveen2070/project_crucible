import { Framework, ComponentName } from '../core/enums';

export interface PeerDependencyMap {
  [component: string]: {
    [framework in Framework]?: string[];
  };
}

export const PEER_DEPENDENCIES: PeerDependencyMap = {
  [ComponentName.Modal]: {
    [Framework.React]: ['focus-trap-react'],
    [Framework.Vue]: ['focus-trap-vue'],
    [Framework.Angular]: ['@angular/cdk'],
  },
  [ComponentName.Select]: {
    [Framework.React]: ['@floating-ui/react'],
    [Framework.Vue]: ['@floating-ui/vue'],
    [Framework.Angular]: ['@floating-ui/dom'],
  },
};

export function getPeerDependencies(component: ComponentName, framework: Framework): string[] {
  return PEER_DEPENDENCIES[component]?.[framework] || [];
}
