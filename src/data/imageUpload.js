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
const MAX_DIMENSION = 800;
const TARGET_COMPRESSED_BYTES = 500 * 1024;
const QUALITY_STEPS = [0.6, 0.4, 0.3];

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

// SVGs are vector — rasterizing them through canvas would be a quality
// regression, not a size win, so they pass through unchanged.
//
// Every other image is scaled so its larger dimension is at most 800px,
// then re-encoded as JPEG starting at quality 0.6; if the result is still
// over 500KB it retries at 0.4, then 0.3, keeping whichever attempt first
// got under the target (or the smallest one achieved if none did).
async function compressImage(file, { maxDimension = MAX_DIMENSION } = {}) {
  const original = await readAsDataURL(file);
  if (file.type === "image/svg+xml") {
    return { dataUrl: original, file };
  }

  const img = await loadImage(original);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  let dataUrl = null;
  let blob = null;
  for (const quality of QUALITY_STEPS) {
    const candidateDataUrl = canvas.toDataURL("image/jpeg", quality);
    const candidateBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    const candidateSize = candidateBlob ? candidateBlob.size : candidateDataUrl.length * 0.75;
    if (!dataUrl || candidateSize < (blob ? blob.size : Infinity)) {
      dataUrl = candidateDataUrl;
      blob = candidateBlob;
    }
    if (candidateSize <= TARGET_COMPRESSED_BYTES) break;
  }

  const compressedFile = blob
    ? new File([blob], (file.name || "image").replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      })
    : file;

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
