'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Search, Moon, Sun, ArrowUpRight, Command } from 'lucide-react';
import { Logo } from '@/components/common/ui';
import type { Profile } from '@/types';
const links = [
  ['/', 'Trang chủ'],
  ['/tai-lieu', 'Khám phá'],
  ['/#khoa', 'Khoa'],
  ['/gioi-thieu', 'Giới thiệu'],
];
export function Header() {
  const path = usePathname();
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  const [dark, setDark] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    setDark(localStorage.getItem('theme') === 'dark');
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setProfile(d.user ?? null))
      .catch(() => {});
  }, [path]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommand((v) => !v);
      }
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  function theme() {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }
  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <Logo />
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {links.map(([href, label]) => (
              <Link key={href} className={path === href ? 'active' : ''} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="quick-search" onClick={() => setCommand(true)} aria-label="Tìm nhanh">
              <Search size={17} />
              <span>Tìm kiếm</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              onClick={theme}
              aria-label={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Link href={profile ? '/ho-so' : '/dang-nhap'} className="login-link">
              {profile ? profile.display_name : 'Đăng nhập'}
            </Link>
            <Link className="button small primary contribute-nav" href="/dong-gop">
              Đóng góp <ArrowUpRight size={16} />
            </Link>
            <button
              className="icon-button mobile-trigger"
              onClick={() => setMobile(true)}
              aria-label="Mở menu"
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="mobile-menu">
            <Dialog.Title>Khám phá UEDocs</Dialog.Title>
            <Dialog.Description>Học liệu dành cho cộng đồng sinh viên.</Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng menu">
              <X />
            </Dialog.Close>
            <nav>
              {[
                ...links,
                ['/dong-gop', 'Đóng góp tài liệu'],
                ['/yeu-thich', 'Tài liệu đã lưu'],
                ['/dang-nhap', 'Đăng nhập'],
              ].map(([href, label]) => (
                <Link href={href} key={href} onClick={() => setMobile(false)}>
                  {label}
                </Link>
              ))}
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={command} onOpenChange={setCommand}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="command-dialog">
            <Dialog.Title>
              <Command size={20} /> Tìm nhanh tài liệu
            </Dialog.Title>
            <Dialog.Description>Nhập tên tài liệu, môn học hoặc mã học phần.</Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng tìm kiếm">
              <X />
            </Dialog.Close>
            <form action="/tim-kiem" onSubmit={() => setCommand(false)} className="search-form">
              <Search size={20} />
              <input name="q" aria-label="Từ khóa tìm nhanh" placeholder="Bạn đang muốn học gì?" autoFocus />
              <button className="button primary">Tìm</button>
            </form>
            <div className="command-links">
              {['Nhập môn lập trình', 'Tâm lý học', 'Đề thi'].map((q) => (
                <Link key={q} href={'/tim-kiem?q=' + encodeURIComponent(q)} onClick={() => setCommand(false)}>
                  <Search size={15} />
                  {q}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
            <small>Nhấn Esc để đóng · Ctrl / ⌘ + K để mở</small>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
