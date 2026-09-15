import { useRef, useState } from "react";
import { PLAN3D_TYPES } from "../data/seedData";
import { uploadMedia } from "../data/mediaStorage";
import { formatFileSize, IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import MediaTypeToggle from "../components/MediaTypeToggle";
import UploadStatus from "../components/UploadStatus";

const MAX_VIDEO_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 4;

const EMPTY = {
  title: "",
  type: PLAN3D_TYPES[0],
  description: "",
  software: "",
  mediaType: "image",
  images: [],
  video: null,
  videoType: null,
  videoUrl: "",
  featured: false,
};

function initialFormState(initialData) {
  if (!initialData) return EMPTY;
  const images = initialData.images?.length
    ? initialData.images
    : initialData.image
    ? [initialData.image]
    : [];
  return { ...EMPTY, ...initialData, images };
}

export default function Plans3DForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(() => initialFormState(initialData));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imgStatus, setImgStatus] = useState("idle");
  const [imgError, setImgError] = useState("");
  const [imgSuccess, setImgSuccess] = useState("");
  const [imgFileName, setImgFileName] = useState("");
  const [imgFileSize, setImgFileSize] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

  function addImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (form.images.length >= MAX_IMAGES) {
      setImgStatus("error");
      setImgError(`Vous pouvez ajouter au maximum ${MAX_IMAGES} images.`);
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setImageUrlInput("");
    setImgStatus("success");
    setImgSuccess("Image ajoutée depuis l'URL.");
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateFields(fields) {
    setForm((f) => ({ ...f, ...fields }));
  }

  async function handleImages(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    if (form.images.length + files.length > MAX_IMAGES) {
      setImgStatus("error");
      setImgError(`Vous pouvez ajouter au maximum ${MAX_IMAGES} images.`);
      return;
    }

    setImgStatus("loading");
    setImgFileName(files.length > 1 ? `${files.length} images` : files[0].name);
    setImgFileSize(formatFileSize(files.reduce((sum, f) => sum + f.size, 0)));

    const urls = [];
    for (const file of files) {
      try {
        const { dataUrl, file: compressed } = await processImageFile(file);
        const url = await uploadMedia(compressed, "plans3d");
        urls.push(url || dataUrl);
      } catch (err) {
        setImgStatus("error");
        setImgError(err.message);
        return;
      }
    }

    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setImgStatus("success");
    setImgSuccess(urls.length > 1 ? `${urls.length} images ajoutées.` : "Image ajoutée.");
  }

  function removeImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function handleImageDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleImages(e.dataTransfer.files);
  }

  async function handleVideo(file) {
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setError("La vidéo dépasse 5 Mo — utilisez un lien YouTube ou Vimeo à la place.");
      videoUrlRef.current?.focus();
      return;
    }
    setError("");
    const url = await uploadMedia(file, "plans3d");
    updateFields({ video: url, videoType: "local", videoUrl: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (form.mediaType === "video") {
      if (!form.video && !form.videoUrl.trim()) {
        setError("Ajoutez une vidéo ou un lien d'intégration.");
        return;
      }
    } else if (form.images.length === 0) {
      setError("Ajoutez au moins une image pour ce projet.");
      return;
    }
    setError("");
    setSubmitting(true);
    await onSave({
      ...form,
      id: form.id || `pl_${Date.now()}`,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="field-grid">
        <div className="form-group">
          <label>Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ex: Modélisation 3D — Charpente métallique"
          />
        </div>
        <div className="form-group">
          <label>Type *</label>
          <select value={form.type} onChange={(e) => update("type", e.target.value)}>
            {PLAN3D_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Logiciel(s) utilisé(s)</label>
        <input
          type="text"
          value={form.software}
          onChange={(e) => update("software", e.target.value)}
          placeholder="Ex: AutoCAD, SolidWorks, Tekla Structures"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Décrivez le plan, la modélisation ou l'étude..."
        />
      </div>

      <div className="form-group">
        <label>Média *</label>
        <MediaTypeToggle
          value={form.mediaType}
          onChange={(v) => update("mediaType", v)}
        />

        {form.mediaType === "image" ? (
          <>
            <div
              className={`image-upload-zone ${dragOver ? "dragover" : ""}`}
              onClick={() => form.images.length < MAX_IMAGES && fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (form.images.length < MAX_IMAGES) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => form.images.length < MAX_IMAGES && handleImageDrop(e)}
              style={form.images.length >= MAX_IMAGES ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              <Icon name="upload" size={26} />
              <p style={{ marginTop: 8 }}>
                Cliquez ou glissez-déposez des images (max {MAX_IMAGES}, 5 Mo chacune)
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) handleImages(e.target.files);
                e.target.value = "";
              }}
            />
            <UploadStatus
              status={imgStatus}
              error={imgError}
              success={imgSuccess}
              fileName={imgFileName}
              fileSize={imgFileSize}
            />
            <div className="url-input-row">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Ou collez une URL d'image (https://...)"
              />
              <button type="button" className="btn btn--ghost btn--sm" onClick={addImageUrl}>
                Ajouter
              </button>
            </div>

            {form.images.length > 0 && (
              <div className="image-upload-grid">
                {form.images.map((img, idx) => (
                  <div className="image-upload-item" key={idx}>
                    <img src={img} alt={`Aperçu ${idx + 1}`} />
                    <button
                      type="button"
                      className="image-upload-item__remove"
                      onClick={() => removeImage(idx)}
                      aria-label="Supprimer l'image"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {form.video ? (
              <div className="video-upload-preview">
                <video src={form.video} controls />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => updateFields({ video: null, videoType: form.videoUrl.trim() ? "url" : null })}
                >
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
                ref={videoUrlRef}
                type="text"
                value={form.videoUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  updateFields({ videoUrl: val, videoType: val.trim() ? "url" : form.video ? "local" : null });
                }}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <p className="field-hint">
              Utilisez soit un fichier vidéo (5 Mo maximum), soit un lien
              d'intégration — le lien est prioritaire si les deux sont
              renseignés. Pour une vidéo plus lourde, utilisez un lien
              YouTube ou Vimeo.
            </p>
          </>
        )}
      </div>

      <div className="form-group">
        <label
          className="toggle-switch"
          onClick={() => update("featured", !form.featured)}
        >
          <span className={`toggle-switch__track ${form.featured ? "on" : ""}`}>
            <span className="toggle-switch__thumb" />
          </span>
          Mettre en vedette sur la page d'accueil
        </label>
      </div>

      <div className="settings-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn btn--secondary btn--sm" disabled={submitting}>
          <Icon name="checkCircle" size={16} /> {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
