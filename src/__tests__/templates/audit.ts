export const PROHIBITED_PATTERNS: RegExp[] = [
  /\{\{\s*#if\s+[^}]*(?:===|!==|<|>|<=|>=)[^}]*\}\}/, // Comparisons inside if
  /\{\{\s*#if\s+[^}]*\?[^}]*:[^}]*\}\}/,              // Ternary operators inside if
  /\{\{\s*else\s+if/,                                 // Else-if chains
  /\{\{[^}]*ComponentName\.[^}]*\}\}/,                // ComponentName in templates
  /\{\{[^}]*crucible\.config\.[^}]*\}\}/,             // Config references
];
