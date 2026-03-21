export interface ComponentDef {
  frameworks: string[];
  styleSystems: string[];
  files: {
    css: string[];
    tailwind: string[];
  };
}

export const registry: Record<string, ComponentDef> = {
  Button: {
    frameworks: ['react', 'angular', 'vue'],
    styleSystems: ['css', 'tailwind'],
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
    },
  },
  Input: {
    frameworks: ['react', 'angular', 'vue'],
    styleSystems: ['css', 'tailwind'],
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
    },
  },
  Card: {
    frameworks: ['react', 'angular', 'vue'],
    styleSystems: ['css', 'tailwind'],
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
    },
  },
  Modal: {
    frameworks: ['react', 'angular', 'vue'],
    styleSystems: ['css', 'tailwind'],
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
    },
  },
  Select: {
    frameworks: ['react', 'angular', 'vue'],
    styleSystems: ['css', 'tailwind'],
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
    },
  },
};
