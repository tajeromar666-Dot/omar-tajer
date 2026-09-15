import { useEffect, useRef, useState } from "react";

// Fades a single grid card in (opacity + slide up, see .reveal-card in
// index.css) the moment it scrolls into the viewport, via its own
// IntersectionObserver — unlike a single observer that scans the DOM once
// on mount, this is robust to cards that render later (filter changes,
// Supabase realtime updates, carousel rotation): each card owns its own
// observer from the moment it mounts, wherever that happens to be in time.
// Unobserves itself after the first reveal so it never re-fires on scroll.
export default function useCardReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}
