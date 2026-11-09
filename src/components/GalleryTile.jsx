import { memo } from "react";
import Icon from "./Icons";
import SmartImage from "./SmartImage";

// Masonry rhythm for the gallery grid: a fixed, repeating pattern of tall
// and wide tiles (see .gallery in sections.css). Shapes are decided up
// front rather than from each image's natural size, so tiles never resize
// once images load — zero layout shift.
const SHAPES = ["tall", "", "", "wide", "", "tall", "", ""];
export function tileShape(index) {
  const shape = SHAPES[index % SHAPES.length];
  return shape ? `gallery__item--${shape}` : "";
}

export const PAGE_SIZE = 6;

// One clickable gallery tile (Réalisations / Plans 3D) — memoized, with a
// stable onOpen(item) callback, so filtering or paging only renders new
// tiles. The whole tile is a single button target (stretched .tile__hit)
// so headings stay valid outside the button.
function GalleryTile({ item, image, localVideo, isVideo, title, badge, meta, featured, onOpen, openLabel }) {
  return (
    <article className="tile">
      <div className="tile__media">
        {image ? (
          <SmartImage
            src={image}
            alt={title}
            width={800}
            height={600}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : localVideo ? (
          <video src={localVideo} preload="metadata" muted playsInline tabIndex={-1} />
        ) : (
          <span className="tile__placeholder">
            <Icon name={isVideo ? "video" : "image"} size={30} />
          </span>
        )}
      </div>
      <div className="tile__shade" aria-hidden="true" />
      {isVideo && (
        <span className="tile__play" aria-hidden="true">
          <Icon name="video" size={18} />
        </span>
      )}
      {featured && (
        <span className="tile__featured" aria-hidden="true">
          <Icon name="star" size={13} filled />
        </span>
      )}
      <div className="tile__body">
        {badge && <span className="chip">{badge}</span>}
        <h3 className="tile__title">{title}</h3>
        {meta && <p className="tile__meta">{meta}</p>}
      </div>
      <button type="button" className="tile__hit" onClick={() => onOpen(item)} aria-label={`${openLabel} — ${title}`} />
    </article>
  );
}

export default memo(GalleryTile);
