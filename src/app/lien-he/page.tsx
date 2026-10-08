import { PageHeading } from '@/components/common/ui';
import { ContactForm } from '@/components/common/contact-form';
export const metadata = { title: 'Liên hệ và góp ý', alternates: { canonical: '/lien-he' } };
export default function Page() {
  return (
    <div className="container page-space">
      <PageHeading eyebrow="CHÚNG MÌNH LUÔN LẮNG NGHE" title="Một lời nhắn, một điều tốt hơn.">
        Góp ý, báo lỗi, yêu cầu gỡ tài liệu hoặc đề xuất hợp tác với cộng đồng UEDocs.
      </PageHeading>
      <div className="contact-layout">
        <ContactForm />
        <aside className="panel">
          <h2>Liên hệ UEDocs</h2>
          <p className="muted">
            Sử dụng biểu mẫu để gửi yêu cầu đến ban quản trị. Email công khai và kho GitHub sẽ được bổ sung
            khi dự án chính thức vận hành.
          </p>
          <div className="notice">
            Đối với yêu cầu bản quyền, vui lòng nêu liên kết tài liệu, nội dung bị ảnh hưởng và thông tin
            chứng minh quyền sở hữu.
          </div>
          <p className="muted">
            UEDocs là dự án cộng đồng độc lập, không phải kênh tiếp nhận chính thức của nhà trường.
          </p>
        </aside>
      </div>
    </div>
  );
}
