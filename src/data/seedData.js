// Sample/seed data + localStorage helpers for the whole app.
// Everything the site needs (projects, messages, settings) lives in
// localStorage; this module owns the keys, the defaults and the seeding.

import { PARTNER_LOGOS } from "../assets/logos";
import { isSupabaseConnected, supabase } from "../supabase";
import { createTableSync } from "./supabaseSync";
import { deleteMedia, getMedia, listMediaKeys, saveMedia } from "../utils/storage";
import { getContrastColor, getReadableAccent, mixHex } from "../utils/contrast";

export const SERVICE_CATEGORIES = [
  "Génie Civil",
  "Charpente Métallique",
  "Chaudronnerie",
  "Tuyauterie",
  "Sablage",
  "Peinture Four",
];

const CATEGORY_COLORS = {
  "Génie Civil": "#1E5AA8",
  "Charpente Métallique": "#E53935",
  Chaudronnerie: "#F4B400",
  Tuyauterie: "#1a1a2e",
  Sablage: "#767e8c",
  "Peinture Four": "#123d75",
};

// Lightweight generated placeholder (no external image files / no network).
function placeholder(label, color = "#1E5AA8") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${color}"/>
        <stop offset="1" stop-color="#1a1a2e"/>
      </linearGradient>
      <pattern id="p" width="40" height="40" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="transparent"/>
        <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
      </pattern>
    </defs>
    <rect width="900" height="620" fill="url(#g)"/>
    <rect width="900" height="620" fill="url(#p)"/>
    <text x="450" y="330" font-family="Arial, sans-serif" font-size="42" font-weight="700"
      fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_SETTINGS = {
  companyName: "CIA — Construction Industrielle Africaine",
  phone1: "06 61 52 70 69",
  phone2: "05 22 33 82 16",
  email1: "cia.hlalat2020@gmail.com",
  email2: "chahydmustapha4@gmail.com",
  address: "Hlalat 1, Mejjatia, Ouled Taleb, Mediouna 20490, Maroc",
  responsable: "CHAHYD Mustapha",
  heroTitle: "Construction Industrielle Africaine",
  heroSubtitle:
    "Génie civil, charpente métallique, chaudronnerie, tuyauterie, sablage et peinture four — l'excellence industrielle au service de vos projets à travers le Maroc et l'Afrique.",
  // null => fall back to the built-in CIA_LOGO asset (see Logo Manager)
  logo: null,
};

// ---- Theme (Theme Customizer) --------------------------------------------
export const DEFAULT_THEME = {
  colorBlue: "#1E5AA8",
  colorYellow: "#F4B400",
  colorRed: "#E53935",
  colorDark: "#1a1a2e",
  // Defaults below match today's actual rendered colors (see index.css
  // --color-gray-900 / --color-white) so adding these two fields never
  // changes the site's current out-of-the-box appearance.
  colorPanel: "#22252b",
  colorText: "#ffffff",
};

const THEME_VAR_MAP = {
  colorBlue: "--color-blue",
  colorYellow: "--color-yellow",
  colorRed: "--color-red",
  colorDark: "--color-dark",
  colorPanel: "--color-panel",
  colorText: "--color-text",
};

// Applies theme colors to the document root as CSS variable overrides —
// every derived shade (color-mix based) cascades automatically.
export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(THEME_VAR_MAP).forEach(([key, cssVar]) => {
    if (theme?.[key]) root.style.setProperty(cssVar, theme[key]);
  });
}

// ---- Theme Selector (10 coordinated preset palettes) ----------------------
// Each preset gives 4 coordinated colors (background, panel, accent, text).
// Applying one maps onto the same 4-variable Theme Customizer above
// (colorDark/colorPanel/colorBlue+colorRed/colorText), so the whole
// already-themed site (which reads --color-dark/--color-blue/--color-red
// pervasively) recolors instantly, and the existing custom pickers keep
// working to fine-tune the result afterwards.
export const PRESET_THEMES = [
  { id: "cia-original", name: "CIA Original", background: "#1a1a2e", panel: "#1c2433", accent: "#E53935", text: "#ffffff" },
  { id: "acier-bleu", name: "Acier Bleu", background: "#0d1b2a", panel: "#1b2d42", accent: "#1E5AA8", text: "#e8edf2" },
  { id: "or-industriel", name: "Or Industriel", background: "#1a1400", panel: "#2a2200", accent: "#F4B400", text: "#fff8e1" },
  { id: "nuit-verte", name: "Nuit Verte", background: "#0a1a0f", panel: "#122018", accent: "#2ecc71", text: "#e8f5e9" },
  { id: "rouge-feu", name: "Rouge Feu", background: "#1a0a0a", panel: "#2d1010", accent: "#e74c3c", text: "#ffeaea" },
  { id: "titane", name: "Titane", background: "#1c1c1e", panel: "#2c2c2e", accent: "#8e8e93", text: "#f2f2f7" },
  { id: "marine-royal", name: "Marine Royal", background: "#001233", panel: "#002366", accent: "#4169e1", text: "#e8eeff" },
  { id: "cuivre", name: "Cuivre", background: "#1a0f00", panel: "#2d1a00", accent: "#cd7f32", text: "#fff3e0" },
  { id: "emeraude", name: "Émeraude", background: "#002a20", panel: "#003d2e", accent: "#00b894", text: "#e0fff8" },
  { id: "minuit-violet", name: "Minuit Violet", background: "#0d0015", panel: "#1a0030", accent: "#9b59b6", text: "#f5e6ff" },
];

export const DEFAULT_PRESET_THEME_ID = "cia-original";

// Merges a preset's 4 colors into an existing theme object (preserving
// colorYellow, which presets don't define, so a manual yellow fine-tune
// survives switching presets). colorRed is set alongside colorBlue so the
// site's secondary "punch" accent stays coherent with the new primary one.
export function themeWithPreset(currentTheme, preset) {
  return {
    ...currentTheme,
    colorDark: preset.background,
    colorPanel: preset.panel,
    colorBlue: preset.accent,
    colorRed: preset.accent,
    colorText: preset.text,
  };
}

export function findPresetTheme(id) {
  return PRESET_THEMES.find((p) => p.id === id) || PRESET_THEMES[0];
}

// Boot-time-only: applies a preset's colors directly (no "current theme" to
// merge into yet). Called before loadTheme()'s own applyTheme() in main.jsx
// as a harmless earlier baseline — the persisted cia_theme (which already
// carries any fine-tuning made on top of the last-applied preset) is always
// the authoritative call and runs right after, before first paint.
export function applyPresetTheme(id) {
  const preset = findPresetTheme(id);
  applyTheme(themeWithPreset({}, preset));
  return preset;
}

export function loadActiveTheme() {
  return read(KEYS.activeTheme, DEFAULT_PRESET_THEME_ID);
}

export function saveActiveTheme(id) {
  return write(KEYS.activeTheme, id);
}

// ---- Per-Section Theme Selector -------------------------------------------
// A second, independent layer on top of the site-wide Theme Selector above:
// each public section can opt into its own coordinated 4-color palette.
// Every section's CSS already reads var(--sec-bg/--sec-panel/--sec-accent/
// --sec-text) as a fallback ahead of its normal default (see index.css) —
// these are only ever set inline, scoped to that one section's DOM subtree
// (see sectionThemeStyle()), so an untouched section's look never changes.
export const SECTION_THEME_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "À Propos" },
  { key: "services", label: "Services" },
  { key: "plans3d", label: "Plans 3D" },
  { key: "portfolio", label: "Réalisations" },
  { key: "partners", label: "Partenaires" },
  { key: "temoignages", label: "Témoignages" },
  { key: "team", label: "Notre Équipe" },
  { key: "whyus", label: "Excellence Industrielle (Pourquoi Nous)" },
  { key: "contact", label: "Contact" },
  { key: "footer", label: "Footer" },
];

export const SECTION_PRESET_THEMES = [
  { id: "blanc-epure", name: "Blanc Épuré", background: "#ffffff", panel: "#f8f9fa", accent: "#1E5AA8", text: "#1a1a2e" },
  { id: "ardoise-bleu", name: "Ardoise Bleu", background: "#1a1a2e", panel: "#1c2433", accent: "#1E5AA8", text: "#e8edf2" },
  { id: "rouge-cia", name: "Rouge CIA", background: "#1a0808", panel: "#2d1010", accent: "#E53935", text: "#ffffff" },
  { id: "or-sable", name: "Or Sable", background: "#fdf6e3", panel: "#f5ece0", accent: "#F4B400", text: "#2d2000" },
  { id: "vert-industrie", name: "Vert Industrie", background: "#0a1a0f", panel: "#122018", accent: "#2ecc71", text: "#e8f5e9" },
  { id: "gris-titane", name: "Gris Titane", background: "#f2f2f7", panel: "#e5e5ea", accent: "#3a3a3c", text: "#1c1c1e" },
  { id: "marine-profond", name: "Marine Profond", background: "#001233", panel: "#002366", accent: "#4169e1", text: "#e8eeff" },
  { id: "nuit-totale", name: "Nuit Totale", background: "#000000", panel: "#0d0d0d", accent: "#E53935", text: "#ffffff" },
];

export function findSectionPreset(name) {
  return SECTION_PRESET_THEMES.find((p) => p.name === name) || null;
}

