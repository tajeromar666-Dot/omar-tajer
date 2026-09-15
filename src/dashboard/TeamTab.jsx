import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  getLastStorageError,
  loadCollaborateursCount,
  loadTeam,
  saveCollaborateursCount,
  saveTeam,
} from "../data/seedData";
import { uploadMedia } from "../data/mediaStorage";
import { formatFileSize, IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import UploadStatus from "../components/UploadStatus";
import useLiveStorage from "../hooks/useLiveStorage";

function emptyMember() {
  return { id: `t_${Date.now()}`, name: "", role: "", photo: null, linkedin: "" };
}

// Memoized so editing one member's fields/photo, or the top-level
// "Collaborateurs" counter, doesn't re-render every other member's panel —
// only the props of the member that actually changed do.
const TeamMemberEditor = memo(function TeamMemberEditor({
  member: m,
  photoStatus,
  photoError,
  photoSuccess,
  photoInfo,
  photoUrlInput,
  dragOver,
  onUpdate,
  onPhoto,
  onPhotoDrop,
  onDragOver,
  onDragLeave,
  onPhotoUrlChange,
  onAddPhotoUrl,
  onRemove,
}) {
  const fileRef = useRef(null);

  return (
    <div className="panel team-editor">
      <div
        className={`team-editor__photo ${dragOver ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(m.id);
        }}
        onDragLeave={() => onDragLeave(m.id)}
        onDrop={(e) => onPhotoDrop(m.id, e)}
      >
        {m.photo ? <img src={m.photo} alt={m.name} /> : <Icon name="user" size={28} />}
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) onPhoto(m.id, e.target.files[0]);
            e.target.value = "";
          }}
        />
        <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} /> Photo
        </button>
        {m.photo && (
          <button type="button" className="btn-remove-photo" onClick={() => onUpdate(m.id, "photo", null)}>
            <Icon name="close" size={11} /> Supprimer la photo
          </button>
        )}
        <UploadStatus
          status={photoStatus}
          error={photoError}
          success={photoSuccess}
          fileName={photoStatus === "loading" ? photoInfo : ""}
        />
        <div className="url-input-row url-input-row--stacked">
          <input
            type="text"
            value={photoUrlInput || ""}
            onChange={(e) => onPhotoUrlChange(m.id, e.target.value)}
            placeholder="Ou URL de photo"
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onAddPhotoUrl(m.id)}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="team-editor__fields">
        <div className="field-grid">
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              value={m.name}
              onChange={(e) => onUpdate(m.id, "name", e.target.value)}
              placeholder="Ex: CHAHYD Mustapha"
            />
          </div>
          <div className="form-group">
            <label>Fonction</label>
            <input
              type="text"
              value={m.role}
              onChange={(e) => onUpdate(m.id, "role", e.target.value)}
              placeholder="Ex: Responsable / Fondateur"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Lien LinkedIn (optionnel)</label>
          <input
            type="text"
            value={m.linkedin}
            onChange={(e) => onUpdate(m.id, "linkedin", e.target.value)}
            placeholder="https://www.linkedin.com/in/..."
          />
        </div>
      </div>

      <button className="btn-icon btn-icon--danger team-editor__remove" onClick={() => onRemove(m.id)} title="Supprimer">
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
});

export default function TeamTab() {
  // useLiveStorage re-syncs once the async local/Supabase read resolves —
  // see the identical fix/comment in ProjectsTab.jsx.
  const [team] = useLiveStorage(loadTeam);
  const [error, setError] = useState("");
  const [collaborateursCount, setCollaborateursCount] = useState(loadCollaborateursCount);
  const [photoStatus, setPhotoStatus] = useState({});
  const [photoError, setPhotoError] = useState({});
  const [photoSuccess, setPhotoSuccess] = useState({});
  const [photoInfo, setPhotoInfo] = useState({});
  const [dragOverId, setDragOverId] = useState(null);
  const [photoUrlInput, setPhotoUrlInput] = useState({});

  const teamRef = useRef(team);
  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  const photoUrlInputRef = useRef(photoUrlInput);
  useEffect(() => {
    photoUrlInputRef.current = photoUrlInput;
  }, [photoUrlInput]);

  const persist = useCallback(async (next) => {
    const ok = await saveTeam(next);
    if (!ok) {
      setError(getLastStorageError() || "Stockage plein. Compressez vos images ou utilisez Supabase Storage.");
      return;
    }
    setError("");
  }, []);

  const update = useCallback((id, field, value) => {
    persist(teamRef.current.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }, [persist]);

  const addPhotoUrl = useCallback((id) => {
    const url = (photoUrlInputRef.current[id] || "").trim();
    if (!url) return;
    update(id, "photo", url);
    setPhotoUrlInput((s) => ({ ...s, [id]: "" }));
    setPhotoStatus((s) => ({ ...s, [id]: "success" }));
    setPhotoSuccess((s) => ({ ...s, [id]: "Photo ajoutée depuis l'URL." }));
  }, [update]);

  const updateCollaborateursCount = useCallback((value) => {
    const count = Math.max(0, Number(value) || 0);
    setCollaborateursCount(count);
    saveCollaborateursCount(count);
  }, []);

  const handlePhoto = useCallback(async (id, file) => {
    if (!file) return;
    setPhotoStatus((s) => ({ ...s, [id]: "loading" }));
    setPhotoInfo((s) => ({ ...s, [id]: `${file.name} (${formatFileSize(file.size)})` }));
    try {
      const { dataUrl, file: compressed } = await processImageFile(file);
      const url = await uploadMedia(compressed, "team");
      update(id, "photo", url || dataUrl);
      setPhotoStatus((s) => ({ ...s, [id]: "success" }));
      setPhotoSuccess((s) => ({ ...s, [id]: "Photo mise à jour." }));
    } catch (err) {
      setPhotoStatus((s) => ({ ...s, [id]: "error" }));
      setPhotoError((s) => ({ ...s, [id]: err.message }));
    }
  }, [update]);

  const handlePhotoDrop = useCallback((id, e) => {
    e.preventDefault();
    setDragOverId(null);
    if (e.dataTransfer.files?.[0]) handlePhoto(id, e.dataTransfer.files[0]);
  }, [handlePhoto]);

  const handleDragOver = useCallback((id) => setDragOverId(id), []);
  const handleDragLeave = useCallback((id) => setDragOverId((cur) => (cur === id ? null : cur)), []);
  const handlePhotoUrlChange = useCallback((id, value) => {
    setPhotoUrlInput((s) => ({ ...s, [id]: value }));
  }, []);

  const addMember = useCallback(() => {
    persist([...teamRef.current, emptyMember()]);
  }, [persist]);

  const removeMember = useCallback((id) => {
    if (!window.confirm("Supprimer ce membre de l'équipe ?")) return;
    persist(teamRef.current.filter((m) => m.id !== id));
  }, [persist]);

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Équipe</h1>
          <p>Gérez les membres affichés dans la section "Notre Équipe" du site.</p>
        </div>
        <button className="btn btn--secondary" onClick={addMember}>
          <Icon name="plus" size={16} /> Ajouter un membre
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Statistique "Collaborateurs"</h3>
        </div>
        <div className="form-group" style={{ maxWidth: 220 }}>
          <label>Nombre de Collaborateurs</label>
          <input
            type="number"
            min="0"
            value={collaborateursCount}
            onChange={(e) => updateCollaborateursCount(e.target.value)}
          />
        </div>
        <p className="field-hint">
          Ce chiffre alimente la carte "+{collaborateursCount} Collaborateurs"
          affichée dans la section "Notre Équipe" et la statistique
          "Collaborateurs" en page d'accueil.
        </p>
      </div>

      {team.length === 0 && (
        <div className="panel">
          <p style={{ color: "var(--color-gray-500)" }}>
            Aucun membre pour le moment — la section "Notre Équipe" sera
            masquée sur le site public tant qu'aucun membre n'est ajouté.
          </p>
        </div>
      )}

      {team.map((m) => (
        <TeamMemberEditor
          key={m.id}
          member={m}
          photoStatus={photoStatus[m.id]}
          photoError={photoError[m.id]}
          photoSuccess={photoSuccess[m.id]}
          photoInfo={photoInfo[m.id]}
          photoUrlInput={photoUrlInput[m.id]}
          dragOver={dragOverId === m.id}
          onUpdate={update}
          onPhoto={handlePhoto}
          onPhotoDrop={handlePhotoDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPhotoUrlChange={handlePhotoUrlChange}
          onAddPhotoUrl={addPhotoUrl}
          onRemove={removeMember}
        />
      ))}
    </div>
  );
}
