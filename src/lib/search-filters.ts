import { z } from 'zod';
import type { Filters } from '@/types';
const id = z.uuid().optional().catch(undefined);
const text = z.string().trim().max(160).optional().catch(undefined);
const schema = z.object({
  q: text,
  university: id,
  faculty: id,
  major: id,
  course: id,
  uploader: id,
  type: text,
  file: z.enum(['pdf', 'docx', 'pptx', 'xlsx', 'zip']).optional().catch(undefined),
  semester: z.enum(['1', '2', '3']).optional().catch(undefined),
  year: text,
  language: z.enum(['vi', 'en']).optional().catch(undefined),
  rating: z
    .string()
    .regex(/^[0-5](\.[0-9])?$/)
    .optional()
    .catch(undefined),
  verified: z.enum(['true', 'false']).optional().catch(undefined),
  since: z.iso.date().optional().catch(undefined),
  sort: z.enum(['relevance', 'newest', 'downloads', 'views', 'rating', 'az']).optional().catch(undefined),
  page: z
    .string()
    .regex(/^\d{1,5}$/)
    .optional()
    .catch(undefined),
});
export const parseFilters = (input: unknown): Filters => schema.parse(input);
