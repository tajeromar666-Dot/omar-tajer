import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadColorOverrides,
  loadSectionThemes,
  loadTestimonials,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";
import RevealCard from "./RevealCard";

const AUTOPLAY_MS = 5000;
const CARDS_PER_VIEW = 3;

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

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Testimonials() {
  const ref = useReveal();
  const { t: tr } = useLanguage();
  const [all, refresh] = useLiveStorage(loadTestimonials);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const [index, setIndex] = useState(0);

  // Explicit re-read on mount, on top of useLiveStorage's own storage-event
  // subscription — belt-and-suspenders so a fresh page load always reflects
  // whatever's currently in cia_testimonials rather than a stale closure.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Missing `active` is treated as visible — only an explicit `false` hides
  // an item (so legacy/partial records never silently disappear).
  const activeTestimonials = all.filter((t) => t.active === true || t.active === undefined);
  const testimonials = activeTestimonials.length > 0 ? activeTestimonials : FALLBACK_TESTIMONIALS;
  const showCarousel = testimonials.length > CARDS_PER_VIEW;

  useEffect(() => {
    if (index >= testimonials.length) setIndex(0);
  }, [testimonials.length, index]);

  useEffect(() => {
    if (!showCarousel) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % testimonials.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(timer);
  }, [showCarousel, testimonials.length]);

  function goTo(i) {
    setIndex(((i % testimonials.length) + testimonials.length) % testimonials.length);
  }

  // Visibility toggled off from Paramètres — render a zero-height, zero-
  // margin placeholder (not `return null`) so there's no ambiguity about
  // it ever leaving a gap, while keeping the #temoignages anchor valid.
  if (!visibility.temoignages) {
    return <div id="temoignages" style={{ height: 0, margin: 0, padding: 0, overflow: "hidden" }} aria-hidden="true" />;
  }

  const visible = showCarousel
    ? Array.from({ length: CARDS_PER_VIEW }, (_, i) => testimonials[(index + i) % testimonials.length])
    : testimonials;

  return (
    <section
      id="temoignages"
      className="section steel-texture"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "temoignages", colorOverrides)}
    >
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{tr.testimonials.tag}</span>
          <h2 className="section-title">
            {tr.testimonials.titleA} <span>{tr.testimonials.titleAccent}</span>{" "}
            {tr.testimonials.titleB}
          </h2>
          <p className="section-subtitle">{tr.testimonials.subtitle}</p>
        </div>

        <div className="testimonial-carousel reveal">
          <div className="testimonial-carousel__track-wrap">
            {showCarousel && (
              <button
                className="hero__nav hero__nav--prev hero__nav--dark"
                onClick={() => goTo(index - 1)}
                aria-label="Témoignage précédent"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
            )}

            <div className="testimonial-carousel__track">
              {visible.map((t, i) => (
                <RevealCard className="testimonial-card" index={i} key={t.id}>
                  <span className="testimonial-card__quote">&ldquo;</span>

                  <div className="testimonial-card__stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Icon key={n} name="star" size={18} filled={n <= t.rating} />
                    ))}
                  </div>

                  <p className="testimonial-card__text">{t.text}</p>

                  <hr className="testimonial-card__divider" />

                  <div className="testimonial-card__author">
                    <span className="testimonial-card__avatar">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} />
                      ) : (
                        initials(t.name)
                      )}
                    </span>
                    <div>
                      <h4>{t.name}</h4>
                      <p>
                        {t.role}
                        {t.role && t.company ? " — " : ""}
                        {t.company}
                      </p>
                    </div>
                  </div>
                </RevealCard>
              ))}
            </div>

            {showCarousel && (
              <button
                className="hero__nav hero__nav--next hero__nav--dark"
                onClick={() => goTo(index + 1)}
                aria-label="Témoignage suivant"
              >
                <Icon name="chevronRight" size={20} />
              </button>
            )}
          </div>

          {showCarousel && (
            <div className="testimonial-carousel__dots">
              {testimonials.map((item, i) => (
                <button
                  key={item.id}
                  className={`hero__dot hero__dot--dark ${i === index ? "active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
