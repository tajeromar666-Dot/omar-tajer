import { useState } from "react";
import { loadVisibility, saveVisibility, VISIBILITY_SECTIONS } from "../data/seedData";
import Icon from "../components/Icons";

export default function VisibilityPanel() {
  const [visibility, setVisibility] = useState(loadVisibility);

  function toggle(key) {
    const next = { ...visibility, [key]: !visibility[key] };
    setVisibility(next);
    saveVisibility(next);
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Visibilité des Sections</h3>
      </div>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Désactivez une section pour la masquer complètement du site public,
        sans perdre son contenu.
      </p>

      {VISIBILITY_SECTIONS.map((s) => (
        <div className="visibility-row" key={s.key}>
          <span>{s.label}</span>
          <button
            type="button"
            className={`visibility-toggle ${visibility[s.key] ? "on" : "off"}`}
            onClick={() => toggle(s.key)}
          >
            <Icon name={visibility[s.key] ? "eye" : "eyeOff"} size={16} />
            {visibility[s.key] ? "Visible" : "Masqué"}
          </button>
        </div>
      ))}
    </div>
  );
}
