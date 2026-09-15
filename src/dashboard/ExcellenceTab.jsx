import { useRef, useState } from "react";
import {
  getLastStorageError,
  ICON_OPTIONS,
  loadWhyUsItems,
  loadWhyUsSlides,
  saveWhyUsItems,
  saveWhyUsSlides,
} from "../data/seedData";
import { IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import MediaTypeToggle from "../components/MediaTypeToggle";
import UploadStatus from "../components/UploadStatus";

const MAX_VIDEO_BYTES = 5 * 1024 * 1024;

function emptySlide() {
  return {
    id: `wslide_${Date.now()}`,
    mediaType: "image",
    image: null,
    video: null,
    videoType: null,
    videoUrl: "",
  };
}

function emptyItem() {
  return { id: `w_${Date.now()}`, icon: "shield", title: "", text: "" };
}

export default function ExcellenceTab() {
  const [slides, setSlides] = useState(loadWhyUsSlides);
  const [items, setItems] = useState(loadWhyUsItems);
  const [error, setError] = useState("");
  const [imgStatus, setImgStatus] = useState({});
  const [imgError, setImgError] = useState({});
  const [imgSuccess, setImgSuccess] = useState({});
  const [imgFileName, setImgFileName] = useState({});
  const [dragOverId, setDragOverId] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState({});
  const fileRefs = useRef({});
  const videoRefs = useRef({});
  const videoUrlRefs = useRef({});

  function addImageUrl(id) {
    const url = (imageUrlInput[id] || "").trim();
    if (!url) return;
    updateSlide(id, "image", url);
    setImageUrlInput((s) => ({ ...s, [id]: "" }));
    setImgStatus((s) => ({ ...s, [id]: "success" }));
    setImgSuccess((s) => ({ ...s, [id]: "Image ajoutée depuis l'URL." }));
  }

  // Only commits to React state once the write actually succeeds — a
  // failed (quota-exceeded) save must not leave the admin thinking a
  // video was saved when it silently wasn't.
  async function persistSlides(next) {
    const ok = await saveWhyUsSlides(next);
    if (!ok) {
      setError(
        getLastStorageError() || "Stockage plein. Compressez vos images ou utilisez Supabase Storage."
      );
      return;
    }
    setSlides(next);
    setError("");
  }

  function persistItems(next) {
    setItems(next);
    const ok = saveWhyUsItems(next);
    if (!ok) setError("Échec de la sauvegarde.");
    else setError("");
  }

  function updateSlide(id, field, value) {
    updateSlideFields(id, { [field]: value });
  }

  function updateSlideFields(id, fields) {
    persistSlides(slides.map((s) => (s.id === id ? { ...s, ...fields } : s)));
  }

  async function handleSlideImage(id, file) {
    if (!file) return;
    setImgStatus((s) => ({ ...s, [id]: "loading" }));
    setImgFileName((s) => ({ ...s, [id]: file.name }));
    try {
      const { dataUrl } = await processImageFile(file);
      updateSlide(id, "image", dataUrl);
      setImgStatus((s) => ({ ...s, [id]: "success" }));
      setImgSuccess((s) => ({ ...s, [id]: "Image mise à jour." }));
    } catch (err) {
      setImgStatus((s) => ({ ...s, [id]: "error" }));
      setImgError((s) => ({ ...s, [id]: err.message }));
    }
  }

  function handleSlideImageDrop(id, e) {
    e.preventDefault();
    setDragOverId(null);
    if (e.dataTransfer.files?.[0]) handleSlideImage(id, e.dataTransfer.files[0]);
  }

  function handleSlideVideo(id, file) {
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setError(
        "La vidéo dépasse 5 Mo — utilisez un lien YouTube ou Vimeo à la place."
      );
      videoUrlRefs.current[id]?.focus();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSlideFields(id, { video: reader.result, videoType: "local", videoUrl: "" });
    };
    reader.readAsDataURL(file);
  }

  function addSlide() {
    persistSlides([...slides, emptySlide()]);
  }

  function removeSlide(id) {
    if (!window.confirm("Supprimer cette diapositive ?")) return;
    persistSlides(slides.filter((s) => s.id !== id));
  }

  function moveSlide(index, dir) {
    const next = [...slides];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persistSlides(next);
  }

  function updateItem(id, field, value) {
    persistItems(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    persistItems([...items, emptyItem()]);
  }

  function removeItem(id) {
    if (!window.confirm("Supprimer cet avantage ?")) return;
    persistItems(items.filter((it) => it.id !== id));
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Excellence</h1>
          <p>
            Gérez le diaporama et les cartes de la section "Pourquoi Nous
            Choisir / Excellence Industrielle".
          </p>
        </div>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Diaporama (images / vidéos)</h3>
          <button className="btn btn--secondary btn--sm" onClick={addSlide}>
            <Icon name="plus" size={14} /> Ajouter une diapositive
          </button>
        </div>

        {slides.length === 0 && (
          <p style={{ color: "var(--color-gray-500)" }}>
            Aucune diapositive — le diaporama reste masqué sur le site public
            tant qu'aucun média n'est ajouté.
          </p>
        )}

        {slides.map((slide, i) => (
          <div className="panel slide-editor" key={slide.id} style={{ boxShadow: "none", border: "1px solid var(--color-gray-100)" }}>
            <div className="slide-editor__preview">
              <MediaTypeToggle
                value={slide.mediaType}
                onChange={(v) => updateSlide(slide.id, "mediaType", v)}
              />
              {slide.mediaType === "image" ? (
                <>
                  <div
                    className={`slide-image-drop ${dragOverId === slide.id ? "dragover" : ""}`}
                    onClick={() => !slide.image && fileRefs.current[slide.id]?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverId(slide.id);
                    }}
                    onDragLeave={() => setDragOverId((cur) => (cur === slide.id ? null : cur))}
                    onDrop={(e) => handleSlideImageDrop(slide.id, e)}
                  >
                    {slide.image ? (
                      <img src={slide.image} alt={`Diapositive ${i + 1}`} style={{ borderRadius: 8, width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                    ) : (
                      <div className="image-upload-zone">
                        <Icon name="upload" size={22} />
                        <p style={{ marginTop: 6, fontSize: "0.8rem" }}>
                          Cliquez ou glissez-déposez une image
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={(el) => (fileRefs.current[slide.id] = el)}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleSlideImage(slide.id, e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  <UploadStatus
                    status={imgStatus[slide.id]}
                    error={imgError[slide.id]}
                    success={imgSuccess[slide.id]}
                    fileName={imgFileName[slide.id]}
                  />
                  <div className="url-input-row url-input-row--stacked">
                    <input
                      type="text"
                      value={imageUrlInput[slide.id] || ""}
                      onChange={(e) =>
                        setImageUrlInput((s) => ({ ...s, [slide.id]: e.target.value }))
                      }
                      placeholder="Ou URL d'image"
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => addImageUrl(slide.id)}
                    >
                      Ajouter
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {slide.video ? (
                    <div className="video-upload-preview">
                      <video src={slide.video} controls />
                    </div>
                  ) : (
                    <div className="image-upload-zone" onClick={() => videoRefs.current[slide.id]?.click()}>
                      <Icon name="video" size={22} />
                      <p style={{ marginTop: 6, fontSize: "0.8rem" }}>Choisir une vidéo</p>
                    </div>
                  )}
                  <input
                    ref={(el) => (videoRefs.current[slide.id] = el)}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleSlideVideo(slide.id, e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={(el) => (videoUrlRefs.current[slide.id] = el)}
                    type="text"
                    style={{ marginTop: 8, width: "100%", padding: "8px 10px", border: "1.5px solid var(--color-gray-200)", borderRadius: 6 }}
                    value={slide.videoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSlideFields(slide.id, {
                        videoUrl: val,
                        videoType: val.trim() ? "url" : slide.video ? "local" : null,
                      });
                    }}
                    placeholder="Ou lien YouTube / Vimeo"
                  />
                </>
              )}
            </div>

            <div className="slide-editor__fields">
              <div className="slide-editor__head">
                <span className="badge badge--blue">Diapositive {i + 1}</span>
                <div className="row-actions">
                  <button className="btn-icon" onClick={() => moveSlide(i, -1)} disabled={i === 0} title="Monter">
                    <Icon name="arrowUp" size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} title="Descendre">
                    <Icon name="arrowDown" size={16} />
                  </button>
                  <button className="btn-icon btn-icon--danger" onClick={() => removeSlide(slide.id)} title="Supprimer">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
              <p className="field-hint">
                Ce diaporama s'affiche en haut de la section "Pourquoi Nous
                Choisir" sur le site public, avec défilement automatique.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Cartes d'avantages</h3>
          <button className="btn btn--secondary btn--sm" onClick={addItem}>
            <Icon name="plus" size={14} /> Ajouter un avantage
          </button>
        </div>

        {items.map((it) => (
          <div className="value-editor" key={it.id}>
            <select value={it.icon} onChange={(e) => updateItem(it.id, "icon", e.target.value)}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <Icon name={it.icon} size={20} />
            <input
              type="text"
              value={it.title}
              onChange={(e) => updateItem(it.id, "title", e.target.value)}
              placeholder="Titre de l'avantage"
            />
            <input
              type="text"
              value={it.text}
              onChange={(e) => updateItem(it.id, "text", e.target.value)}
              placeholder="Description courte"
            />
            <button className="btn-icon btn-icon--danger" onClick={() => removeItem(it.id)} title="Supprimer">
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
