import { useState } from "react";
import { loadActiveLanguages, saveActiveLanguages } from "../data/seedData";
import { LANGUAGES } from "../data/translations";

export default function LanguagesPanel() {
  const [active, setActive] = useState(loadActiveLanguages);
  const [error, setError] = useState("");

  function toggle(code) {
    if (code === "fr") return; // Français always stays on
    const next = active.includes(code)
      ? active.filter((c) => c !== code)
      : [...active, code];
    setActive(next);
    const ok = saveActiveLanguages(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Gestion des Langues</h3>
      </div>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Seules les langues activées apparaissent dans le sélecteur de langue
        du site public. Le français reste toujours actif (langue par défaut).
      </p>

      {error && <div className="error-text">{error}</div>}

      {LANGUAGES.map((l) => {
        const isFrench = l.code === "fr";
        const isOn = active.includes(l.code);
        return (
          <div className="visibility-row" key={l.code}>
            <span>
              {l.flag} {l.label}
            </span>
            <label
              className={`toggle-switch ${isFrench ? "toggle-switch--locked" : ""}`}
              onClick={() => toggle(l.code)}
              title={isFrench ? "Le français ne peut pas être désactivé" : undefined}
            >
              <span className={`toggle-switch__track ${isOn ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
