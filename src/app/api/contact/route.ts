import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { guard, failure, json } from '@/lib/http';
import { isDemo } from '@/lib/config';
import { mutateDemo } from '@/lib/repositories/demo-store';
import { adminSupabase } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    await guard(request, 'contact', 5);
    const b = await request.json();
    if (b.website) return json({ ok: true });
    const input = z
      .object({
        name: z.string().trim().min(2).max(70),
        email: z.email().max(254),
        subject: z.string().trim().min(2).max(100),
        message: z.string().trim().min(10).max(5000),
      })
      .parse(b);
    const row = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      message: input.subject + '\n' + input.message,
      created_at: new Date().toISOString(),
    };
    if (isDemo()) await mutateDemo((s) => s.contacts.unshift(row));
    else {
      const { error } = await adminSupabase().from('contact_messages').insert(row);
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
