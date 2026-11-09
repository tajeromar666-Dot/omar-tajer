import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getTestimonialsStatus, loadTestimonials, loadVisibility, retryTestimonials } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SectionError, SkeletonGrid } from "./SectionStatus";
import "../styles/sections.css";

const AUTOPLAY_MS = 5000;

// Shown only when cia_testimonials has no active entries at all (never
// saved, or explicitly emptied by the admin) — the section still has
// something to show instead of collapsing to a blank gap. Purely a
// display-time fallback: never written back to storage.
const FALLBACK_TESTIMONIALS = [
  {
    id: "fallback_te1",
    name: "OCP Group",
    company: "",
    role: "Responsable Projets",
    text: "CIA a réalisé nos installations avec un professionnalisme remarquable. Délais respectés, qualité irréprochable.",
    rating: 5,
    avatar: null,
  },
  {
    id: "fallback_te2",
    name: "Marjane Holding",
    company: "",
    role: "Directeur Technique",
    text: "Excellent travail sur notre hangar de stockage. Équipe sérieuse et compétente.",
    rating: 5,
    avatar: null,
  },
  {
    id: "fallback_te3",
    name: "Atacadao Maroc",
    company: "",
    role: "Chef de Projet",
    text: "Très satisfait de la qualité des structures métalliques livrées par CIA.",
    rating: 4,
    avatar: null,
  },
];

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const TestimonialCard = memo(function TestimonialCard({ item }) {
  return (
    <figure className="quote card">
      <span className="quote__mark" aria-hidden="true">
        &ldquo;
      </span>
      <div className="quote__stars" role="img" aria-label={`${item.rating}/5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} name="star" size={16} filled={n <= item.rating} />
        ))}
      </div>
      <blockquote className="quote__text">{item.text}</blockquote>
      <figcaption className="quote__author">
        <span className="quote__avatar">
          {item.avatar ? (
            <img src={item.avatar} alt="" width="48" height="48" loading="lazy" decoding="async" />
          ) : (
            initials(item.name)
          )}
        </span>
        <span>
          <strong>{item.name}</strong>
          <small>
            {item.role}
            {item.role && item.company ? " — " : ""}
            {item.company}
          </small>
        </span>
      </figcaption>
    </figure>
  );
});

// Native scroll-snap track: swipe on touch devices for free, buttons/dots
// and autoplay drive scrollLeft. The step between two cards is measured
// from the DOM (negative in RTL, where scrollLeft runs from 0 downwards),
// so the same math works in both directions.
export default function Testimonials() {
  const { t } = useLanguage();
  const [all] = useLiveStorage(loadTestimonials);
  const [status] = useLiveStorage(getTestimonialsStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("temoignages");
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  // Missing `active` is treated as visible — only an explicit `false` hides
  // an item (so legacy/partial records never silently disappear).
  const active = all.filter((x) => x.active === true || x.active === undefined);
  const items = active.length > 0 ? active : FALLBACK_TESTIMONIALS;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < 2) return null;
    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    if (!step) return null;
    const max = Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / Math.abs(step)));
    return { track, step, max };
  }, []);

  const scrollToPage = useCallback(
    (i) => {
      const m = measure();
      if (!m) return;
      const target = Math.max(0, Math.min(i, m.max));
      m.track.scrollTo({ left: target * m.step, behavior: "smooth" });
    },
    [measure]
  );

  // Keep page/pages in sync with the scroll position (swipe included).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    function update() {
      frame = 0;
      const m = measure();
      if (!m) {
        setPages(1);
        setPage(0);
        return;
      }
      setPages(m.max + 1);
      setPage(Math.min(m.max, Math.round(track.scrollLeft / m.step)));
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    track.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [measure, items.length, status]);

  // Autoplay — skipped while hovered/focused/touched, while the tab is
  // hidden, while the carousel is off screen, and with reduced motion.
  useEffect(() => {
    if (pages < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current || document.hidden) return;
      const r = track.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      scrollToPage(page >= pages - 1 ? 0 : page + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [page, pages, scrollToPage]);

  // Visibility toggled off from Paramètres — keep a zero-height anchor so
  // #temoignages links stay valid without leaving a gap.
  if (!visibility.temoignages) {
    return <div id="temoignages" style={{ height: 0, margin: 0, padding: 0, overflow: "hidden" }} aria-hidden="true" />;
  }

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <section id="temoignages" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.testimonials.tag}
          titleA={t.testimonials.titleA}
          accent={t.testimonials.titleAccent}
          titleB={t.testimonials.titleB}
          subtitle={t.testimonials.subtitle}
        />

        {status === "loading" && !active.length ? (
          <SkeletonGrid count={3} className="carousel__skeleton" />
        ) : status === "error" && !active.length ? (
          <SectionError onRetry={retryTestimonials} />
        ) : (
          <Reveal
            className="carousel"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
          >
            <div className="carousel__track" ref={trackRef}>
              {items.map((item) => (
                <div className="carousel__slide" key={item.id}>
                  <TestimonialCard item={item} />
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="carousel__controls">
                <button
                  type="button"
                  className="round-btn round-btn--flip"
                  onClick={() => scrollToPage(page - 1)}
                  aria-label={t.common.previous}
                >
                  <Icon name="chevronLeft" size={20} />
                </button>
                <div className="carousel__dots">
                  {Array.from({ length: pages }, (_, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`carousel__dot${i === page ? " is-active" : ""}`}
                      onClick={() => scrollToPage(i)}
                      aria-label={`${t.common.slide} ${i + 1}`}
                      aria-current={i === page ? "true" : undefined}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="round-btn round-btn--flip"
                  onClick={() => scrollToPage(page + 1)}
                  aria-label={t.common.next}
                >
                  <Icon name="chevronRight" size={20} />
                </button>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
