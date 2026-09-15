import { useRef, useState } from "react";
import {
  applyTheme,
  autoTextTiers,
  DEFAULT_PRESET_THEME_ID,
  DEFAULT_THEME,
  DESIGN_TEMPLATES,
  findPresetTheme,
  findSectionPreset,
  getLastStorageError,
  loadActiveTheme,
  loadColorOverrides,
  loadDesignTemplate,
  loadSectionThemes,
  loadSettings,
  loadTheme,
  PRESET_THEMES,
  saveActiveTheme,
  saveColorOverrides,
  saveDesignTemplate,
  saveSectionThemes,
  saveSettings,
  saveTheme,
  SECTION_PRESET_THEMES,
  SECTION_THEME_SECTIONS,
  themeWithPreset,
} from "../data/seedData";
import { contrastLabel, contrastRatio } from "../utils/contrast";
import { CIA_LOGO } from "../assets/logos";
import { uploadMedia } from "../data/mediaStorage";
import { formatFileSize, IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import UploadStatus from "../components/UploadStatus";

const COLOR_FIELDS = [
  { key: "colorBlue", label: "Couleur d'accent principale" },
  { key: "colorYellow", label: "Jaune accent" },
  { key: "colorRed", label: "Rouge" },
  { key: "colorDark", label: "Fond sombre" },
  { key: "colorPanel", label: "Fond des panneaux" },
  { key: "colorText", label: "Texte sur fond sombre" },
];

const CUSTOMIZE_FIELDS = [
  { key: "heading", label: "Couleur des titres" },
  { key: "text", label: "Couleur du texte principal" },
  { key: "secondary", label: "Couleur du texte secondaire" },
];

export default function ThemeTab() {
  const [theme, setTheme] = useState(loadTheme);
  const [activeThemeId, setActiveThemeId] = useState(loadActiveTheme);
  const [sectionThemes, setSectionThemes] = useState(loadSectionThemes);
  const [colorOverrides, setColorOverrides] = useState(loadColorOverrides);
  const [expandedSection, setExpandedSection] = useState(null);
  const [designTemplateId, setDesignTemplateId] = useState(loadDesignTemplate);
  const [settings, setSettings] = useState(loadSettings);
  const [logoStatus, setLogoStatus] = useState("idle");
  const [logoError, setLogoError] = useState("");
  const [logoSuccess, setLogoSuccess] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoFileSize, setLogoFileSize] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [toast, setToast] = useState("");
  const logoRef = useRef(null);

  async function addLogoUrl() {
    const url = logoUrlInput.trim();
    if (!url) return;
    const next = { ...settings, logo: url };
    const ok = await saveSettings(next);
    if (!ok) {
      setLogoStatus("error");
      setLogoError(
        getLastStorageError() || "Stockage plein. Compressez vos images ou utilisez Supabase Storage."
      );
      return;
    }
    setSettings(next);
    setLogoUrlInput("");
    setLogoStatus("success");
    setLogoSuccess("Logo ajouté depuis l'URL.");
    showToast("Logo mis à jour sur tout le site.");
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function updateColor(key, value) {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next); // instant preview
    saveTheme(next); // persist + notify (live everywhere)
  }

  function resetColors() {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    saveTheme(DEFAULT_THEME);
    showToast("Couleurs réinitialisées.");
  }

  function applyPreset(preset) {
    const next = themeWithPreset(theme, preset);
    setTheme(next);
    applyTheme(next); // instant, site-wide preview
    saveTheme(next);
    setActiveThemeId(preset.id);
    saveActiveTheme(preset.id);
    showToast(`Thème "${preset.name}" appliqué sur tout le site.`);
  }

  function resetToOriginalTheme() {
    applyPreset(findPresetTheme(DEFAULT_PRESET_THEME_ID));
  }

  function applySectionTheme(sectionKey, presetName) {
    const next = { ...sectionThemes };
    if (presetName) next[sectionKey] = presetName;
    else delete next[sectionKey];
    setSectionThemes(next);
    saveSectionThemes(next);
    showToast("Thème appliqué");
  }

  function applySectionThemeToAll(presetName) {
    const next = {};
    SECTION_THEME_SECTIONS.forEach((s) => {
      next[s.key] = presetName;
    });
    setSectionThemes(next);
    saveSectionThemes(next);
    showToast("Thème appliqué");
  }

  function resetAllSectionThemes() {
    setSectionThemes({});
    saveSectionThemes({});
    setColorOverrides({});
    saveColorOverrides({});
    showToast("Thème appliqué");
  }

  function updateColorOverride(sectionKey, field, value) {
    const next = {
      ...colorOverrides,
      [sectionKey]: { ...(colorOverrides[sectionKey] || {}), [field]: value },
    };
    setColorOverrides(next);
    saveColorOverrides(next);
    showToast("Thème appliqué");
  }

  function applyDesignTemplate(id) {
    setDesignTemplateId(id);
    saveDesignTemplate(id);
    showToast("Thème appliqué");
  }

  function resetColorOverrideField(sectionKey, field) {
    const current = { ...(colorOverrides[sectionKey] || {}) };
    delete current[field];
    const next = { ...colorOverrides, [sectionKey]: current };
    setColorOverrides(next);
    saveColorOverrides(next);
    showToast("Thème appliqué");
  }

  async function handleLogoFile(file) {
    if (!file) return;
    setLogoStatus("loading");
    setLogoFileName(file.name);
    setLogoFileSize(formatFileSize(file.size));
    try {
      const { dataUrl, file: compressed } = await processImageFile(file);
      const url = await uploadMedia(compressed, "logo");
      const next = { ...settings, logo: url || dataUrl };
      const ok = await saveSettings(next);
      if (!ok) {
        setLogoStatus("error");
        setLogoError(
          getLastStorageError() || "Stockage plein. Compressez vos images ou utilisez Supabase Storage."
        );
        return;
      }
      setSettings(next);
      setLogoStatus("success");
      setLogoSuccess("Logo mis à jour.");
      showToast("Logo mis à jour sur tout le site.");
    } catch (err) {
      setLogoStatus("error");
      setLogoError(err.message);
    }
  }

  function handleLogoDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]);
  }

  async function removeLogo() {
    const next = { ...settings, logo: null };
    const ok = await saveSettings(next);
    if (!ok) {
      setLogoStatus("error");
      setLogoError("Échec de la sauvegarde.");
      return;
    }
    setSettings(next);
    setLogoStatus("idle");
    showToast("Logo par défaut restauré.");
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Apparence</h1>
          <p>Personnalisez les couleurs et le logo affichés sur tout le site.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Thèmes de couleurs</h3>
          <button className="btn btn--ghost btn--sm" onClick={resetToOriginalTheme}>
            Réinitialiser
          </button>
        </div>
        <div className="theme-preset-grid">
          {PRESET_THEMES.map((preset) => (
            <div
              key={preset.id}
              className={`theme-preset-card ${activeThemeId === preset.id ? "theme-preset-card--active" : ""}`}
            >
              <div className="theme-preset-card__dots">
                <span className="theme-preset-card__dot" style={{ background: preset.background }} />
                <span className="theme-preset-card__dot" style={{ background: preset.panel }} />
                <span className="theme-preset-card__dot" style={{ background: preset.accent }} />
                <span className="theme-preset-card__dot" style={{ background: preset.text }} />
              </div>
              <div className="theme-preset-card__name">{preset.name}</div>
              <button
                className="btn btn--secondary btn--sm theme-preset-card__apply"
                onClick={() => applyPreset(preset)}
              >
                Appliquer
              </button>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Chaque thème applique instantanément ses 4 couleurs coordonnées à
          tout le site public. Affinez ensuite des couleurs individuelles
          ci-dessous si besoin.
        </p>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Thèmes par Section</h3>
          <button className="btn btn--ghost btn--sm" onClick={resetAllSectionThemes}>
            Réinitialiser tout
          </button>
        </div>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Donnez à chaque section son propre thème de couleurs, indépendant
          du thème global ci-dessus. Chaque choix est enregistré et appliqué
          instantanément, sans bouton "Enregistrer".
        </p>

        <div className="section-theme-block">
          <div className="section-theme-block__label">
            Appliquer à tout le site
          </div>
          <div className="section-theme-grid">
            {SECTION_PRESET_THEMES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="section-theme-mini"
                title={`Appliquer "${preset.name}" à toutes les sections`}
                onClick={() => applySectionThemeToAll(preset.name)}
              >
                <span className="section-theme-mini__swatches">
                  <i style={{ background: preset.background }} />
                  <i style={{ background: preset.panel }} />
                  <i style={{ background: preset.accent }} />
                  <i style={{ background: preset.text }} />
                </span>
                <span className="section-theme-mini__name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {SECTION_THEME_SECTIONS.map((section) => {
          const activePreset = findSectionPreset(sectionThemes[section.key]);
          const auto = activePreset
            ? autoTextTiers(activePreset.background, activePreset.text)
            : null;
          const sectionOverrides = colorOverrides[section.key] || {};
          const isExpanded = expandedSection === section.key;

          return (
            <div className="section-theme-block" key={section.key}>
              <div className="section-theme-block__label">{section.label}</div>
              <div className="section-theme-grid">
                <button
                  type="button"
                  className={`section-theme-mini section-theme-mini--none ${
                    !sectionThemes[section.key] ? "section-theme-mini--active" : ""
                  }`}
                  title="Par défaut (thème global)"
                  onClick={() => applySectionTheme(section.key, null)}
                >
                  <span className="section-theme-mini__swatches section-theme-mini__swatches--none">
                    <Icon name="close" size={14} />
                  </span>
                  <span className="section-theme-mini__name">Défaut</span>
                </button>
                {SECTION_PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`section-theme-mini ${
                      sectionThemes[section.key] === preset.name ? "section-theme-mini--active" : ""
                    }`}
                    title={preset.name}
                    onClick={() => applySectionTheme(section.key, preset.name)}
                  >
                    <span className="section-theme-mini__swatches">
                      <i style={{ background: preset.background }} />
                      <i style={{ background: preset.panel }} />
                      <i style={{ background: preset.accent }} />
                      <i style={{ background: preset.text }} />
                    </span>
                    <span className="section-theme-mini__name">{preset.name}</span>
                  </button>
                ))}
              </div>

              {activePreset && (
                <div className="section-theme-customize">
                  <button
                    type="button"
                    className="section-theme-customize__toggle"
                    onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                  >
                    <Icon
                      name="chevronDown"
                      size={14}
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                    />
                    Personnaliser
                  </button>

                  {isExpanded && (
                    <div className="section-theme-customize__fields">
                      {CUSTOMIZE_FIELDS.map((f) => {
                        const autoValue =
                          f.key === "heading"
                            ? auto.heading
                            : f.key === "text"
                            ? auto.primary
                            : auto.secondary;
                        const value = sectionOverrides[f.key] || autoValue;
                        const ratio = contrastRatio(activePreset.background, value);
                        const rating = contrastLabel(ratio);
                        return (
                          <div className="form-group" key={f.key}>
                            <label>{f.label}</label>
                            <div className="theme-swatch__row">
                              <input
                                type="color"
                                value={value}
                                onChange={(e) => updateColorOverride(section.key, f.key, e.target.value)}
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateColorOverride(section.key, f.key, e.target.value)}
                              />
                              {sectionOverrides[f.key] && (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => resetColorOverrideField(section.key, f.key)}
                                >
                                  Réinitialiser
                                </button>
                              )}
                            </div>
                            <p
                              className={`contrast-indicator ${
                                rating.ok ? "contrast-indicator--ok" : "contrast-indicator--bad"
                              }`}
                            >
                              Contraste : {ratio.toFixed(1)}:1 {rating.ok ? "✓" : "✗"} {rating.level}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Templates de Design</h3>
          <button className="btn btn--ghost btn--sm" onClick={() => applyDesignTemplate(null)}>
            Réinitialiser
          </button>
        </div>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Change la forme, l'ombre, la disposition et l'animation des cartes
          (Projets, Plans 3D, Équipe, Témoignages) sur tout le site public —
          sans toucher au contenu, aux images ni aux couleurs choisies
          ci-dessus. Le changement s'applique avec une transition de 0,5s.
        </p>
        <div className="design-template-grid">
          {DESIGN_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className={`design-template-card ${
                designTemplateId === tpl.id ? "design-template-card--active" : ""
              }`}
            >
              <div className={`template-preview ${tpl.className}`}>
                <div className="mockup-card" />
                <div className="mockup-card" />
              </div>
              <div className="design-template-card__name">{tpl.name}</div>
              <button
                className="btn btn--secondary btn--sm design-template-card__apply"
                onClick={() => applyDesignTemplate(tpl.id)}
              >
                Appliquer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Couleurs du site</h3>
          <button className="btn btn--ghost btn--sm" onClick={resetColors}>
            Réinitialiser
          </button>
        </div>
        <div className="theme-swatches">
          {COLOR_FIELDS.map((f) => (
            <div className="theme-swatch" key={f.key}>
              <label>{f.label}</label>
              <div className="theme-swatch__row">
                <input
                  type="color"
                  value={theme[f.key]}
                  onChange={(e) => updateColor(f.key, e.target.value)}
                />
                <input
                  type="text"
                  value={theme[f.key]}
                  onChange={(e) => updateColor(f.key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Les changements s'appliquent instantanément sur tout le site (public
          et administration) et sont sauvegardés automatiquement.
        </p>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Logo de l'entreprise</h3>
        </div>
        <div className="logo-manager">
          <div
            className={`logo-manager__preview ${dragOver ? "dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
          >
            <img src={settings.logo || CIA_LOGO} alt="Logo actuel" />
          </div>
          <div className="logo-manager__actions">
            <button className="btn btn--secondary btn--sm" onClick={() => logoRef.current?.click()}>
              <Icon name="upload" size={14} /> Changer le logo
            </button>
            {settings.logo && (
              <button className="btn btn--ghost btn--sm" onClick={removeLogo}>
                <Icon name="trash" size={14} /> Revenir au logo par défaut
              </button>
            )}
            <input
              ref={logoRef}
              type="file"
              accept={IMAGE_ACCEPT}
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) handleLogoFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <UploadStatus
              status={logoStatus}
              error={logoError}
              success={logoSuccess}
              fileName={logoFileName}
              fileSize={logoFileSize}
            />
            <div className="url-input-row">
              <input
                type="text"
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
                placeholder="Ou collez une URL de logo (https://...)"
              />
              <button type="button" className="btn btn--ghost btn--sm" onClick={addLogoUrl}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
        <p className="field-hint">
          Le nouveau logo s'affiche immédiatement dans la barre de navigation
          et le pied de page du site public (max 2 Mo).
        </p>
      </div>

      {toast && (
        <div className="save-toast">
          <Icon name="checkCircle" size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
