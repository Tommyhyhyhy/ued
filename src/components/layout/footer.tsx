import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/common/ui';
import { disclaimer } from '@/lib/utils';
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p>
              Học liệu được sẻ chia,
              <br />
              tri thức được lan tỏa.
            </p>
            <span className="footer-location">Đà Nẵng, Việt Nam</span>
          </div>
          <div>
            <h3>Khám phá</h3>
            <Link href="/tai-lieu">Kho tài liệu</Link>
            <Link href="/#khoa">Khoa & môn học</Link>
            <Link href="/dong-gop">Đóng góp tài liệu</Link>
            <Link href="/gioi-thieu">Về UEDocs</Link>
          </div>
          <div>
            <h3>Cộng đồng</h3>
            <Link href="/quy-dinh">Quy định nội dung</Link>
            <Link href="/quyen-rieng-tu">Quyền riêng tư</Link>
            <Link href="/ban-quyen">Chính sách bản quyền</Link>
            <Link href="/lien-he?subject=report">Báo cáo tài liệu</Link>
          </div>
          <div>
            <h3>Kết nối với chúng mình</h3>
            <Link href="/lien-he">
              Gửi lời nhắn <ArrowUpRight size={14} />
            </Link>
            <span>Email: đang cập nhật</span>
            <span>GitHub: sắp công bố</span>
            <div className="independent-tag">Một dự án vì cộng đồng</div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{disclaimer}</p>
          <span>© 2026 UEDocs</span>
        </div>
      </div>
    </footer>
  );
}
