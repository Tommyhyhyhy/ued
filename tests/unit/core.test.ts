import { allowedOrigin } from '@/lib/config';
import { describe, it, expect } from 'vitest';
import { catalog, demoDocuments } from '@/data/demo';
import { normalize, publicDocument, safeNextPath } from '@/lib/utils';
import { filterDocuments } from '@/lib/repositories/search';
import { canEdit, canRead, isStaff, canUpload } from '@/lib/permissions';
import { validateFile, safeFilename, uploadSchema } from '@/lib/validation';
import { zipSync, strToU8 } from 'fflate';
describe('Vietnamese search and visibility', () => {
  it('normalizes accents and đ', () => expect(normalize('Đại số – Tâm lý học')).toBe('dai so – tam ly hoc'));
  it('finds accent-insensitive course names and codes', () => {
    expect(filterDocuments(demoDocuments, { q: 'tam ly hoc' }, catalog).map((d) => d.title)).toContain(
      'Tài liệu Tâm lý học đại cương',
    );
    expect(
      filterDocuments(demoDocuments, { q: 'UED101' }, catalog).every(
        (d) => d.course_id === catalog.courses[0].id,
      ),
    ).toBe(true);
  });
  it('never exposes pending/hidden/rejected records', () =>
    expect(filterDocuments(demoDocuments, {}, catalog).every(publicDocument)).toBe(true));
  it('combines faculty, file and rating filters', () => {
    const rows = filterDocuments(
      demoDocuments,
      { faculty: catalog.faculties[0].id, file: 'pdf', rating: '4.7' },
      catalog,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (d) =>
          d.faculty_id === catalog.faculties[0].id && d.file.extension === 'pdf' && d.average_rating >= 4.7,
      ),
    ).toBe(true);
  });
  it('sorts download counts descending', () => {
    const rows = filterDocuments(demoDocuments, { sort: 'downloads' }, catalog);
    expect(rows[0].download_count).toBeGreaterThanOrEqual(rows.at(-1)!.download_count);
  });
});
describe('authorization', () => {
  const pending = demoDocuments.find((d) => d.status === 'pending')!;
  const owner = { id: pending.uploader_id, role: 'contributor' as const };
  const stranger = { id: 'other', role: 'student' as const };
  it('protects pending documents from guests and other users', () => {
    expect(canRead(pending, null)).toBe(false);
    expect(canRead(pending, stranger)).toBe(false);
    expect(canRead(pending, owner)).toBe(true);
  });
  it('only permits editable states and staff', () => {
    expect(canEdit(pending, owner)).toBe(true);
    expect(canEdit({ ...pending, status: 'approved' }, owner)).toBe(false);
    expect(canEdit(pending, stranger)).toBe(false);
    expect(isStaff('student')).toBe(false);
    expect(canUpload('student')).toBe(false);
  });
});
describe('server file validation', () => {
  const pdf = strToU8('%PDF-1.7\nDemo');
  it('accepts bounded PDF with matching MIME', () =>
    expect(validateFile('my.pdf', 'application/pdf', pdf, 1024).extension).toBe('pdf'));
  it('rejects spoofed extension, MIME, empty and oversized files', () => {
    expect(() => validateFile('a.exe', 'application/pdf', pdf, 1024)).toThrow();
    expect(() => validateFile('a.pdf', 'text/plain', pdf, 1024)).toThrow();
    expect(() => validateFile('a.pdf', 'application/pdf', new Uint8Array(), 1024)).toThrow();
    expect(() => validateFile('a.pdf', 'application/pdf', pdf, 3)).toThrow();
    expect(() => validateFile('a.pdf', 'application/pdf', strToU8('not pdf'), 1024)).toThrow();
  });
  it('validates Office containers rather than accepting any ZIP', () => {
    const fake = zipSync({ 'hello.txt': strToU8('hello') });
    expect(() =>
      validateFile(
        'a.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fake,
        1024,
      ),
    ).toThrow();
    const real = zipSync({
      '[Content_Types].xml': strToU8('<Types/>'),
      'word/document.xml': strToU8('<w:document/>'),
    });
    expect(
      validateFile(
        'a.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        real,
        4096,
      ).extension,
    ).toBe('docx');
  });
  it('rejects traversal and executable archive entries', () =>
    expect(() =>
      validateFile('a.zip', 'application/zip', zipSync({ '../evil.exe': strToU8('test') }), 4096),
    ).toThrow());
  it('sanitizes filenames', () => expect(safeFilename('../../Đề thi?.PDF')).toBe('de-thi.pdf'));
  it('requires both rights confirmations', () =>
    expect(uploadSchema.safeParse({ rights_confirmation: false, privacy_confirmation: false }).success).toBe(
      false,
    ));
});

describe('request origin protection', () => {
  it('accepts configured loopback origin and rejects foreign origins', () => {
    expect(allowedOrigin('http://127.0.0.1:3100', 'http://127.0.0.1:3100')).toBe(true);
    for (const origin of [
      'https://attacker.test',
      'http://127.0.0.1:3000',
      'http://127.0.0.1.attacker.test:3100',
      'null',
    ])
      expect(allowedOrigin(origin, 'http://127.0.0.1:3100')).toBe(false);
  });
});

it('keeps post-login redirects on the same origin', () => {
  expect(safeNextPath('/dong-gop?step=1')).toBe('/dong-gop?step=1');
  for (const value of [
    '//evil.example',
    '/\\evil.example',
    '/\n/evil.example',
    'https://evil.example',
    'javascript:alert(1)',
  ])
    expect(safeNextPath(value)).toBe('/ho-so');
});
