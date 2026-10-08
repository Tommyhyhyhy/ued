import Link from 'next/link';
import { BookOpen } from 'lucide-react';
export default function NotFound() {
  return (
    <div className="container not-found">
      <BookOpen size={52} />
      <span>404</span>
      <h1>Trang này đã lạc khỏi kệ sách.</h1>
      <p>Đường dẫn có thể chưa đúng, hoặc tài liệu chưa được công khai.</p>
      <div className="form-actions">
        <Link className="button primary" href="/tai-lieu">
          Tìm tài liệu khác
        </Link>
        <Link className="button secondary" href="/">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
