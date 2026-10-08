# Báo cáo kiểm thử UEDocs

Ngày thực hiện: 19/09/2026. Môi trường Windows, Node.js 24, pnpm 11.19.0.

## Kết quả đã thực chạy

| Kiểm tra                         | Kết quả                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Thành công; dependency và lockfile đã cố định phiên bản |
| `pnpm lint`                      | Thành công, không lỗi/cảnh báo ESLint                   |
| `pnpm typecheck`                 | Thành công, TypeScript strict                           |
| `pnpm test`                      | **30/30 đạt**: 15 unit và 15 SQL/RLS                    |
| `pnpm test:e2e`                  | **17/17 đạt**, Chromium, khoảng 57 giây ở lượt cuối     |
| `pnpm build`                     | Thành công, không còn cảnh báo build                    |
| `pnpm format`                    | Đã định dạng source, cấu hình và tài liệu               |

Dev server đang dùng `http://127.0.0.1:3000`. Playwright chạy riêng ở port 3100 với thư mục build và dữ liệu riêng.

## Luồng đã xác minh

- Trang chủ, canonical, command palette Ctrl+K/Escape, dark mode giữ trạng thái sau reload.
- Tìm kiếm tiếng Việt không dấu, môn/mã học phần, filter theo khoa, URL query, grid/list.
- PDF hiển thị canvas, chuyển trang, zoom; file tải về có bytes PDF hợp lệ.
- Lưu yêu thích, đánh giá, bình luận, gửi báo cáo.
- Upload PDF qua đủ bốn bước; bước xem lại không tự gửi. File pending chưa công khai; người khác không đọc được; moderator duyệt và tài liệu xuất hiện công khai.
- File giả PDF và file vượt dung lượng bị từ chối.
- Người dùng thường không vào admin và không gọi API nâng quyền.
- Admin thêm môn học và xem audit log.
- Các route public, legal/auth, 404, noindex, sitemap và robots.
- Menu và filter drawer mobile, Escape đóng dialog.
- 375, 768, 1024, 1440 px: trang chủ và danh sách không tràn ngang; reduced motion tắt chuyển động không cần thiết.
- PDF tại 375 px: đọc/chuyển trang được, metadata vẫn hiện, giao diện sáng/tối.
- Yêu cầu ghi từ origin khác bị chặn; sáu lần ghi đồng thời vào demo store được giữ đầy đủ.
- Student kích hoạt contributor trước khi upload; tin liên hệ xuất hiện trong hộp thư admin.

## SQL/RLS đã xác minh

Migration và seed được chạy bằng PostgreSQL WASM/PGlite với các extension thực và schema Auth/Storage mô phỏng. Test sử dụng `SET ROLE anon/authenticated/service_role`, bao gồm quyền mặc định rộng tương tự Supabase.

Đã kiểm tra: chỉ tài liệu approved/public xuất hiện với khách; quyền owner trên pending; cấm tự duyệt, sửa counters, đổi role; moderator duyệt kèm audit; chỉ admin sửa danh mục; foreign key đa trường; favorite theo chủ sở hữu; rating không đổi chủ/document; đường dẫn Storage; deduplicate lượt xem; full-text search không dấu.

RPC tìm kiếm phù hợp được kiểm tra về thứ hạng title so với description, phân trang, total trên trang rỗng, bộ lọc file, cấu trúc kết quả và giữ RLS kể cả khi người gọi là moderator.

## Rà soát giao diện

Đã mở bản local trong trình duyệt của ứng dụng và xem ảnh do Playwright tạo. Bố cục desktop/tablet/mobile, thẻ tài liệu, font tiếng Việt, trạng thái rỗng, PDF sáng/tối đã được kiểm tra trực quan.

Ảnh được tái tạo trong `test-results/` khi chạy E2E:

- `home-375.png`, `home-768.png`, `home-1024.png`, `home-1440.png`
- `browse-375.png`, `browse-768.png`, `browse-1024.png`, `browse-1440.png`
- `pdf-375.png`, `pdf-dark-375.png`

Báo cáo HTML: `playwright-report/index.html`.

## Những lỗi đã sửa trong quá trình kiểm tra

- So sánh Origin sai vì NextURL chuẩn hóa loopback: dùng public origin cấu hình, giữ kiểm tra protocol/host/port.
- Nội dung bị ẩn với reduced motion: reveal không ẩn nội dung SSR.
- Tự gửi upload khi chuyển sang bước cuối: tách identity của nút chuyển bước và nút submit.
- Ghi demo đồng thời trên Windows: khóa ghi giữa workers, file tạm riêng và retry rename khi file bị khóa ngắn hạn.
- Quá tám khoa làm icon undefined: thêm fallback luân phiên.
- Metadata bị giấu trên mobile, ảnh OG tài liệu bị bỏ trống, live search không xếp hạng relevance.
- Quyền mặc định Supabase quá rộng, namespace unaccent và rating upsert: thu hẹp grant và dùng RPC có kiểm tra quyền.
- Redirect sau đăng nhập: xác minh origin để chặn URL bên ngoài.

## Phạm vi chưa được xác minh bằng dịch vụ thật

Chưa có credentials Supabase, SMTP/Google OAuth, antivirus hoặc tài khoản triển khai. Do đó **chưa kiểm thử end-to-end trên Supabase thật** về xác nhận email, khôi phục mật khẩu, OAuth, refresh session, Storage HTTP và signed URL; chưa deploy public và chưa chạy CI trên GitHub.

Demo sử dụng file local (hoặc thư mục tạm trên Vercel), không phù hợp làm kho dữ liệu production. File demo là học liệu minh họa nguyên bản; không phải tài liệu chính thức của trường. Khi chưa cấu hình scanner, trạng thái là `not_configured` và yêu cầu kiểm duyệt thủ công, không có tuyên bố đã quét virus.

Dashboard hiện đọc tối đa 200 bản ghi mỗi nhóm; cần phân trang và thống kê tổng hợp khi vận hành ở quy mô lớn. Chưa thực hiện kiểm toán accessibility độc lập hay đo Lighthouse trên domain production.
