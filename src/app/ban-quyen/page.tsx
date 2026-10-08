import Link from 'next/link';
export const metadata = {
  title: 'Bản quyền và yêu cầu gỡ tài liệu',
  alternates: { canonical: '/ban-quyen' },
};
export default function Page() {
  return (
    <div className="container">
      <article className="prose">
        <div className="eyebrow">TÔN TRỌNG NGƯỜI TẠO RA TRI THỨC</div>
        <h1>Chính sách bản quyền</h1>
        <p>
          UEDocs hỗ trợ học tập thông qua nội dung được chia sẻ hợp lệ. Người đăng chịu trách nhiệm về quyền
          chia sẻ và tính chính xác của thông tin cung cấp.
        </p>
        <h2>Nội dung được phép</h2>
        <p>
          Bạn có thể đăng nội dung do mình tạo, tài liệu có giấy phép cho phép phân phối hoặc tài liệu được
          chủ sở hữu đồng ý cho chia sẻ công khai. Nêu nguồn và điều kiện sử dụng; việc một tài liệu có sẵn
          trên Internet không mặc nhiên tạo ra quyền đăng lại.
        </p>
        <h2>Nội dung không được phép</h2>
        <ul>
          <li>Sách, giáo trình hoặc khóa học trả phí bị sao chép trái phép.</li>
          <li>Tài liệu có dữ liệu cá nhân hoặc thông tin riêng tư chưa được phép công bố.</li>
          <li>Đề thi và đáp án chưa được đơn vị có thẩm quyền cho công bố.</li>
          <li>File độc hại, nội dung gây hại hoặc tài liệu vi phạm quy định cộng đồng.</li>
        </ul>
        <h2>Yêu cầu gỡ nội dung</h2>
        <p>
          Chủ sở hữu hoặc người được ủy quyền có thể sử dụng <Link href="/lien-he">biểu mẫu liên hệ</Link>,
          chọn “Yêu cầu gỡ tài liệu”. Nếu đã đăng nhập, bạn cũng có thể bấm “Báo cáo vi phạm” ngay trên trang
          tài liệu.
        </p>
        <p>Vui lòng cung cấp:</p>
        <ul>
          <li>Tên và email để ban quản trị phản hồi.</li>
          <li>Liên kết chính xác đến tài liệu trên UEDocs.</li>
          <li>Mô tả tác phẩm gốc và phần nội dung bị ảnh hưởng.</li>
          <li>Bằng chứng về quyền sở hữu hoặc ủy quyền, cùng nguồn đối chiếu.</li>
          <li>Xác nhận thông tin yêu cầu là chính xác theo hiểu biết của bạn.</li>
        </ul>
        <h2>Quy trình xử lý</h2>
        <p>
          Ban quản trị xem xét yêu cầu, có thể tạm ẩn nội dung trong quá trình xác minh, liên hệ người đóng
          góp và ghi lại kết quả xử lý. Nội dung xác định không có quyền chia sẻ sẽ được gỡ. Yêu cầu thiếu
          thông tin có thể cần bổ sung trước khi có kết luận.
        </p>
        <h2>Phản hồi của người đóng góp</h2>
        <p>
          Nếu cho rằng tài liệu bị xử lý nhầm, hãy gửi thông tin quyền sử dụng và liên kết tài liệu qua biểu
          mẫu liên hệ. Không đăng lại nội dung đang bị khiếu nại để né quy trình xác minh.
        </p>
      </article>
    </div>
  );
}
