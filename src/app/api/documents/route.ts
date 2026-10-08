import { listDocuments } from '@/lib/repositories';
import { failure, json } from '@/lib/http';
export async function GET(request: Request) {
  try {
    return json(await listDocuments(Object.fromEntries(new URL(request.url).searchParams)));
  } catch (e) {
    return failure(e);
  }
}