// Auto-calculated text-color tiers for a section's chosen background —
// the theme's own `text` field (already author-picked for contrast) wins
// for heading/primary text whenever it's set; getContrastColor() is only
// the fallback for whichever tiers it doesn't cover. Exported so the admin
// UI's live contrast indicator (ThemeTab.jsx) can preview the same values.
export function autoTextTiers(backgroundHex, explicitTextHex) {
  const heading = explicitTextHex || getContrastColor(backgroundHex);
  const primary = explicitTextHex || getContrastColor(backgroundHex);
  const secondary = mixHex(primary, backgroundHex, 18);
  const muted = mixHex(primary, backgroundHex, 34);
  return { heading, primary, secondary, muted };
}

// Inline style object a section component spreads onto its own root
// element — undefined (no-op) when that section has no chosen theme, so it
// keeps its exact current default appearance. `overrides` is this
// section's entry from cia_color_overrides (loadColorOverrides()), applied
// on top of the theme's own colors and the auto-calculated contrast tiers —
// manual choice > theme's explicit text color > auto-calculated contrast.
export function sectionThemeStyle(themes, sectionKey, overrides) {
  const preset = findSectionPreset(themes?.[sectionKey]);
  if (!preset) return undefined;
  const auto = autoTextTiers(preset.background, preset.text);
  const o = overrides?.[sectionKey] || {};
  return {
    "--sec-bg": preset.background,
    "--sec-panel": preset.panel,
    "--sec-accent": getReadableAccent(preset.background, preset.accent),
    "--sec-text": preset.text,
    "--sec-heading": o.heading || auto.heading,
    "--sec-text-primary": o.text || auto.primary,
    "--sec-text-secondary": o.secondary || auto.secondary,
    "--sec-text-muted": auto.muted,
  };
}

export function loadSectionThemes() {
  return read(KEYS.sectionThemes, {});
}

export function saveSectionThemes(themes) {
  return write(KEYS.sectionThemes, themes);
}

export function loadColorOverrides() {
  return read(KEYS.colorOverrides, {});
}

export function saveColorOverrides(overrides) {
  return write(KEYS.colorOverrides, overrides);
}

// ---- Design Templates -------------------------------------------------
// 30 total recipes for the whole public site, in three families — layered
// on top of whatever colors the Theme Selector / Per-Section Themes above
// have set. No content/data is affected; see the .template-<id> rules in
// index.css and the wrapper in HomePage.jsx.
// - The first 10 focus on card LAYOUT: column count, card shape/size/
//   spacing and section layout.
// - The next 10 focus on card border-radius/shadow PLUS a distinct scroll
//   or hover ANIMATION per template (built on the shared .reveal-card /
//   .card-in-view toggle from useCardReveal.js's IntersectionObserver).
// - The last 10 are full aesthetic skins (background pattern/texture,
//   card shape, hover animation, scroll-reveal) — each one that changes
//   the section backdrop also force-sets its title/subtitle color so it
//   can never reproduce the title-invisible contrast bug.
export const DESIGN_TEMPLATES = [
  { id: "classic", name: "Grille Classique", className: "template-classic" },
  { id: "wide", name: "Cartes Larges", className: "template-wide" },
  { id: "masonry", name: "Mosaïque Asymétrique", className: "template-masonry" },
  { id: "horizontal", name: "Bandes Horizontales", className: "template-horizontal" },
  { id: "circles", name: "Cercles et Courbes", className: "template-circles" },
  { id: "cut-corners", name: "Angles Coupés", className: "template-cut-corners" },
  { id: "overlap", name: "Superposition", className: "template-overlap" },
  { id: "minimal", name: "Minimal Épuré", className: "template-minimal" },
  { id: "floating", name: "Cartes Flottantes", className: "template-floating" },
  { id: "editorial", name: "Style Magazine", className: "template-editorial" },
  { id: "net", name: "Classique Net", className: "template-net" },
  { id: "steel-cut", name: "Acier Coupé", className: "template-steel-cut" },
  { id: "soft-round", name: "Rond Doux", className: "template-soft-round" },
  { id: "brutal", name: "Brutaliste", className: "template-brutal" },
  { id: "frosted-glass", name: "Verre Dépoli", className: "template-frosted-glass" },
  { id: "spring-float", name: "Flottant", className: "template-spring-float" },
  { id: "mag-stagger", name: "Magazine", className: "template-mag-stagger" },
  { id: "neon-pulse", name: "Néon Pulse", className: "template-neon-pulse" },
  { id: "waves", name: "Vagues Organiques", className: "template-waves" },
  { id: "dark-luxe", name: "Luxe Sombre", className: "template-dark-luxe" },
  { id: "vaporwave", name: "Vaporwave", className: "template-vaporwave" },
  { id: "paper-cut", name: "Papier Découpé", className: "template-paper-cut" },
  { id: "concrete", name: "Architecture Béton", className: "template-concrete" },
  { id: "holographic", name: "Holographique", className: "template-holographic" },
  { id: "scandi", name: "Scandinave", className: "template-scandi" },
  { id: "cyberpunk", name: "Cyberpunk Grid", className: "template-cyberpunk" },
  { id: "terracotta", name: "Terracotta Chaude", className: "template-terracotta" },
  { id: "mono-type", name: "Mono Typographique", className: "template-mono-type" },
  { id: "watercolor", name: "Aquarelle", className: "template-watercolor" },
  { id: "rust", name: "Industriel Rouille", className: "template-rust" },
];

export function findDesignTemplate(id) {
  return DESIGN_TEMPLATES.find((t) => t.id === id) || null;
}

// null = no template chosen yet → today's exact default look, untouched.
export function loadDesignTemplate() {
  return read(KEYS.designTemplate, null);
}

export function saveDesignTemplate(id) {
  return write(KEYS.designTemplate, id);
}

// ---- Hero Slider ------------------------------------------------------
export const DEFAULT_HERO_SLIDES = [
  {
    id: "slide_1",
    image: null,
    title: DEFAULT_SETTINGS.heroTitle,
    subtitle: DEFAULT_SETTINGS.heroSubtitle,
  },
];

// ---- À Propos -----------------------------------------------------------
export const DEFAULT_ABOUT = {
  title: "Un partenaire industriel fiable et exigeant",
  titleAccent: "fiable et exigeant",
  mediaType: "image", // "image" | "video"
  image: null,
  video: null, // base64
  videoUrl: "", // external embed link (YouTube/Vimeo)
  badgeNumber: "15+",
  badgeLabel: "Ans d'expertise",
  description:
    "CIA — Construction Industrielle Africaine est une entreprise marocaine spécialisée dans les travaux de génie civil et de construction métallique industrielle. Basée à Hlalat, Mejjatia, Ouled Taleb (Mediouna), nous intervenons auprès d'industriels, de la grande distribution et de groupes miniers partout au Maroc.\nSous la direction de CHAHYD Mustapha, notre équipe pluridisciplinaire couvre l'ensemble de la chaîne de réalisation : fondations béton armé, charpente et structures métalliques, chaudronnerie sur mesure, tuyauterie industrielle, sablage et peinture haute performance — un seul interlocuteur, du terrassement à la finition.",
  values: [
    {
      id: "v1",
      icon: "shield",
      title: "Sécurité avant tout",
      text: "Chantiers conformes aux normes HSE, équipes formées et suivies.",
    },
    {
      id: "v2",
      icon: "award",
      title: "Qualité certifiée",
      text: "Exigence industrielle à chaque étape, du dossier d'exécution à la livraison.",
    },
    {
      id: "v3",
      icon: "tool",
      title: "Savoir-faire technique",
      text: "Génie civil, métal et chaudronnerie maîtrisés par des équipes expérimentées.",
    },
    {
      id: "v4",
      icon: "clock",
      title: "Respect des délais",
      text: "Planification rigoureuse et suivi de chantier pour livrer à temps.",
    },
  ],
};

// ---- Services -------------------------------------------------------------
export const DEFAULT_SERVICES = [
  {
    id: "s1",
    icon: "edit",
    title: "Études techniques et réalisation de plans",
    description:
      "Conception et réalisation de plans techniques détaillés pour vos projets de construction métallique",
  },
  {
    id: "s2",
    icon: "pipe",
    title: "Tuyauterie industrielle",
    description:
      "Préfabrication et montage de tuyauterie industrielle adaptés à vos besoins spécifiques",
  },
  {
    id: "s3",
    icon: "boiler",
    title: "Fabrication d'ouvrages métalliques",
    description:
      "Fabrication sur mesure d'ouvrages en acier et inox de haute qualité",
  },
  {
    id: "s4",
    icon: "truss",
    title: "Montage de structures métalliques",
    description:
      "Installation et montage professionnel de structures métalliques sur site",
  },
  {
    id: "s5",
    icon: "civil",
    title: "Travaux de génie civil",
    description:
      "Réalisation de fondations métalliques et travaux de génie civil spécialisés",
  },
  {
    id: "s6",
    icon: "tool",
    title: "Maintenance industrielle",
    description:
      "Services de maintenance préventive et corrective pour vos installations industrielles",
  },
];

export const ICON_OPTIONS = [
  "civil",
  "truss",
  "boiler",
  "pipe",
  "sand",
  "paint",
  "shield",
  "award",
  "tool",
  "clock",
  "users",
  "thumbsUp",
  "building",
  "checkCircle",
  "star",
  "mapPin",
  "phone",
  "mail",
];

