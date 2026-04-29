export const PROHIBITED_PATTERNS: RegExp[] = [
  /\{\{\s*#if\s+[^}]*(?:===|!==|<|>|<=|>=)[^}]*\}\}/, // Comparisons inside if
  /\{\{\s*#if\s+[^}]*\?[^}]*:[^}]*\}\}/, // Ternary operators inside if
  /\{\{\s*else\s+if/, // Else-if chains
  /\{\{[^}]*ComponentName\.[^}]*\}\}/, // ComponentName in templates
  /\{\{[^}]*crucible\.config\.[^}]*\}\}/, // Config references
  /\*ngIf/, // Legacy Angular *ngIf - use @if instead
  /\*ngFor/, // Legacy Angular *ngFor - use @for instead
  /\*ngSwitch/, // Legacy Angular *ngSwitch - use @switch instead
];

export const AUDIT_EXCLUDES = [
  // Virtualization adapter guide uses template syntax for documentation
  /templates[\\/]shared[\\/]virtualization-adapters-guide\.md\.hbs$/,
];
