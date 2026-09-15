import { useEffect, useState } from "react";

// Adds `.in-view` to any `.reveal` descendant once it enters the viewport.
//
// Returns a *callback* ref (not a plain useRef object) on purpose: several
// callers (Plans3D, Team...) conditionally `return null` on their first
// render while their data is still loading, so the <section> this hook is
// attached to doesn't exist in the DOM yet at that point. A useRef-based
// version's effect (empty deps, runs once) would find `containerRef.current`
// still null right then and permanently skip setting up the observer —
// leaving every `.reveal` in that section stuck at its pre-reveal opacity
// forever, even once real content renders. Backing the ref with state
// instead makes React re-run this effect the moment the section actually
// mounts into the DOM, however late that happens.
export default function useReveal() {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    if (!root) return;
    const targets = root.querySelectorAll(".reveal");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [root]);

  return setRoot;
}
