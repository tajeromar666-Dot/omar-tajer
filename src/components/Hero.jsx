import { Fragment, memo, useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  DEFAULT_HERO_SLIDES,
  heroSlidesFromServer,
  loadHeroSlides,
  loadHeroSpeed,
  loadSettings,
  loadVisibility,
} from "../data/seedData";
import { buildSrcSet, canTransform, HERO_WIDTHS } from "../utils/image";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import SmartImage from "./SmartImage";

const DEFAULT_TITLE = DEFAULT_HERO_SLIDES[0].title;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The optional background video (Paramètres → "Vidéo de fond du Hero") is a
// progressive enhancement: desktop only, never with reduced motion or data
// saver, only on a fast (4G-class) connection when the browser reports it,
// and only fetched once the page has finished loading — the poster image
// stays the LCP element. Never on mobile.
function canUseHeroVideo(url) {
  if (!url || /youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return false;
  if (prefersReducedMotion()) return false;
  if (!window.matchMedia("(min-width: 1024px) and (hover: hover)").matches) return false;
  const connection = navigator.connection;
  if (connection && (connection.saveData || (connection.effectiveType && connection.effectiveType !== "4g"))) return false;
  return true;
}

const HERO_SIZES = "100vw";
const PRELOAD_KEY = "site:hero-preload";

// Remembers how to preload the first hero image, read by the inline script
// in index.html on the next visit. Data URLs (base64) need no preload.
function rememberHeroPreload(image) {
  try {
    if (!image || !/^https?:/.test(image)) {
      localStorage.removeItem(PRELOAD_KEY);
      return;
    }
    const entry = canTransform(image)
      ? { href: image, srcset: buildSrcSet(image, HERO_WIDTHS), sizes: HERO_SIZES, type: "image/webp" }
      : { href: image };
    localStorage.setItem(PRELOAD_KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable — only costs the repeat-visit preload */
  }
}

// Rows fetched by index.html straight from Supabase's REST API (see
// heroPrefetchPlugin in vite.config.js), mapped like heroSlideFromRow.
function usePrefetchedSlides() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    window.__ciaHeroSlides?.then((data) => {
      if (alive && Array.isArray(data) && data.length) {
        setRows(
          data.map((r) => ({ id: r.id, image: r.image || null, title: r.title || "", subtitle: r.subtitle || "" }))
        );
      }
    });
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}

function whenIdleAfterLoad(fn) {
  let cancelled = false;
  let handle;
  const run = () => {
    if (cancelled) return;
    handle = window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (window.cancelIdleCallback && handle) window.cancelIdleCallback(handle);
    else clearTimeout(handle);
  };
}

function Hero() {
  const { t } = useLanguage();
  const [syncedSlides] = useLiveStorage(loadHeroSlides);
  const prefetched = usePrefetchedSlides();
  // The early REST prefetch is fresher than the local cached copy, so it is
  // shown until the regular Supabase sync has its own server data (which
  // then also carries realtime updates).
  const slides = prefetched && !heroSlidesFromServer() ? prefetched : syncedSlides;
  const [heroSpeed] = useLiveStorage(loadHeroSpeed);
  const [visibility] = useLiveStorage(loadVisibility);
  const [settings] = useLiveStorage(loadSettings);
  const themeStyle = useSectionTheme("hero");

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // The very first title is painted without animation (it continues the
  // static shell from index.html); only later slide changes animate.
  const [animateTitle, setAnimateTitle] = useState(false);
  // Slides whose image has been requested — the first one immediately (with
  // high priority), the others only shortly before they're shown.
  const [mounted, setMounted] = useState(() => new Set([0]));
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const mediaRef = useRef(null);

  const count = slides.length;
  const safeIndex = index < count ? index : 0;
  // Until slides arrive (async local/Supabase read) the stock first slide
  // stands in, so the text block already has its final shape and nothing
  // shifts when the real slide replaces it.
  const slide = slides[safeIndex] || DEFAULT_HERO_SLIDES[0];
  const title = slide?.title?.trim() || DEFAULT_TITLE;
  const subtitle = slide?.subtitle || "";
  const words = title.split(/\s+/);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setAnimateTitle(true);
      setIndex((i) => (i + 1) % count);
    }, (heroSpeed || 4) * 1000);
    return () => clearInterval(timer);
  }, [count, paused, heroSpeed]);

  // Warm up the next slide's image a moment after the current one shows.
  useEffect(() => {
    if (count < 2) return;
    const next = (safeIndex + 1) % count;
    const timer = setTimeout(() => {
      setMounted((prev) => (prev.has(next) && prev.has(safeIndex) ? prev : new Set(prev).add(safeIndex).add(next)));
    }, 1200);
    return () => clearTimeout(timer);
  }, [safeIndex, count]);

  // Parallax: the media layer moves at 30% of scroll speed while the hero
  // is on screen — one transform per animation frame, desktop only.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 768px)").matches) return;
    let frame = 0;
    function update() {
      frame = 0;
      const y = window.scrollY;
      if (y <= window.innerHeight) el.style.transform = `translate3d(0, ${(y * 0.3).toFixed(1)}px, 0)`;
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [visibility.hero]);

  const firstImage = slides[0]?.image || null;
  useEffect(() => {
    rememberHeroPreload(firstImage);
  }, [firstImage]);

  const heroVideo = settings.heroVideo?.trim();
  useEffect(() => {
    setVideoSrc(null);
    setVideoReady(false);
    if (!canUseHeroVideo(heroVideo)) return;
    return whenIdleAfterLoad(() => setVideoSrc(heroVideo));
  }, [heroVideo]);

  function goTo(i) {
    if (!count) return;
    const next = ((i % count) + count) % count;
    setMounted((prev) => new Set(prev).add(next));
    setAnimateTitle(true);
    setIndex(next);
  }

  if (!visibility.hero) return null;

  return (
    <section
      id="hero"
      className="hero"
      style={themeStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero__media" ref={mediaRef} aria-hidden="true">
        {slides.map((s, i) =>
          s.image && mounted.has(i) ? (
            <div key={s.id} className={`hero__slide${i === safeIndex ? " is-active" : ""}`}>
              <SmartImage
                src={s.image}
                priority={i === 0}
                width={1200}
                height={675}
                sizes={HERO_SIZES}
                widths={HERO_WIDTHS}
              />
            </div>
          ) : null
        )}
        {videoSrc && (
          <video
            className={`hero__video${videoReady ? " is-ready" : ""}`}
            src={videoSrc}
            poster={slides[0]?.image || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
          />
        )}
      </div>
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />

      <div className="container hero__content">
        <span className="hero__eyebrow">
          <span className="hero__eyebrow-dot" aria-hidden="true" />
          {t.hero.eyebrow}
        </span>
        <h1 key={animateTitle ? `${safeIndex}-${title}` : "static"} className={`hero__title${animateTitle ? " is-animated" : ""}`}>
          {words.map((w, i) => (
            <Fragment key={i}>
              <span className="hero__word" style={{ "--i": i }}>
                <span className={i === words.length - 1 ? "accent" : undefined}>{w}</span>
              </span>
              {i < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h1>
        {subtitle && (
          <p key={`sub-${safeIndex}`} className="hero__subtitle">
            {subtitle}
          </p>
        )}

        <div className="hero__ctas">
          {visibility.services !== false && (
            <a href="#services" className="btn btn--primary btn--lg">
              {t.hero.ctaServices}
              <Icon name="arrowRight" size={18} className="btn__arrow" />
            </a>
          )}
          {visibility.portfolio !== false && (
            <a href="#portfolio" className="btn btn--glass btn--lg">
              {t.hero.ctaPortfolio}
            </a>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="hero__controls">
          <button type="button" className="hero__arrow hero__arrow--prev" onClick={() => goTo(safeIndex - 1)} aria-label={t.common.previous}>
            <Icon name="chevronLeft" size={20} />
          </button>
          <div className="hero__dots">
            {slides.map((s, i) => (
              <button
                type="button"
                key={s.id}
                className={`hero__dot${i === safeIndex ? " is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`${t.common.slide} ${i + 1}`}
                aria-current={i === safeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <button type="button" className="hero__arrow hero__arrow--next" onClick={() => goTo(safeIndex + 1)} aria-label={t.common.next}>
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      )}

      <a href="#about" className="hero__scroll" aria-label={t.hero.scrollText}>
        <span className="hero__scroll-line" aria-hidden="true" />
        <span className="hero__scroll-text">{t.hero.scrollText}</span>
      </a>
    </section>
  );
}

export default memo(Hero);
