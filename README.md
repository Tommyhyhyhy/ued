# UEDocs

**UEDocs – Kho tài liệu học tập sinh viên UED**. Website chia sẻ học liệu, có demo chạy ngay và adapter Supabase dành cho vận hành thật.

> UEDocs là dự án cộng đồng độc lập dành cho sinh viên, không phải cổng thông tin chính thức của Trường Đại học Sư phạm – Đại học Đà Nẵng.

## Chạy local

Yêu cầu Node.js **22.13+** (khuyến nghị Node 24 LTS), pnpm 11.19.


```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

PowerShell dùng `Copy-Item .env.example .env.local` thay cho `cp` nếu cần. Mở **http://127.0.0.1:3000**. Không cần Supabase để xem và thử website. `NEXT_PUBLIC_SITE_URL` cần khớp origin đang mở trên trình duyệt để kiểm tra CSRF hoạt động đúng.

Trang đăng nhập có nút **Trải nghiệm demo**. Để thử các vai trò quản trị trên máy phát triển, đặt `DEMO_ADMIN_ENABLED=true` trong `.env.local`, khởi động lại rồi chọn vai trò ở `/dang-nhap`. Quyền này **luôn bị tắt trong production**, kể cả khi biến được bật. Sinh viên thường không có quyền vào `/admin`.

## Công nghệ và cấu trúc

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4.
- Bộ component riêng, Radix Dialog cho focus trap/Escape, Motion, Lucide, Sonner.
- Supabase PostgreSQL, Auth SSR/PKCE, Storage private, RLS.
- React Hook Form + Zod; PDF.js qua React-PDF 11 và worker nội bộ.
- Vitest, PostgreSQL WASM PGlite, Playwright; ESLint + Prettier.
- Font Be Vietnam Pro được phục vụ nội bộ, không phụ thuộc Google Fonts khi chạy/build.

TypeScript 6.0.3 và ESLint 9.39.5 được chọn vì tương thích với `typescript-eslint` và plugin React hiện tại. TypeScript 7/ESLint 10 chưa tương thích hoàn toàn với tổ hợp lint này. Lockfile cố định phiên bản để CI tái lập được.

```text
src/app/                  Trang public, auth, hồ sơ, admin và API
src/components/           Layout, tìm kiếm, PDF, upload, auth, quản trị
src/types/                Model dữ liệu có kiểu
src/lib/repositories/     Cổng dữ liệu chung + Supabase + demo store
src/lib/supabase/         Client chỉ chạy ở server
src/lib/validation/       Form và kiểm tra file thực tế
src/lib/permissions/      Quyền ứng dụng
src/data/                 1 trường, 8 khoa, 8 ngành, 20 môn, 28 học liệu
supabase/migrations/      Schema, indexes, RLS, routine, storage policies
supabase/seed.sql          Dữ liệu minh họa tái lập từ TypeScript
tests/unit/              Search, validation, permissions
tests/database/          SQL/RLS thực thi trong PostgreSQL WASM
tests/e2e/               Luồng trình duyệt và responsive
public/samples/          File PDF, DOCX, PPTX, XLSX, ZIP nguyên bản
public/branding/         Logo placeholder và hướng dẫn thay nhận diện
```

## Các chức năng

Trang chủ; kho tài liệu với tìm kiếm không dấu, filter theo URL, lưới/danh sách và phân trang; trang khoa/ngành/môn; chi tiết tài liệu và PDF có chuyển trang/zoom/fit/fullscreen; tải file; lưu yêu thích; rating, bình luận, báo cáo; upload 4 bước; hồ sơ và chỉnh sửa tài liệu pending; quản trị kiểm duyệt, báo cáo, người dùng, danh mục, nhật ký. Có hộp thư liên hệ tại `/admin/lien-he`, biểu đồ lượt tải 7 ngày, dark mode, menu mobile, bộ lọc dạng drawer, command palette Ctrl/Cmd+K, reduced motion, skeleton, error/404/403, metadata/OG/sitemap/robots và chính sách tiếng Việt.

## Chế độ demo

Kích hoạt khi `DEMO_MODE=true` **hoặc** thiếu URL/anon key. Demo dùng repository riêng, lưu metadata, tài khoản thử nghiệm, session, bình luận, yêu thích, báo cáo và hoạt động kiểm duyệt trong `.demo-data/`; file mới trong `.demo-data/files/`. Mật khẩu demo được băm bằng scrypt, session là token ngẫu nhiên lưu băm phía server và cookie HttpOnly. Không gửi email thật.

Các tên người và học liệu đều minh họa. File mẫu có nội dung gốc ghi rõ không phải học liệu chính thức. Số liệu mẫu không phản ánh hoạt động thật của trường. Trên Vercel demo lưu trong `/tmp`, có thể bị mất hoặc khác nhau giữa các instance; **không dùng demo cho dữ liệu thật**. Khi dùng Supabase, API không đọc danh tính/vai trò demo.

## Biến môi trường

| Biến                               | Ý nghĩa                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | Origin chuẩn, ví dụ `https://uedocs.example`; không có dấu `/` cuối           |
| `NEXT_PUBLIC_SUPABASE_URL`         | URL Supabase project                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Publishable/anon API key; an toàn ở client khi RLS đúng                       |
| `SUPABASE_SERVICE_ROLE_KEY`        | **Chỉ server**: lưu trữ, ký URL, rate limit, ghi sự kiện và lời nhắn          |
| `DEMO_MODE`                        | `true` để demo; `false` khi cấu hình Supabase thật                            |
| `DEMO_ADMIN_ENABLED`               | Chỉ cho phát triển local; không có hiệu lực trong production                  |
| `MAX_UPLOAD_SIZE_MB`               | Mặc định 3 MB; ứng dụng giới hạn tối đa 3 MB để tương thích Vercel multipart  |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | Bật nút Google sau khi cấu hình provider                                      |
| `MALWARE_SCANNER_URL`              | HTTPS endpoint nhận binary, trả JSON `{ "verdict": "clean" }` hoặc `infected` |
| `MALWARE_SCANNER_TOKEN`            | Token dịch vụ quét, chỉ server                                                |

