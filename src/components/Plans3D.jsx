import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getPlans3DStatus, loadPlans3D, loadVisibility, PLAN3D_TYPES, retryPlans3D } from "../data/seedData";
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

function planImages(p) {
  if (p.images?.length) return p.images.filter(Boolean);
  return p.image ? [p.image] : [];
}

// videoType (explicitly set on upload/URL entry) takes priority, falling
// back to inferring from whichever field is populated — for plans saved
// before the videoType field existed.
function planVideoType(plan) {
  if (plan.mediaType !== "video") return null;
  if (plan.videoType) return plan.videoType;
  if (plan.video) return "local";
  if (plan.videoUrl) return "url";
  return null;
}

function planMedia(plan) {
  const videoType = planVideoType(plan);
  if (videoType === "local" && plan.video) return [{ type: "video", src: plan.video }];
  if (videoType === "url" && plan.videoUrl) return [{ type: "embed", src: plan.videoUrl }];
  return planImages(plan).map((src) => ({ type: "image", src }));
}

export default function Plans3D() {
  const { t } = useLanguage();
  const [plans] = useLiveStorage(loadPlans3D);
  const [status] = useLiveStorage(getPlans3DStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("plans3d");
  const [filter, setFilter] = useState(ALL);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState(null); // { plan, index }

  const visiblePlans = useMemo(() => plans.filter((p) => p.visible !== false), [plans]);
  const types = useMemo(
    () => PLAN3D_TYPES.filter((type) => visiblePlans.some((p) => p.type === type)),
    [visiblePlans]
  );
  const activeFilter = filter === ALL || types.includes(filter) ? filter : ALL;
  const filtered = useMemo(
    () => (activeFilter === ALL ? visiblePlans : visiblePlans.filter((p) => p.type === activeFilter)),
    [visiblePlans, activeFilter]
  );

  const selectFilter = useCallback((f) => {
    setFilter(f);
    setLimit(PAGE_SIZE);
  }, []);
  const openPlan = useCallback((plan) => {
    if (planMedia(plan).length) setOpen({ plan, index: 0 });
  }, []);
  const closeLightbox = useCallback(() => setOpen(null), []);
  const setLightboxIndex = useCallback((index) => setOpen((o) => o && { ...o, index }), []);

  if (!visibility.plans3d) return null;
  // Genuinely no data to show (nothing local, or Supabase confirmed the
  // table is empty) — hide the whole section. While the first fetch is
  // still in flight or has failed, fall through to the skeleton/error UI.
  if ((status === "idle" || status === "ready") && !plans.length) return null;

  const shown = filtered.slice(0, limit);

  return (
    <section id="plans3d" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.plans3d.tag}
          titleA={t.plans3d.titleA}
          accent={t.plans3d.titleAccent}
          titleB={t.plans3d.titleB}
          subtitle={t.plans3d.subtitle}
        />

        {types.length > 0 && (
          <FilterBar
            options={[ALL, ...types]}
            value={activeFilter}
            onChange={selectFilter}
            labelFor={(f) => (f === ALL ? t.plans3d.filterAll : f)}
          />
        )}

        {status === "loading" ? (
          <SkeletonGrid count={6} className="gallery" />
        ) : status === "error" ? (
          <SectionError onRetry={retryPlans3D} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">{t.plans3d.emptyState}</div>
        ) : (
          <>
            <div className="gallery">
              {shown.map((p, i) => {
                const videoType = planVideoType(p);
                const images = planImages(p);
                return (
                  <Reveal key={p.id} delay={i % 3} className={`gallery__item ${tileShape(i)}`}>
                    <GalleryTile
                      item={p}
                      image={videoType ? null : images[0]}
                      localVideo={videoType === "local" ? p.video : null}
                      isVideo={!!videoType}
                      title={p.title}
                      badge={p.type}
                      meta={p.software}
                      featured={p.featured}
                      onOpen={openPlan}
                      openLabel={t.common.openDetails}
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
          items={planMedia(open.plan)}
          index={open.index}
          onIndex={setLightboxIndex}
          onClose={closeLightbox}
          label={open.plan.title}
        >
          {open.plan.type && <span className="chip">{open.plan.type}</span>}
          <h3>{open.plan.title}</h3>
          {open.plan.software && <p className="lightbox__meta">{open.plan.software}</p>}
          {open.plan.description && <p>{open.plan.description}</p>}
        </Lightbox>
      )}
    </section>
  );
}
