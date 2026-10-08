import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    'node_modules/**',
    'public/pdf.worker.min.mjs',
    'playwright-report/**',
    'test-results/**',
    'output/**',
    'tmp/**',
    'web python nâng cao/**',
  ]),
  { rules: { 'react-hooks/set-state-in-effect': 'off' } },
]);
