import Link from 'next/link';
export const metadata = { title: 'Chính sách quyền riêng tư', alternates: { canonical: '/quyen-rieng-tu' } };
export default function Page() {
  return (
    <div className="container">
      <article className="prose">
        <div className="eyebrow">THÔNG TIN CỦA BẠN</div>
        <h1>Chính sách quyền riêng tư</h1>
        <h2>Thông tin được xử lý</h2>
        <p>
          UEDocs sử dụng email để xác thực tài khoản; tên hiển thị, tiểu sử, tài liệu và bình luận để cung cấp
          tính năng cộng đồng. Danh sách yêu thích thuộc về từng tài khoản. Lời nhắn và báo cáo chỉ dành cho
          bộ phận quản trị có quyền xử lý.
        </p>
        <h2>Cookie và lưu trữ trên thiết bị</h2>
        <p>
          Cookie phiên đăng nhập giúp duy trì truy cập an toàn. Mã khách ngẫu nhiên giúp giảm lượt xem và lượt
          tải trùng trong ngày. Lựa chọn giao diện và từ khóa tìm kiếm gần đây được lưu trên trình duyệt; bạn
          có thể xóa chúng trong cài đặt dữ liệu trang.
        </p>
        <h2>Mục đích và nhà cung cấp</h2>
        <p>
          Trong chế độ thật, Supabase xử lý xác thực, cơ sở dữ liệu và file; Vercel có thể cung cấp hạ tầng
          website. Dữ liệu dùng để vận hành dịch vụ, bảo vệ hệ thống và giải quyết báo cáo. Website không tích
          hợp quảng cáo theo dõi trong phiên bản này.
        </p>
        <h2>Chế độ demo</h2>
        <p>
          Dữ liệu thử nghiệm được lưu trong máy chủ demo và có thể bị đặt lại. Không sử dụng tài liệu riêng tư
          hoặc thông tin nhạy cảm khi trải nghiệm. Việc đăng ký trong demo không gửi email xác minh thật.
        </p>
        <h2>Quản lý và yêu cầu xóa</h2>
        <p>
          Bạn có thể sửa hồ sơ, bỏ lưu tài liệu và đăng xuất. Để yêu cầu truy cập, sửa hoặc xóa dữ liệu tài
          khoản khác, hãy <Link href="/lien-he">liên hệ ban quản trị</Link>. Nhật ký kiểm duyệt có thể cần giữ
          trong thời gian xử lý báo cáo và bảo vệ tính toàn vẹn hệ thống; thời gian lưu cụ thể sẽ được công bố
          trước khi dịch vụ vận hành chính thức.
        </p>
      </article>
    </div>
  );
}
