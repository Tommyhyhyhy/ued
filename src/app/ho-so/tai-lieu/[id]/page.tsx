import { notFound, redirect } from 'next/navigation';
import { getDocument } from '@/lib/repositories';
import { currentUser } from '@/lib/auth';
import { PageHeading } from '@/components/common/ui';
import { EditDocument } from '@/components/documents/edit-document';
import { PdfPreview } from '@/components/documents/pdf-preview';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) redirect('/dang-nhap');
  const d = await getDocument((await params).id, true);
  if (!d || d.uploader_id !== u.id) notFound();
  return (
    <div className="container page-space">
      <PageHeading title="Theo dõi đóng góp" eyebrow="TÀI LIỆU CỦA BẠN" />
      <div className="edit-layout">
        <EditDocument document={d} />
        {d.file.extension === 'pdf' && <PdfPreview url={'/api/documents/' + d.id + '/file'} />}
      </div>
    </div>
  );
}
