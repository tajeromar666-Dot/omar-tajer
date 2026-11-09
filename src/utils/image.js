// Supabase Storage image transformations (resized/re-encoded on the fly via
// /storage/v1/render/image/...). They require a paid Supabase plan, so they
// are opt-in: set VITE_SUPABASE_IMAGE_TRANSFORM=true in the Netlify env
// once enabled on the project. Anything that isn't a public Supabase Storage
// URL (base64 data URLs, external links) is always used as-is.
//
// Supabase picks the output format from the request's Accept header: a
// browser that accepts WebP gets WebP. The <picture> markup in SmartImage
// uses that for its image/webp <source>, and `format=origin` (the original
// JPEG/PNG) for the <img> fallback.
const TRANSFORMS_ENABLED = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORM === "true";
const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export const DEFAULT_WIDTHS = [480, 800, 1200];
export const HERO_WIDTHS = [480, 640, 960, 1200];

export function canTransform(src) {
  return TRANSFORMS_ENABLED && typeof src === "string" && src.includes(OBJECT_PATH);
}

export function transformedUrl(src, width, { quality = 72, original = false } = {}) {
  if (!canTransform(src)) return src;
  const base = src.split("?")[0].replace(OBJECT_PATH, RENDER_PATH);
  return `${base}?width=${width}&quality=${quality}&resize=contain${original ? "&format=origin" : ""}`;
}

export function buildSrcSet(src, widths = DEFAULT_WIDTHS, options) {
  if (!canTransform(src)) return undefined;
  return widths.map((w) => `${transformedUrl(src, w, options)} ${w}w`).join(", ");
}
