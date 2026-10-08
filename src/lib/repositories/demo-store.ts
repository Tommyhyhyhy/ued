import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { catalog, contributors, demoDocuments, uid } from '@/data/demo';
import type { Catalog, Profile, StudyDocument, Comment, Report, Audit } from '@/types';
export interface DemoState {
  catalog: Catalog;
  documents: StudyDocument[];
  profiles: Profile[];
  accounts: { email: string; hash: string; id: string }[];
  sessions: Record<string, { user_id: string; expires: number }>;
  favorites: { user_id: string; document_id: string }[];
  ratings: { user_id: string; document_id: string; value: number }[];
  comments: Comment[];
  reports: Report[];
  audit: Audit[];
  contacts: { id: string; name: string; email: string; message: string; created_at: string }[];
  views: string[];
  downloads: string[];
}
export function demoDir() {
  if (process.env.VERCEL || process.env.RENDER) return path.join(os.tmpdir(), 'uedocs-demo');
  if (process.env.DEMO_DATA_DIR === 'e2e') return path.join(process.cwd(), '.demo-data-e2e');
  return path.join(process.cwd(), '.demo-data');
}
const initial = (): DemoState => ({
  catalog: structuredClone(catalog),
  documents: structuredClone(demoDocuments),
  profiles: [
    ...structuredClone(contributors),
    {
      id: uid(204),
      display_name: 'Quản trị viên demo',
      bio: 'Tài khoản quản trị minh họa',
      university_id: uid(1),
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: uid(205),
      display_name: 'Sinh viên demo',
      bio: 'Tài khoản sinh viên minh họa',
      university_id: uid(1),
      role: 'student',
      created_at: new Date().toISOString(),
    },
    {
      id: uid(206),
      display_name: 'Kiểm duyệt viên demo',
      bio: 'Tài khoản kiểm duyệt minh họa',
      university_id: uid(1),
      role: 'moderator',
      created_at: new Date().toISOString(),
    },
  ],
  accounts: [],
  sessions: {},
  favorites: [],
  ratings: [],
  comments: [],
  reports: [],
  audit: [],
  contacts: [],
  views: [],
  downloads: [],
});
const globalStore = globalThis as typeof globalThis & { uedocsLock?: Promise<unknown> };
export async function readDemo(): Promise<DemoState> {
  try {
    const state = JSON.parse(await fs.readFile(path.join(demoDir(), 'state.json'), 'utf8')) as DemoState;
    state.catalog.document_types ??= structuredClone(catalog.document_types);
    return state;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return initial();
  }
}
// The filesystem lock also serializes Next.js route workers on Windows.
export async function mutateDemo<T>(fn: (state: DemoState) => T | Promise<T>): Promise<T> {
  const run = (globalStore.uedocsLock ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      await fs.mkdir(demoDir(), { recursive: true });
      const lock = path.join(demoDir(), 'write.lock');
      let handle;
      for (let attempt = 0; !handle; attempt++) {
        try {
          handle = await fs.open(lock, 'wx');
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || attempt >= 400) throw error;
          const stat = await fs.stat(lock).catch(() => null);
          if (stat && Date.now() - stat.mtimeMs > 60000) await fs.unlink(lock).catch(() => {});
          await delay(25);
        }
      }
      try {
        const state = await readDemo();
        const result = await fn(state);
        const target = path.join(demoDir(), 'state.json');
        const temporary = target + '.' + randomUUID() + '.tmp';
        await fs.writeFile(temporary, JSON.stringify(state));
        // Antivirus/indexers can briefly hold a file handle during a rename on Windows.
        for (let attempt = 0; ; attempt++) {
          try {
            await fs.rename(temporary, target);
            break;
          } catch (error) {
            if (
              !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code ?? '') ||
              attempt >= 20
            )
              throw error;
            await delay(25 * (attempt + 1));
          }
        }
        return result;
      } finally {
        await handle.close();
        await fs.unlink(lock).catch(() => {});
      }
    });
  globalStore.uedocsLock = run;
  return run;
}
