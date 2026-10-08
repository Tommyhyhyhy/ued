'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react';
import type { Catalog, Filters, DocumentPage } from '@/types';
import { DocumentCard } from '@/components/documents/document-card';
import { normalize } from '@/lib/utils';
import { EmptyState } from '@/components/common/ui';

export function DocumentBrowser({
  catalog,
  initial,
  filters: initialFilters,
}: {
  catalog: Catalog;
  initial: DocumentPage;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters.q ?? '');
  const [list, setList] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggest, setSuggest] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    setFilters(initialFilters);
    setQuery(initialFilters.q ?? '');
  }, [initialFilters]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('uedocs-searches') ?? '[]'));
    } catch {}
  }, []);
  const update = (patch: Filters) => {
    const next = { ...filters, ...patch, page: patch.page ?? '1' };
    setFilters(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    startTransition(() => router.replace(pathname + '?' + params.toString(), { scroll: false }));
  };
  useEffect(() => {
    if (query === (initialFilters.q ?? '')) return;
    const t = setTimeout(() => {
      const next = { ...initialFilters, q: query, page: '1' };
      const p = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v) p.set(k, v);
      });
      startTransition(() => router.replace(pathname + '?' + p.toString(), { scroll: false }));
    }, 350);
    return () => clearTimeout(t);
  }, [query, initialFilters, pathname, router]);
  function saveSearch() {
    const q = query.trim();
    if (q) {
      const values = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
      localStorage.setItem('uedocs-searches', JSON.stringify(values));
      setRecent(values);
    }
    setSuggest(false);
  }
  const selected = Object.entries(filters).filter(([k, v]) => v && !['q', 'page', 'sort'].includes(k));
  function renderFilterFields(prefix: string) {
    return (
      <>
        <div className="filter-title">
          <h2>Bộ lọc</h2>
          <button
            onClick={() => {
              setQuery('');
              setFilters({});
              router.replace(pathname);
            }}
          >
            Xóa tất cả
          </button>
        </div>
        {[
          ['university', 'Trường', catalog.universities.map((x) => [x.id, x.short_name + ' — ' + x.name])],
          [
            'faculty',
            'Khoa',
            catalog.faculties
              .filter((x) => !filters.university || x.university_id === filters.university)
              .map((x) => [x.id, x.name]),
          ],
          [
            'major',
            'Ngành',
            catalog.majors
              .filter((x) => !filters.faculty || x.faculty_id === filters.faculty)
              .map((x) => [x.id, x.name]),
          ],
          [
            'course',
            'Môn học',
            catalog.courses
              .filter((x) => !filters.faculty || x.faculty_id === filters.faculty)
              .map((x) => [x.id, x.name]),
          ],
          [
            'semester',
            'Học kỳ',
            [
              ['1', 'Học kỳ 1'],
              ['2', 'Học kỳ 2'],
              ['3', 'Học kỳ hè'],
            ],
          ],
          [
            'year',
            'Năm học',
            [
              ['2025–2026', '2025–2026'],
              ['2026–2027', '2026–2027'],
            ],
          ],
          ['type', 'Loại tài liệu', catalog.document_types.map((t) => [t.name, t.name])],
          ['file', 'Định dạng', ['pdf', 'docx', 'pptx', 'xlsx', 'zip'].map((t) => [t, t.toUpperCase()])],
          [
            'language',
            'Ngôn ngữ',
            [
              ['vi', 'Tiếng Việt'],
              ['en', 'Tiếng Anh'],
            ],
          ],
          [
            'rating',
            'Đánh giá',
            [
              ['4', 'Từ 4 sao'],
              ['4.5', 'Từ 4.5 sao'],
            ],
          ],
        ].map(([key, label, options]) => (
          <div className="field" key={key as string}>
            <label htmlFor={'filter-' + prefix + '-' + key}>{label as string}</label>
            <select
              id={'filter-' + prefix + '-' + key}
              value={filters[key as keyof Filters] ?? ''}
              onChange={(e) =>
                update({
                  [key as string]: e.target.value,
                  ...(key === 'faculty'
                    ? { major: '', course: '' }
                    : key === 'university'
                      ? { faculty: '', major: '', course: '' }
                      : {}),
                })
              }
            >
              <option value="">Tất cả</option>
              {(options as string[][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="field">
          <label htmlFor={'filter-since-' + prefix}>Đăng từ ngày</label>
          <input
            id={'filter-since-' + prefix}
            type="date"
            value={filters.since ?? ''}
            onChange={(e) => update({ since: e.target.value })}
          />
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={filters.verified === 'true'}
            onChange={(e) => update({ verified: e.target.checked ? 'true' : '' })}
          />
          Đã kiểm duyệt
        </label>
      </>
    );
  }
  return (
    <div className="browse-layout">
      <aside className="filter-sidebar">{renderFilterFields('desktop')}</aside>
      <div className="browse-results">
        <div className="browse-search">
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveSearch();
              update({ q: query });
            }}
          >
            <Search size={21} />
            <input
              aria-label="Tìm trong kho tài liệu"
              placeholder="Tên tài liệu, môn học, mã học phần…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSuggest(true)}
              onBlur={() => setTimeout(() => setSuggest(false), 180)}
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label="Xóa từ khóa"
                onClick={() => setQuery('')}
              >
                <X size={16} />
              </button>
            )}
            <button className="button primary">Tìm</button>
          </form>
          {suggest && (
            <div className="search-suggestions">
              <small>{query ? 'Gợi ý môn học' : 'Tìm kiếm gần đây'}</small>
              {(query
                ? catalog.courses
                    .filter((c) => normalize(c.name + ' ' + c.code).includes(normalize(query)))
                    .slice(0, 4)
                    .map((c) => c.name)
                : recent
              ).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    setSuggest(false);
                  }}
                >
                  <Clock3 size={14} />
                  {q}
                </button>
              ))}
              {!query && !recent.length && <span>Thử “Tâm lý học” hoặc “UED101”.</span>}
            </div>
          )}
        </div>
        <div className="results-toolbar">
          <p>
            <strong>{initial.total}</strong> tài liệu
            {filters.q && (
              <>
                {' '}
                cho <mark>{filters.q}</mark>
              </>
            )}
          </p>
          <div>
            <button className="button secondary small mobile-filter" onClick={() => setDrawer(true)}>
              <SlidersHorizontal size={16} />
              Bộ lọc{selected.length > 0 ? ' (' + selected.length + ')' : ''}
            </button>
            <select
              aria-label="Sắp xếp tài liệu"
              className="select sort-select"
              value={filters.sort ?? 'newest'}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="relevance">Phù hợp nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="downloads">Tải nhiều nhất</option>
              <option value="views">Xem nhiều nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="az">Tên A–Z</option>
            </select>
            <div className="view-buttons">
              <button
                className={'icon-button ' + (!list ? 'selected' : '')}
                onClick={() => setList(false)}
                aria-label="Dạng lưới"
                aria-pressed={!list}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                className={'icon-button ' + (list ? 'selected' : '')}
                onClick={() => setList(true)}
                aria-label="Dạng danh sách"
                aria-pressed={list}
              >
                <List size={19} />
              </button>
            </div>
          </div>
        </div>
        {selected.length > 0 && (
          <div className="active-filters">
            {selected.map(([k, v]) => (
              <button key={k} onClick={() => update({ [k]: '' })}>
                {[...catalog.faculties, ...catalog.courses, ...catalog.majors, ...catalog.universities].find(
                  (x) => x.id === v,
                )?.name ?? (k === 'verified' ? 'Đã kiểm duyệt' : v)}
                <X size={12} />
              </button>
            ))}
          </div>
        )}
        <div
          className={'document-grid browse-grid ' + (list ? 'as-list' : '')}
          style={{ opacity: pending ? 0.55 : 1 }}
          aria-busy={pending}
        >
          {initial.items.map((d) => (
            <DocumentCard key={d.id} document={d} catalog={catalog} list={list} query={filters.q} />
          ))}
          {!initial.items.length && (
            <EmptyState
              action={
                <button
                  className="button secondary"
                  onClick={() => {
                    setQuery('');
                    router.replace(pathname);
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              }
            />
          )}
        </div>
        {initial.total > initial.pageSize && (
          <nav className="pagination" aria-label="Phân trang">
            <button
              className="button secondary small"
              disabled={initial.page <= 1}
              onClick={() => update({ page: String(initial.page - 1) })}
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <span>
              Trang {initial.page} / {Math.ceil(initial.total / initial.pageSize)}
            </span>
            <button
              className="button secondary small"
              disabled={initial.page * initial.pageSize >= initial.total}
              onClick={() => update({ page: String(initial.page + 1) })}
            >
              Tiếp
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="filter-drawer">
            <Dialog.Title>Lọc tài liệu</Dialog.Title>
            <Dialog.Description>Chọn điều kiện phù hợp với môn học của bạn.</Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng bộ lọc">
              <X />
            </Dialog.Close>
            <div className="drawer-fields">{renderFilterFields('mobile')}</div>
            <Dialog.Close asChild>
              <button className="button primary full">Xem {initial.total} tài liệu</button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
