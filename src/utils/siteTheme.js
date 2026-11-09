import { autoTextTiers, DEFAULT_SPACING, DEFAULT_THEME, findSectionPreset } from "../data/seedData";
import { contrastRatio, getContrastColor, getReadableAccent } from "./contrast";

// Defaults of the redesigned public site — mirrored from the tokens at the
// top of site.css (used here only for contrast calculations).
const SITE = {
  bg: "#0a0a0f",
  bgAlt: "#1a1a2e",
  bgDeep: "#07070b",
  text: "#ffffff",
  textSoft: "#c9cbd8",
  accent: "#ff6b35",
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const isHex = (v) => typeof v === "string" && HEX.test(v.trim());

// loadTheme() seeds DEFAULT_THEME into every visitor's storage, so "a theme
// exists" doesn't mean "the admin chose one". Only a theme that actually
// differs from the stock defaults overrides the new design's palette.
export function isCustomTheme(theme) {
  if (!theme) return false;
  return Object.keys(DEFAULT_THEME).some(
    (k) => isHex(theme[k]) && theme[k].toLowerCase() !== DEFAULT_THEME[k].toLowerCase()
  );
}

// Same idea for the global section spacing: applySpacing() always writes
// the stock 60px, which would flatten the new fluid spacing — only a value
// the admin actually changed is honored.
export function customSpacing(spacing) {
  const global = Number(spacing?.global);
  return global && global !== DEFAULT_SPACING.global ? global : null;
}

// One entry per public section: its key in "Couleurs des Sections"
// (cia_section_colors), its key in the per-section theme presets
// (cia_section_themes / cia_color_overrides), and which default background
// the design gives it.
const SECTIONS = [
  { id: "hero", color: "hero", theme: "hero", bg: "bg" },
  { id: "about", color: "about", theme: "about", bg: "bg" },
  { id: "services", color: "services", theme: "services", bg: "bgAlt" },
  { id: "plans3d", color: "plans3d", theme: "plans3d", bg: "bg" },
  { id: "portfolio", color: "portfolio", theme: "portfolio", bg: "bgAlt" },
  { id: "partners", color: "partners", theme: "partners", bg: "bg" },
  { id: "testimonials", color: "testimonials", theme: "temoignages", bg: "bgAlt" },
  { id: "excellence", color: "excellence", theme: "whyus", bg: "bg" },
  { id: "team", color: "team", theme: "team", bg: "bgAlt" },
  { id: "contact", color: "contact", theme: "contact", bg: "bg" },
  { id: "footer", color: "footer", theme: "footer", bg: "bgDeep" },
];

const first = (...values) => values.find(isHex);

// Title/text readability guarantee. Admin color choices were made against
// the old light design (dark titles on light sections) — on the new dark
// backgrounds those would become unreadable. For every section this works
// out the background and title/text/accent colors that will actually
// render (same precedence as the CSS: section color > section theme >
// design default) and, wherever the pair falls below WCAG (3:1 for titles
// and 4.5:1 for body text and accents — the accent also colors small
// section tags), emits a --guard-* variable that site.css
// puts ahead of everything else. Readable combinations are left untouched.
export function contrastGuardVars({ sectionColors, sectionThemes, colorOverrides, theme }) {
  const custom = isCustomTheme(theme);
  const defaults = custom
    ? { bg: theme.colorDark, bgAlt: theme.colorPanel, bgDeep: theme.colorDark, text: theme.colorText, accent: theme.colorBlue }
    : SITE;
  const vars = {};

  SECTIONS.forEach((s) => {
    const sc = sectionColors?.[s.color] || {};
    const preset = findSectionPreset(sectionThemes?.[s.theme]);
    const ov = colorOverrides?.[s.theme] || {};
    const auto = preset ? autoTextTiers(preset.background, preset.text) : null;

    const bg = first(sc.bg, preset?.background, defaults[s.bg]);
    if (!bg) return;
    // applySectionColors() auto-fills title/text from a custom background.
    const autoFromBg = isHex(sc.bg) ? getContrastColor(sc.bg) : null;
    const title = first(sc.title, autoFromBg, ov.heading, auto?.heading, defaults.text);
    const text = first(sc.text, autoFromBg, ov.text, auto?.primary, custom ? defaults.text : SITE.textSoft);
    const accent = first(
      sc.accent,
      preset ? getReadableAccent(preset.background, preset.accent) : null,
      defaults.accent
    );

    if (title && contrastRatio(bg, title) < 3) vars[`--guard-${s.id}-title`] = getContrastColor(bg);
    if (text && contrastRatio(bg, text) < 4.5) vars[`--guard-${s.id}-text`] = getContrastColor(bg);
    if (accent && contrastRatio(bg, accent) < 4.5) vars[`--guard-${s.id}-accent`] = getReadableAccent(bg, accent);
    if (isHex(sc.cardBg) && text && contrastRatio(sc.cardBg, text) < 4.5) {
      vars[`--guard-${s.id}-card-text`] = getContrastColor(sc.cardBg);
    }
  });

  return vars;
}
