import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
export const metadata = { title: 'Không có quyền truy cập', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <div className="container not-found">
      <ShieldAlert size={55} />
      <span>403</span>
      <h1>Bạn chưa có quyền truy cập khu vực này.</h1>
      <p>Chỉ ban kiểm duyệt và quản trị viên được sử dụng các chức năng này.</p>
      <Link className="button primary" href="/ho-so">
        Quay lại hồ sơ
      </Link>
    </div>
  );
}
