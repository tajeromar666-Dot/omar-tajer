// Shared validation + client-side compression for every image upload input
// in the admin dashboard (Projets, Plans 3D, Team, Partenaires, Excellence,
// Settings logo). Keeps the exact user-facing error strings in one place so
// every upload area shows identical wording.

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const MAX_BYTES = 5 * 1024 * 1024;
// Every raster upload is re-encoded to WebP, at most 1200px on its larger
// side, starting at quality 0.75 — then stepped down (quality first, then
// dimensions) until it fits the 150KB budget the public site is tuned for.
const MAX_DIMENSION = 1200;
const TARGET_COMPRESSED_BYTES = 150 * 1024;
const QUALITY_STEPS = [0.75, 0.65, 0.55, 0.45];
const DIMENSION_STEPS = [1200, 1024, 800, 640];

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Format non supporté. Utilisez JPG, PNG, WEBP ou GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image trop grande. Maximum 5MB." };
  }
  return { ok: true };
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier. Réessayez."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Erreur de lecture du fichier. Réessayez."));
    img.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// SVGs are vector — rasterizing them through canvas would be a quality
// regression, not a size win, so they pass through unchanged.
//
// Every other image is drawn at most `maxDimension`px on its larger side and
// encoded as WebP at quality 0.75; while the result is over 150KB it retries
// at lower quality, then at smaller dimensions, keeping the first attempt
// that fits (or the smallest one achieved if none did). Browsers that can't
// encode WebP (canvas silently returns PNG) fall back to JPEG.
async function compressImage(file, { maxDimension = MAX_DIMENSION } = {}) {
  const original = await readAsDataURL(file);
  if (file.type === "image/svg+xml") {
    return { dataUrl: original, file };
  }

  const img = await loadImage(original);
  const longest = Math.max(img.width, img.height);
  // Never upscale, and never re-encode the same size twice.
  const dimensions = [
    ...new Set(DIMENSION_STEPS.filter((d) => d <= maxDimension).map((d) => Math.min(d, longest))),
  ];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let type = "image/webp";
  let best = null;

  outer: for (const dimension of dimensions) {
    const scale = dimension / longest;
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITY_STEPS) {
      let blob = await canvasToBlob(canvas, type, quality);
      if (blob && blob.type !== type) {
        type = "image/jpeg";
        blob = await canvasToBlob(canvas, type, quality);
      }
      if (!blob) continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_COMPRESSED_BYTES) break outer;
    }
  }

  if (!best) return { dataUrl: original, file };

  const ext = best.type === "image/webp" ? ".webp" : ".jpg";
  const compressedFile = new File([best], (file.name || "image").replace(/\.[^.]+$/, "") + ext, {
    type: best.type,
  });
  const dataUrl = await readAsDataURL(compressedFile);
  return { dataUrl, file: compressedFile };
}

// Full pipeline for a single file: validate -> read -> compress. Throws an
// Error whose `.message` is always one of the exact user-facing strings, so
// callers can show it directly in their error state.
export async function processImageFile(file) {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new Error(validation.error);
  return compressImage(file);
}
