import useCardReveal from "../hooks/useCardReveal";

// Wraps one grid card with scroll-triggered fade + slide-up (see
// .reveal-card in index.css) and a per-card stagger delay. `index` is the
// card's position within its row (callers pass `i % columns` so the
// stagger resets each row instead of growing unbounded on long lists).
// Renders as a single <div> — the ref/classes/style land directly on the
// card element itself (no extra wrapper) so existing card CSS (size,
// absolute-positioned children, grid placement) keeps working unchanged.
export default function RevealCard({ index = 0, step = 0.1, className = "", style, children, ...rest }) {
  const [ref, inView] = useCardReveal();
  return (
    <div
      ref={ref}
      className={`reveal-card ${inView ? "card-in-view" : ""} ${className}`.trim()}
      style={{ ...style, transitionDelay: `${(index * step).toFixed(2)}s` }}
      {...rest}
    >
      {children}
    </div>
  );
}
