import { memo, useCallback, useState } from "react";
import { buildSrcSet, canTransform, DEFAULT_WIDTHS, transformedUrl } from "../utils/image";

// Every public-site image goes through here: lazy by default (eager +
// high fetch priority only for the hero), async decoding, explicit
// width/height so the browser reserves space (no layout shift), and a
// blur-up reveal. When Supabase transformations are available it renders a
// <picture>: a WebP <source> with a srcset/sizes per width, and the original
// format (JPEG/PNG) in the <img> as fallback.
function SmartImage({
  src,
  alt = "",
  width,
  height,
  sizes = "100vw",
  widths = DEFAULT_WIDTHS,
  priority = false,
  fit = "cover",
  className = "",
}) {
  // Tracked per-src (not a boolean reset in an effect) so a cached image
  // whose load event fires before effects run can never get stuck blurred.
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const transform = canTransform(src) && failedSrc !== src;

  const imgRef = useCallback(
    (img) => {
      if (img && img.complete && img.naturalWidth) setLoadedSrc(src);
    },
    [src]
  );

  if (!src) return null;

  const largest = widths[widths.length - 1];
  const loaded = loadedSrc === src;
  const preview = transform ? transformedUrl(src, 32, { quality: 30 }) : null;

  const img = (
    <img
      ref={imgRef}
      src={transform ? transformedUrl(src, largest, { original: true }) : src}
      srcSet={transform ? buildSrcSet(src, widths, { original: true }) : undefined}
      sizes={transform ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={priority ? "high" : undefined}
      style={fit !== "cover" ? { objectFit: fit } : undefined}
      onLoad={() => setLoadedSrc(src)}
      onError={() => {
        // A transformation URL failing (plan without the feature, unusual
        // format...) falls back to the original file; otherwise just stop
        // showing the placeholder shimmer.
        if (transform) setFailedSrc(src);
        else setLoadedSrc(src);
      }}
    />
  );

  return (
    <span
      className={`smart-img${loaded ? " is-loaded" : ""}${priority ? " smart-img--priority" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={preview ? { "--preview": `url("${preview}")` } : undefined}
    >
      {transform ? (
        <picture>
          <source type="image/webp" srcSet={buildSrcSet(src, widths)} sizes={sizes} />
          {img}
        </picture>
      ) : (
        img
      )}
    </span>
  );
}

export default memo(SmartImage);
