import { useEffect, useRef, useState } from "react";
import { ICON_OPTIONS, loadServices, saveServices } from "../data/seedData";
import Icon from "../components/Icons";
import useLiveStorage from "../hooks/useLiveStorage";

function emptyService() {
  return { id: `s_${Date.now()}`, icon: "tool", title: "", description: "" };
}

export default function ServicesTab() {
  // useLiveStorage re-syncs once the async local/Supabase read resolves —
  // see the identical fix/comment in ProjectsTab.jsx.
  const [services] = useLiveStorage(loadServices);
  const [error, setError] = useState("");

  const servicesRef = useRef(services);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  async function persist(next) {
    const ok = await saveServices(next);
    setError(ok ? "" : "Échec de la sauvegarde.");
  }

  function update(id, field, value) {
    persist(servicesRef.current.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addService() {
    persist([...servicesRef.current, emptyService()]);
  }

  function removeService(id) {
    if (!window.confirm("Supprimer ce service ?")) return;
    persist(servicesRef.current.filter((s) => s.id !== id));
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
