export interface ComponentDef {
  frameworks: string[];
  files: {
    react: string[];
  };
}

export const registry: Record<string, ComponentDef> = {
  Button: {
    frameworks: ['react'],
    files: { react: ['Button.tsx', 'Button.module.css', 'Button.stories.tsx'] },
  },
  Input: {
    frameworks: ['react'],
    files: { react: ['Input.tsx', 'Input.module.css', 'Input.stories.tsx'] },
  },
  Card: {
    frameworks: ['react'],
    files: { react: ['Card.tsx', 'Card.module.css', 'Card.stories.tsx'] },
  },
  Modal: {
    frameworks: ['react'],
    files: { react: ['Modal.tsx', 'Modal.module.css', 'Modal.stories.tsx'] },
  },
  Select: {
    frameworks: ['react'],
    files: { react: ['Select.tsx', 'Select.module.css', 'Select.stories.tsx'] },
  },
};
