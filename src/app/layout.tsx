import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { siteUrl } from '@/lib/config';
const site = siteUrl();
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'UEDocs – Kho tài liệu học tập sinh viên UED', template: '%s | UEDocs' },
  description:
    'Tìm kiếm, chia sẻ và lưu trữ giáo trình, slide, đề thi và tài liệu học tập dành cho sinh viên UED.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'UEDocs',
    title: 'UEDocs – Học liệu được sẻ chia',
    description: 'Kho tài liệu học tập dành cho sinh viên UED.',
    images: [{ url: '/og.png', width: 1731, height: 909 }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/branding/ued-logo-placeholder.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'light'}catch{}",
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Bỏ qua điều hướng
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
