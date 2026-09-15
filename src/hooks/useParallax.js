import { useEffect, useRef } from "react";

// Lightweight scroll-parallax: moves a background layer at a fraction of
// scroll speed while its section moves through the viewport.
export default function useParallax(speed = 0.15) {
  const sectionRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!section || !layer) return;

    let ticking = false;
    function update() {
      const rect = section.getBoundingClientRect();
      layer.style.transform = `translateY(${rect.top * speed}px)`;
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return { sectionRef, layerRef };
}
