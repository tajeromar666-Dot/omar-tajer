import { useEffect, useRef, useState } from "react";
import {
  getLastStorageError,
  loadHeroSlides,
  loadHeroSpeed,
  saveHeroSlides,
  saveHeroSpeed,
} from "../data/seedData";
import { IMAGE_ACCEPT, processImageFile } from "../data/imageUpload";
import Icon from "../components/Icons";
import useLiveStorage from "../hooks/useLiveStorage";

function emptySlide() {
  return { id: `slide_${Date.now()}`, image: null, title: "", subtitle: "" };
}

export default function HeroSlidesTab() {
  // useLiveStorage (not a one-time useState) so this list re-syncs itself
  // once the async local/Supabase read resolves — without it, opening this
  // tab before that read settles left it stuck showing stale/empty slides.
  const [slides] = useLiveStorage(loadHeroSlides);
  const [speed, setSpeed] = useState(loadHeroSpeed);
  const [error, setError] = useState("");
  const fileRefs = useRef({});

  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  function updateSpeed(value) {
    const clamped = Math.min(10, Math.max(2, Number(value) || 4));
    setSpeed(clamped);
    saveHeroSpeed(clamped);
  }

  async function persist(next) {
    const ok = await saveHeroSlides(next);
    if (!ok) {
      setError(
        getLastStorageError() || "Échec de la sauvegarde — image trop volumineuse pour le stockage local."
      );
      return;
    }
    setError("");
  }

  function updateField(id, field, value) {
    persist(slidesRef.current.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function handleImage(id, file) {
    if (!file) return;
    try {
      const { dataUrl } = await processImageFile(file);
      updateField(id, "image", dataUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  function addSlide() {
    persist([...slidesRef.current, emptySlide()]);
  }

  function removeSlide(id) {
    if (slidesRef.current.length <= 1) return;
    if (!window.confirm("Supprimer cette diapositive ?")) return;
    persist(slidesRef.current.filter((s) => s.id !== id));
  }

  function move(index, dir) {
    const next = [...slidesRef.current];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Hero — Diaporama</h1>
          <p>
            Gérez les images du diaporama principal, leur ordre, et le titre /
            sous-titre affichés pour chacune.
          </p>
        </div>
        <button className="btn btn--secondary" onClick={addSlide}>
          <Icon name="plus" size={16} /> Nouvelle diapositive
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      <div className="panel">
        <div className="form-group">
          <label>Vitesse du diaporama (secondes)</label>
          <input
            type="number"
            min="2"
            max="10"
            value={speed}
            onChange={(e) => updateSpeed(e.target.value)}
          />
        </div>
      </div>

      {slides.map((slide, i) => (
        <div className="panel slide-editor" key={slide.id}>
          <div className="slide-editor__preview">
            <img
              src={
                slide.image ||
                `data:image/svg+xml;utf8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#16294d"/><text x="160" y="95" font-family="Arial" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">Pas d\'image</text></svg>'
                )}`
              }
              alt={`Diapositive ${i + 1}`}
            />
            <input
              ref={(el) => (fileRefs.current[slide.id] = el)}
              type="file"
              accept={IMAGE_ACCEPT}
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) handleImage(slide.id, e.target.files[0]);
                e.target.value = "";
              }}
            />
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => fileRefs.current[slide.id]?.click()}
            >
              <Icon name="upload" size={14} /> Choisir une image
            </button>
          </div>

          <div className="slide-editor__fields">
            <div className="slide-editor__head">
              <span className="badge badge--blue">Diapositive {i + 1}</span>
              <div className="row-actions">
                <button
                  className="btn-icon"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Monter"
                >
                  <Icon name="arrowUp" size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => move(i, 1)}
                  disabled={i === slides.length - 1}
                  title="Descendre"
                >
                  <Icon name="arrowDown" size={16} />
                </button>
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => removeSlide(slide.id)}
                  disabled={slides.length <= 1}
                  title="Supprimer"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateField(slide.id, "title", e.target.value)}
                placeholder="Construction Industrielle Africaine"
              />
            </div>
            <div className="form-group">
              <label>Sous-titre</label>
              <textarea
                value={slide.subtitle}
                onChange={(e) => updateField(slide.id, "subtitle", e.target.value)}
                placeholder="Décrivez cette diapositive..."
              />
            </div>
          </div>
        </div>
      ))}

      <p className="field-hint">
        Le diaporama défile automatiquement toutes les {speed} secondes sur le
        site public ; les visiteurs peuvent aussi naviguer avec les flèches ou
        les points.
      </p>
    </div>
  );
}
