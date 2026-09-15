// WCAG contrast helpers used by the Theme Selector / Per-Section Theme
// system to keep text readable whenever a background or accent color is
// chosen from a preset — see seedData.js's sectionThemeStyle().

function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}

// WCAG relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(rgb) {
  const [R, G, B] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Standard WCAG contrast ratio between two colors (1:1 to 21:1).
export function contrastRatio(hexA, hexB) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Dark or light text for a given background, using the site's own
// dark/white ink colors rather than pure black/white.
export function getContrastColor(hexBackground) {
  const rgb = hexToRgb(hexBackground);
  if (!rgb) return "#1a1a2e";
  return relativeLuminance(rgb) > 0.179 ? "#1a1a2e" : "#ffffff";
}

// Blends hexA toward hexB by pct% (0-100).
export function mixHex(hexA, hexB, pct) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const t = Math.max(0, Math.min(100, pct)) / 100;
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

// Nudges accentHex toward whichever of black/white reads best on
// bgHex until it clears the WCAG AA minimum (4.5:1) for normal text —
// returns the original color untouched if it already passes.
export function getReadableAccent(bgHex, accentHex, minRatio = 4.5) {
  if (!hexToRgb(bgHex) || !hexToRgb(accentHex)) return accentHex;
  if (contrastRatio(bgHex, accentHex) >= minRatio) return accentHex;

  const target = getContrastColor(bgHex);
  let best = accentHex;
  for (let pct = 10; pct <= 100; pct += 10) {
    const candidate = mixHex(accentHex, target, pct);
    best = candidate;
    if (contrastRatio(bgHex, candidate) >= minRatio) break;
  }
  return best;
}

// A short, human-readable contrast rating for the admin UI's live indicator.
export function contrastLabel(ratio) {
  if (ratio >= 7) return { level: "Excellent", ok: true };
  if (ratio >= 4.5) return { level: "Bon", ok: true };
  if (ratio >= 3) return { level: "Limite", ok: false };
  return { level: "Insuffisant", ok: false };
}
