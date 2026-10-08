'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container not-found">
      <span>Rất tiếc</span>
      <h1>Thư viện đang gặp một chút gián đoạn.</h1>
      <p>Vui lòng thử tải lại. Nếu lỗi tiếp diễn, bạn có thể báo cho chúng mình.</p>
      <div className="form-actions">
        <button className="button primary" onClick={reset}>
          Thử lại
        </button>
        <Link className="button secondary" href="/lien-he">
          Báo lỗi
        </Link>
      </div>
    </div>
  );
}
