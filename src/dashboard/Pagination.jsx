// Shared admin list pagination — only rendered by callers once their list
// exceeds one page (see PAGE_SIZE in ProjectsTab/Plans3DTab/TestimonialsTab),
// so small lists keep showing everything at once exactly as before.
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Précédent
      </button>
      <span className="pagination__status">
        Page {page} / {pageCount}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Suivant
      </button>
    </div>
  );
}
