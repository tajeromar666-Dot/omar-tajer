import { useState } from "react";
import { ICON_OPTIONS, loadServices, saveServices } from "../data/seedData";
import Icon from "../components/Icons";

function emptyService() {
  return { id: `s_${Date.now()}`, icon: "tool", title: "", description: "" };
}

export default function ServicesTab() {
  const [services, setServices] = useState(loadServices);
  const [error, setError] = useState("");

  function persist(next) {
    setServices(next);
    const ok = saveServices(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  function update(id, field, value) {
    persist(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addService() {
    persist([...services, emptyService()]);
  }

  function removeService(id) {
    if (!window.confirm("Supprimer ce service ?")) return;
    persist(services.filter((s) => s.id !== id));
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Services</h1>
          <p>Gérez les 6 (ou plus) services affichés sur la page d'accueil.</p>
        </div>
        <button className="btn btn--secondary" onClick={addService}>
          <Icon name="plus" size={16} /> Nouveau service
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        {services.length === 0 && (
          <p style={{ color: "var(--color-gray-500)" }}>Aucun service pour le moment.</p>
        )}
        {services.map((s) => (
          <div className="value-editor" key={s.id}>
            <select value={s.icon} onChange={(e) => update(s.id, "icon", e.target.value)}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <Icon name={s.icon} size={20} />
            <input
              type="text"
              value={s.title}
              onChange={(e) => update(s.id, "title", e.target.value)}
              placeholder="Titre du service"
            />
            <input
              type="text"
              value={s.description}
              onChange={(e) => update(s.id, "description", e.target.value)}
              placeholder="Description courte"
            />
            <button
              className="btn-icon btn-icon--danger"
              onClick={() => removeService(s.id)}
              title="Supprimer"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
