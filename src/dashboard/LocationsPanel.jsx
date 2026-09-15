import { useState } from "react";
import { loadLocations, saveLocations } from "../data/seedData";
import Icon from "../components/Icons";

function emptyLocation() {
  return {
    id: `loc_${Date.now()}`,
    name: "",
    address: "",
    phone: "",
    email: "",
    mapUrl: "",
    active: true,
    showEmail: true,
    showPhone: true,
    showMap: true,
  };
}

export default function LocationsPanel() {
  const [locations, setLocations] = useState(loadLocations);
  const [error, setError] = useState("");

  function persist(next) {
    setLocations(next);
    const ok = saveLocations(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  function update(id, field, value) {
    persist(locations.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function addLocation() {
    persist([...locations, emptyLocation()]);
  }

  function removeLocation(id) {
    if (!window.confirm("Supprimer cette localisation ?")) return;
    persist(locations.filter((l) => l.id !== id));
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Nos Localisations</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addLocation}>
          <Icon name="plus" size={14} /> Ajouter une localisation
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      {locations.length === 0 && (
        <p style={{ color: "var(--color-gray-500)" }}>
          Aucune localisation — la section "Nos Localisations" sera masquée
          sur le site public tant qu'aucune n'est active.
        </p>
      )}

      {locations.map((l) => (
        <div className="location-editor" key={l.id}>
          <div className="field-grid">
            <div className="form-group">
              <label>Nom du site</label>
              <input
                type="text"
                value={l.name}
                onChange={(e) => update(l.id, "name", e.target.value)}
                placeholder="Ex: Siège Social"
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="text"
                value={l.phone}
                onChange={(e) => update(l.id, "phone", e.target.value)}
                placeholder="06 XX XX XX XX"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={l.address}
              onChange={(e) => update(l.id, "address", e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={l.email || ""}
              onChange={(e) => update(l.id, "email", e.target.value)}
              placeholder="contact@exemple.com"
            />
          </div>

          <div className="form-group">
            <label>URL d'intégration Google Maps (iframe src)</label>
            <input
              type="text"
              value={l.mapUrl}
              onChange={(e) => update(l.id, "mapUrl", e.target.value)}
              placeholder="https://www.google.com/maps?q=...&output=embed"
            />
          </div>

          <div className="location-editor__visibility">
            <label
              className="toggle-switch toggle-switch--sm"
              onClick={() => update(l.id, "showEmail", !(l.showEmail ?? true))}
            >
              <span className={`toggle-switch__track ${l.showEmail ?? true ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
              Afficher l'email
            </label>
            <label
              className="toggle-switch toggle-switch--sm"
              onClick={() => update(l.id, "showPhone", !(l.showPhone ?? true))}
            >
              <span className={`toggle-switch__track ${l.showPhone ?? true ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
              Afficher le téléphone
            </label>
            <label
              className="toggle-switch toggle-switch--sm"
              onClick={() => update(l.id, "showMap", !(l.showMap ?? true))}
            >
              <span className={`toggle-switch__track ${l.showMap ?? true ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
              Afficher la carte Maps
            </label>
          </div>

          <div className="location-editor__footer">
            <label
              className="toggle-switch"
              onClick={() => update(l.id, "active", !l.active)}
            >
              <span className={`toggle-switch__track ${l.active ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
              Visible sur le site public (carte entière)
            </label>
            <button
              type="button"
              className="btn-icon btn-icon--danger"
              onClick={() => removeLocation(l.id)}
              title="Supprimer"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
