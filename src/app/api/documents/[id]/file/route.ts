import { cookies } from 'next/headers';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { getDocument } from '@/lib/repositories';
import { currentUser, AuthError } from '@/lib/auth';
import { canRead } from '@/lib/permissions';
import { isDemo } from '@/lib/config';
import { demoDir, mutateDemo } from '@/lib/repositories/demo-store';
import { adminSupabase } from '@/lib/supabase/server';
import { failure } from '@/lib/http';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const d = await getDocument(id, true);
    const u = await currentUser();
    if (!d || !canRead(d, u)) throw new AuthError('Không tìm thấy tài liệu.', 404);
    const download = new URL(request.url).searchParams.get('download') === '1';
    if (download && !(d.status === 'approved' && d.visibility === 'public'))
      throw new AuthError('Tài liệu chưa được duyệt để tải công khai.', 403);
    if (download) {
      const jar = await cookies();
      let v = jar.get('uedocs_visitor')?.value;
      if (!v) {
        v = randomUUID();
        jar.set('uedocs_visitor', v, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 31536000,
        });
      }
      const hash = createHash('sha256').update(v).digest('hex');
      if (isDemo())
        await mutateDemo((s) => {
          const key = id + hash + new Date().toISOString().slice(0, 10);
          if (!s.downloads.includes(key)) {
            s.downloads.push(key);
            const doc = s.documents.find((x) => x.id === id);
            if (doc) doc.download_count++;
          }
        });
      else {
        const { error } = await adminSupabase().rpc('record_document_event', {
          p_document: id,
          p_visitor: hash,
          p_kind: 'download',
        });
        if (error) throw error;
      }
    }
    if (isDemo()) {
      const relative = d.file.storage_path;
      const filename = relative.startsWith('/samples/')
        ? path.join(process.cwd(), 'public', 'samples', path.basename(relative))
        : path.join(demoDir(), 'files', d.id + '.' + d.file.extension);
      const bytes = await readFile(filename);
      return new Response(bytes, {
        headers: {
          'Content-Type': d.file.mime_type,
          'Content-Disposition':
            (download ? 'attachment' : 'inline') +
            "; filename*=UTF-8''" +
            encodeURIComponent(d.file.safe_name),
          'Content-Length': String(bytes.length),
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const { data, error } = await adminSupabase()
      .storage.from('documents')
      .createSignedUrl(d.file.storage_path, 60, download ? { download: d.file.safe_name } : undefined);
    if (error) throw error;
    return new Response(null, {
      status: 307,
      headers: { Location: data.signedUrl, 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
