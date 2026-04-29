import * as fs from 'node:fs';
import * as path from 'node:path';
import ansis from 'ansis';

/**
 * Copies the registry manifests from src/registry/manifests to dist/registry/manifests.
 * This is necessary because tsc does not copy non-TypeScript files.
 */
function copyManifests() {
  const srcDir = path.join(process.cwd(), 'src/registry/manifests');
  const distDir = path.join(process.cwd(), 'dist/registry/manifests');

  try {
    if (!fs.existsSync(srcDir)) {
      console.error(ansis.red(`✗ Source manifests directory not found: ${srcDir}`));
      process.exit(1);
    }

    // Ensure dist parent directories exist
    fs.mkdirSync(path.dirname(distDir), { recursive: true });

    // Copy directory recursively
    // fs.cpSync is available in Node.js 16.7.0+
    fs.cpSync(srcDir, distDir, { recursive: true });

    console.log(ansis.green('✅ Copied registry manifests to dist'));
  } catch (err: any) {
    console.error(ansis.red(`✗ Failed to copy manifests: ${err.message}`));
    process.exit(1);
  }
}

copyManifests();
