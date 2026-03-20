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
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Button/Button.tsx', 'Button/Button.module.css', 'Button/Button.stories.tsx'],
      tailwind: ['Button/Button.tsx', 'Button/Button.stories.tsx'],
    },
  },
  Input: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Input/Input.tsx', 'Input/Input.module.css', 'Input/Input.stories.tsx'],
      tailwind: ['Input/Input.tsx', 'Input/Input.stories.tsx'],
    },
  },
  Card: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Card/Card.tsx', 'Card/Card.module.css', 'Card/Card.stories.tsx'],
      tailwind: ['Card/Card.tsx', 'Card/Card.stories.tsx'],
    },
  },
  Modal: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Modal/Modal.tsx', 'Modal/Modal.module.css', 'Modal/Modal.stories.tsx'],
      tailwind: ['Modal/Modal.tsx', 'Modal/Modal.stories.tsx'],
    },
  },
  Select: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Select/Select.tsx', 'Select/Select.module.css', 'Select/Select.stories.tsx'],
      tailwind: ['Select/Select.tsx', 'Select/Select.stories.tsx'],
    },
  },
};
