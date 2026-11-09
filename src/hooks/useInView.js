import { useCallback, useRef, useState } from "react";

// One shared IntersectionObserver per rootMargin (scroll reveals use the
// default; lazy sections use a 300px look-ahead) instead of one observer per
// component. Each element is unobserved after its first intersection, so
// this never re-fires on scroll.
export const REVEAL_MARGIN = "0px 0px -8% 0px";
const observers = new Map();

function getObserver(rootMargin) {
  if (typeof IntersectionObserver === "undefined") return null;
  let entry = observers.get(rootMargin);
  if (!entry) {
    const callbacks = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const cb = callbacks.get(e.target);
          callbacks.delete(e.target);
          io.unobserve(e.target);
          if (cb) cb();
        });
      },
      { rootMargin, threshold: 0 }
    );
    entry = { io, callbacks };
    observers.set(rootMargin, entry);
  }
  return entry;
}

// Returns a *callback* ref (robust to elements that mount late — after data
// loads, a filter change, etc.) and whether that element has come within
// `rootMargin` of the viewport yet. Without IntersectionObserver support,
// reports in-view immediately so nothing stays hidden.
export default function useInView(rootMargin = REVEAL_MARGIN) {
  const [inView, setInView] = useState(false);
  const nodeRef = useRef(null);
  const seenRef = useRef(false);

  const ref = useCallback(
    (node) => {
      const shared = getObserver(rootMargin);
      const prev = nodeRef.current;
      if (prev && shared) {
        shared.io.unobserve(prev);
        shared.callbacks.delete(prev);
      }
      nodeRef.current = node;
      if (!node || seenRef.current) return;

      if (!shared) {
        seenRef.current = true;
        setInView(true);
        return;
      }
      shared.callbacks.set(node, () => {
        seenRef.current = true;
        setInView(true);
      });
      shared.io.observe(node);
    },
    [rootMargin]
  );

  return [ref, inView];
}
