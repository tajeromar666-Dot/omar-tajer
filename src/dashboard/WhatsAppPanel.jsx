import { useState } from "react";
import { loadWhatsApp, saveWhatsApp } from "../data/seedData";
import Icon from "../components/Icons";

export default function WhatsAppPanel() {
  const [whatsapp, setWhatsapp] = useState(loadWhatsApp);
  const [error, setError] = useState("");

  function persist(next) {
    setWhatsapp(next);
    const ok = saveWhatsApp(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>WhatsApp</h3>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="form-group">
        <label
          className="toggle-switch"
          onClick={() => persist({ ...whatsapp, enabled: !whatsapp.enabled })}
        >
          <span className={`toggle-switch__track ${whatsapp.enabled ? "on" : ""}`}>
            <span className="toggle-switch__thumb" />
          </span>
          Afficher le bouton flottant WhatsApp
        </label>
      </div>

      <div className="form-group">
        <label>Numéro WhatsApp</label>
        <input
          type="text"
          value={whatsapp.number}
          onChange={(e) => persist({ ...whatsapp, number: e.target.value })}
          placeholder="06 61 52 70 69"
          disabled={!whatsapp.enabled}
        />
      </div>
      <p className="field-hint">
        Le bouton flottant WhatsApp s'affiche en bas à droite de chaque page
        du site public lorsqu'il est activé.
      </p>
    </div>
  );
}
