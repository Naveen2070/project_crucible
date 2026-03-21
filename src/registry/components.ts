import { Framework, StyleSystem, ComponentName } from '../core/enums';

export interface ComponentDef {
  frameworks: Framework[];
  styleSystems: StyleSystem[];
  files: {
    css: string[];
    tailwind: string[];
    scss: string[];
  };
}

export const registry: Record<ComponentName, ComponentDef> = {
  [ComponentName.Button]: {
    frameworks: [Framework.React, Framework.Angular, Framework.Vue],
    styleSystems: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
    files: {
      css: [
        'Button/Button.tsx',
        'Button/Button.module.css',
        'Button/Button.stories.tsx',
        'Button/button.component.ts',
        'Button/button.component.html',
        'Button/button.component.css',
        'Button/button.stories.ts',
        'Button/Button.vue',
        'Button/Button.stories.ts',
      ],
      tailwind: [
        'Button/Button.tsx',
        'Button/Button.stories.tsx',
        'Button/button.component.ts',
        'Button/button.component.html',
        'Button/button.stories.ts',
        'Button/Button.vue',
        'Button/Button.stories.ts',
      ],
      scss: [
        'Button/Button.tsx',
        'Button/Button.module.scss',
        'Button/Button.stories.tsx',
        'Button/button.component.ts',
        'Button/button.component.html',
        'Button/button.component.scss',
        'Button/button.stories.ts',
        'Button/Button.vue',
        'Button/Button.stories.ts',
      ],
    },
  },
  [ComponentName.Input]: {
    frameworks: [Framework.React, Framework.Angular, Framework.Vue],
    styleSystems: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
    files: {
      css: [
        'Input/Input.tsx',
        'Input/Input.module.css',
        'Input/Input.stories.tsx',
        'Input/input.component.ts',
        'Input/input.component.html',
        'Input/input.component.css',
        'Input/input.stories.ts',
        'Input/Input.vue',
        'Input/Input.stories.ts',
      ],
      tailwind: [
        'Input/Input.tsx',
        'Input/Input.stories.tsx',
        'Input/input.component.ts',
        'Input/input.component.html',
        'Input/input.stories.ts',
        'Input/Input.vue',
        'Input/Input.stories.ts',
      ],
      scss: [
        'Input/Input.tsx',
        'Input/Input.module.scss',
        'Input/Input.stories.tsx',
        'Input/input.component.ts',
        'Input/input.component.html',
        'Input/input.component.scss',
        'Input/input.stories.ts',
        'Input/Input.vue',
        'Input/Input.stories.ts',
      ],
    },
  },
  [ComponentName.Card]: {
    frameworks: [Framework.React, Framework.Angular, Framework.Vue],
    styleSystems: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
    files: {
      css: [
        'Card/Card.tsx',
        'Card/Card.module.css',
        'Card/Card.stories.tsx',
        'Card/card.component.ts',
        'Card/card.component.html',
        'Card/card.component.css',
        'Card/card.stories.ts',
        'Card/Card.vue',
        'Card/Card.stories.ts',
      ],
      tailwind: [
        'Card/Card.tsx',
        'Card/Card.stories.tsx',
        'Card/card.component.ts',
        'Card/card.component.html',
        'Card/card.stories.ts',
        'Card/Card.vue',
        'Card/Card.stories.ts',
      ],
      scss: [
        'Card/Card.tsx',
        'Card/Card.module.scss',
        'Card/Card.stories.tsx',
        'Card/card.component.ts',
        'Card/card.component.html',
        'Card/card.component.scss',
        'Card/card.stories.ts',
        'Card/Card.vue',
        'Card/Card.stories.ts',
      ],
    },
  },
  [ComponentName.Modal]: {
    frameworks: [Framework.React, Framework.Angular, Framework.Vue],
    styleSystems: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
    files: {
      css: [
        'Modal/Modal.tsx',
        'Modal/Modal.module.css',
        'Modal/Modal.stories.tsx',
        'Modal/modal.component.ts',
        'Modal/modal.component.html',
        'Modal/modal.component.css',
        'Modal/modal.stories.ts',
        'Modal/Modal.vue',
        'Modal/Modal.stories.ts',
      ],
      tailwind: [
        'Modal/Modal.tsx',
        'Modal/Modal.stories.tsx',
        'Modal/modal.component.ts',
        'Modal/modal.component.html',
        'Modal/modal.stories.ts',
        'Modal/Modal.vue',
        'Modal/Modal.stories.ts',
      ],
      scss: [
        'Modal/Modal.tsx',
        'Modal/Modal.module.scss',
        'Modal/Modal.stories.tsx',
        'Modal/modal.component.ts',
        'Modal/modal.component.html',
        'Modal/modal.component.scss',
        'Modal/modal.stories.ts',
        'Modal/Modal.vue',
        'Modal/Modal.stories.ts',
      ],
    },
  },
  [ComponentName.Select]: {
    frameworks: [Framework.React, Framework.Angular, Framework.Vue],
    styleSystems: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
    files: {
      css: [
        'Select/Select.tsx',
        'Select/Select.module.css',
        'Select/Select.stories.tsx',
        'Select/select.component.ts',
        'Select/select.component.html',
        'Select/select.component.css',
        'Select/select.stories.ts',
        'Select/Select.vue',
        'Select/Select.stories.ts',
      ],
      tailwind: [
        'Select/Select.tsx',
        'Select/Select.stories.tsx',
        'Select/select.component.ts',
        'Select/select.component.html',
        'Select/select.stories.ts',
        'Select/Select.vue',
        'Select/Select.stories.ts',
      ],
      scss: [
        'Select/Select.tsx',
        'Select/Select.module.scss',
        'Select/Select.stories.tsx',
        'Select/select.component.ts',
        'Select/select.component.html',
        'Select/select.component.scss',
        'Select/select.stories.ts',
        'Select/Select.vue',
        'Select/Select.stories.ts',
      ],
    },
  },
};
