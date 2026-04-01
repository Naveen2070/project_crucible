import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { PROHIBITED_PATTERNS, AUDIT_EXCLUDES } from '../src/__tests__/templates/audit';

function shouldExclude(filePath: string): boolean {
  return AUDIT_EXCLUDES.some((pattern) => pattern.test(filePath));
}

async function auditTemplates() {
  const templates = await glob('templates/**/*.hbs');
  const errors: Array<{ file: string; pattern: string; line: string }> = [];

  for (const template of templates) {
    if (shouldExclude(template)) {
      continue;
    }

    const content = await readFile(template, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      for (const pattern of PROHIBITED_PATTERNS) {
        if (pattern.test(line)) {
          errors.push({
            file: template,
            pattern: pattern.source,
            line: line.trim(),
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Template audit failed:\n');
    for (const error of errors) {
      console.error(`  ${error.file}: ${error.line}`);
    }
    process.exit(1);
  }

  console.log(`✅ Audited ${templates.length} templates`);
}

auditTemplates();
