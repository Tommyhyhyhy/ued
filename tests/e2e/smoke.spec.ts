import { test, expect, type APIRequestContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { catalog, uid } from '../../src/data/demo';
const id = uid(1000);
async function login(request: APIRequestContext, role = 'contributor') {
  const r = await request.post('/api/auth', { data: { action: 'demo', role } });
  expect(r.ok()).toBeTruthy();
}
const metadata = (title: string) => ({
  title,
  description: 'Tài liệu do bộ kiểm thử tạo để xác minh luồng đóng góp và kiểm duyệt.',
  university_id: uid(1),
  faculty_id: uid(10),
  major_id: '',
  course_id: uid(100),
  academic_year: '2025–2026',
  semester: '1',
  document_type: 'Bài giảng',
  language: 'vi',
  rights_confirmation: true,
  privacy_confirmation: true,
});
test('homepage, metadata, command palette and dark mode', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('sinh viên UED');
  await expect(page.locator('#khoa .faculty-card')).toHaveCount(8);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    /^http:\/\/127\.0\.0\.1:3100\/?$/,
  );
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bật giao diện tối' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('accent-insensitive search, URL persistence and faculty filtering', async ({ page }) => {
  await page.goto('/tai-lieu');
  await page.getByRole('textbox', { name: 'Tìm trong kho tài liệu' }).fill('tam ly hoc');
  await expect(page).toHaveURL(/q=tam/);
  await expect(page.locator('.browse-grid')).toContainText('Tài liệu Tâm lý học đại cương');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Tìm trong kho tài liệu' })).toHaveValue('tam ly hoc');
  await page.getByRole('button', { name: 'Xóa từ khóa' }).click();
  await expect(page).not.toHaveURL(/q=/);
  await page.getByLabel('Khoa', { exact: true }).selectOption(catalog.faculties[1].id);
  await expect(page).toHaveURL(/faculty=/);
  await expect(page.locator('.browse-grid .doc-faculty')).toHaveCount(2);
  await expect(page.locator('.browse-grid')).toContainText('Khoa Lý – Hóa');
  await page.getByRole('button', { name: 'Dạng danh sách' }).click();
  await expect(page.locator('.browse-grid')).toHaveClass(/as-list/);
});
test('document PDF renders and supports navigation and zoom', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/tai-lieu/bai-giang-nhap-mon-lap-trinh');
  await expect(page.locator('.react-pdf__Page canvas')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.pdf-toolbar')).toContainText('Trang 1 / 3');
  await page.getByRole('button', { name: 'Trang tiếp', exact: true }).click();
  await expect(page.locator('.pdf-toolbar')).toContainText('Trang 2 / 3');
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await expect(page.locator('.pdf-toolbar')).toContainText('120%');
  expect(errors).toEqual([]);
});
test('favorites persist, rating/comment/report are recorded', async ({ page }) => {
  const request = page.request;
  await login(request);
  await page.goto('/tai-lieu/bai-giang-nhap-mon-lap-trinh');
  await expect(page.locator('.interactions')).toHaveAttribute('aria-busy', 'false');
  const save = page.getByRole('button', { name: 'Lưu tài liệu', exact: true });
  if (await save.count()) await save.click();
  await expect(page.getByRole('button', { name: 'Đã lưu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '5 sao', exact: true }).click();
  await expect(page.getByRole('button', { name: '5 sao', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const comment = 'Cảm ơn cộng đồng đã chia sẻ học liệu hữu ích. ' + Date.now();
  await page.getByLabel('Chia sẻ điều bạn thấy hữu ích').fill(comment);
  await page.getByRole('button', { name: 'Gửi bình luận' }).click();
  await expect(page.locator('.comment').filter({ hasText: comment })).toHaveCount(1);
  await page.getByRole('button', { name: 'Báo cáo vi phạm', exact: true }).click();
  await page
    .getByLabel('Mô tả và bằng chứng')
    .fill('Báo cáo minh họa cho kiểm thử, nội dung không có vi phạm thật.');
  await page.getByRole('button', { name: 'Gửi báo cáo', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/yeu-thich');
  await expect(page.locator('.document-grid')).toContainText('Bài giảng Nhập môn lập trình');
});
test('contributor completes four-step upload, pending is private, moderator approves', async ({ page }) => {
  const request = page.request;
  await login(request);
  await page.goto('/dong-gop');
  await page.getByLabel('Chọn file tài liệu').setInputFiles('public/samples/sample.pdf');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  const title = 'Tài liệu kiểm thử tự động ' + Date.now();
  await page.getByLabel('Tiêu đề tài liệu *').fill(title);
  await page
    .getByLabel('Mô tả *')
    .fill('Học liệu do bộ kiểm thử tự động tạo để xác minh luồng đóng góp đầy đủ.');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('checkbox').nth(0).check();
  await page.getByRole('checkbox').nth(1).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Gửi tài liệu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cảm ơn bạn đã sẻ chia!' })).toBeVisible();
  await page.getByRole('link', { name: 'Xem tài liệu đã đăng' }).click();
  const row = page.locator('.my-document').filter({ hasText: title });
  await expect(row).toContainText('Chờ duyệt');
  const href = await row.getByRole('link', { name: 'Xem và chỉnh sửa' }).getAttribute('href');
  const docId = href!.split('/').at(-1)!;
  const publicList = await (await request.get('/api/documents?q=' + encodeURIComponent(title))).json();
  expect(publicList.total).toBe(0);
  await login(request, 'student');
  expect((await request.get('/api/documents/' + docId + '/file')).status()).toBe(404);
  expect(
    (
      await request.post('/api/admin', { data: { action: 'moderate', ids: [docId], status: 'approved' } })
    ).status(),
  ).toBe(403);
  await login(request, 'moderator');
  await page.goto('/admin/tai-lieu');
  const modRow = page.getByRole('row').filter({ hasText: title });
  await modRow.getByRole('button', { name: 'Duyệt ' + title, exact: true }).click();
  await expect(modRow).toContainText('Đã duyệt');
  const approved = await (await request.get('/api/documents?q=' + encodeURIComponent(title))).json();
  expect(approved.total).toBe(1);
});

test('admin publishes a document immediately; other roles cannot bypass review', async ({ page }) => {
  const request = page.request;
  await login(request, 'admin');
  await page.goto('/admin/dang-tai-lieu');
  await expect(page.getByRole('heading', { name: 'Đăng tài liệu trực tiếp' })).toBeVisible();
  await page.getByLabel('Chọn file tài liệu').setInputFiles('public/samples/sample.pdf');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  const title = 'Tài liệu đăng trực tiếp ' + Date.now();
  await page.getByLabel('Tiêu đề tài liệu *').fill(title);
  await page
    .getByLabel('Mô tả *')
    .fill('Học liệu do quản trị viên kiểm thử quy trình đăng trực tiếp vào kho công khai.');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('checkbox').nth(0).check();
  await page.getByRole('checkbox').nth(1).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.locator('.review-list')).toContainText('Công khai ngay');
  await page.getByRole('button', { name: 'Đăng công khai ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Tài liệu đã xuất hiện trong kho!' })).toBeVisible();
  const publicLink = page.getByRole('link', { name: 'Xem tài liệu công khai' });
  await expect(publicLink).toHaveAttribute('href', /\/tai-lieu\//);
  await publicLink.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const publicList = await (await request.get('/api/documents?q=' + encodeURIComponent(title))).json();
  expect(publicList.total).toBe(1);
  expect(publicList.items[0].status).toBe('approved');
  await login(request, 'contributor');
  const forged = await request.post('/api/upload', {
    multipart: {
      metadata: JSON.stringify(metadata('Tài liệu không được đăng ngay')),
      publish_immediately: 'true',
      file: {
        name: 'sample.pdf',
        mimeType: 'application/pdf',
        buffer: await readFile('public/samples/sample.pdf'),
      },
    },
  });
  expect(forged.status()).toBe(403);
  await page.goto('/admin/dang-tai-lieu');
  await expect(page).toHaveURL(/khong-co-quyen/);
});
test('server rejects disguised/oversized uploads and ordinary users cannot enter admin', async ({ page }) => {
  const request = page.request;
  await login(request);
  const r = await request.post('/api/upload', {
    multipart: {
      metadata: JSON.stringify(metadata('Tài liệu không hợp lệ cho kiểm thử')),
      file: { name: 'evil.pdf', mimeType: 'application/pdf', buffer: Buffer.from('this is not a PDF') },
    },
  });
  expect(r.status()).toBe(400);
  expect((await r.json()).error).toContain('PDF');
  const big = await request.post('/api/upload', {
    multipart: {
      metadata: JSON.stringify(metadata('Tài liệu vượt giới hạn kiểm thử')),
      file: { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4 * 1024 * 1024) },
    },
  });
  expect(big.status()).toBe(413);
  await login(request, 'student');
  await page.goto('/admin');
  await expect(page).toHaveURL(/khong-co-quyen/);
  expect(
    (await request.post('/api/admin', { data: { action: 'role', id: uid(205), role: 'admin' } })).status(),
  ).toBe(403);
});
test('admin creates/edits a course and audit entry appears', async ({ page }) => {
  const request = page.request;
  await login(request, 'admin');
  await page.goto('/admin/danh-muc');
  await page.getByLabel('Loại danh mục').selectOption('courses');
  await page.getByRole('button', { name: 'Thêm danh mục' }).click();
  const name = 'Học phần thử nghiệm ' + Date.now();
  await page.getByLabel('Tên danh mục', { exact: true }).fill(name);
  await page.getByLabel('Mã học phần', { exact: true }).fill('TEST' + Date.now());
  await page.getByRole('button', { name: 'Lưu danh mục', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  await page.goto('/admin/nhat-ky');
  await expect(page.locator('table')).toContainText(name);
});
test('all requested public routes, 404, and private metadata', async ({ page }) => {
  test.setTimeout(90000);
  const request = page.request;
  for (const url of [
    '/khoa',
    '/khoa/toan-tin',
    '/nganh/su-pham-toan',
    '/mon-hoc/nhap-mon-lap-trinh',
    '/gioi-thieu',
    '/quy-dinh',
    '/ban-quyen',
    '/quyen-rieng-tu',
    '/lien-he',
    '/dang-nhap',
    '/dang-ky',
    '/quen-mat-khau',
  ]) {
    const r = await page.goto(url);
    expect(r?.status(), url).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.goto('/dang-nhap');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  const r = await page.goto('/duong-dan-khong-ton-tai');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Trang này đã lạc khỏi kệ sách.' })).toBeVisible();
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/robots.txt')).status()).toBe(200);
});
for (const width of [375, 768, 1024, 1440])
  test('responsive ' + width + 'px and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await page.screenshot({ path: 'test-results/home-' + width + '.png', fullPage: true, caret: 'initial' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(
      await page
        .locator('.floating-note')
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    if (width === 375) {
      await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await page.goto('/tai-lieu');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 850) {
      await page.getByRole('button', { name: /Bộ lọc/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('dialog').getByLabel('Khoa', { exact: true }).selectOption(uid(11));
      await page.getByRole('button', { name: /Xem .* tài liệu/ }).click();
      await expect(page).toHaveURL(/faculty=/);
    }
    await page.screenshot({
      path: 'test-results/browse-' + width + '.png',
      fullPage: true,
      caret: 'initial',
    });
  });
test('view counts do not increment on rapid refresh', async ({ request }) => {
  const get = async () =>
    (await (await request.get('/api/documents?q=UED101')).json()).items.find(
      (d: { id: string }) => d.id === id,
    ).view_count;
  await request.post('/api/interactions', { data: { action: 'view', document_id: id } });
  const a = await get();
  await request.post('/api/interactions', { data: { action: 'view', document_id: id } });
  const b = await get();
  expect(a).toBe(b);
});
test('approved file download contains valid PDF bytes', async ({ request }) => {
  const r = await request.get('/api/documents/' + id + '/file?download=1');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-disposition']).toContain('attachment');
  expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');
  expect((await readFile('public/samples/sample.pdf')).length).toBeGreaterThan(1000);
});

test('foreign origin is blocked and parallel demo writes are retained', async ({ request }) => {
  await login(request);
  const blocked = await request.post('/api/interactions', {
    headers: { Origin: 'https://foreign.example' },
    data: { action: 'favorite', document_id: id },
  });
  expect(blocked.status()).toBe(403);
  const marker = 'Concurrent QA ' + Date.now();
  const bodies = Array.from({ length: 6 }, (_, i) => marker + ' ' + i);
  const responses = await Promise.all(
    bodies.map((body) =>
      request.post('/api/interactions', {
        headers: { Origin: 'http://127.0.0.1:3100' },
        data: { action: 'comment', document_id: id, body },
      }),
    ),
  );
  expect(responses.every((r) => r.ok())).toBe(true);
  const result = await (await request.get('/api/interactions?document_id=' + id)).json();
  expect(result.comments.filter((c: { body: string }) => c.body.startsWith(marker))).toHaveLength(6);
});

test('contact form reaches admin inbox; student activation appears before upload', async ({ page }) => {
  const request = page.request;
  await login(request, 'admin');
  await request.post('/api/admin', { data: { action: 'role', id: uid(205), role: 'student' } });
  await login(request, 'student');
  await page.goto('/dong-gop');
  await expect(page.getByRole('button', { name: 'Trở thành người đóng góp', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trở thành người đóng góp', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chọn tài liệu', exact: true })).toBeVisible();
  const message = 'Lời nhắn kiểm thử ' + Date.now();
  const result = await request.post('/api/contact', {
    data: { name: 'Sinh viên thử nghiệm', email: 'qa@example.invalid', subject: 'Góp ý thư viện', message },
  });
  expect(result.ok()).toBe(true);
  await login(request, 'admin');
  await request.post('/api/admin', { data: { action: 'role', id: uid(205), role: 'student' } });
  await page.goto('/admin/lien-he');
  await expect(page.getByText(message, { exact: false })).toBeVisible();
});
