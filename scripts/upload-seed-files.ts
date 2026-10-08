import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { demoDocuments } from '../src/data/demo';
try {
  process.loadEnvFile('.env.local');
} catch {
  /* CI environment can provide variables directly. */
}
if (!process.argv.includes('--confirm-demo-project'))
  throw new Error('Run only on a new demo Supabase project. Add --confirm-demo-project to acknowledge.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Configure server-side Supabase URL and service role key.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
for (const d of demoDocuments) {
  const storagePath = d.uploader_id + '/' + d.id + '/' + d.file.safe_name;
  const bytes = await readFile('public/samples/sample.' + d.file.extension);
  const { error } = await db.storage
    .from('documents')
    .upload(storagePath, bytes, { contentType: d.file.mime_type, upsert: false });
  if (error && !error.message.toLowerCase().includes('already exists')) throw error;
  const result = await db.from('document_files').update({ size_bytes: bytes.length }).eq('document_id', d.id);
  if (result.error) throw result.error;
}
console.log('Uploaded 28 synthetic sample files to the private documents bucket.');
