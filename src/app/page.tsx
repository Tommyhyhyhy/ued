import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Sparkles,
  BookOpen,
  Download,
  Users,
  GraduationCap,
  Binary,
  Atom,
  Sprout,
  MessagesSquare,
  Globe,
  Brain,
  Blocks,
  Palette,
  Check,
  Heart,
} from 'lucide-react';
import { getCatalog, listDocuments, getPublicStats } from '@/lib/repositories';
import { isDemo } from '@/lib/config';
import { Reveal, Counter } from '@/components/common/motion';
import { DocumentCard } from '@/components/documents/document-card';
import { SectionHeading } from '@/components/common/ui';
const icons = [Binary, Atom, Sprout, MessagesSquare, Globe, Brain, Blocks, Palette];
export const dynamic = 'force-dynamic';
export default async function Home() {
  const [catalog, page, newest, stats] = await Promise.all([
    getCatalog(),
    listDocuments({ sort: 'downloads' }),
    listDocuments({ sort: 'newest' }),
    getPublicStats(),
  ]);
  const docs = page.items;
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <span className="hero-kicker">
              <span className="tiny-spark">✦</span> CÙNG NHAU HỌC TỐT HƠN
            </span>
            <h1>
              Kho tài liệu học tập
              <br />
              dành cho{' '}
              <span>
                sinh viên UED
                <svg viewBox="0 0 320 12" aria-hidden="true">
                  <path
                    d="M2 8 Q155 -3 316 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p>
              Tìm nhanh giáo trình, slide, đề thi, bài tập và tài liệu tham khảo theo từng khoa, ngành và môn
              học.
            </p>
            <form action="/tim-kiem" className="hero-search">
              <Search size={22} />
              <input name="q" placeholder="Tìm môn học, mã học phần, tài liệu…" aria-label="Tìm tài liệu" />
              <button className="button primary" type="submit" aria-label="Tìm kiếm tài liệu">
                <span>Tìm kiếm</span>
                <ArrowRight size={19} />
              </button>
            </form>
            <div className="search-tags">
              <span>Tìm nhiều:</span>
              {['Đề thi', 'Bài giảng', 'Giáo trình', 'Bài tập'].map((t) => (
                <Link href={'/tai-lieu?type=' + encodeURIComponent(t)} key={t}>
                  {t}
                </Link>
              ))}
            </div>
            <div className="hero-actions">
              <Link href="/tai-lieu" className="text-link">
                Khám phá tài liệu <ArrowRight size={17} />
              </Link>
              <Link href="/dong-gop" className="subtle-link">
                Đóng góp tài liệu <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="community-proof">
              <div className="avatar-stack">
                {['M', 'N', 'S', 'L'].map((t, i) => (
                  <span key={t} style={{ background: ['#d9e7ff', '#fde7be', '#d3efdf', '#e6ddff'][i] }}>
                    {t}
                  </span>
                ))}
              </div>
              <div>
                <strong>Mỗi chia sẻ, thêm một cơ hội học tốt.</strong>
                <small>Được xây dựng bởi tinh thần cộng đồng.</small>
              </div>
            </div>
          </Reveal>
          <Reveal className="hero-art" delay={0.1}>
            <div className="hero-image-wrap">
              <Image
                src="/illustrations/hero.png"
                alt="Sách xanh và những trang học liệu đang mở, biểu tượng cho tri thức được sẻ chia"
                width={620}
                height={620}
                priority
              />
              <span className="art-caption">SHARE KNOWLEDGE. GROW TOGETHER.</span>
            </div>
            <div className="floating-note top">
              <span className="note-icon">
                <BookOpen size={20} />
              </span>
              <div>
                Góc học tập của bạn<small>Tất cả học liệu, một nơi.</small>
              </div>
              <Check size={17} className="brand-blue" />
            </div>
            <div className="floating-note bottom">
              <span className="note-heart">
                <Heart size={21} fill="currentColor" />
              </span>
              <div>
                Chia sẻ một tài liệu<small>Lan tỏa ngàn điều hay</small>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <div className="container">
        <section className="stats-strip" aria-label="Thống kê minh họa">
          {[
            [BookOpen, stats.documents, 'Tài liệu sẻ chia'],
            [GraduationCap, catalog.courses.length, 'Môn học'],
            [Download, stats.downloads, 'Lượt tải tài liệu'],
            [Users, stats.contributors, 'Người đóng góp'],
          ].map(([Icon, n, label], i) => {
            const I = Icon as typeof BookOpen;
            return (
              <div className="stat" key={i}>
                <I size={25} />
                <div>
                  <strong>
                    <Counter value={n as number} />
                  </strong>
                  <span>{label as string}</span>
                </div>
              </div>
            );
          })}
        </section>
        <p className="demo-caption">
          {isDemo()
            ? 'Số liệu cộng đồng đang được minh họa trong bản trải nghiệm.'
            : 'Tri thức được sẻ chia từ cộng đồng.'}
        </p>
      </div>
      <section className="section container" id="khoa">
        <SectionHeading
          eyebrow="BẮT ĐẦU TỪ ĐIỀU BẠN HỌC"
          title="Tìm học liệu theo khoa"
          description="Một góc học tập dành riêng cho ngành của bạn."
          href="/khoa"
        />
        <div className="faculty-grid">
          {catalog.faculties.map((f, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal delay={i * 0.035} key={f.id}>
                <Link className={'faculty-card ' + f.color} href={'/khoa/' + f.slug}>
                  <span className="faculty-icon">
                    <Icon size={25} strokeWidth={1.6} />
                  </span>
                  <h3>{f.name}</h3>
                  <span className="faculty-count">
                    {catalog.courses.filter((c) => c.faculty_id === f.id).length} môn học <b>·</b>{' '}
                    {stats.faculties[f.id] ?? 0} tài liệu
                  </span>
                  <ArrowUpRight className="faculty-arrow" size={18} />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="section soft-section">
        <div className="container">
          <SectionHeading
            eyebrow="ĐƯỢC CỘNG ĐỒNG YÊU THÍCH"
            title="Học liệu đáng để khám phá"
            description="Những tài liệu hữu ích cho hành trình học tập của bạn."
            href="/tai-lieu?sort=downloads"
          />
          <div className="document-grid">
            {docs.slice(0, 6).map((d, i) => (
              <Reveal key={d.id} delay={(i % 3) * 0.05}>
                <DocumentCard document={d} catalog={catalog} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="THÊM MỘT CHÚT KIẾN THỨC MỖI NGÀY"
          title="Vừa được chia sẻ"
          href="/tai-lieu?sort=newest"
        />
        <div className="home-tabs">
          {[
            ['Mới nhất', 'newest'],
            ['Tải nhiều', 'downloads'],
            ['Đánh giá cao', 'rating'],
            ['Đề thi', 'exam'],
            ['Giáo trình', 'book'],
          ].map(([t, v], i) => (
            <Link
              className={i === 0 ? 'active' : ''}
              href={
                '/tai-lieu?' + (v === 'exam' ? 'type=Đề+thi' : v === 'book' ? 'type=Giáo+trình' : 'sort=' + v)
              }
              key={v}
            >
              {t}
            </Link>
          ))}
        </div>
        <div className="document-grid">
          {newest.items.slice(0, 3).map((d) => (
            <DocumentCard key={d.id} document={d} catalog={catalog} />
          ))}
        </div>
      </section>
      <section className="section how-section">
        <div className="container">
          <SectionHeading eyebrow="HỌC TẬP THẬT ĐƠN GIẢN" title="Từ một tìm kiếm, đến nhiều khám phá" />
          <div className="steps-grid">
            {[
              [
                Search,
                '01',
                'Tìm điều bạn cần',
                'Tìm theo môn học, khoa hoặc từ khóa. Học liệu phù hợp luôn ở gần bạn.',
              ],
              [
                BookOpen,
                '02',
                'Xem trước. Học ngay.',
                'Đọc trực tiếp trên trình duyệt hoặc tải về để học theo nhịp của riêng mình.',
              ],
              [
                Heart,
                '03',
                'Chia sẻ để cùng tiến bộ',
                'Đóng góp học liệu bạn có quyền chia sẻ. Một điều nhỏ, giá trị lớn.',
              ],
            ].map(([Icon, n, t, d]) => {
              const I = Icon as typeof Search;
              return (
                <Reveal key={n as string} className="step">
                  <span className="step-number">{n as string}</span>
                  <I size={27} />
                  <h3>{t as string}</h3>
                  <p>{d as string}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      <section className="container cta-wrap">
        <Reveal className="community-cta">
          <div>
            <span className="eyebrow">
              <Sparkles size={16} /> TRI THỨC LỚN LÊN KHI ĐƯỢC SẺ CHIA
            </span>
            <h2>
              Một tài liệu bạn chia sẻ có thể giúp
              <br />
              hàng trăm sinh viên học tốt hơn.
            </h2>
            <p>Cùng nhau xây dựng một thư viện mở, hữu ích và tử tế.</p>
          </div>
          <Link href="/dong-gop" className="button white">
            Chia sẻ tài liệu ngay <ArrowUpRight size={19} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
