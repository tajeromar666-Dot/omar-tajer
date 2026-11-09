import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getWhyUsSlidesStatus, loadVisibility, loadWhyUsItems, loadWhyUsSlides } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import SmartImage from "./SmartImage";
import "../styles/sections.css";

const AUTOPLAY_MS = 5000;

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

function SlideMedia({ slide, active }) {
  const videoType = slideVideoType(slide);
  if (videoType === "local" && slide.video) {
    // Autoplay only on desktop; phones get a tap-to-play video instead.
    const desktop = window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
    return (
      <video
        src={slide.video}
        autoPlay={active && desktop}
        controls={!desktop}
        muted
        loop
        playsInline
        preload={desktop ? "metadata" : "none"}
        className="slider__media"
      />
    );
  }
  if (videoType === "url" && slide.videoUrl) {
    // Embeds are heavy — only the visible slide keeps its iframe.
    return active ? (
      <iframe src={slide.videoUrl} title="Excellence CIA" className="slider__media" allowFullScreen loading="lazy" />
    ) : null;
  }
  if (slide.image) {
    return <SmartImage src={slide.image} alt="Excellence CIA" width={1600} height={686} sizes="(min-width: 1240px) 1200px, 100vw" />;
  }
  return (
    <span className="slider__placeholder">
      <Icon name="image" size={36} />
    </span>
  );
}

// "Excellence Industrielle" slider: crossfading slides, autoplay only while
// on screen, arrows/dots and horizontal swipe. A slide's media is only
// mounted once it has been shown (or is up next).
function ExcellenceSlider({ slides }) {
  const { t, language } = useLanguage();
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(() => new Set([0]));
  const wrapRef = useRef(null);
  const touchX = useRef(null);
  const pausedRef = useRef(false);
  const count = slides.length;
  const current = index < count ? index : 0;
  const rtl = language === "ar";

  function goTo(i) {
    const next = ((i % count) + count) % count;
    setMounted((prev) => new Set(prev).add(next));
    setIndex(next);
  }

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const el = wrapRef.current;
      if (!el || pausedRef.current || document.hidden) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      setIndex((i) => {
        const next = (i + 1) % count;
        setMounted((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;

  return (
    <Reveal
      className="slider"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div
        className="slider__frame"
        ref={wrapRef}
        onTouchStart={(e) => {
          pausedRef.current = true;
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          pausedRef.current = false;
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) goTo(current + ((dx < 0) !== rtl ? 1 : -1));
        }}
      >
        {slides.map((s, i) =>
          mounted.has(i) ? (
            <div key={s.id} className={`slider__slide${i === current ? " is-active" : ""}`} aria-hidden={i !== current}>
              <SlideMedia slide={s} active={i === current} />
            </div>
          ) : null
        )}

        {count > 1 && (
          <>
            <button type="button" className="round-btn round-btn--flip slider__arrow slider__arrow--prev" onClick={() => goTo(current - 1)} aria-label={t.common.previous}>
              <Icon name="chevronLeft" size={20} />
            </button>
            <button type="button" className="round-btn round-btn--flip slider__arrow slider__arrow--next" onClick={() => goTo(current + 1)} aria-label={t.common.next}>
              <Icon name="chevronRight" size={20} />
            </button>
            <div className="slider__dots">
              {slides.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  className={`carousel__dot${i === current ? " is-active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`${t.common.slide} ${i + 1}`}
                  aria-current={i === current ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Reveal>
  );
}

export default function WhyUs() {
  const { t } = useLanguage();
  const [items] = useLiveStorage(loadWhyUsItems);
  const [slides] = useLiveStorage(loadWhyUsSlides);
  const [slidesStatus] = useLiveStorage(getWhyUsSlidesStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("whyus");
  // Safety net: if the first slides fetch never settles (unreachable
  // network), stop showing the placeholder after a few seconds rather than
  // leaving an empty box on the page.
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visibility.whyus) return null;

  return (
    <section id="why-us" className="section why-us" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.whyus.tag}
          titleA={t.whyus.titleA}
          accent={t.whyus.titleAccent}
          titleB={t.whyus.titleB}
          subtitle={t.whyus.subtitle}
        />

        {slidesStatus === "loading" && !slides.length && !waited ? (
          <div className="slider slider--loading skeleton" aria-hidden="true" />
        ) : (
          <ExcellenceSlider slides={slides} />
        )}

        <div className="why-us__grid">
          {items.map((r, i) => (
            <Reveal key={r.id} delay={i % 3}>
              <article className="why card card--hover">
                <span className="icon-chip">
                  <Icon name={r.icon} size={24} />
                </span>
                <h3 className="card__title">{r.title}</h3>
                <p className="card__text">{r.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
