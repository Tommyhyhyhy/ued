'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  Flag,
  Users,
  Library,
  History,
  Mail,
  UploadCloud,
  ArrowUpRight,
} from 'lucide-react';
import type { Role } from '@/types';
export function AdminShell({
  children,
  demo,
  role,
}: {
  children: React.ReactNode;
  demo: boolean;
  role: Role;
}) {
  const path = usePathname();
  const links = [
    ['/admin', 'Tổng quan', LayoutDashboard],
    ['/admin/tai-lieu', 'Kiểm duyệt tài liệu', Files],
    ['/admin/bao-cao', 'Báo cáo vi phạm', Flag],
    ...(role === 'admin'
      ? [
          ['/admin/dang-tai-lieu', 'Đăng tài liệu trực tiếp', UploadCloud],
          ['/admin/nguoi-dung', 'Người dùng', Users],
          ['/admin/danh-muc', 'Danh mục', Library],
          ['/admin/nhat-ky', 'Nhật ký hệ thống', History],
          ['/admin/lien-he', 'Hộp thư liên hệ', Mail],
        ]
      : []),
  ];
  return (
    <div className="container admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">KHÔNG GIAN QUẢN TRỊ</span>
        <h2>Chăm chút thư viện.</h2>
        <nav>
          {links.map(([href, label, Icon]) => {
            const I = Icon as typeof Files;
            return (
              <Link key={href as string} className={path === href ? 'active' : ''} href={href as string}>
                <I size={18} />
                {label as string}
              </Link>
            );
          })}
        </nav>
        <Link href="/tai-lieu" className="text-link">
          Xem website
          <ArrowUpRight size={15} />
        </Link>
        {demo && <div className="notice">Đang sử dụng dữ liệu minh họa</div>}
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
