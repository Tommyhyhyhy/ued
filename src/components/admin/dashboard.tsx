import Link from 'next/link';
import { Files, Clock3, CheckCircle, Flag, Users, Download, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import type { StudyDocument, Catalog, Report, Profile } from '@/types';
import { number } from '@/lib/utils';
export function Dashboard({
  documents,
  profiles,
  reports,
  catalog,
  downloads,
}: {
  documents: StudyDocument[];
  profiles: Profile[];
  reports: Report[];
  catalog: Catalog;
  downloads: { day: string; count: number }[];
}) {
  const stats = [
    [Files, 'Tổng tài liệu', documents.length],
    [Clock3, 'Chờ kiểm duyệt', documents.filter((d) => d.status === 'pending').length],
    [CheckCircle, 'Đã được duyệt', documents.filter((d) => d.status === 'approved').length],
    [Flag, 'Báo cáo đang mở', reports.filter((r) => r.status === 'open').length],
    [Users, 'Thành viên', profiles.length],
    [Download, 'Lượt tải', documents.reduce((n, d) => n + d.download_count, 0)],
    [Eye, 'Lượt xem', documents.reduce((n, d) => n + d.view_count, 0)],
  ];
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 6 + i);
    return {
      label: dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      count: documents.filter((d) => d.created_at.slice(0, 10) === dt.toISOString().slice(0, 10)).length,
    };
  });
  return (
    <>
      <header className="page-heading">
        <div>
          <div className="eyebrow">CÙNG NUÔI DƯỠNG TRI THỨC</div>
          <h1>Tổng quan thư viện</h1>
          <p>Một góc nhìn về cộng đồng và những đóng góp mới.</p>
        </div>
      </header>
      <div className="admin-stats">
        {stats.map(([Icon, label, n]) => {
          const I = Icon as typeof Files;
          return (
            <div className="panel" key={label as string}>
              <I size={21} />
              <span>{label as string}</span>
              <strong>{number(n as number)}</strong>
            </div>
          );
        })}
      </div>
      <div className="admin-charts">
        <section className="panel">
          <h2>Lượt tải · 7 ngày</h2>
          <p className="muted">Lượt tải được ghi nhận mỗi tài liệu, mỗi trình duyệt, mỗi ngày.</p>
          <div
            className="bar-chart"
            role="img"
            aria-label={downloads.map((d) => d.day + ': ' + d.count + ' lượt tải').join(', ')}
          >
            {downloads.map((d) => (
              <div key={d.day}>
                <strong>{d.count}</strong>
                <span
                  style={{
                    height:
                      Math.max(3, (d.count / Math.max(1, ...downloads.map((x) => x.count))) * 130) + 'px',
                  }}
                />
                <small>{d.day.slice(8) + '/' + d.day.slice(5, 7)}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Tài liệu đóng góp · 7 ngày</h2>
          <div
            className="bar-chart"
            role="img"
            aria-label={days.map((d) => d.label + ': ' + d.count + ' tài liệu').join(', ')}
          >
            {days.map((d) => (
              <div key={d.label}>
                <strong>{d.count}</strong>
                <span style={{ height: Math.max(3, d.count * 28) + 'px' }} />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Phân bố theo khoa</h2>
          <div className="horizontal-chart">
            {catalog.faculties.map((f) => {
              const n = documents.filter((d) => d.faculty_id === f.id).length;
              return (
                <div key={f.id}>
                  <span>{f.name.replace('Khoa ', '')}</span>
                  <div>
                    <i style={{ width: Math.max(2, (n / Math.max(documents.length, 1)) * 100) + '%' }} />
                  </div>
                  <strong>{n}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h2>Phân bố loại tài liệu</h2>
          <div className="horizontal-chart">
            {[...new Set(documents.map((d) => d.document_type))].map((t) => {
              const n = documents.filter((d) => d.document_type === t).length;
              return (
                <div key={t}>
                  <span>{t}</span>
                  <div>
                    <i style={{ width: (n / Math.max(documents.length, 1)) * 100 + '%' }} />
                  </div>
                  <strong>{n}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h2>
            <TrendingUp size={20} /> Được tải nhiều
          </h2>
          <ol className="trending-list">
            {[...documents]
              .sort((a, b) => b.download_count - a.download_count)
              .slice(0, 5)
              .map((d) => (
                <li key={d.id}>
                  <span>{d.title}</span>
                  <strong>{number(d.download_count)}</strong>
                </li>
              ))}
          </ol>
          <Link className="text-link" href="/admin/tai-lieu">
            Xem toàn bộ tài liệu <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </>
  );
}
