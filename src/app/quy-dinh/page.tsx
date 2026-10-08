import Link from 'next/link';
export const metadata = { title: 'Quy định cộng đồng', alternates: { canonical: '/quy-dinh' } };
export default function Page() {
  return (
    <div className="container">
      <article className="prose">
        <div className="eyebrow">CỘNG ĐỒNG HỌC TẬP TỬ TẾ</div>
        <h1>Quy định nội dung</h1>
        <p>
          UEDocs dành cho việc học tập và sẻ chia có trách nhiệm. Khi tham gia, hãy cùng gìn giữ những nguyên
          tắc sau.
        </p>
        <h2>Chỉ đóng góp nội dung bạn được phép chia sẻ</h2>
        <p>
          Ưu tiên ghi chép do bạn tự biên soạn, học liệu có giấy phép mở hoặc nội dung đã được tác giả cho
          phép. Ghi rõ nguồn, phạm vi sử dụng và giấy phép nếu có. Không tải lên bản sao trái phép của sách,
          khóa học trả phí hoặc tài liệu có giới hạn truy cập.
        </p>
        <h2>Bảo vệ người khác và sự công bằng học thuật</h2>
        <p>
          Không đăng dữ liệu cá nhân, thông tin tài khoản, chữ ký, hồ sơ riêng tư, đề thi hoặc đáp án chưa
          được phép công bố. Không sử dụng UEDocs để tổ chức gian lận, quấy rối, phát tán mã độc hoặc quảng
          cáo không liên quan.
        </p>
        <h2>Thông tin tài liệu rõ ràng</h2>
        <p>
          Chọn đúng trường, khoa, môn học và loại tài liệu. Tránh tiêu đề gây hiểu nhầm, spam, bản trùng lặp
          hoặc file không thể đọc. Đánh giá và bình luận dựa trên chất lượng nội dung, với ngôn ngữ tôn trọng.
        </p>
        <h2>Kiểm duyệt và xử lý vi phạm</h2>
        <p>
          Tài liệu mới ở trạng thái chờ duyệt và chưa công khai. Ban kiểm duyệt có thể yêu cầu bổ sung, từ
          chối, tạm ẩn hoặc gỡ nội dung vi phạm, đồng thời lưu lý do xử lý. Kiểm duyệt thủ công không đồng
          nghĩa với chứng nhận tài liệu không có virus.
        </p>
        <h2>Phản hồi và khiếu nại</h2>
        <p>
          Sử dụng nút “Báo cáo vi phạm” trên tài liệu hoặc <Link href="/lien-he">biểu mẫu liên hệ</Link>. Cung
          cấp liên kết và thông tin cụ thể để ban quản trị xác minh. Đọc thêm{' '}
          <Link href="/ban-quyen">chính sách bản quyền</Link>.
        </p>
      </article>
    </div>
  );
}