// ---- Partners ---------------------------------------------------------
export const DEFAULT_PARTNERS = [
  { id: "ocp", name: "OCP Group", logo: PARTNER_LOGOS.ocp },
  { id: "carrefour", name: "Carrefour", logo: PARTNER_LOGOS.carrefour },
  { id: "marjane", name: "Marjane", logo: PARTNER_LOGOS.marjane },
  { id: "atacadao", name: "Atacadao", logo: PARTNER_LOGOS.atacadao },
];

// ---- Team ---------------------------------------------------------------
export const DEFAULT_TEAM = [
  {
    id: "t1",
    name: "CHAHYD Mustapha",
    role: "Responsable / Fondateur",
    photo: null,
    linkedin: "",
  },
  {
    id: "t2",
    name: "Mohamed DAHIRI",
    role: "Responsable / Fondateur",
    photo: null,
    linkedin: "",
  },
];

// ---- Pourquoi Nous Choisir / Excellence Industrielle ----------------------
export const DEFAULT_WHYUS_ITEMS = [
  {
    id: "w1",
    icon: "award",
    title: "15+ ans d'expérience",
    text: "Une expertise éprouvée sur des chantiers industriels exigeants à travers le Maroc.",
  },
  {
    id: "w2",
    icon: "users",
    title: "Équipes qualifiées",
    text: "Des techniciens et ouvriers spécialisés, formés aux normes de sécurité industrielle.",
  },
  {
    id: "w3",
    icon: "tool",
    title: "Multi-métiers",
    text: "Génie civil, métal, chaudronnerie, tuyauterie, sablage et peinture sous un même toit.",
  },
  {
    id: "w4",
    icon: "clock",
    title: "Respect des délais",
    text: "Planification rigoureuse du chantier et suivi d'avancement transparent.",
  },
  {
    id: "w5",
    icon: "shield",
    title: "Sécurité & conformité",
    text: "Procédures HSE appliquées sur chaque intervention, en atelier comme sur site.",
  },
  {
    id: "w6",
    icon: "thumbsUp",
    title: "Satisfaction client",
    text: "Des partenariats durables avec des industriels et enseignes de premier plan.",
  },
];

// No default slides — the slider only renders once the admin adds media.
export const DEFAULT_WHYUS_SLIDES = [];

// ---- Témoignages ----------------------------------------------------------
export const DEFAULT_TESTIMONIALS = [
  {
    id: "te1",
    name: "Rachid Benali",
    company: "OCP Group",
    role: "Directeur des Opérations",
    text: "CIA a livré notre plateforme de stockage dans les délais avec une qualité d'exécution remarquable. Une équipe sérieuse et réactive du premier au dernier jour.",
    rating: 5,
    avatar: null,
    active: true,
  },
  {
    id: "te2",
    name: "Sanae El Amrani",
    company: "Marjane Holding",
    role: "Responsable Technique",
    text: "Le montage de notre charpente métallique a été mené avec un vrai professionnalisme. CIA maîtrise parfaitement les délais et la sécurité sur chantier.",
    rating: 5,
    avatar: null,
    active: true,
  },
  {
    id: "te3",
    name: "Karim Ouazzani",
    company: "Atacadao",
    role: "Chef de Projet",
    text: "Une entreprise fiable pour tous nos besoins en chaudronnerie et tuyauterie industrielle. Nous recommandons CIA sans hésiter.",
    rating: 4,
    avatar: null,
    active: true,
  },
];

// ---- Plans 3D & Études Techniques -----------------------------------------
export const PLAN3D_TYPES = [
  "Plan 2D",
  "Modélisation 3D",
  "Étude Technique",
  "Détail d'assemblage",
];

const PLAN3D_TYPE_COLORS = {
  "Plan 2D": "#1E5AA8",
  "Modélisation 3D": "#E53935",
  "Étude Technique": "#F4B400",
  "Détail d'assemblage": "#1a1a2e",
};

export const DEFAULT_PLANS3D = [
  {
    id: "pl1",
    title: "Plan de fondation — Hangar industriel",
    type: "Plan 2D",
    description:
      "Plan 2D détaillé des fondations et radiers pour un hangar de stockage industriel.",
    software: "AutoCAD",
    mediaType: "image",
    images: [placeholder("Plan 2D", PLAN3D_TYPE_COLORS["Plan 2D"])],
    video: null,
    videoUrl: "",
    featured: true,
    visible: true,
  },
  {
    id: "pl2",
    title: "Modélisation 3D — Charpente métallique",
    type: "Modélisation 3D",
    description:
      "Modélisation 3D complète d'une charpente métallique avec portiques et pannes.",
    software: "SolidWorks / Tekla Structures",
    mediaType: "image",
    images: [placeholder("Modélisation 3D", PLAN3D_TYPE_COLORS["Modélisation 3D"])],
    video: null,
    videoUrl: "",
    featured: true,
    visible: true,
  },
  {
    id: "pl3",
    title: "Étude technique — Plateforme de stockage",
    type: "Étude Technique",
    description:
      "Étude technique et dimensionnement structurel pour une plateforme de stockage industriel.",
    software: "Robot Structural Analysis",
    mediaType: "image",
    images: [placeholder("Étude Technique", PLAN3D_TYPE_COLORS["Étude Technique"])],
    video: null,
    videoUrl: "",
    featured: false,
    visible: true,
  },
  {
    id: "pl4",
    title: "Détail d'assemblage — Portique acier",
    type: "Détail d'assemblage",
    description:
      "Plan de détail d'assemblage boulonné pour un portique en charpente acier.",
    software: "AutoCAD",
    mediaType: "image",
    images: [placeholder("Détail d'assemblage", PLAN3D_TYPE_COLORS["Détail d'assemblage"])],
    video: null,
    videoUrl: "",
    featured: false,
    visible: true,
  },
];

export const SEED_PROJECTS = [
  {
    id: "p1",
    title: "Plateforme industrielle Mediouna",
    category: "Génie Civil",
    client: "OCP Group",
    year: "2023",
    description:
      "Réalisation des fondations, plots et radiers en béton armé pour une plateforme de stockage industriel.",
    images: [placeholder("Génie Civil", CATEGORY_COLORS["Génie Civil"])],
    featured: true,
    visible: true,
  },
  {
    id: "p2",
    title: "Hangar de stockage 3 000 m²",
    category: "Charpente Métallique",
    client: "Marjane Holding",
    year: "2022",
    description:
      "Conception et montage d'une charpente métallique complète avec portiques acier pour un hangar logistique.",
    images: [
      placeholder("Charpente Métallique", CATEGORY_COLORS["Charpente Métallique"]),
    ],
    featured: true,
    visible: true,
  },
  {
    id: "p3",
    title: "Cuve chaudronnée sur mesure",
    category: "Chaudronnerie",
    client: "Atacadao",
    year: "2023",
    description:
      "Fabrication d'ouvrages chaudronnés en acier inoxydable pour une unité de conditionnement agroalimentaire.",
    images: [placeholder("Chaudronnerie", CATEGORY_COLORS["Chaudronnerie"])],
    featured: false,
    visible: true,
  },
  {
    id: "p4",
    title: "Réseau de tuyauterie process",
    category: "Tuyauterie",
    client: "OCP Group",
    year: "2021",
    description:
      "Préfabrication et montage d'un réseau de tuyauterie industrielle pour une unité de traitement chimique.",
    images: [placeholder("Tuyauterie", CATEGORY_COLORS.Tuyauterie)],
    featured: true,
    visible: true,
  },
  {
    id: "p5",
    title: "Traitement de surfaces métalliques",
    category: "Sablage",
    client: "Carrefour Maroc",
    year: "2022",
    description:
      "Préparation de surfaces par sablage avant peinture sur des structures métalliques de grande dimension.",
    images: [placeholder("Sablage", CATEGORY_COLORS.Sablage)],
    featured: false,
    visible: true,
  },
  {
    id: "p6",
    title: "Peinture haute performance — Four industriel",
    category: "Peinture Four",
    client: "OCP Group",
    year: "2023",
    description:
      "Application de peinture industrielle haute performance résistante aux hautes températures sur four de production.",
    images: [placeholder("Peinture Four", CATEGORY_COLORS["Peinture Four"])],
    featured: true,
    visible: true,
  },
  {
    id: "p7",
    title: "Extension d'entrepôt logistique",
    category: "Génie Civil",
    client: "Marjane Holding",
    year: "2020",
    description:
      "Travaux de génie civil pour l'extension d'un entrepôt : longrines, radiers et voiles béton armé.",
    images: [placeholder("Génie Civil", CATEGORY_COLORS["Génie Civil"])],
    featured: false,
    visible: true,
  },
  {
    id: "p8",
    title: "Ossature métallique bâtiment technique",
    category: "Charpente Métallique",
    client: "Atacadao",
    year: "2021",
    description:
      "Structure et ossature métallique complète pour un bâtiment technique industriel.",
    images: [
      placeholder("Charpente Métallique", CATEGORY_COLORS["Charpente Métallique"]),
    ],
    featured: false,
    visible: true,
  },
];

