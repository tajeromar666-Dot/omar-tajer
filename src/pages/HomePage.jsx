import { lazy, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import LazySection, { LOAD_ALL_SECTIONS } from "../components/LazySection";
import SocialFloating from "../components/SocialFloating";
import WhatsAppButton from "../components/WhatsAppButton";
import {
  applyTheme,
  loadColorOverrides,
  loadSectionColors,
  loadSectionThemes,
  loadSpacing,
  loadTheme,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import { getContrastColor } from "../utils/contrast";
import { contrastGuardVars, customSpacing, isCustomTheme } from "../utils/siteTheme";

// Navbar + Hero are in the main bundle (their styles are inlined in
// index.html). Every other section is its own lazy chunk, mounted — code,
// styles and data — only when it comes within 300px of the viewport.
// minHeight is the placeholder's height until then (typical desktop height).
const SECTIONS = [
  { key: "stats", component: lazy(() => import("../components/Stats")), minHeight: 230 },
  { key: "about", anchor: "about", component: lazy(() => import("../components/About")), minHeight: 1100 },
  { key: "services", anchor: "services", component: lazy(() => import("../components/Services")), minHeight: 1100 },
  { key: "plans3d", anchor: "plans3d", component: lazy(() => import("../components/Plans3D")), minHeight: 1100 },
  { key: "portfolio", anchor: "portfolio", component: lazy(() => import("../components/Portfolio")), minHeight: 1300 },
  { key: "partners", anchor: "partners", component: lazy(() => import("../components/Partners")), minHeight: 600 },
  { key: "testimonials", anchor: "temoignages", component: lazy(() => import("../components/Testimonials")), minHeight: 820 },
  { key: "whyus", anchor: "why-us", component: lazy(() => import("../components/WhyUs")), minHeight: 1300 },
  { key: "team", anchor: "team", component: lazy(() => import("../components/Team")), minHeight: 870 },
  { key: "contact", anchor: "contact", component: lazy(() => import("../components/Contact")), minHeight: 1600 },
];
const Footer = lazy(() => import("../components/Footer"));

// True when jumping to #id needs the lazy sections first: the target is
// still a placeholder, or an unloaded section above it would still grow.
function needsSections(id) {
  const target = document.getElementById(id);
  if (!target || target.classList.contains("lazy-slot")) return true;
  return [...document.querySelectorAll(".lazy-slot")].some(
    (slot) => slot.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING
  );
}

function jumpTo(id, smooth) {
  window.dispatchEvent(new Event(LOAD_ALL_SECTIONS));
  const started = performance.now();
  (function waitForSections() {
    if (document.querySelector(".lazy-slot") && performance.now() - started < 5000) {
      setTimeout(waitForSections, 50);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: smooth && !reduce ? "smooth" : "auto" });
    settleOn(id);
  })();
}

// Sections that just mounted still grow a little as their data and images
// arrive, which can leave a smooth scroll short of its target. Re-align a
// few times while things settle — unless the visitor scrolls themselves.
function settleOn(id) {
  let cancelled = false;
  const stop = () => {
    cancelled = true;
  };
  const events = ["wheel", "touchstart", "keydown"];
  events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
  [700, 1400, 2400].forEach((delay, i, all) =>
    setTimeout(() => {
      const target = document.getElementById(id);
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (!cancelled && target && Math.abs(target.getBoundingClientRect().top - offset) > 8) {
        target.scrollIntoView({ behavior: "auto" });
      }
      if (i === all.length - 1) events.forEach((e) => window.removeEventListener(e, stop));
    }, delay)
  );
}

export default function HomePage() {
  const [theme] = useLiveStorage(loadTheme);
  const [sectionColors] = useLiveStorage(loadSectionColors);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const [spacing] = useLiveStorage(loadSpacing);

  // In-page links (#contact...) and deep links: mount the remaining
  // sections first, then scroll, so the jump lands on the right spot.
  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.('a[href^="#"]');
      const id = link && decodeURIComponent(link.getAttribute("href").slice(1));
      if (!id || !needsSections(id)) return;
      e.preventDefault();
      history.pushState(null, "", `#${id}`);
      jumpTo(id, true);
    }
    document.addEventListener("click", onClick);
    const initial = decodeURIComponent(window.location.hash.slice(1));
    if (initial && needsSections(initial)) jumpTo(initial, false);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // A theme saved from the admin in another tab is picked up live here.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const themed = isCustomTheme(theme);
  const pad = customSpacing(spacing);
  const guardKey = JSON.stringify([sectionColors, sectionThemes, colorOverrides, themed && theme]);
  const style = useMemo(
    () => ({
      ...contrastGuardVars({ sectionColors, sectionThemes, colorOverrides, theme }),
      // Readable text color on the accent (buttons, chips, badges).
      "--on-accent": getContrastColor(themed ? theme.colorBlue : "#ff6b35"),
      ...(pad ? { "--site-pad": `${pad}px` } : null),
    }),
    // guardKey captures every input by value; the objects themselves are
    // re-created on each storage event even when nothing changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guardKey, pad]
  );

  return (
    <div className={`site${themed ? " site--themed" : ""}`} style={style}>
      <Navbar />
      <main id="main">
        <Hero />
        {SECTIONS.map((s) => (
          <LazySection key={s.key} component={s.component} anchor={s.anchor} minHeight={s.minHeight} />
        ))}
      </main>
      <LazySection component={Footer} minHeight={600} />
      <SocialFloating />
      <WhatsAppButton />
    </div>
  );
}
