import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadCollaborateursCount,
  loadColorOverrides,
  loadHeroSlides,
  loadHeroSpeed,
  loadSectionThemes,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";

function Counter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const duration = 1400;
            const start = performance.now();
            function tick(now) {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.round(eased * value));
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  const [slides] = useLiveStorage(loadHeroSlides);
  const [collaborateursCount] = useLiveStorage(loadCollaborateursCount);
  const [heroSpeed] = useLiveStorage(loadHeroSpeed);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const stats = [
    { value: 15, suffix: "+", label: t.hero.statExperience },
    { value: 120, suffix: "+", label: t.hero.statProjects },
    { value: 98, suffix: "%", label: t.hero.statSatisfaction },
    { value: collaborateursCount, suffix: "+", label: t.hero.statCollaborators },
  ];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Keep the active index valid if slides are added/removed live.
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides, index]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, (heroSpeed || 4) * 1000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused, heroSpeed]);

  function goTo(i) {
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }

  const slide = slides[index] || slides[0];
  const title = slide?.title || "Construction Industrielle Africaine";
  const subtitle = slide?.subtitle || "";
  const words = title.split(" ");

  if (!visibility.hero) return null;

  return (
    <section
      id="hero"
      style={sectionThemeStyle(sectionThemes, "hero", colorOverrides)}
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hero__slide ${i === index ? "active" : ""}`}
          style={
            s.image
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(10,15,30,0.35) 0%, rgba(10,15,30,0.8) 100%), url(${s.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
      ))}
      <div className="hero__bg-pattern" />
      <div className="hero__overlay" />

      <div className="hero__content">
        <span className="hero__eyebrow">{t.hero.eyebrow}</span>
        <h1 className="hero__title">
          {words.slice(0, -1).join(" ")}{" "}
          <span className="accent">{words.slice(-1)}</span>
        </h1>
        <p className="hero__subtitle">{subtitle}</p>

        <div className="hero__ctas">
          <a href="#services" className="btn btn--primary">
            {t.hero.ctaServices} <Icon name="arrowRight" size={18} />
          </a>
          <a href="#portfolio" className="btn btn--outline">
            {t.hero.ctaPortfolio}
          </a>
        </div>

        <div className="hero__stats">
          {stats.map((s) => (
            <div className="hero__stat" key={s.label}>
              <div className="hero__stat-number">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="hero__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            className="hero__nav hero__nav--prev"
            onClick={() => goTo(index - 1)}
            aria-label="Diapositive précédente"
          >
            <Icon name="chevronLeft" size={22} />
          </button>
          <button
            className="hero__nav hero__nav--next"
            onClick={() => goTo(index + 1)}
            aria-label="Diapositive suivante"
          >
            <Icon name="chevronRight" size={22} />
          </button>
          <div className="hero__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={`hero__dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Aller à la diapositive ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <a href="#about" className="hero__scroll">
        <span className="hero__scroll-dot" />
        {t.hero.scrollText}
      </a>
    </section>
  );
}
