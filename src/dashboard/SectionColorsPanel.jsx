import { useState } from "react";
import {
  applySectionColors,
  DEFAULT_SECTION_COLORS,
  loadSectionColors,
  saveSectionColors,
  SECTION_COLOR_FIELDS,
  SECTION_COLOR_PROPS,
} from "../data/seedData";
import Icon from "../components/Icons";

export default function SectionColorsPanel() {
  const [colors, setColors] = useState(loadSectionColors);
  const [openSection, setOpenSection] = useState(null);
  const [message, setMessage] = useState("");

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  // Auto-saves on every change — live preview and persistence happen
  // together, no separate "save" step needed for color pickers.
  function persist(next) {
    setColors(next);
    applySectionColors(next);
    saveSectionColors(next);
  }

  function updateProp(sectionKey, propKey, value) {
    persist({
      ...colors,
      [sectionKey]: { ...colors[sectionKey], [propKey]: value || null },
    });
  }

  function resetSection(sectionKey) {
    persist({ ...colors, [sectionKey]: {} });
    showMessage("Couleurs de la section réinitialisées.");
  }

  function resetAll() {
    if (!window.confirm("Réinitialiser les couleurs de toutes les sections ?")) return;
    persist(DEFAULT_SECTION_COLORS);
    showMessage("Toutes les couleurs ont été réinitialisées.");
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Couleurs des Sections</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={resetAll}>
          <Icon name="trash" size={14} /> Réinitialiser tout
        </button>
      </div>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Personnalisez le fond, le texte, les titres, les icônes, les cartes
        et l'accent de chaque section. Chaque changement s'applique
        instantanément sur le site public et est sauvegardé automatiquement.
      </p>

      {message && <div className="form-success">{message}</div>}

      {SECTION_COLOR_FIELDS.map((f) => {
        const sectionColors = colors[f.key] || {};
        const isOpen = openSection === f.key;
        const customCount = SECTION_COLOR_PROPS.filter((p) => sectionColors[p.key]).length;

        return (
          <div className="color-accordion-item" key={f.key}>
            <button
              type="button"
              className="color-accordion-header"
              onClick={() => setOpenSection(isOpen ? null : f.key)}
              aria-expanded={isOpen}
            >
              <span>{f.label}</span>
              <span className="color-accordion-header__right">
                {customCount > 0 && (
                  <span className="badge badge--blue">{customCount} personnalisée(s)</span>
                )}
                <Icon name="chevronDown" size={16} className={isOpen ? "rotate-180" : ""} />
              </span>
            </button>

            {isOpen && (
              <div className="color-accordion-body">
                {SECTION_COLOR_PROPS.map((p) => {
                  const isCustom = !!sectionColors[p.key];
                  const value = sectionColors[p.key] || f.swatches[p.key];
                  return (
                    <div className="section-color-row" key={p.key}>
                      <label>{p.label}</label>
                      <div className="section-color-row__controls">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => updateProp(f.key, p.key, e.target.value)}
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateProp(f.key, p.key, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => updateProp(f.key, p.key, null)}
                          disabled={!isCustom}
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="settings-actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => resetSection(f.key)}
                    disabled={customCount === 0}
                  >
                    Réinitialiser cette section
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
