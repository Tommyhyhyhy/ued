import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
try {
  const pdfRequire = createRequire(require.resolve('react-pdf'));
  const dir = path.dirname(pdfRequire.resolve('pdfjs-dist/package.json'));
  mkdirSync('public', { recursive: true });
  copyFileSync(path.join(dir, 'build/pdf.worker.min.mjs'), 'public/pdf.worker.min.mjs');
} catch (e) {
  console.error('Cannot prepare PDF worker:', e.message);
  process.exitCode = 1;
}
