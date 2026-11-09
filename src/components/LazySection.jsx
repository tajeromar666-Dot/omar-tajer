import { Suspense, useEffect, useState } from "react";
import useInView from "../hooks/useInView";

// Fired to mount every remaining section at once — before jumping to an
// in-page anchor (see HomePage), so the target and everything above it have
// their real height when the browser scrolls.
export const LOAD_ALL_SECTIONS = "cia:load-all-sections";

// Holds a fixed-height placeholder until the section comes within 300px of
// the viewport, then mounts the (React.lazy) section: its code, styles and
// data are only fetched at that point. The placeholder carries the section's
// anchor id so in-page links still have a target before it loads.
export default function LazySection({ component: Component, anchor, minHeight }) {
  const [ref, near] = useInView("300px 0px");
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const onLoadAll = () => setForced(true);
    window.addEventListener(LOAD_ALL_SECTIONS, onLoadAll);
    return () => window.removeEventListener(LOAD_ALL_SECTIONS, onLoadAll);
  }, []);

  const placeholder = (attrs) => <div className="lazy-slot" style={{ minHeight }} aria-hidden="true" {...attrs} />;

  if (!near && !forced) return placeholder({ ref, id: anchor });
  return (
    <Suspense fallback={placeholder({ "data-pending": "" })}>
      <Component />
    </Suspense>
  );
}
