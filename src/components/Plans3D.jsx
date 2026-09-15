import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getPlans3DStatus,
  loadColorOverrides,
  loadPlans3D,
  loadSectionThemes,
  loadVisibility,
  PLAN3D_TYPES,
  retryPlans3D,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";
import RevealCard from "./RevealCard";

function Plans3DSkeleton() {
  return (
    <div className="grid cards-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}

function planImages(p) {
  if (p.images?.length) return p.images;
  return p.image ? [p.image] : [];
}

// videoType (explicitly set on upload/URL entry) takes priority, falling
// back to inferring from whichever field is populated — for plans saved
// before the videoType field existed.
function planVideoType(plan) {
  if (plan.videoType) return plan.videoType;
  if (plan.video) return "local";
  if (plan.videoUrl) return "url";
  return null;
}

const CARD_AUTOPLAY_MS = 3500;

function Plan3DCard({ plan, index, onOpen }) {
  const images = planImages(plan);
  const isVideo = plan.mediaType === "video" && (plan.video || plan.videoUrl);
  const videoType = isVideo ? planVideoType(plan) : null;
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (isVideo || images.length < 2 || hover) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, CARD_AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isVideo, images.length, hover]);

  function goToDot(e, i) {
    e.stopPropagation();
    setIdx(i);
  }

  return (
    <RevealCard
      className="plan3d-card"
      index={index}
      onClick={() => onOpen(plan)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {videoType === "local" && plan.video ? (
        <video
          src={plan.video}
          autoPlay
          muted
          loop
          playsInline
          className="plan3d-card__media"
        />
      ) : videoType === "url" && plan.videoUrl ? (
        <div className="media-embed plan3d-card__media">
          <iframe src={plan.videoUrl} title={plan.title} allowFullScreen />
        </div>
      ) : isVideo ? (
        <div className="plan3d-card__placeholder">
          <Icon name="cube" size={28} />
        </div>
      ) : images.length > 0 ? (
        <img src={images[idx]} alt={plan.title} className="plan3d-card__media" />
      ) : (
        <div className="plan3d-card__placeholder">
          <Icon name="cube" size={28} />
        </div>
      )}

      {!isVideo && images.length > 1 && (
        <div className="plan3d-card__dots" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`plan3d-card__dot ${i === idx ? "active" : ""}`}
              onClick={(e) => goToDot(e, i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {plan.featured && (
        <span className="plan3d-card__featured">
          <Icon name="star" size={12} filled />
        </span>
      )}

      <div className="plan3d-card__overlay" />
      <div className="plan3d-card__content">
        <span className="plan3d-card__badge">{plan.type}</span>
        <h3 className="plan3d-card__title">{plan.title}</h3>
        {plan.software && <p className="plan3d-card__meta">{plan.software}</p>}
      </div>
    </RevealCard>
  );
}

export default function Plans3D() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [plans] = useLiveStorage(loadPlans3D);
  const [status] = useLiveStorage(getPlans3DStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const [filter, setFilter] = useState("Tous");
  const [lightbox, setLightbox] = useState(null); // { plan, index }

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      const images = planImages(lightbox.plan);
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") {
        setLightbox((l) => l && { ...l, index: (l.index - 1 + images.length) % images.length });
      } else if (e.key === "ArrowRight") {
        setLightbox((l) => l && { ...l, index: (l.index + 1) % images.length });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (!visibility.plans3d) return null;
  // Genuinely no data to show (nothing local, or Supabase confirmed the
  // table is empty) — keep hiding the whole section as before. While the
  // first Supabase fetch is still in flight or has failed, fall through
  // instead so the skeleton/error UI below can render.
  if ((status === "idle" || status === "ready") && !plans.length) return null;

  const visiblePlans = plans.filter((p) => p.visible !== false);
  const filters = ["Tous", ...PLAN3D_TYPES];
  const filtered =
    filter === "Tous" ? visiblePlans : visiblePlans.filter((p) => p.type === filter);

  function openLightbox(plan) {
    if (plan.mediaType === "video" && (plan.video || plan.videoUrl)) return;
    if (planImages(plan).length === 0) return;
    setLightbox({ plan, index: 0 });
  }

  function goTo(delta) {
    setLightbox((l) => {
      if (!l) return l;
      const images = planImages(l.plan);
      return { ...l, index: (l.index + delta + images.length) % images.length };
    });
  }

  return (
    <section id="plans3d" className="section" ref={ref} style={sectionThemeStyle(sectionThemes, "plans3d", colorOverrides)}>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.plans3d.tag}</span>
          <h2 className="section-title">
            {t.plans3d.titleA} <span>{t.plans3d.titleAccent}</span> {t.plans3d.titleB}
          </h2>
          <p className="section-subtitle">{t.plans3d.subtitle}</p>
        </div>

        <div className="portfolio__filters reveal">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "Tous" ? t.plans3d.filterAll : f}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <Plans3DSkeleton />
        ) : status === "error" ? (
          <div className="section-error">
            <p>Impossible de charger les plans 3D pour le moment.</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={retryPlans3D}>
              <Icon name="refreshCw" size={16} /> Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">{t.plans3d.emptyState}</div>
        ) : (
          <div className="grid cards-grid">
            {filtered.map((p, i) => (
              <Plan3DCard
                key={p.id}
                plan={p}
                index={i % 3}
                onOpen={openLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setLightbox(null)}>
              <Icon name="close" size={18} />
            </button>
            <div className="modal__gallery-wrap">
              <div className="modal__gallery">
                <div className="modal__gallery-item">
                  <img
                    key={lightbox.index}
                    src={planImages(lightbox.plan)[lightbox.index]}
                    alt={`${lightbox.plan.title} ${lightbox.index + 1}`}
                  />
                </div>
              </div>
              {planImages(lightbox.plan).length > 1 && (
                <>
                  <button
                    className="hero__nav hero__nav--prev"
                    onClick={() => goTo(-1)}
                    aria-label="Image précédente"
                  >
                    <Icon name="chevronLeft" size={20} />
                  </button>
                  <button
                    className="hero__nav hero__nav--next"
                    onClick={() => goTo(1)}
                    aria-label="Image suivante"
                  >
                    <Icon name="chevronRight" size={20} />
                  </button>
                  <span className="modal__gallery-counter">
                    {lightbox.index + 1} / {planImages(lightbox.plan).length}
                  </span>
                </>
              )}
            </div>
            <div className="modal__body">
              <span className="badge badge--blue" style={{ marginBottom: 10 }}>
                {lightbox.plan.type}
              </span>
              <h3>{lightbox.plan.title}</h3>
              <p>{lightbox.plan.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
