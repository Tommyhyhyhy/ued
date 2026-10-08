import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { userDocuments } from '@/lib/repositories';
import { PageHeading, Badge, EmptyState } from '@/components/common/ui';
import { date, statusLabels } from '@/lib/utils';
export const metadata = { title: 'Tài liệu đã đóng góp' };
export default async function MyDocuments() {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap');
  const docs = await userDocuments(user.id);
  return (
    <div className="container page-space">
      <PageHeading
        eyebrow="ĐÓNG GÓP CỦA BẠN"
        title="Tài liệu đã sẻ chia"
        action={
          <Link className="button primary" href="/dong-gop">
            Đóng góp mới
          </Link>
        }
      >
        Theo dõi tiến trình kiểm duyệt và học liệu bạn đã đóng góp.
      </PageHeading>
      {docs.length ? (
        <div className="my-documents">
          {docs.map((d) => (
            <article key={d.id} className="panel my-document">
              <div>
                <Badge tone={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'rose' : 'gold'}>
                  {statusLabels[d.status]}
                </Badge>
                <h2>{d.title}</h2>
                <p>
                  {date(d.created_at)} · {d.file.extension.toUpperCase()}
                </p>
                {d.rejection_reason && <div className="notice warning">Lý do: {d.rejection_reason}</div>}
              </div>
              <div>
                <Link className="button secondary small" href={'/ho-so/tai-lieu/' + d.id}>
                  Xem và chỉnh sửa
                </Link>
                {d.status === 'approved' && (
                  <Link className="text-link" href={'/tai-lieu/' + d.slug}>
                    Xem công khai
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Bắt đầu từ tài liệu đầu tiên"
          description="Một tài liệu bạn chia sẻ có thể giúp thêm nhiều bạn học."
          action={
            <Link className="button primary" href="/dong-gop">
              Đóng góp tài liệu
            </Link>
          }
        />
      )}
    </div>
  );
}
