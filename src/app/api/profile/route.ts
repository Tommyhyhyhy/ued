import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { guard, failure, json } from '@/lib/http';
import { isDemo } from '@/lib/config';
import { mutateDemo } from '@/lib/repositories/demo-store';
import { supabase } from '@/lib/supabase/server';
export async function PATCH(request: Request) {
  try {
    await guard(request, 'profile');
    const user = await requireUser();
    const body = await request.json();
    if (body.become_contributor === true) {
      if (isDemo())
        await mutateDemo((s) => {
          const p = s.profiles.find((p) => p.id === user.id)!;
          if (p.role === 'student') p.role = 'contributor';
        });
      else {
        const { error } = await (await supabase()).rpc('become_contributor');
        if (error) throw error;
      }
      return json({ ok: true });
    }
    const input = z
      .object({ display_name: z.string().trim().min(2).max(70), bio: z.string().trim().max(500) })
      .parse(body);
    if (isDemo())
      await mutateDemo((s) => {
        Object.assign(
          s.profiles.find((p) => p.id === user.id)!,
          input,
        );
      });
    else {
      const { error } = await (await supabase()).from('profiles').update(input).eq('id', user.id);
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