const KEYS = {
  projects: "cia_projects",
  messages: "cia_messages",
  settings: "cia_settings",
  auth: "cia_auth",
  theme: "cia_theme",
  activeTheme: "cia_active_theme",
  sectionThemes: "cia_section_themes",
  colorOverrides: "cia_color_overrides",
  designTemplate: "cia_design_template",
  heroSlides: "cia_hero_slides",
  about: "cia_about",
  services: "cia_services",
  partners: "cia_partners",
  team: "cia_team",
  whyUsItems: "cia_whyus_items",
  whyUsSlides: "cia_whyus_slides",
  testimonials: "cia_testimonials",
  visibility: "cia_visibility",
  adminCredentials: "cia_admin_credentials",
  locations: "cia_locations",
  plans3d: "cia_plans3d",
  social: "cia_social",
  maps: "cia_maps",
  sectionColors: "cia_section_colors",
  whatsapp: "cia_whatsapp",
  collaborateursCount: "cia_collaborateurs_count",
  heroSpeed: "cia_hero_speed",
  language: "cia_language",
  activeLanguages: "cia_active_languages",
  legalInfo: "cia_legal_info",
  spacing: "cia_spacing",
};

// ---- Social Media Manager ---------------------------------------------
export const DEFAULT_SOCIAL = {
  facebook: { url: "", enabled: false },
  linkedin: { url: "", enabled: false },
  instagram: { url: "", enabled: false },
  whatsapp: { number: "", enabled: false },
};

// ---- Google Maps Manager -------------------------------------------------
export const DEFAULT_MAPS = {
  embedUrl: "https://www.google.com/maps?q=Mediouna,Casablanca,Morocco&output=embed",
  enabled: true,
};

// ---- Dedicated WhatsApp Floating Button -----------------------------------
export const DEFAULT_WHATSAPP = {
  enabled: true,
  number: "212661527069",
};

// ---- Notre Équipe — Collaborateurs count -----------------------------------
export const DEFAULT_COLLABORATEURS_COUNT = 30;
export const DEFAULT_HERO_SPEED = 4;

// ---- Legal Info (ICE / RC / IF / CNSS) -------------------------------------
export const LEGAL_INFO_FIELDS = [
  { key: "ice", label: "ICE" },
  { key: "rc", label: "RC" },
  { key: "if", label: "IF" },
  { key: "cnss", label: "CNSS" },
];

export const DEFAULT_LEGAL_INFO = {
  ice: { value: "002601206000094", enabled: false },
  rc: { value: "471259", enabled: false },
  if: { value: "45951419", enabled: false },
  cnss: { value: "", enabled: false },
};

// ---- Language Visibility Control -------------------------------------------
// Français is always active — it's the default and the fallback.
export const DEFAULT_ACTIVE_LANGUAGES = ["fr", "en", "de", "ar"];

// ---- Section Colors (background, text, title, icon, cards, accent) --------
// Each section stores an object keyed by property (`{ bg, text, title, icon,
// cardBg, cardBorder, accent }`); any property left `null`/absent means "use
// the site's built-in design" — its CSS variable is removed rather than set,
// so an un-customized section keeps its original look (gradients, textures,
// hover tints...) exactly as authored in index.css.
//
// `swatch` (background) and `swatches` (the other 6 properties) are only
// representative colors shown in the admin color pickers before anything is
// customized — they approximate index.css's current defaults for that
// section's "light" or "dark" styling so the picker doesn't just default to
// black/white.
const LIGHT_SWATCHES = {
  text: "#454b57",
  title: "#22252b",
  icon: "#1E5AA8",
  cardBg: "#ffffff",
  cardBorder: "#eef0f4",
  accent: "#1E5AA8",
};
const DARK_SWATCHES = {
  text: "#c9ccd3",
  title: "#ffffff",
  icon: "#F4B400",
  cardBg: "#1f2a44",
  cardBorder: "#3a4a66",
  accent: "#F4B400",
};

function withSwatches(bg, preset) {
  return { bg, ...preset };
}

export const SECTION_COLOR_PROPS = [
  { key: "bg", label: "Fond" },
  { key: "text", label: "Texte" },
  { key: "title", label: "Titre / En-tête" },
  { key: "icon", label: "Icônes" },
  { key: "cardBg", label: "Fond des cartes" },
  { key: "cardBorder", label: "Bordure des cartes" },
  { key: "accent", label: "Accent / Surbrillance" },
];

const PROP_VAR_SUFFIX = {
  bg: "bg",
  text: "text",
  title: "title",
  icon: "icon",
  cardBg: "card-bg",
  cardBorder: "card-border",
  accent: "accent",
};

export const SECTION_COLOR_FIELDS = [
  { key: "hero", label: "Hero (dégradé de fond)", swatches: withSwatches("#16294d", DARK_SWATCHES) },
  { key: "about", label: "À Propos", swatches: withSwatches("#f2f4f7", LIGHT_SWATCHES) },
  { key: "services", label: "Services", swatches: withSwatches("#f2f4f7", LIGHT_SWATCHES) },
  { key: "excellence", label: "Excellence Industrielle", swatches: withSwatches("#1a1a2e", DARK_SWATCHES) },
  { key: "plans3d", label: "Plans 3D", swatches: withSwatches("#ffffff", LIGHT_SWATCHES) },
  { key: "portfolio", label: "Réalisations / Projets", swatches: withSwatches("#f2f4f7", LIGHT_SWATCHES) },
  { key: "partners", label: "Partenaires", swatches: withSwatches("#f7f8fa", LIGHT_SWATCHES) },
  { key: "team", label: "Notre Équipe", swatches: withSwatches("#f2f4f7", LIGHT_SWATCHES) },
  { key: "testimonials", label: "Témoignages", swatches: withSwatches("#f2f4f7", LIGHT_SWATCHES) },
  { key: "contact", label: "Contact", swatches: withSwatches("#ffffff", LIGHT_SWATCHES) },
  { key: "footer", label: "Footer", swatches: withSwatches("#15151f", DARK_SWATCHES) },
];

export const DEFAULT_SECTION_COLORS = Object.fromEntries(
  SECTION_COLOR_FIELDS.map((f) => [f.key, {}])
);

export function sectionColorVar(sectionKey, propKey) {
  return `--section-${sectionKey}-${PROP_VAR_SUFFIX[propKey] || propKey}`;
}

// Kept for any external reference to the background var specifically.
export function sectionBgVar(key) {
  return sectionColorVar(key, "bg");
}

// Injects every customized section/property as a CSS variable on :root; any
// property left at its default (null/absent) has its variable removed so
// the section's original CSS shows through untouched.
//
// Guaranteed-contrast fix: `bg`/`title`/`text` are picked independently in
// this panel (unlike the Per-Section Theme presets, which already run
// through autoTextTiers()) — an admin customizing only the background left
// the title/subtitle on the fixed --color-gray-900 default, invisible on a
// dark custom background. Whenever `bg` is set but `title`/`text` isn't,
// auto-compute one with getContrastColor() (same white/#1a1a2e-or-dark
// luminance check the rest of the app already relies on) instead of
// leaving it to the unrelated default — an explicit title/text choice
// still always wins.
export function applySectionColors(colors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  SECTION_COLOR_FIELDS.forEach((f) => {
    const sectionColors = colors?.[f.key] || {};
    const bg = sectionColors.bg;
    SECTION_COLOR_PROPS.forEach((p) => {
      let value = sectionColors[p.key];
      if (!value && bg && (p.key === "title" || p.key === "text")) {
        value = getContrastColor(bg);
      }
      const varName = sectionColorVar(f.key, p.key);
      if (value) root.style.setProperty(varName, value);
      else root.style.removeProperty(varName);
    });
  });
}

// ---- Section Spacing Control -----------------------------------------------
export const SPACING_SECTION_FIELDS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "À Propos" },
  { key: "services", label: "Services" },
  { key: "excellence", label: "Excellence" },
  { key: "plans3d", label: "Plans 3D" },
  { key: "realisations", label: "Réalisations" },
  { key: "partenaires", label: "Partenaires" },
  { key: "equipe", label: "Équipe" },
  { key: "temoignages", label: "Témoignages" },
  { key: "contact", label: "Contact" },
];

export const DEFAULT_SPACING = {
  global: 60,
  sections: Object.fromEntries(SPACING_SECTION_FIELDS.map((f) => [f.key, {}])),
};

// Injects the global spacing value plus any customized per-section
// pt/pb as CSS variables on :root; a section left at its default
// (no pt/pb set) has its variable removed so it falls back to the
// global value (or, for Hero, to its own unchanged 0px default) —
// same "customized wins, else fall through to CSS default" approach
// as applySectionColors above.
export function applySpacing(spacing) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const s = spacing || DEFAULT_SPACING;
  const global = Number(s.global) || DEFAULT_SPACING.global;
  root.style.setProperty("--section-padding-top", `${global}px`);
  root.style.setProperty("--section-padding-bottom", `${global}px`);
  SPACING_SECTION_FIELDS.forEach((f) => {
    const sec = s.sections?.[f.key] || {};
    const ptVar = `--section-${f.key}-pt`;
    const pbVar = `--section-${f.key}-pb`;
    if (sec.pt) root.style.setProperty(ptVar, `${sec.pt}px`);
    else root.style.removeProperty(ptVar);
    if (sec.pb) root.style.setProperty(pbVar, `${sec.pb}px`);
    else root.style.removeProperty(pbVar);
  });
}

export function loadSpacing() {
  const existing = read(KEYS.spacing, null);
  if (existing) {
    return {
      global: existing.global ?? DEFAULT_SPACING.global,
      sections: {
        ...DEFAULT_SPACING.sections,
        ...(existing.sections || {}),
      },
    };
  }
  write(KEYS.spacing, DEFAULT_SPACING);
  return DEFAULT_SPACING;
}

export function saveSpacing(spacing) {
  return write(KEYS.spacing, spacing);
}

