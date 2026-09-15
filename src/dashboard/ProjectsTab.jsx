import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLastStorageError, loadProjects, saveProjects } from "../data/seedData";
import ProjectForm from "./ProjectForm";
import Pagination from "./Pagination";
import Icon from "../components/Icons";
import MediaVideo from "../components/MediaVideo";
import useDebouncedValue from "../hooks/useDebouncedValue";
import useLiveStorage from "../hooks/useLiveStorage";

const PAGE_SIZE = 50;

// Memoized so typing in the search box (which re-renders ProjectsTab on
// every keystroke) doesn't re-render every row — only rows whose own
// `project` prop actually changed, or whose page changed, re-render.
const ProjectRow = memo(function ProjectRow({ project: p, onToggleVisible, onPreview, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        {p.images?.[0] ? (
          <img className="table-thumb" src={p.images[0]} alt={p.title} />
        ) : (
          <span className="table-thumb table-thumb--icon">
            <Icon name="video" size={18} />
          </span>
        )}
      </td>
      <td>{p.title}</td>
      <td>
        <span className="badge badge--blue">{p.category}</span>
      </td>
      <td>{p.client}</td>
      <td>{p.year}</td>
      <td>
        {p.featured ? (
          <span className="badge badge--yellow">Oui</span>
        ) : (
          <span className="badge badge--gray">Non</span>
        )}
      </td>
      <td>
        <div className="row-actions">
          <button
            className={`btn-icon ${p.visible === false ? "btn-icon--hidden" : "btn-icon--visible"}`}
            onClick={() => onToggleVisible(p.id)}
            title={p.visible === false ? "Masqué du site public — cliquer pour afficher" : "Visible sur le site public — cliquer pour masquer"}
          >
            <Icon name={p.visible === false ? "eyeOff" : "eye"} size={16} />
          </button>
          <button className="btn-icon" onClick={() => onPreview(p)} title="Aperçu">
            <Icon name="eye" size={16} />
          </button>
          <button className="btn-icon" onClick={() => onEdit(p)} title="Modifier">
            <Icon name="edit" size={16} />
          </button>
          <button className="btn-icon btn-icon--danger" onClick={() => onDelete(p.id)} title="Supprimer">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function ProjectsTab() {
  // useLiveStorage (not a one-time useState/useEffect load) so this list
  // re-syncs itself once the async local/Supabase read actually resolves —
  // without it, opening this tab before that read settles left the table
  // permanently stuck showing "Aucun projet" even though data existed.
  const [projects] = useLiveStorage(loadProjects);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Lets the callbacks below stay referentially stable (empty deps) while
  // still always acting on the latest list — avoids re-creating them (and
  // therefore re-rendering every memoized ProjectRow) on every render.
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Reset to page 1 whenever the search term actually changes the result
  // set, so the admin never lands on a now-empty trailing page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredProjects = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) =>
      [p.title, p.category, p.client, p.year].some((f) => f?.toLowerCase().includes(term))
    );
  }, [projects, debouncedSearch]);

  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const pageProjects = useMemo(() => {
    if (filteredProjects.length <= PAGE_SIZE) return filteredProjects;
    const start = (page - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, page]);

  const openNew = useCallback(() => {
    setEditing(null);
    setSaveError("");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((project) => {
    setEditing(project);
    setSaveError("");
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    setSaveError("");
  }, []);

  const handleSave = useCallback(async (project) => {
    const current = projectsRef.current;
    const updated = current.some((p) => p.id === project.id)
      ? current.map((p) => (p.id === project.id ? project : p))
      : [project, ...current];
    const ok = await saveProjects(updated);
    if (!ok) {
      setSaveError(
        getLastStorageError() ||
          "Échec de l'enregistrement — le stockage local du navigateur est probablement plein (souvent causé par une vidéo trop volumineuse). Utilisez un lien YouTube ou Vimeo à la place."
      );
      return;
    }
    closeForm();
  }, [closeForm]);

  const handleDelete = useCallback((id) => {
    if (!window.confirm("Supprimer définitivement ce projet ?")) return;
    saveProjects(projectsRef.current.filter((p) => p.id !== id));
  }, []);

  const toggleVisible = useCallback((id) => {
    saveProjects(
      projectsRef.current.map((p) => (p.id === id ? { ...p, visible: p.visible === false } : p))
    );
  }, []);

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Projets</h1>
          <p>Gérez les réalisations affichées sur le site public.</p>
        </div>
        <button className="btn btn--secondary" onClick={openNew}>
          <Icon name="plus" size={16} /> Nouveau projet
        </button>
      </div>

      <div className="panel">
        <div className="list-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, catégorie, client, année..."
          />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Client</th>
                <th>Année</th>
                <th>Vedette</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageProjects.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={7}>
                    {projects.length === 0 ? "Aucun projet pour le moment." : "Aucun projet ne correspond à cette recherche."}
                  </td>
                </tr>
              )}
              {pageProjects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onToggleVisible={toggleVisible}
                  onPreview={setPreview}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={closeForm}>
              <Icon name="close" size={18} />
            </button>
            <div className="modal__body">
              <h3>{editing ? "Modifier le projet" : "Nouveau projet"}</h3>
              {saveError && (
                <div className="error-text">
                  <Icon name="alertCircle" size={14} /> {saveError}
                </div>
              )}
              <ProjectForm
                initialData={editing}
                onSave={handleSave}
                onCancel={closeForm}
              />
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setPreview(null)}>
              <Icon name="close" size={18} />
            </button>
            <div className="modal__gallery">
              {preview.mediaType === "video" && (preview.video || preview.videoUrl) ? (
                <MediaVideo video={preview.video} videoUrl={preview.videoUrl} title={preview.title} />
              ) : (
                <img src={preview.images?.[0]} alt={preview.title} />
              )}
            </div>
            <div className="modal__body">
              <span className="badge badge--blue" style={{ marginBottom: 10 }}>
                {preview.category}
              </span>
              <h3>{preview.title}</h3>
              <div className="modal__meta">
                <span>
                  <Icon name="building" size={16} /> {preview.client}
                </span>
                <span>
                  <Icon name="clock" size={16} /> {preview.year}
                </span>
              </div>
              <p>{preview.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
