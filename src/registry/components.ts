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
      css: ['Button.tsx', 'Button.module.css', 'Button.stories.tsx'],
      tailwind: ['Button.tsx', 'Button.stories.tsx'],
    },
  },
  Input: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Input.tsx', 'Input.module.css', 'Input.stories.tsx'],
      tailwind: ['Input.tsx', 'Input.stories.tsx'],
    },
  },
  Card: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Card.tsx', 'Card.module.css', 'Card.stories.tsx'],
      tailwind: ['Card.tsx', 'Card.stories.tsx'],
    },
  },
  Modal: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Modal.tsx', 'Modal.module.css', 'Modal.stories.tsx'],
      tailwind: ['Modal.tsx', 'Modal.stories.tsx'],
    },
  },
  Select: {
    frameworks: ['react'],
    styleSystems: ['css', 'tailwind'],
    files: {
      css: ['Select.tsx', 'Select.module.css', 'Select.stories.tsx'],
      tailwind: ['Select.tsx', 'Select.stories.tsx'],
    },
  },
};