// ---- Section Visibility Control -------------------------------------------
export const VISIBILITY_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "À Propos" },
  { key: "services", label: "Services" },
  { key: "plans3d", label: "Plans 3D" },
  { key: "portfolio", label: "Réalisations (Projets)" },
  { key: "partners", label: "Partenaires" },
  { key: "temoignages", label: "Témoignages" },
  { key: "team", label: "Notre Équipe" },
  { key: "whyus", label: "Excellence Industrielle" },
  { key: "contact", label: "Contact" },
];

export const DEFAULT_VISIBILITY = {
  hero: true,
  about: true,
  services: true,
  plans3d: true,
  portfolio: true,
  partners: true,
  temoignages: true,
  team: true,
  whyus: true,
  contact: true,
};

// ---- Admin Login Credentials -----------------------------------------------
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: "admin@cia.ma",
  password: "admin123",
};

// ---- Multiple Locations Manager --------------------------------------------
export const DEFAULT_LOCATIONS = [
  {
    id: "loc1",
    name: "Siège Social",
    address: "Hlalat 1, Mejjatia, Ouled Taleb, Mediouna 20490",
    phone: "06 61 52 70 69",
    email: "",
    mapUrl: "https://www.google.com/maps?q=Mediouna,Casablanca,Morocco&output=embed",
    active: true,
    showEmail: true,
    showPhone: true,
    showMap: true,
  },
];

// Same-tab live updates (admin + public site mounted in the same
// document) go through this custom event; cross-tab updates arrive via
// the native `storage` event — see hooks/useLiveStorage.js.
export const DATA_CHANGE_EVENT = "cia:data-changed";

function notify(key) {
  if (typeof window === "undefined") return;
  // Deferred to the next tick so this synchronous dispatch never lands in
  // the middle of the React update that triggered the save (other mounted
  // components — e.g. the admin Sidebar — also listen for this event and
  // update their own state from it).
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT, { detail: key }));
  }, 0);
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ---- localStorage quota recovery -------------------------------------
// write() always saves the FULL array/object for a key, not just the one
// item being edited — so a single old oversized image (e.g. uploaded
// before compression existed) can keep failing every future save of that
// key, even one adding a tiny new image. These helpers make that
// recoverable instead of a hard, permanent failure.

function isQuotaExceededError(err) {
  return (
    !!err &&
    (err.name === "QuotaExceededError" ||
      err.code === 22 ||
      err.code === 1014 ||
      /quota/i.test(err.message || ""))
  );
}

// Populated with a specific, user-facing message whenever quota recovery
// has to give up — read via getLastStorageError() right after a failed
// save to show something more useful than a generic error.
let lastStorageError = null;
export function getLastStorageError() {
  return lastStorageError;
}

// Removes any "cia_"-prefixed localStorage key that isn't one of this
// app's current, known data keys — leftover artifacts from earlier
// feature iterations/renamed keys. Never touches real project data (every
// key actually in use lives in KEYS). Also used directly by the "Vider le
// cache" button in Paramètres.
export function clearCache() {
  const known = new Set(Object.values(KEYS));
  let removed = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith("cia_") && !known.has(k)) {
      localStorage.removeItem(k);
      removed++;
    }
  }
  return removed;
}

// Same idea as clearCache() above, but for the IndexedDB media store —
// removes any record whose key isn't one of this app's current, known
// data keys. Never touches the 7 real media domains (their keys all live
// in KEYS). Used alongside clearCache() by "Vider le cache" in Paramètres.
export async function clearMediaCache() {
  const known = new Set(Object.values(KEYS));
  try {
    const keys = await listMediaKeys();
    const orphaned = keys.filter((k) => typeof k === "string" && k.startsWith("cia_") && !known.has(k));
    await Promise.all(orphaned.map((k) => deleteMedia(k)));
    return orphaned.length;
  } catch (err) {
    console.error("clearMediaCache: failed to list/clear IndexedDB entries", err);
    return 0;
  }
}

// Returns null on success, the caught error otherwise.
function trySet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch (err) {
    return err;
  }
}

function itemLabel(item) {
  return item?.title || item?.name || item?.client_name || "cet élément";
}

// items: an array of records (projects, plans, team members, testimonials,
// partners, slides...). Degrades progressively on quota errors: free any
// orphaned cache and retry, then trim each item's own `images` array down
// to just the most recent image, then drop the oldest items outright one
// at a time, so a single oversized item can never permanently block every
// future save of the whole list. Any other kind of error is not
// recoverable this way and fails immediately.
function saveArrayWithQuotaRecovery(key, items) {
  lastStorageError = null;
  const firstErr = trySet(key, items);
  if (!firstErr) return true;
  if (!isQuotaExceededError(firstErr)) return false;

  clearCache();
  if (!trySet(key, items)) return true;

  const trimmed = items.map((item) =>
    Array.isArray(item.images) && item.images.length > 1
      ? { ...item, images: item.images.slice(-1) }
      : item
  );
  if (!trySet(key, trimmed)) return true;

  let reduced = trimmed;
  while (reduced.length > 1) {
    reduced = reduced.slice(0, -1);
    if (!trySet(key, reduced)) return true;
  }

  const largest = items.reduce(
    (a, b) => (JSON.stringify(b).length > JSON.stringify(a).length ? b : a),
    items[0]
  );
  lastStorageError = `"${itemLabel(largest)}" est trop volumineux pour le stockage local. Utilisez une URL d'image à la place.`;
  return false;
}

// value: a single plain object (Settings, Theme, Social...). No array to
// trim — just frees cache and retries, then names whichever field looks
// oversized so the admin knows what to switch to a URL.
function saveObjectWithQuotaRecovery(key, value) {
  lastStorageError = null;
  const firstErr = trySet(key, value);
  if (!firstErr) return true;
  if (!isQuotaExceededError(firstErr)) return false;

  clearCache();
  if (!trySet(key, value)) return true;

  const entries = Object.entries(value || {});
  const largestField = entries.length
    ? entries.reduce((a, b) => (JSON.stringify(b[1]).length > JSON.stringify(a[1]).length ? b : a))[0]
    : "";
  lastStorageError = largestField
    ? `Le champ "${largestField}" est trop volumineux pour le stockage local. Utilisez une URL d'image à la place.`
    : "Stockage local plein.";
  return false;
}

// Returns true on success, false if the write failed even after quota
// recovery was attempted (see saveArrayWithQuotaRecovery /
// saveObjectWithQuotaRecovery above).
function write(key, value) {
  const ok = Array.isArray(value)
    ? saveArrayWithQuotaRecovery(key, value)
    : saveObjectWithQuotaRecovery(key, value);
  if (ok) notify(key);
  return ok;
}

// ---- Supabase-backed domains (Projects, Plans3D, Messages, Testimonials,
// Team, Settings) — each is reconciled from / written through to Supabase
// in the background when configured. See src/data/supabaseSync.js for the
// shared engine and the approved migration plan for the full reasoning.
// Every other domain in this file is untouched and stays localStorage-only.
//
// Media-heavy domains (Projects, Plans3D, Team, Testimonials — plus
// Partners/Excellence-slides/Hero-slides further below, which have no
// Supabase table) persist their LOCAL copy to IndexedDB instead of
// localStorage, via the two helpers below — localStorage's ~5MB per-origin
// cap was routinely exceeded by base64 images/video; IndexedDB's quota is
// far larger. `read()`/`write()` (localStorage) remain unchanged and are
// still used by every other domain in this file (settings, credentials,
// visibility, colors, messages, about, theme...).

// Wraps saveMedia (IndexedDB) with the same "catch and report" contract
// write() already has for localStorage, so every existing `if (!ok) {
// setError(getLastStorageError() || ...) }` call site keeps working
// unchanged for these domains too.
async function saveMediaWithErrorHandling(key, value) {
  lastStorageError = null;
  try {
    await saveMedia(key, value);
    return true;
  } catch (err) {
    console.error(`seedData: saveMedia(${key}) failed`, err);
    lastStorageError = `Échec de l'enregistrement — stockage IndexedDB indisponible ou plein. Réessayez ou utilisez une URL.`;
    return false;
  }
}

// Reads from IndexedDB, seeding it with `defaultValue` (and persisting
// that seed) the first time — mirroring read()'s existing
// seed-then-write-default behavior for localStorage.
//
// Before falling back to the static default, checks for LEGACY data still
// sitting under this same key in localStorage — real content saved before
// this domain moved to IndexedDB. Without this, that content would look
// like it silently vanished (IndexedDB starts empty; nothing ever copied
// it over), even though it was never actually lost. Found legacy data is
// migrated into IndexedDB and removed from localStorage, so it only ever
// gets adopted once.
async function localMediaRead(key, defaultValue) {
  const existing = await getMedia(key);
  if (existing !== undefined && existing !== null) return existing;

  const legacy = read(key, null);
  if (legacy !== null && (!Array.isArray(legacy) || legacy.length > 0)) {
    await saveMediaWithErrorHandling(key, legacy);
    localStorage.removeItem(key);
    return legacy;
  }

  await saveMediaWithErrorHandling(key, defaultValue);
  return defaultValue;
}

