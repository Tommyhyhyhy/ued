export default function Loading() {
  return (
    <div className="container page-space" aria-busy="true" aria-label="Đang tải học liệu">
      <div className="skeleton" style={{ height: 100, marginBlock: 35 }} />
      <div className="document-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}
