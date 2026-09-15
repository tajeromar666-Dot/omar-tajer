import { useState } from "react";
import {
  applySpacing,
  DEFAULT_SPACING,
  loadSpacing,
  saveSpacing,
  SPACING_SECTION_FIELDS,
} from "../data/seedData";
import Icon from "../components/Icons";

export default function SpacingPanel() {
  const [spacing, setSpacing] = useState(loadSpacing);
  const [openSection, setOpenSection] = useState(null);
  const [message, setMessage] = useState("");

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  // Auto-saves on every change — live preview and persistence happen
  // together, same as the "Couleurs des Sections" panel.
  function persist(next) {
    setSpacing(next);
    applySpacing(next);
    saveSpacing(next);
  }

  function updateGlobal(value) {
    const clamped = Math.min(120, Math.max(20, Number(value) || DEFAULT_SPACING.global));
    persist({ ...spacing, global: clamped });
  }

  function updateSectionField(sectionKey, field, value) {
    const num = value === "" ? null : Math.max(0, Number(value) || 0);
    persist({
      ...spacing,
      sections: {
        ...spacing.sections,
        [sectionKey]: { ...spacing.sections[sectionKey], [field]: num },
      },
    });
  }

  function resetSection(sectionKey) {
    persist({ ...spacing, sections: { ...spacing.sections, [sectionKey]: {} } });
    showMessage("Espacement de la section réinitialisé.");
  }

  function resetAll() {
    if (!window.confirm("Réinitialiser l'espacement de toutes les sections ?")) return;
    persist(DEFAULT_SPACING);
    showMessage("Espacement de toutes les sections réinitialisé.");
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Espacement des Sections</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={resetAll}>
          <Icon name="trash" size={14} /> Réinitialiser tout
        </button>
      </div>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Réglez l'espacement vertical entre les sections du site public.
        Chaque changement s'applique instantanément et est sauvegardé
        automatiquement.
      </p>

      {message && <div className="form-success">{message}</div>}

      <div className="form-group">
        <label>Espacement entre sections (px)</label>
        <div className="section-color-row__controls">
          <input
            type="range"
            min="20"
            max="120"
            value={spacing.global}
            onChange={(e) => updateGlobal(e.target.value)}
          />
          <input
            type="number"
            min="20"
            max="120"
            value={spacing.global}
            onChange={(e) => updateGlobal(e.target.value)}
            style={{ maxWidth: 90 }}
          />
        </div>
        <p className="field-hint">
          S'applique à toutes les sections, sauf celles personnalisées
          individuellement ci-dessous.
        </p>
      </div>

      {SPACING_SECTION_FIELDS.map((f) => {
        const sec = spacing.sections[f.key] || {};
        const isOpen = openSection === f.key;
        const customCount = ["pt", "pb"].filter((k) => sec[k] != null).length;

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
                <div className="field-grid">
                  <div className="form-group">
                    <label>Padding haut (px)</label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      placeholder={String(spacing.global)}
                      value={sec.pt ?? ""}
                      onChange={(e) => updateSectionField(f.key, "pt", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Padding bas (px)</label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      placeholder={String(spacing.global)}
                      value={sec.pb ?? ""}
                      onChange={(e) => updateSectionField(f.key, "pb", e.target.value)}
                    />
                  </div>
                </div>

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
