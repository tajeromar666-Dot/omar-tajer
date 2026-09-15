import { useEffect, useRef, useState } from "react";
import { getLastStorageError, ICON_OPTIONS, loadAbout, saveAbout } from "../data/seedData";
import { IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import MediaTypeToggle from "../components/MediaTypeToggle";
import useLiveStorage from "../hooks/useLiveStorage";

function emptyValue() {
  return { id: `v_${Date.now()}`, icon: "shield", title: "", text: "" };
}

export default function AboutTab() {
  // useLiveStorage (not a one-time useState) so this re-syncs itself once
  // the async local/Supabase read resolves — without it, opening this tab
  // before that read settles left it stuck showing stale content.
  const [about] = useLiveStorage(loadAbout);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  // Lets update()/updateValue() always build the next value from the
  // latest known state rather than a closure that can go stale while a
  // previous edit's save() is still in flight (this domain has many
  // fields — title, badge, description, values... — that a form can
  // reasonably touch in quick succession).
  const aboutRef = useRef(about);
  useEffect(() => {
    aboutRef.current = about;
  }, [about]);

  async function persist(next) {
    const ok = await saveAbout(next);
    if (ok) {
      setError("");
      setToast(true);
      setTimeout(() => setToast(false), 1800);
    } else {
      setError(
        getLastStorageError() || "Échec de la sauvegarde — image trop volumineuse pour le stockage local."
      );
    }
  }

  function update(field, value) {
    persist({ ...aboutRef.current, [field]: value });
  }

  async function handleImage(file) {
    if (!file) return;
    try {
      const { dataUrl } = await processImageFile(file);
      update("image", dataUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleVideo(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("video", reader.result);
    reader.readAsDataURL(file);
  }

  function updateValue(id, field, val) {
    const current = aboutRef.current;
    persist({
      ...current,
      values: current.values.map((v) => (v.id === id ? { ...v, [field]: val } : v)),
    });
  }

  function addValue() {
    const current = aboutRef.current;
    persist({ ...current, values: [...current.values, emptyValue()] });
  }

  function removeValue(id) {
    if (!window.confirm("Supprimer cette valeur ?")) return;
    const current = aboutRef.current;
    persist({ ...current, values: current.values.filter((v) => v.id !== id) });
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>À Propos</h1>
          <p>Modifiez le contenu de la section "À Propos de CIA" du site public.</p>
        </div>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Texte et image</h3>
        </div>

        <div className="field-grid">
          <div className="form-group">
            <label>Titre complet</label>
            <input
              type="text"
              value={about.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Portion du titre en accent (couleur bleue)</label>
            <input
              type="text"
              value={about.titleAccent}
              onChange={(e) => update("titleAccent", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description (un paragraphe par ligne)</label>
          <textarea
            style={{ minHeight: 160 }}
            value={about.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div className="field-grid">
          <div className="form-group">
            <label>Badge — nombre</label>
            <input
              type="text"
              value={about.badgeNumber}
              onChange={(e) => update("badgeNumber", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Badge — libellé</label>
            <input
              type="text"
              value={about.badgeLabel}
              onChange={(e) => update("badgeLabel", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Média de la section</label>
          <MediaTypeToggle
            value={about.mediaType || "image"}
            onChange={(v) => update("mediaType", v)}
          />

          {(about.mediaType || "image") === "image" ? (
            <div className="logo-manager">
              <div className="logo-manager__preview logo-manager__preview--wide">
                {about.image && <img src={about.image} alt="Aperçu" />}
                {!about.image && <Icon name="image" size={28} />}
              </div>
              <div className="logo-manager__actions">
                <button className="btn btn--secondary btn--sm" onClick={() => imageRef.current?.click()}>
                  <Icon name="upload" size={14} /> Choisir une image
                </button>
                {about.image && (
                  <button className="btn btn--ghost btn--sm" onClick={() => update("image", null)}>
                    <Icon name="trash" size={14} /> Retirer
                  </button>
                )}
                <input
                  ref={imageRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImage(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {about.video ? (
                <div className="video-upload-preview">
                  <video src={about.video} controls />
                  <button className="btn btn--ghost btn--sm" onClick={() => update("video", null)}>
                    <Icon name="trash" size={14} /> Retirer la vidéo
                  </button>
                </div>
              ) : (
                <div className="image-upload-zone" onClick={() => videoRef.current?.click()}>
                  <Icon name="video" size={26} />
                  <p style={{ marginTop: 8 }}>Cliquez pour choisir une vidéo</p>
                </div>
              )}
              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) handleVideo(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Ou lien d'intégration (YouTube / Vimeo)</label>
                <input
                  type="text"
                  value={about.videoUrl}
                  onChange={(e) => update("videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <p className="field-hint">
                Utilisez soit un fichier vidéo, soit un lien d'intégration — le
                lien est prioritaire si les deux sont renseignés. Aucune limite
                de taille n'est appliquée au fichier.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Cartes de valeurs</h3>
          <button className="btn btn--secondary btn--sm" onClick={addValue}>
            <Icon name="plus" size={14} /> Ajouter une valeur
          </button>
        </div>

        {about.values.map((v) => (
          <div className="value-editor" key={v.id}>
            <select value={v.icon} onChange={(e) => updateValue(v.id, "icon", e.target.value)}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <Icon name={v.icon} size={20} />
            <input
              type="text"
              value={v.title}
              onChange={(e) => updateValue(v.id, "title", e.target.value)}
              placeholder="Titre de la valeur"
            />
            <input
              type="text"
              value={v.text}
              onChange={(e) => updateValue(v.id, "text", e.target.value)}
              placeholder="Description courte"
            />
            <button
              className="btn-icon btn-icon--danger"
              onClick={() => removeValue(v.id)}
              title="Supprimer"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>

      {toast && (
        <div className="save-toast">
          <Icon name="checkCircle" size={16} /> Modifications enregistrées.
        </div>
      )}
    </div>
  );
}