Không commit `.env.local`; không đặt prefix `NEXT_PUBLIC_` cho khóa bí mật. `.env.example` không chứa secret.

## Cấu hình Supabase

1. Tạo project Supabase mới; lấy project URL, anon key và service-role key từ phần API settings. Điền `.env.local`, đặt `DEMO_MODE=false`.
2. Trong SQL Editor chạy **toàn bộ** `supabase/migrations/202609190001_initial.sql`, hoặc dùng Supabase CLI:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Migration tạo các bảng, khóa ngoại nhiều trường, indexes, full-text search `simple` + `unaccent`, triggers, giới hạn quyền SQL, RLS và bucket **documents** private (3 MB). Không tạo bucket public, không tắt RLS. Nếu extension `unaccent` đã có ở schema khác, routine tự tìm đúng namespace.
4. Để dùng dữ liệu minh họa, chạy `supabase/seed.sql` trong SQL Editor. Seed không tạo tài khoản có mật khẩu hay admin thật; các email `example.invalid` chỉ là tác giả giả lập. Sau đó chạy:

   ```sh
   pnpm seed:files --confirm-demo-project
   ```

   Script dùng service role tại server để đưa file mẫu vào bucket private. Không chạy seed lên dữ liệu vận hành. Có thể tái tạo SQL bằng `pnpm seed:generate`.

5. Auth → URL Configuration: đặt Site URL theo domain thật; cho phép `https://YOUR_DOMAIN/auth/callback` và callback local nếu cần phát triển. Bật xác minh email và cấu hình SMTP cho email xác nhận/khôi phục đáng tin cậy.
6. Đăng ký tài khoản qua website và xác minh email. Tài khoản thật mặc định là `student`; kích hoạt quyền đóng góp từ hồ sơ. Thao tác này chỉ thêm `contributor`, không cấp quyền quản trị.

### Quản trị viên đầu tiên

Sau khi tài khoản đã đăng ký, chủ dự án thực hiện trong SQL Editor bằng tài khoản có quyền quản lý database:

```sql
-- Xác minh đúng email và UUID trước khi cấp quyền.
select id, email from auth.users where email = 'YOUR_ADMIN_EMAIL';
insert into public.user_roles(user_id, role)
values ('VERIFIED_USER_UUID', 'admin')
on conflict do nothing;
```

Không có chức năng cấp admin từ metadata đăng ký, localStorage hoặc giá trị role do client tự gửi. Sau khi có admin, quản lý vai trò tại `/admin/nguoi-dung`; server và database đều kiểm tra lại quyền.

### Google OAuth (tùy chọn)

Tạo Google OAuth web client, cấu hình redirect URI do trang Supabase Google provider hiển thị, lưu client ID/secret trong Supabase Auth → Providers → Google. Đặt `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`, giữ callback website trong allowlist. Không đưa Google client secret vào frontend.

## Bảo mật file và kiểm duyệt

- Server xác thực phiên, quyền contributor, kích thước thực tế, extension, MIME, magic bytes và cấu trúc ZIP/Office; chặn đường dẫn traversal, archive quá lớn và tệp thực thi phổ biến. Tên được sanitize, checksum SHA-256 do server tính.
- File mới luôn pending và không công khai. Storage path được tạo server theo `user-id/document-id/random-safe-name`.
- File approved không thể bị uploader ghi đè. API download chỉ ký path lấy từ DB sau kiểm tra quyền; URL hết hạn sau 60 giây. URL đã ký còn hiệu lực tới khi hết hạn, kể cả nội dung vừa bị ẩn.
- Có hook quét virus, **không tích hợp sẵn antivirus**. Khi thiếu dịch vụ, lưu `not_configured` và hiển thị kiểm duyệt thủ công. Không tự gắn nhãn sạch. Scanner lỗi hoặc báo nhiễm thì upload bị từ chối.
- Việc kiểm tra magic bytes không thay thế antivirus. Ban quản trị cần thiết lập quy trình xem xét file nghi ngờ trước khi vận hành thật.
- Rate limit cho API ghi chạy trong database ở chế độ Supabase; demo dùng bộ đếm trong process. Kiểm tra Origin và cookie SameSite giảm CSRF; dữ liệu người dùng được render như văn bản.
- Upload multipart mặc định 3 MB vì Vercel Functions có giới hạn body. Muốn nhận file lớn: triển khai signed staging upload trực tiếp vào bucket private, xác thực kích thước/nội dung ở bước finalize, rồi cập nhật giới hạn DB/storage/API đồng bộ. Không chỉ tăng một biến môi trường.

