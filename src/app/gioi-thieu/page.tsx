import Link from 'next/link';
import { disclaimer } from '@/lib/utils';
export const metadata = {
  title: 'Về UEDocs',
  description: 'Dự án cộng đồng chia sẻ học liệu dành cho sinh viên.',
  alternates: { canonical: '/gioi-thieu' },
};
export default function About() {
  return (
    <div className="container">
      <article className="prose">
        <div className="eyebrow">VỀ CHÚNG MÌNH</div>
        <h1>
          Học liệu được sẻ chia,
          <br />
          tri thức được lan tỏa.
        </h1>
        <p>
          UEDocs – Kho tài liệu học tập sinh viên UED là nơi sinh viên tìm kiếm, chia sẻ và lưu trữ giáo
          trình, slide bài giảng, đề thi, bài tập và tài liệu tham khảo theo từng khoa, ngành và môn học.
        </p>
        <h2>Bắt đầu từ một nhu cầu rất gần</h2>
        <p>
          Một buổi ôn thi, một môn học mới, hay một câu hỏi chưa có lời giải. UEDocs kết nối những học liệu
          hữu ích với người đang cần chúng, để việc học bớt đơn độc và sự sẻ chia trở nên dễ dàng hơn.
        </p>
        <h2>Dành cho UED, mở rộng cùng cộng đồng</h2>
        <p>
          Trường Đại học Sư phạm – Đại học Đà Nẵng là cộng đồng đầu tiên của dự án. Kiến trúc học liệu được tổ
          chức theo trường, khoa, ngành và môn học để có thể đón thêm các cộng đồng đại học trong tương lai.
        </p>
        <h2>Ba điều chúng mình gìn giữ</h2>
        <ul>
          <li>Hữu ích: thông tin rõ ràng, tìm kiếm thuận tiện, tài liệu dễ tiếp cận.</li>
          <li>Tử tế: ghi nhận công sức người đóng góp và tôn trọng nhau khi trao đổi.</li>
          <li>Có trách nhiệm: chỉ sẻ chia nội dung có quyền sử dụng, bảo vệ dữ liệu cá nhân.</li>
        </ul>
        <div className="notice">{disclaimer}</div>
        <p>
          Các tài liệu, tên người đóng góp và số liệu trong chế độ demo đều là dữ liệu minh họa. Hình ảnh và
          biểu tượng thuộc nhận diện riêng của dự án, không phải tài sản chính thức của nhà trường.
        </p>
        <h2>Cùng xây dựng một thư viện tốt hơn</h2>
        <p>
          Bạn có thể <Link href="/dong-gop">đóng góp tài liệu</Link> hoặc{' '}
          <Link href="/lien-he">gửi ý kiến</Link> để giúp UEDocs trở nên hữu ích hơn mỗi ngày.
        </p>
      </article>
    </div>
  );
}
