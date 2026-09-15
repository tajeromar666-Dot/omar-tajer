import { useState } from "react";
import { LEGAL_INFO_FIELDS, loadLegalInfo, saveLegalInfo } from "../data/seedData";

export default function LegalInfoPanel() {
  const [legalInfo, setLegalInfo] = useState(loadLegalInfo);
  const [error, setError] = useState("");

  function persist(next) {
    setLegalInfo(next);
    const ok = saveLegalInfo(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  function updateField(key, field, value) {
    persist({ ...legalInfo, [key]: { ...legalInfo[key], [field]: value } });
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Informations Légales</h3>
      </div>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Activez un champ pour l'afficher dans le pied de page et la section
        Contact du site public.
      </p>

      {error && <div className="error-text">{error}</div>}

      {LEGAL_INFO_FIELDS.map((f) => (
        <div className="social-row" key={f.key}>
          <div className="social-row__field">
            <label>{f.label}</label>
            <input
              type="text"
              value={legalInfo[f.key].value}
              onChange={(e) => updateField(f.key, "value", e.target.value)}
              placeholder={f.label}
            />
          </div>
          <label
            className="toggle-switch"
            onClick={() => updateField(f.key, "enabled", !legalInfo[f.key].enabled)}
          >
            <span className={`toggle-switch__track ${legalInfo[f.key].enabled ? "on" : ""}`}>
              <span className="toggle-switch__thumb" />
            </span>
          </label>
        </div>
      ))}
    </div>
  );
}