## Kiểm thử

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm start
```

Playwright dùng server riêng **127.0.0.1:3100**, `.next-e2e/` và `.demo-data-e2e/`, không sửa dữ liệu demo đang xem tại port 3000. Có ảnh kiểm tra 375/768/1024/1440 trong `test-results/`; báo cáo HTML tại `playwright-report/index.html`.

`pnpm test` thực thi migration + seed + RLS bằng PostgreSQL WASM với schema Auth/Storage mô phỏng và quyền mặc định tương tự Supabase. Các test đổi `SET ROLE`, không kiểm tra RLS bằng database owner. Chúng kiểm tra DB/SQL, **không thay thế** kiểm thử một project Supabase thật về email, OAuth, refresh session, Storage HTTP và signed URL. Báo cáo thực chạy được ghi trong `docs/QA.md`.

## Triển khai GitHub + Vercel

1. Tạo repository GitHub và push source cùng lockfile. Không đưa `.env.local`, `.demo-data`, file upload riêng tư hoặc `.next` vào Git.
2. Import repository vào Vercel; chọn preset **Next.js**, Node 24, install `pnpm install --frozen-lockfile`, build `pnpm build`.
3. Điền các biến môi trường production ở bảng trên; để `DEMO_ADMIN_ENABLED=false`. Muốn vận hành thật cần đủ URL, anon key, service-role key và `DEMO_MODE=false`.
4. Áp dụng migrations/seed tùy môi trường, hoàn thành Auth callbacks và cấp admin đầu tiên như hướng dẫn Supabase.
5. Deploy; xác minh đăng ký/xác nhận email, đăng nhập, upload pending, duyệt, signed download, quyền của người dùng thường và chính sách RLS trên project thật trước khi mở đăng ký công khai.
6. Vercel → Settings → Domains: thêm custom domain, cấu hình bản ghi DNS theo Vercel. Cập nhật `NEXT_PUBLIC_SITE_URL` và Supabase Site URL/redirect allowlist, redeploy.
7. Các lần push tiếp theo vào `main` kích hoạt CI rồi deployment theo Git integration. PR có preview deployment; dùng Supabase project riêng cho preview để tách dữ liệu production. Migration cần review và áp dụng trước hoặc cùng bản code tương ứng.

GitHub Actions chạy lint, type-check, unit/SQL tests, browser tests, production build và lưu test artifacts. Chưa tạo repository remote, chưa deploy public và chưa cấu hình tài khoản dịch vụ trong workspace này.

## Triển khai Render bằng Uvicorn

Repository có sẵn [render.yaml](./render.yaml), [main.py](./main.py) và [requirements.txt](./requirements.txt). FastAPI chạy bằng Uvicorn ở cổng public của Render, đồng thời khởi động Next.js ở cổng nội bộ 3001 và chuyển tiếp toàn bộ request.

Khi tạo **Blueprint** từ repository trên Render, cấu hình sẽ tự dùng:

```sh
# Build command
pip install -r requirements.txt && pnpm install --frozen-lockfile && pnpm build

# Start command
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Nếu tạo Web Service thủ công, **Build Command phải chứa đủ ba bước** như trên. Chỉ chạy `pip install -r requirements.txt` sẽ không tạo gói Next.js standalone và dịch vụ không thể khởi động.

Health check là `/__render_health`. Render tự điền hostname public vào `NEXT_PUBLIC_SITE_URL`. Bản Blueprint mặc định bật demo công khai và tắt đăng nhập admin demo. Dữ liệu/file ghi trong demo mode có thể mất khi Render khởi động lại; để vận hành thật, cấu hình Supabase và đặt `DEMO_MODE=false` trong Dashboard.

## Vận hành tiếp theo

Trước khi ra mắt: hoàn thiện danh mục môn học thực tế với chủ dự án; thay email/GitHub và tài sản nhận diện được cấp phép; cấu hình SMTP, Google nếu cần, antivirus, backup/retention và cảnh báo lỗi. Dashboard quản trị hiện đọc tối đa 200 bản ghi mỗi nhóm; khi thư viện lớn cần bổ sung phân trang quản trị và thống kê SQL đầy đủ. Các màn hình public đã phân trang phía server.