// Same idea as localMediaRead, for the few domains where an existing-but-
// empty array should still be treated as "nothing set" (re-seed with the
// default) rather than as legitimately-empty content — checks IndexedDB,
// then legacy localStorage (migrating + cleaning up if found there), and
// returns `undefined` only if truly nothing usable exists anywhere.
async function localMediaReadNonEmpty(key) {
  const existing = await getMedia(key);
  if (existing && existing.length) return existing;

  const legacy = read(key, null);
  if (legacy && legacy.length) {
    await saveMediaWithErrorHandling(key, legacy);
    localStorage.removeItem(key);
    return legacy;
  }

  return undefined;
}

function localProjects() {
  return localMediaRead(KEYS.projects, SEED_PROJECTS);
}

// A project's video/videoUrl collapse into the table's single `video`
// column (disambiguated by `video_type`), and mediaType is derived from
// column presence on read — see plan decision #7. Saving enforces mutual
// exclusivity (images vs video) so that derivation stays lossless.
function projectToRow(p) {
  const isVideo = p.mediaType === "video";
  return {
    id: p.id,
    title: p.title || "",
    category: p.category || "",
    client: p.client || "",
    year: p.year || "",
    description: p.description || "",
    images: isVideo ? [] : p.images || [],
    video: isVideo ? (p.videoType === "url" ? p.videoUrl || null : p.video || null) : null,
    video_type: isVideo ? p.videoType || null : null,
    featured: !!p.featured,
    visible: p.visible !== false,
  };
}

function projectFromRow(row) {
  const hasVideo = !!row.video;
  return {
    id: row.id,
    title: row.title || "",
    category: row.category || "",
    client: row.client || "",
    year: row.year || "",
    description: row.description || "",
    images: row.images || [],
    mediaType: hasVideo ? "video" : "image",
    video: hasVideo && row.video_type !== "url" ? row.video : null,
    videoType: hasVideo ? row.video_type : null,
    videoUrl: hasVideo && row.video_type === "url" ? row.video : "",
    featured: !!row.featured,
    visible: row.visible !== false,
  };
}

const projectsSync = createTableSync({
  table: KEYS.projects,
  localRead: localProjects,
  localWrite: (items) => saveMediaWithErrorHandling(KEYS.projects, items),
  toRow: projectToRow,
  fromRow: projectFromRow,
  notify: () => notify(KEYS.projects),
});

export function loadProjects() {
  return projectsSync.load();
}

export function saveProjects(projects) {
  return projectsSync.save(projects);
}

// "idle" | "loading" | "ready" | "error" — see createTableSync in
// supabaseSync.js. Read reactively via useLiveStorage(getProjectsStatus) in
// Portfolio.jsx to drive its first-load skeleton and retry-on-error UI.
export function getProjectsStatus() {
  return projectsSync.getStatus();
}

export function retryProjects() {
  return projectsSync.retry();
}

function localMessages() {
  return read(KEYS.messages, []);
}

function messageToRow(m) {
  return {
    id: m.id,
    name: m.name || "",
    email: m.email || "",
    phone: m.phone || "",
    message: m.message || "",
    read: !!m.read,
  };
}

function messageFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    message: row.message || "",
    read: !!row.read,
    date: row.created_at || new Date().toISOString(),
  };
}

const messagesSync = createTableSync({
  table: KEYS.messages,
  localRead: localMessages,
  localWrite: (items) => write(KEYS.messages, items),
  toRow: messageToRow,
  fromRow: messageFromRow,
  notify: () => notify(KEYS.messages),
});

export function loadMessages() {
  return messagesSync.load();
}

export function saveMessages(messages) {
  return messagesSync.save(messages);
}

let settingsCache = null;
let settingsWriteSeq = 0;
let settingsFetchStarted = false;
let settingsRealtimeStarted = false;

function settingsRowValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

async function fetchSettingsFromSupabase() {
  const seqAtStart = settingsWriteSeq;
  try {
    const { data, error } = await supabase.from(KEYS.settings).select();
    if (error) throw error;
    if (seqAtStart !== settingsWriteSeq) return;
    const fromRows = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    settingsCache = { ...DEFAULT_SETTINGS, ...fromRows };
    write(KEYS.settings, settingsCache);
    notify(KEYS.settings);
  } catch (err) {
    console.error("settingsSync: fetch failed, staying on localStorage", err);
  }
}

function startSettingsRealtime() {
  if (settingsRealtimeStarted) return;
  settingsRealtimeStarted = true;
  try {
    supabase
      .channel(`${KEYS.settings}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table: KEYS.settings }, () => {
        fetchSettingsFromSupabase();
      })
      .subscribe();
  } catch (err) {
    console.error("settingsSync: realtime subscription failed", err);
  }
}

export function loadSettings() {
  if (settingsCache === null) {
    const existing = read(KEYS.settings, null);
    settingsCache = existing ? { ...DEFAULT_SETTINGS, ...existing } : DEFAULT_SETTINGS;
    if (!existing) write(KEYS.settings, DEFAULT_SETTINGS);
  }
  if (isSupabaseConnected && !settingsFetchStarted) {
    settingsFetchStarted = true;
    fetchSettingsFromSupabase();
    startSettingsRealtime();
  }
  return settingsCache;
}

export async function saveSettings(settings) {
  settingsWriteSeq += 1;
  if (isSupabaseConnected) {
    try {
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value: settingsRowValue(value),
      }));
      const { error } = await supabase.from(KEYS.settings).upsert(rows, { onConflict: "key" });
      if (error) throw error;
      settingsCache = settings;
      write(KEYS.settings, settings);
      notify(KEYS.settings);
      return true;
    } catch (err) {
      console.error("settingsSync: save failed, falling back to localStorage", err);
    }
  }
  const ok = write(KEYS.settings, settings);
  if (ok) settingsCache = settings;
  return ok;
}

// Tops up any locally-held field missing from Supabase — not just when the
// table is totally empty, so a partially-migrated table (some keys synced,
// others only ever saved locally) still gets fully reconciled instead of
// silently staying incomplete forever.
async function migrateSettingsIfEmpty() {
  if (!isSupabaseConnected) return;
  try {
    const existing = read(KEYS.settings, null);
    if (!existing) return;

    const { data, error } = await supabase.from(KEYS.settings).select("key");
    if (error) throw error;
    const remoteKeys = new Set((data || []).map((r) => r.key));

    const rows = Object.entries(existing)
      .filter(([key]) => !remoteKeys.has(key))
      .map(([key, value]) => ({ key, value: settingsRowValue(value) }));
    if (!rows.length) return;

    const { error: upsertError } = await supabase
      .from(KEYS.settings)
      .upsert(rows, { onConflict: "key" });
    if (upsertError) throw upsertError;
    console.info(`settingsSync: reconciled ${rows.length} field(s) into Supabase`);
    await fetchSettingsFromSupabase();
  } catch (err) {
    console.error("settingsSync: reconcile failed", err);
  }
}

export function loadTheme() {
  const existing = read(KEYS.theme, null);
  if (existing) return { ...DEFAULT_THEME, ...existing };
  write(KEYS.theme, DEFAULT_THEME);
  return DEFAULT_THEME;
}

export function saveTheme(theme) {
  return write(KEYS.theme, theme);
}

// Hero slides hold base64 images — mirrored to IndexedDB, and now also
// synced through Supabase (cia_hero_slides) like Projects/Plans3D/Team.
function localHeroSlides() {
  return localMediaRead(KEYS.heroSlides, DEFAULT_HERO_SLIDES);
}

// Array order is the display order (no explicit field on the client side)
// — mapped to `display_order` on save, table fetched ordered by it so
// order round-trips correctly, same convention as Team/Partners below.
function heroSlideToRow(slide, index) {
  return {
    id: slide.id,
    image: slide.image || null,
    title: slide.title || "",
    subtitle: slide.subtitle || "",
    display_order: index,
  };
}

function heroSlideFromRow(row) {
  return {
    id: row.id,
    image: row.image || null,
    title: row.title || "",
    subtitle: row.subtitle || "",
  };
}

const heroSlidesSync = createTableSync({
  table: KEYS.heroSlides,
  localRead: localHeroSlides,
  localWrite: (slides) => saveMediaWithErrorHandling(KEYS.heroSlides, slides),
  toRow: heroSlideToRow,
  fromRow: heroSlideFromRow,
  notify: () => notify(KEYS.heroSlides),
  orderBy: { column: "display_order", ascending: true },
});

export function loadHeroSlides() {
  return heroSlidesSync.load();
}

export function saveHeroSlides(slides) {
  return heroSlidesSync.save(slides);
}

// ---- À Propos — single row (id is always the fixed string "about"),
// now synced through Supabase (cia_about) the same way Settings is: a
// dedicated module-level cache/fetch/realtime trio rather than
// createTableSync, since this domain is one record, not an array.
let aboutCache = null;
let aboutWriteSeq = 0;
let aboutFetchStarted = false;
let aboutRealtimeStarted = false;

function aboutToRow(about) {
  const isVideo = about.mediaType === "video";
  return {
    id: "about",
    title: about.title || "",
    title_accent: about.titleAccent || "",
    media_type: about.mediaType || "image",
    image: isVideo ? null : about.image || null,
    video: isVideo ? (about.videoType === "url" ? about.videoUrl || null : about.video || null) : null,
    video_type: isVideo ? about.videoType || null : null,
    badge_number: about.badgeNumber || "",
    badge_label: about.badgeLabel || "",
    description: about.description || "",
    value_items: about.values || [],
  };
}

function aboutFromRow(row) {
  const hasVideo = !!row.video;
  return {
    title: row.title || "",
    titleAccent: row.title_accent || "",
    mediaType: row.media_type || "image",
    image: row.image || null,
    video: hasVideo && row.video_type !== "url" ? row.video : null,
    videoType: hasVideo ? row.video_type : null,
    videoUrl: hasVideo && row.video_type === "url" ? row.video : "",
    badgeNumber: row.badge_number || "",
    badgeLabel: row.badge_label || "",
    description: row.description || "",
    values: row.value_items || [],
  };
}

async function fetchAboutFromSupabase() {
  const seqAtStart = aboutWriteSeq;
  try {
    const { data, error } = await supabase.from(KEYS.about).select().eq("id", "about").maybeSingle();
    if (error) throw error;
    if (seqAtStart !== aboutWriteSeq || !data) return;
    aboutCache = { ...DEFAULT_ABOUT, ...aboutFromRow(data) };
    write(KEYS.about, aboutCache);
    notify(KEYS.about);
  } catch (err) {
    console.error("aboutSync: fetch failed, staying on localStorage", err);
  }
}

function startAboutRealtime() {
  if (aboutRealtimeStarted) return;
  aboutRealtimeStarted = true;
  try {
    supabase
      .channel(`${KEYS.about}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table: KEYS.about }, () => {
        fetchAboutFromSupabase();
      })
      .subscribe();
  } catch (err) {
    console.error("aboutSync: realtime subscription failed", err);
  }
}

