import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getProjectsStatus,
  loadProjects,
  loadVisibility,
  retryProjects,
  SERVICE_CATEGORIES,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import FilterBar from "./FilterBar";
import GalleryTile, { PAGE_SIZE, tileShape } from "./GalleryTile";
import Icon from "./Icons";
import Lightbox from "./Lightbox";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SectionError, SkeletonGrid } from "./SectionStatus";
import "../styles/sections.css";

const ALL = "Tous";

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

function projectMedia(project) {
  const videoType = projectVideoType(project);
  if (videoType === "local" && project.video) return [{ type: "video", src: project.video }];
  if (videoType === "url" && project.videoUrl) return [{ type: "embed", src: project.videoUrl }];
  return (project.images || []).filter(Boolean).map((src) => ({ type: "image", src }));
}

export default function Portfolio() {
  const { t } = useLanguage();
  const [projects] = useLiveStorage(loadProjects);
  const [status] = useLiveStorage(getProjectsStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("portfolio");
  const [filter, setFilter] = useState(ALL);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState(null); // { project, index }

  const visibleProjects = useMemo(() => projects.filter((p) => p.visible !== false), [projects]);
  const categories = useMemo(
    () => SERVICE_CATEGORIES.filter((c) => visibleProjects.some((p) => p.category === c)),
    [visibleProjects]
  );
  const activeFilter = filter === ALL || categories.includes(filter) ? filter : ALL;
  const filtered = useMemo(
    () => (activeFilter === ALL ? visibleProjects : visibleProjects.filter((p) => p.category === activeFilter)),
    [visibleProjects, activeFilter]
  );

  const selectFilter = useCallback((f) => {
    setFilter(f);
    setLimit(PAGE_SIZE);
  }, []);

  const openProject = useCallback((project) => {
    if (projectMedia(project).length) setOpen({ project, index: 0 });
  }, []);
  const closeLightbox = useCallback(() => setOpen(null), []);
  const setLightboxIndex = useCallback((index) => setOpen((o) => o && { ...o, index }), []);

  if (!visibility.portfolio) return null;

  const shown = filtered.slice(0, limit);

  return (
    <section id="portfolio" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.portfolio.tag}
          titleA={t.portfolio.titleA}
          accent={t.portfolio.titleAccent}
          titleB={t.portfolio.titleB}
          subtitle={t.portfolio.subtitle}
        />

        {categories.length > 0 && (
          <FilterBar
            options={[ALL, ...categories]}
            value={activeFilter}
            onChange={selectFilter}
            labelFor={(f) => (f === ALL ? t.portfolio.filterAll : f)}
          />
        )}

        {status === "loading" ? (
          <SkeletonGrid count={6} className="gallery" />
        ) : status === "error" ? (
          <SectionError onRetry={retryProjects} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">{t.portfolio.emptyState}</div>
        ) : (
          <>
            <div className="gallery">
              {shown.map((p, i) => {
                const videoType = projectVideoType(p);
                return (
                  <Reveal key={p.id} delay={i % 3} className={`gallery__item ${tileShape(i)}`}>
                    <GalleryTile
                      item={p}
                      image={p.images?.[0]}
                      localVideo={videoType === "local" ? p.video : null}
                      isVideo={p.mediaType === "video"}
                      title={p.title}
                      badge={p.category}
                      meta={[p.client, p.year].filter(Boolean).join(" · ")}
                      featured={p.featured}
                      onOpen={openProject}
                      openLabel={t.portfolio.viewProject}
                    />
                  </Reveal>
                );
              })}
            </div>
            {filtered.length > limit && (
              <div className="load-more">
                <button type="button" className="btn btn--ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  <Icon name="plus" size={18} /> {t.common.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {open && (
        <Lightbox
          items={projectMedia(open.project)}
          index={open.index}
          onIndex={setLightboxIndex}
          onClose={closeLightbox}
          label={open.project.title}
        >
          {open.project.category && <span className="chip">{open.project.category}</span>}
          <h3>{open.project.title}</h3>
          {(open.project.client || open.project.year) && (
            <p className="lightbox__meta">
              {open.project.client && (
                <span>
                  <Icon name="building" size={16} /> {open.project.client}
                </span>
              )}
              {open.project.year && (
                <span>
                  <Icon name="clock" size={16} /> {open.project.year}
                </span>
              )}
            </p>
          )}
          {open.project.description && <p>{open.project.description}</p>}
        </Lightbox>
      )}
    </section>
  );
}
