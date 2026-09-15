import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadColorOverrides,
  loadSectionThemes,
  loadVisibility,
  loadWhyUsItems,
  loadWhyUsSlides,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useParallax from "../hooks/useParallax";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";

const AUTOPLAY_MS = 5000;

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (typeof r === "function") r(node);
      else if (r) r.current = node;
    });
  };
}

// videoType (explicitly set on upload/URL entry) takes priority, falling
// back to inferring from whichever field is populated — for slides saved
// before the videoType field existed.
function slideVideoType(slide) {
  if (slide.mediaType !== "video") return null;
  if (slide.videoType) return slide.videoType;
  if (slide.video) return "local";
  if (slide.videoUrl) return "url";
  return null;
}

function SlideMedia({ slide }) {
  const videoType = slideVideoType(slide);
  if (videoType === "local" && slide.video) {
    return (
      <video
        src={slide.video}
        autoPlay
        muted
        loop
        playsInline
        className="whyus-slider__media"
      />
    );
  }
  if (videoType === "url" && slide.videoUrl) {
    return (
      <iframe
        src={slide.videoUrl}
        title="Excellence CIA"
        className="whyus-slider__media"
        allowFullScreen
      />
    );
  }
  if (slide.image) {
    return <img className="whyus-slider__media" src={slide.image} alt="Excellence CIA" />;
  }
  return (
    <div className="whyus-slider__media whyus-slider__placeholder">
      <Icon name="image" size={32} />
    </div>
  );
}

function WhyUsSlider({ slides, loaded }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  function goTo(i) {
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }

  // Never render nothing here — the section behind this slider has no
  // background of its own, so an early `return null` while slides are
  // still loading (or once genuinely confirmed empty) showed as a blank
  // white gap. The slider box itself (with its dark background/min-height)
  // always mounts; only its *contents* change between loading/empty/ready.
  if (slides.length === 0) {
    return (
      <div className="whyus-slider reveal">
        <div className="whyus-slider__placeholder">
          {loaded ? <Icon name="image" size={40} /> : <span className="upload-spinner" />}
        </div>
      </div>
    );
  }

  return (
    <div className="whyus-slider reveal">
      {slides.map((slide, i) => (
        <div key={slide.id} className={`whyus-slider__slide ${i === index ? "active" : ""}`}>
          <SlideMedia slide={slide} />
        </div>
      ))}

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
          <div className="whyus-slider__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={`hero__dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Diapositive ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function WhyUs() {
  const ref = useReveal();
  const { t } = useLanguage();
  const { sectionRef, layerRef } = useParallax(0.15);
  const [items] = useLiveStorage(loadWhyUsItems);
  const [slides] = useLiveStorage(loadWhyUsSlides);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const [slidesLoaded, setSlidesLoaded] = useState(false);

  // Slides load asynchronously (IndexedDB) — `slides` reads as `[]` both
  // while that's still in flight and once genuinely confirmed empty, so a
  // short safety timeout distinguishes "still loading" (show a spinner)
  // from "confirmed nothing saved yet" (show a static placeholder icon).
  useEffect(() => {
    if (slides.length > 0) setSlidesLoaded(true);
  }, [slides]);
  useEffect(() => {
    const timer = setTimeout(() => setSlidesLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visibility.whyus) return null;

  return (
    <section
      id="why-us"
      className="section why-us steel-texture-dark"
      ref={mergeRefs(ref, sectionRef)}
      style={sectionThemeStyle(sectionThemes, "whyus", colorOverrides)}
    >
      <div className="why-us__parallax-layer" ref={layerRef} />
      <WhyUsSlider slides={slides} loaded={slidesLoaded} />
      <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: 64 }}>
        <div className="section-header reveal">
          <span className="section-tag">{t.whyus.tag}</span>
          <h2 className="section-title">
            {t.whyus.titleA} <span>{t.whyus.titleAccent}</span> {t.whyus.titleB}
          </h2>
          <p className="section-subtitle">{t.whyus.subtitle}</p>
        </div>

        <div className="why-us__grid">
          {items.map((r, i) => (
            <div
              className="why-item fade-up"
              style={{ animationDelay: `${(i % 3) * 0.08}s` }}
              key={r.id}
            >
              <div className="why-item__icon">
                <Icon name={r.icon} size={26} />
              </div>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
