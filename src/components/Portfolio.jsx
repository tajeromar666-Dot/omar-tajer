import { useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getProjectsStatus,
  loadColorOverrides,
  loadProjects,
  loadSectionThemes,
  loadVisibility,
  retryProjects,
  sectionThemeStyle,
  SERVICE_CATEGORIES,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";
import RevealCard from "./RevealCard";

function ProjectsSkeleton() {
  return (
    <div className="grid cards-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}

// videoType (explicitly set on upload/URL entry) takes priority, falling
// back to inferring from whichever field is populated — for projects
// saved before the videoType field existed.
function projectVideoType(project) {
  if (project.mediaType !== "video") return null;
  if (project.videoType) return project.videoType;
  if (project.video) return "local";
  if (project.videoUrl) return "url";
  return null;
}

function ProjectVideo({ project }) {
  const videoType = projectVideoType(project);
  if (videoType === "local" && project.video) {
    return <video src={project.video} autoPlay muted loop playsInline />;
  }
  if (videoType === "url" && project.videoUrl) {
    return (
      <div className="media-embed">
        <iframe src={project.videoUrl} title={project.title} allowFullScreen />
      </div>
    );
  }
  return null;
}

export default function Portfolio() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [projects] = useLiveStorage(loadProjects);
  const [status] = useLiveStorage(getProjectsStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const [filter, setFilter] = useState("Tous");
  const [selected, setSelected] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const galleryRef = useRef(null);

  if (!visibility.portfolio) return null;

  const visibleProjects = projects.filter((p) => p.visible !== false);
  const filters = ["Tous", ...SERVICE_CATEGORIES];
  const filtered =
    filter === "Tous"
      ? visibleProjects
      : visibleProjects.filter((p) => p.category === filter);

  function openProject(p) {
    setSelected(p);
    setActiveImg(0);
  }

  function scrollToImage(idx) {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const clamped = Math.max(0, Math.min(idx, (selected?.images?.length || 1) - 1));
    gallery.scrollTo({ left: clamped * gallery.clientWidth, behavior: "smooth" });
    setActiveImg(clamped);
  }

  function onGalleryScroll(e) {
    const gallery = e.target;
    const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
    if (idx !== activeImg) setActiveImg(idx);
  }

  return (
    <section
      id="portfolio"
      className="section steel-texture"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "portfolio", colorOverrides)}
    >
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.portfolio.tag}</span>
          <h2 className="section-title">
            {t.portfolio.titleA} <span>{t.portfolio.titleAccent}</span> {t.portfolio.titleB}
          </h2>
          <p className="section-subtitle">{t.portfolio.subtitle}</p>
        </div>

        <div className="portfolio__filters reveal">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "Tous" ? t.portfolio.filterAll : f}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <ProjectsSkeleton />
        ) : status === "error" ? (
          <div className="section-error">
            <p>Impossible de charger les réalisations pour le moment.</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={retryProjects}>
              <Icon name="refreshCw" size={16} /> Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">{t.portfolio.emptyState}</div>
        ) : (
          <div className="grid cards-grid">
            {filtered.map((p, i) => {
              const image = p.images?.[0];
              return (
                <RevealCard
                  className="project-card"
                  index={i % 3}
                  key={p.id}
                  onClick={() => openProject(p)}
                >
                  {image ? (
                    <img src={image} alt={p.title} className="project-card__media" />
                  ) : (
                    <div className="project-card__placeholder">
                      <Icon name={p.mediaType === "video" ? "video" : "image"} size={26} />
                    </div>
                  )}
                  {p.mediaType === "video" && (
                    <span className="project-card__play">
                      <Icon name="video" size={16} />
                    </span>
                  )}
                  {p.featured && (
                    <span className="project-card__featured">
                      <Icon name="star" size={12} filled />
                    </span>
                  )}
                  <div className="project-card__overlay" />
                  <div className="project-card__content">
                    <span className="project-card__category">{p.category}</span>
                    <h3 className="project-card__title">{p.title}</h3>
                    <p className="project-card__meta">
                      {[p.client, p.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setSelected(null)}>
              <Icon name="close" size={18} />
            </button>
            {selected.mediaType === "video" && (selected.video || selected.videoUrl) ? (
              <div className="modal__gallery">
                <ProjectVideo project={selected} />
              </div>
            ) : (
              <div className="modal__gallery-wrap">
                <div className="modal__gallery" ref={galleryRef} onScroll={onGalleryScroll}>
                  {(selected.images || []).map((img, idx) => (
                    <div className="modal__gallery-item" key={idx}>
                      <img src={img} alt={`${selected.title} ${idx + 1}`} />
                    </div>
                  ))}
                </div>
                {selected.images?.length > 1 && (
                  <>
                    <button
                      className="hero__nav hero__nav--prev"
                      onClick={() => scrollToImage(activeImg - 1)}
                      aria-label="Image précédente"
                    >
                      <Icon name="chevronLeft" size={20} />
                    </button>
                    <button
                      className="hero__nav hero__nav--next"
                      onClick={() => scrollToImage(activeImg + 1)}
                      aria-label="Image suivante"
                    >
                      <Icon name="chevronRight" size={20} />
                    </button>
                    <span className="modal__gallery-counter">
                      {activeImg + 1} / {selected.images.length}
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="modal__body">
              <span className="project-card__category" style={{ marginBottom: 10 }}>
                {selected.category}
              </span>
              <h3>{selected.title}</h3>
              <div className="modal__meta">
                <span>
                  <Icon name="building" size={16} /> {selected.client}
                </span>
                <span>
                  <Icon name="clock" size={16} /> {selected.year}
                </span>
              </div>
              <p>{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
