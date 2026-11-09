import { useLanguage } from "../context/LanguageContext.jsx";
import Icon from "./Icons";

// Placeholder blocks shown while a section's first Supabase fetch is in
// flight — same footprint as the real content, so nothing jumps when it
// arrives.
export function SkeletonGrid({ count = 6, className = "" }) {
  return (
    <div className={`skeleton-grid ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}

// Only shown when Supabase failed AND there is no local fallback data
// (status "error" from the sync engine) — retry re-runs the fetch.
export function SectionError({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="section-error" role="status">
      <p>{t.common.loadError}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <Icon name="refreshCw" size={16} /> {t.common.retry}
        </button>
      )}
    </div>
  );
}