export function loadAbout() {
  if (aboutCache === null) {
    const existing = read(KEYS.about, null);
    aboutCache = existing ? { ...DEFAULT_ABOUT, ...existing } : DEFAULT_ABOUT;
    if (!existing) write(KEYS.about, DEFAULT_ABOUT);
  }
  if (isSupabaseConnected && !aboutFetchStarted) {
    aboutFetchStarted = true;
    fetchAboutFromSupabase();
    startAboutRealtime();
  }
  return aboutCache;
}

export async function saveAbout(about) {
  aboutWriteSeq += 1;
  if (isSupabaseConnected) {
    try {
      const { error } = await supabase.from(KEYS.about).upsert(aboutToRow(about));
      if (error) throw error;
      aboutCache = about;
      write(KEYS.about, about);
      notify(KEYS.about);
      return true;
    } catch (err) {
      console.error("aboutSync: save failed, falling back to localStorage", err);
    }
  }
  const ok = write(KEYS.about, about);
  if (ok) aboutCache = about;
  return ok;
}

// Tops up Supabase from whatever's held locally if the remote row doesn't
// exist yet — same "seed once from the admin dashboard" role as
// migrateSettingsIfEmpty(), called only from runMigrations() below.
async function migrateAboutIfEmpty() {
  if (!isSupabaseConnected) return;
  try {
    const existing = read(KEYS.about, null);
    if (!existing) return;

    const { data, error } = await supabase.from(KEYS.about).select("id").eq("id", "about").maybeSingle();
    if (error) throw error;
    if (data) return;

    const { error: upsertError } = await supabase.from(KEYS.about).upsert(aboutToRow(existing));
    if (upsertError) throw upsertError;
    console.info("aboutSync: reconciled locally-held content into Supabase");
    await fetchAboutFromSupabase();
  } catch (err) {
    console.error("aboutSync: reconcile failed", err);
  }
}

// Titles from the pre-update default list — a browser that seeded before
// the services content/order fix landed still has these cached in
// localStorage. loadServices() below auto-migrates that exact stale set
// (and only that set — any genuinely admin-edited list is left untouched).
const LEGACY_SERVICE_TITLES = new Set([
  "Génie Civil",
  "Charpente Métallique",
  "Chaudronnerie",
  "Tuyauterie Industrielle",
  "Sablage",
  "Peinture Four",
]);

function isLegacyServiceList(list) {
  return (
    list.length === LEGACY_SERVICE_TITLES.size &&
    list.every((s) => LEGACY_SERVICE_TITLES.has(s.title))
  );
}

// Services text content is small (no media) — plain localStorage mirror,
// same as before, now also synced through Supabase (cia_services).
function localServices() {
  const existing = read(KEYS.services, null);
  if (existing && existing.length && !isLegacyServiceList(existing)) return existing;
  write(KEYS.services, DEFAULT_SERVICES);
  return DEFAULT_SERVICES;
}

function serviceToRow(s) {
  return { id: s.id, icon: s.icon || "", title: s.title || "", description: s.description || "" };
}

function serviceFromRow(row) {
  return { id: row.id, icon: row.icon || "", title: row.title || "", description: row.description || "" };
}

const servicesSync = createTableSync({
  table: KEYS.services,
  localRead: localServices,
  localWrite: (items) => write(KEYS.services, items),
  toRow: serviceToRow,
  fromRow: serviceFromRow,
  notify: () => notify(KEYS.services),
});

export function loadServices() {
  return servicesSync.load();
}

export function saveServices(services) {
  return servicesSync.save(services);
}

// Partner logos hold base64 images — mirrored to IndexedDB, and now also
// synced through Supabase (cia_partners) like Team.
function localPartners() {
  return localMediaRead(KEYS.partners, DEFAULT_PARTNERS);
}

function partnerToRow(p, index) {
  return { id: p.id, name: p.name || "", logo: p.logo || null, display_order: index };
}

function partnerFromRow(row) {
  return { id: row.id, name: row.name || "", logo: row.logo || null };
}

const partnersSync = createTableSync({
  table: KEYS.partners,
  localRead: localPartners,
  localWrite: (partners) => saveMediaWithErrorHandling(KEYS.partners, partners),
  toRow: partnerToRow,
  fromRow: partnerFromRow,
  notify: () => notify(KEYS.partners),
  orderBy: { column: "display_order", ascending: true },
});

export function loadPartners() {
  return partnersSync.load();
}

export function savePartners(partners) {
  return partnersSync.save(partners);
}

function localTeam() {
  return localMediaRead(KEYS.team, DEFAULT_TEAM);
}

// Array order is the display order today (no explicit field) — mapped to
// `display_order` on save, and the table is fetched ordered by it so that
// order round-trips correctly.
function teamToRow(member, index) {
  return {
    id: member.id,
    name: member.name || "",
    role: member.role || "",
    photo: member.photo || null,
    linkedin: member.linkedin || "",
    display_order: index,
  };
}

function teamFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    role: row.role || "",
    photo: row.photo || null,
    linkedin: row.linkedin || "",
  };
}

const teamSync = createTableSync({
  table: KEYS.team,
  localRead: localTeam,
  localWrite: (items) => saveMediaWithErrorHandling(KEYS.team, items),
  toRow: teamToRow,
  fromRow: teamFromRow,
  notify: () => notify(KEYS.team),
  orderBy: { column: "display_order", ascending: true },
});

export function loadTeam() {
  return teamSync.load();
}

export function saveTeam(team) {
  return teamSync.save(team);
}

// Advantage cards ("Pourquoi Nous Choisir") — plain localStorage mirror,
// now also synced through Supabase (cia_whyus_items).
function localWhyUsItems() {
  const existing = read(KEYS.whyUsItems, null);
  if (existing && existing.length) return existing;
  write(KEYS.whyUsItems, DEFAULT_WHYUS_ITEMS);
  return DEFAULT_WHYUS_ITEMS;
}

function whyUsItemToRow(it) {
  return { id: it.id, icon: it.icon || "", title: it.title || "", text: it.text || "" };
}

function whyUsItemFromRow(row) {
  return { id: row.id, icon: row.icon || "", title: row.title || "", text: row.text || "" };
}

const whyUsItemsSync = createTableSync({
  table: KEYS.whyUsItems,
  localRead: localWhyUsItems,
  localWrite: (items) => write(KEYS.whyUsItems, items),
  toRow: whyUsItemToRow,
  fromRow: whyUsItemFromRow,
  notify: () => notify(KEYS.whyUsItems),
});

export function loadWhyUsItems() {
  return whyUsItemsSync.load();
}

export function saveWhyUsItems(items) {
  return whyUsItemsSync.save(items);
}

// Excellence slider slides hold base64 images/video — mirrored to
// IndexedDB, and now also synced through Supabase (cia_whyus_slides).
function localWhyUsSlides() {
  return localMediaRead(KEYS.whyUsSlides, DEFAULT_WHYUS_SLIDES);
}

// Same video/videoType collapsing as Projects/Plans3D/Hero — see
// projectToRow/FromRow.
function whyUsSlideToRow(slide, index) {
  const isVideo = slide.mediaType === "video";
  return {
    id: slide.id,
    media_type: slide.mediaType || "image",
    image: isVideo ? null : slide.image || null,
    video: isVideo ? (slide.videoType === "url" ? slide.videoUrl || null : slide.video || null) : null,
    video_type: isVideo ? slide.videoType || null : null,
    display_order: index,
  };
}

function whyUsSlideFromRow(row) {
  const hasVideo = !!row.video;
  return {
    id: row.id,
    mediaType: row.media_type || "image",
    image: row.image || null,
    video: hasVideo && row.video_type !== "url" ? row.video : null,
    videoType: hasVideo ? row.video_type : null,
    videoUrl: hasVideo && row.video_type === "url" ? row.video : "",
  };
}

const whyUsSlidesSync = createTableSync({
  table: KEYS.whyUsSlides,
  localRead: localWhyUsSlides,
  localWrite: (slides) => saveMediaWithErrorHandling(KEYS.whyUsSlides, slides),
  toRow: whyUsSlideToRow,
  fromRow: whyUsSlideFromRow,
  notify: () => notify(KEYS.whyUsSlides),
  orderBy: { column: "display_order", ascending: true },
});

