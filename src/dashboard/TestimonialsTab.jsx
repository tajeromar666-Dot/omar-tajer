import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLastStorageError, loadTestimonials, saveTestimonials } from "../data/seedData";
import { uploadMedia } from "../data/mediaStorage";
import Pagination from "./Pagination";
import Icon from "../components/Icons";
import useDebouncedValue from "../hooks/useDebouncedValue";
import useLiveStorage from "../hooks/useLiveStorage";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const PAGE_SIZE = 50;

function emptyTestimonial() {
  return {
    id: `te_${Date.now()}`,
    name: "",
    company: "",
    role: "",
    text: "",
    rating: 5,
    avatar: null,
    active: true,
  };
}

// Memoized so typing in the search box, or editing one testimonial, only
// re-renders that testimonial's own panel — not every other one in the list.
const TestimonialEditor = memo(function TestimonialEditor({ testimonial: t, onUpdate, onAvatar, onRemove }) {
  const fileRef = useRef(null);

  return (
    <div className="panel team-editor testimonial-editor">
      <div className="team-editor__photo">
        {t.avatar ? <img src={t.avatar} alt={t.name} /> : <Icon name="user" size={28} />}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) onAvatar(t.id, e.target.files[0]);
            e.target.value = "";
          }}
        />
        <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} /> Avatar
        </button>
      </div>

      <div className="team-editor__fields">
        <div className="field-grid">
          <div className="form-group">
            <label>Nom du client</label>
            <input
              type="text"
              value={t.name}
              onChange={(e) => onUpdate(t.id, "name", e.target.value)}
              placeholder="Ex: Rachid Benali"
            />
          </div>
          <div className="form-group">
            <label>Entreprise</label>
            <input
              type="text"
              value={t.company}
              onChange={(e) => onUpdate(t.id, "company", e.target.value)}
              placeholder="Ex: OCP Group"
            />
          </div>
        </div>

        <div className="field-grid">
          <div className="form-group">
            <label>Fonction</label>
            <input
              type="text"
              value={t.role}
              onChange={(e) => onUpdate(t.id, "role", e.target.value)}
              placeholder="Ex: Directeur des Opérations"
            />
          </div>
          <div className="form-group">
            <label>Note</label>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="star-picker__btn"
                  onClick={() => onUpdate(t.id, "rating", n)}
                  aria-label={`${n} étoiles`}
                >
                  <Icon name="star" size={20} filled={n <= t.rating} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Témoignage</label>
          <textarea
            value={t.text}
            onChange={(e) => onUpdate(t.id, "text", e.target.value)}
            placeholder="Le témoignage du client..."
          />
        </div>

        <div className="form-group">
          <label className="toggle-switch" onClick={() => onUpdate(t.id, "active", !t.active)}>
            <span className={`toggle-switch__track ${t.active ? "on" : ""}`}>
              <span className="toggle-switch__thumb" />
            </span>
            Actif sur le site public
          </label>
        </div>
      </div>

      <button
        className="btn-icon btn-icon--danger team-editor__remove"
        onClick={() => onRemove(t.id)}
        title="Supprimer"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
});

export default function TestimonialsTab() {
  // useLiveStorage re-syncs once the async local/Supabase read resolves —
  // see the identical fix/comment in ProjectsTab.jsx.
  const [testimonials] = useLiveStorage(loadTestimonials);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const testimonialsRef = useRef(testimonials);
  useEffect(() => {
    testimonialsRef.current = testimonials;
  }, [testimonials]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const persist = useCallback(async (next) => {
    const ok = await saveTestimonials(next);
    if (!ok) {
      setError(getLastStorageError() || "Échec de la sauvegarde — avatar trop volumineux.");
      return;
    }
    setError("");
  }, []);

  const update = useCallback((id, field, value) => {
    persist(testimonialsRef.current.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, [persist]);

  const handleAvatar = useCallback(async (id, file) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError("L'avatar doit faire moins de 2 Mo.");
      return;
    }
    const url = await uploadMedia(file, "testimonials");
    update(id, "avatar", url);
  }, [update]);

  const addTestimonial = useCallback(() => {
    persist([...testimonialsRef.current, emptyTestimonial()]);
  }, [persist]);

  const removeTestimonial = useCallback((id) => {
    if (!window.confirm("Supprimer ce témoignage ?")) return;
    persist(testimonialsRef.current.filter((t) => t.id !== id));
  }, [persist]);

  const filteredTestimonials = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return testimonials;
    return testimonials.filter((t) =>
      [t.name, t.company, t.role, t.text].some((f) => f?.toLowerCase().includes(term))
    );
  }, [testimonials, debouncedSearch]);

  const pageCount = Math.max(1, Math.ceil(filteredTestimonials.length / PAGE_SIZE));
  const pageTestimonials = useMemo(() => {
    if (filteredTestimonials.length <= PAGE_SIZE) return filteredTestimonials;
    const start = (page - 1) * PAGE_SIZE;
    return filteredTestimonials.slice(start, start + PAGE_SIZE);
  }, [filteredTestimonials, page]);

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Témoignages</h1>
          <p>Gérez les avis clients affichés dans la section "Témoignages" du site.</p>
        </div>
        <button className="btn btn--secondary" onClick={addTestimonial}>
          <Icon name="plus" size={16} /> Ajouter un témoignage
        </button>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}

      {testimonials.length > 0 && (
        <div className="list-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, entreprise, texte..."
          />
        </div>
      )}

      {testimonials.length === 0 && (
        <div className="panel">
          <p style={{ color: "var(--color-gray-500)" }}>
            Aucun témoignage — la section "Témoignages" affichera 3 avis par
            défaut sur le site public tant qu'aucun témoignage actif n'est
            ajouté ici.
          </p>
        </div>
      )}

      {testimonials.length > 0 && pageTestimonials.length === 0 && (
        <div className="panel">
          <p style={{ color: "var(--color-gray-500)" }}>Aucun résultat pour cette recherche.</p>
        </div>
      )}

      {pageTestimonials.map((t) => (
        <TestimonialEditor
          key={t.id}
          testimonial={t}
          onUpdate={update}
          onAvatar={handleAvatar}
          onRemove={removeTestimonial}
        />
      ))}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
