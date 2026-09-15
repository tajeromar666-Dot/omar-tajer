import { useEffect, useRef, useState } from "react";
import { getLastStorageError, loadPartners, savePartners } from "../data/seedData";
import { IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import UploadStatus from "../components/UploadStatus";
import useLiveStorage from "../hooks/useLiveStorage";

function emptyPartner() {
  return { id: `partner_${Date.now()}`, name: "", logo: null };
}

export default function PartnersTab() {
  // useLiveStorage re-syncs once the async local/Supabase read resolves —
  // see the identical fix/comment in ProjectsTab.jsx.
  const [partners] = useLiveStorage(loadPartners);
  const [error, setError] = useState("");
  const [logoStatus, setLogoStatus] = useState({});
  const [logoError, setLogoError] = useState({});
  const [logoSuccess, setLogoSuccess] = useState({});
  const [dragOverId, setDragOverId] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState({});
  const fileRefs = useRef({});

  const partnersRef = useRef(partners);
  useEffect(() => {
    partnersRef.current = partners;
  }, [partners]);

  function addLogoUrl(id) {
    const url = (logoUrlInput[id] || "").trim();
    if (!url) return;
    persist(partnersRef.current.map((p) => (p.id === id ? { ...p, logo: url } : p)));
    setLogoUrlInput((s) => ({ ...s, [id]: "" }));
    setLogoStatus((s) => ({ ...s, [id]: "success" }));
    setLogoSuccess((s) => ({ ...s, [id]: "Logo ajouté depuis l'URL." }));
  }

  async function persist(next) {
    const ok = await savePartners(next);
    if (!ok) {
      setError(getLastStorageError() || "Stockage plein. Compressez vos images ou utilisez Supabase Storage.");
      return;
    }
    setError("");
  }

  function updateName(id, name) {
    persist(partnersRef.current.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  async function handleLogo(id, file) {
    if (!file) return;
    setLogoStatus((s) => ({ ...s, [id]: "loading" }));
    try {
      const { dataUrl } = await processImageFile(file);
      persist(partnersRef.current.map((p) => (p.id === id ? { ...p, logo: dataUrl } : p)));
      setLogoStatus((s) => ({ ...s, [id]: "success" }));
      setLogoSuccess((s) => ({ ...s, [id]: "Logo mis à jour." }));
    } catch (err) {
      setLogoStatus((s) => ({ ...s, [id]: "error" }));
      setLogoError((s) => ({ ...s, [id]: err.message }));
    }
  }

  function handleLogoDrop(id, e) {
    e.preventDefault();
    setDragOverId(null);
    if (e.dataTransfer.files?.[0]) handleLogo(id, e.dataTransfer.files[0]);
  }

  function addPartner() {
    persist([...partnersRef.current, emptyPartner()]);
  }

  function removePartner(id) {
    if (!window.confirm("Supprimer ce partenaire ?")) return;
    persist(partnersRef.current.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Partenaires</h1>
          <p>Gérez les logos partenaires affichés sur le site public.</p>
        </div>
        <button className="btn btn--secondary" onClick={addPartner}>
          <Icon name="plus" size={16} /> Ajouter un partenaire
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={3}>Aucun partenaire pour le moment.</td>
                </tr>
              )}
              {partners.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div
                      className={`partner-thumb ${dragOverId === p.id ? "dragover" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverId(p.id);
                      }}
                      onDragLeave={() => setDragOverId((cur) => (cur === p.id ? null : cur))}
                      onDrop={(e) => handleLogoDrop(p.id, e)}
                    >
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} />
                      ) : (
                        <Icon name="handshake" size={20} />
                      )}
                    </div>
                    <UploadStatus
                      status={logoStatus[p.id]}
                      error={logoError[p.id]}
                      success={logoSuccess[p.id]}
                    />
                    <div className="url-input-row url-input-row--stacked">
                      <input
                        type="text"
                        value={logoUrlInput[p.id] || ""}
                        onChange={(e) => setLogoUrlInput((s) => ({ ...s, [p.id]: e.target.value }))}
                        placeholder="Ou URL de logo"
                        style={{ minWidth: 120 }}
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => addLogoUrl(p.id)}
                      >
                        Ajouter
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updateName(p.id, e.target.value)}
                      placeholder="Nom du partenaire"
                      style={{ maxWidth: 220 }}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-icon"
                        onClick={() => fileRefs.current[p.id]?.click()}
                        title="Changer le logo"
                      >
                        <Icon name="upload" size={16} />
                      </button>
                      <input
                        ref={(el) => (fileRefs.current[p.id] = el)}
                        type="file"
                        accept={IMAGE_ACCEPT}
                        hidden
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleLogo(p.id, e.target.files[0]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        className="btn-icon btn-icon--danger"
                        onClick={() => removePartner(p.id)}
                        title="Supprimer"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