export function loadWhyUsSlides() {
  return whyUsSlidesSync.load();
}

export function saveWhyUsSlides(slides) {
  return whyUsSlidesSync.save(slides);
}

function localTestimonials() {
  return localMediaRead(KEYS.testimonials, DEFAULT_TESTIMONIALS);
}

// App shape uses `name`; the table's column is `client_name`.
function testimonialToRow(t) {
  return {
    id: t.id,
    client_name: t.name || "",
    company: t.company || "",
    role: t.role || "",
    text: t.text || "",
    rating: t.rating ?? 5,
    avatar: t.avatar || null,
    active: t.active !== false,
  };
}

function testimonialFromRow(row) {
  return {
    id: row.id,
    name: row.client_name || "",
    company: row.company || "",
    role: row.role || "",
    text: row.text || "",
    rating: row.rating ?? 5,
    avatar: row.avatar || null,
    active: row.active !== false,
  };
}

const testimonialsSync = createTableSync({
  table: KEYS.testimonials,
  localRead: localTestimonials,
  localWrite: (items) => saveMediaWithErrorHandling(KEYS.testimonials, items),
  toRow: testimonialToRow,
  fromRow: testimonialFromRow,
  notify: () => notify(KEYS.testimonials),
});

export function loadTestimonials() {
  return testimonialsSync.load();
}

export function saveTestimonials(testimonials) {
  return testimonialsSync.save(testimonials);
}

function localPlans3D() {
  return localMediaRead(KEYS.plans3d, DEFAULT_PLANS3D);
}

// Same video/videoType collapsing as Projects — see projectToRow/FromRow.
function planToRow(p) {
  const isVideo = p.mediaType === "video";
  return {
    id: p.id,
    title: p.title || "",
    type: p.type || "",
    description: p.description || "",
    software: p.software || "",
    images: isVideo ? [] : p.images || [],
    video: isVideo ? (p.videoType === "url" ? p.videoUrl || null : p.video || null) : null,
    video_type: isVideo ? p.videoType || null : null,
    featured: !!p.featured,
    visible: p.visible !== false,
  };
}

function planFromRow(row) {
  const hasVideo = !!row.video;
  return {
    id: row.id,
    title: row.title || "",
    type: row.type || "",
    description: row.description || "",
    software: row.software || "",
    images: row.images || [],
    mediaType: hasVideo ? "video" : "image",
    video: hasVideo && row.video_type !== "url" ? row.video : null,
    videoType: hasVideo ? row.video_type : null,
    videoUrl: hasVideo && row.video_type === "url" ? row.video : "",
    featured: !!row.featured,
    visible: row.visible !== false,
  };
}

const plansSync = createTableSync({
  table: KEYS.plans3d,
  localRead: localPlans3D,
  localWrite: (items) => saveMediaWithErrorHandling(KEYS.plans3d, items),
  toRow: planToRow,
  fromRow: planFromRow,
  notify: () => notify(KEYS.plans3d),
});

export function loadPlans3D() {
  return plansSync.load();
}

export function savePlans3D(plans) {
  return plansSync.save(plans);
}

// See getProjectsStatus/retryProjects above — same contract, for the
// Plans 3D table. Read reactively via useLiveStorage(getPlans3DStatus) in
// Plans3D.jsx.
export function getPlans3DStatus() {
  return plansSync.getStatus();
}

export function retryPlans3D() {
  return plansSync.retry();
}

// Runs the one-time "if this Supabase table is empty, seed it from
// whatever's in localStorage" migration for every Supabase-backed domain.
// Only ever called from the authenticated admin dashboard (DashboardLayout)
// — never from a public-site load — so an anonymous visitor's browser
// (whose localStorage, if any, holds only auto-seeded defaults) can never
// win the race and lock placeholder content into Supabase permanently.
export async function runMigrations() {
  await Promise.all([
    projectsSync.migrateIfEmpty(),
    plansSync.migrateIfEmpty(),
    messagesSync.migrateIfEmpty(),
    testimonialsSync.migrateIfEmpty(),
    teamSync.migrateIfEmpty(),
    migrateSettingsIfEmpty(),
    heroSlidesSync.migrateIfEmpty(),
    migrateAboutIfEmpty(),
    servicesSync.migrateIfEmpty(),
    partnersSync.migrateIfEmpty(),
    whyUsItemsSync.migrateIfEmpty(),
    whyUsSlidesSync.migrateIfEmpty(),
  ]);
}

export function loadSocial() {
  const existing = read(KEYS.social, null);
  if (existing) return { ...DEFAULT_SOCIAL, ...existing };
  write(KEYS.social, DEFAULT_SOCIAL);
  return DEFAULT_SOCIAL;
}

export function saveSocial(social) {
  return write(KEYS.social, social);
}

export function loadMaps() {
  const existing = read(KEYS.maps, null);
  if (existing) return { ...DEFAULT_MAPS, ...existing };
  write(KEYS.maps, DEFAULT_MAPS);
  return DEFAULT_MAPS;
}

export function saveMaps(maps) {
  return write(KEYS.maps, maps);
}

export function loadWhatsApp() {
  const existing = read(KEYS.whatsapp, null);
  if (existing) return { ...DEFAULT_WHATSAPP, ...existing };
  write(KEYS.whatsapp, DEFAULT_WHATSAPP);
  return DEFAULT_WHATSAPP;
}

export function saveWhatsApp(whatsapp) {
  return write(KEYS.whatsapp, whatsapp);
}

export function loadCollaborateursCount() {
  const existing = read(KEYS.collaborateursCount, null);
  if (existing !== null) return existing;
  write(KEYS.collaborateursCount, DEFAULT_COLLABORATEURS_COUNT);
  return DEFAULT_COLLABORATEURS_COUNT;
}

export function saveCollaborateursCount(count) {
  return write(KEYS.collaborateursCount, count);
}

export function loadHeroSpeed() {
  const existing = read(KEYS.heroSpeed, null);
  if (existing !== null) return existing;
  write(KEYS.heroSpeed, DEFAULT_HERO_SPEED);
  return DEFAULT_HERO_SPEED;
}

export function saveHeroSpeed(seconds) {
  return write(KEYS.heroSpeed, seconds);
}

export function loadLegalInfo() {
  const existing = read(KEYS.legalInfo, null);
  if (existing) {
    const merged = {};
    LEGAL_INFO_FIELDS.forEach((f) => {
      merged[f.key] = { ...DEFAULT_LEGAL_INFO[f.key], ...(existing[f.key] || {}) };
    });
    return merged;
  }
  write(KEYS.legalInfo, DEFAULT_LEGAL_INFO);
  return DEFAULT_LEGAL_INFO;
}

export function saveLegalInfo(legalInfo) {
  return write(KEYS.legalInfo, legalInfo);
}

export function loadLanguage() {
  return read(KEYS.language, "fr");
}

export function saveLanguage(language) {
  return write(KEYS.language, language);
}

export function loadActiveLanguages() {
  const existing = read(KEYS.activeLanguages, null);
  if (existing && existing.length) {
    // "fr" can never be turned off, even if stale/corrupt storage lacks it.
    return existing.includes("fr") ? existing : ["fr", ...existing];
  }
  write(KEYS.activeLanguages, DEFAULT_ACTIVE_LANGUAGES);
  return DEFAULT_ACTIVE_LANGUAGES;
}

export function saveActiveLanguages(languages) {
  const withFrench = languages.includes("fr") ? languages : ["fr", ...languages];
  return write(KEYS.activeLanguages, withFrench);
}

export function loadSectionColors() {
  const existing = read(KEYS.sectionColors, null);
  if (existing) {
    // Migrate the earlier format, where each section was a single hex
    // string (the background color only), to the current per-property
    // object shape — without losing a background an admin already set.
    const migrated = {};
    SECTION_COLOR_FIELDS.forEach((f) => {
      const raw = existing[f.key];
      if (typeof raw === "string") migrated[f.key] = { bg: raw };
      else migrated[f.key] = { ...(raw || {}) };
    });
    return migrated;
  }
  write(KEYS.sectionColors, DEFAULT_SECTION_COLORS);
  return DEFAULT_SECTION_COLORS;
}

export function saveSectionColors(colors) {
  return write(KEYS.sectionColors, colors);
}

export function loadVisibility() {
  const existing = read(KEYS.visibility, null);
  if (existing) return { ...DEFAULT_VISIBILITY, ...existing };
  write(KEYS.visibility, DEFAULT_VISIBILITY);
  return DEFAULT_VISIBILITY;
}

export function saveVisibility(visibility) {
  return write(KEYS.visibility, visibility);
}

export function loadAdminCredentials() {
  const existing = read(KEYS.adminCredentials, null);
  if (existing) return existing;
  write(KEYS.adminCredentials, DEFAULT_ADMIN_CREDENTIALS);
  return DEFAULT_ADMIN_CREDENTIALS;
}

export function saveAdminCredentials(credentials) {
  return write(KEYS.adminCredentials, credentials);
}

export function loadLocations() {
  const existing = read(KEYS.locations, null);
  if (existing && existing.length) return existing;
  write(KEYS.locations, DEFAULT_LOCATIONS);
  return DEFAULT_LOCATIONS;
}

export function saveLocations(locations) {
  return write(KEYS.locations, locations);
}

export const STORAGE_KEYS = KEYS;
