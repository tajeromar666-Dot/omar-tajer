import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLastStorageError, loadPlans3D, savePlans3D } from "../data/seedData";
import Plans3DForm from "./Plans3DForm";
import Pagination from "./Pagination";
import Icon from "../components/Icons";
import useDebouncedValue from "../hooks/useDebouncedValue";
import useLiveStorage from "../hooks/useLiveStorage";

const PAGE_SIZE = 50;

// Memoized so typing in the search box doesn't re-render every row — only
// rows whose own `plan` prop actually changed, or whose page changed, do.
const PlanRow = memo(function PlanRow({ plan: p, onToggleVisible, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <img className="table-thumb" src={p.images?.[0] || p.image} alt={p.title} />
      </td>
      <td>{p.title}</td>
      <td>
        <span className="badge badge--blue">{p.type}</span>
      </td>
      <td>{p.software || "—"}</td>
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

export default function Plans3DTab() {
  // useLiveStorage re-syncs once the async local/Supabase read resolves —
  // see the identical fix/comment in ProjectsTab.jsx.
  const [plans] = useLiveStorage(loadPlans3D);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const plansRef = useRef(plans);
  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredPlans = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((p) =>
      [p.title, p.type, p.software].some((f) => f?.toLowerCase().includes(term))
    );
  }, [plans, debouncedSearch]);

  const pageCount = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE));
  const pagePlans = useMemo(() => {
    if (filteredPlans.length <= PAGE_SIZE) return filteredPlans;
    const start = (page - 1) * PAGE_SIZE;
    return filteredPlans.slice(start, start + PAGE_SIZE);
  }, [filteredPlans, page]);

  const openNew = useCallback(() => {
    setEditing(null);
    setSaveError("");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((plan) => {
    setEditing(plan);
    setSaveError("");
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    setSaveError("");
  }, []);

  const handleSave = useCallback(async (plan) => {
    const current = plansRef.current;
    const updated = current.some((p) => p.id === plan.id)
      ? current.map((p) => (p.id === plan.id ? plan : p))
      : [plan, ...current];
    const ok = await savePlans3D(updated);
    if (!ok) {
      setSaveError(
        getLastStorageError() ||
          "Échec de l'enregistrement — média trop volumineux pour le stockage local. Pour une vidéo, utilisez un lien YouTube ou Vimeo à la place."
      );
      return;
    }
    closeForm();
  }, [closeForm]);

  const handleDelete = useCallback((id) => {
    if (!window.confirm("Supprimer définitivement ce plan / étude ?")) return;
    savePlans3D(plansRef.current.filter((p) => p.id !== id));
  }, []);

  const toggleVisible = useCallback((id) => {
    savePlans3D(
      plansRef.current.map((p) => (p.id === id ? { ...p, visible: p.visible === false } : p))
    );
  }, []);

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Plans 3D</h1>
          <p>Gérez les plans, modélisations 3D et études techniques affichés sur le site public.</p>
        </div>
        <button className="btn btn--secondary" onClick={openNew}>
          <Icon name="plus" size={16} /> Nouveau plan / étude
        </button>
      </div>

      <div className="panel">
        <div className="list-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, type, logiciel..."
          />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Logiciel</th>
                <th>Vedette</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagePlans.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>
                    {plans.length === 0 ? "Aucun plan ou étude technique pour le moment." : "Aucun résultat pour cette recherche."}
                  </td>
                </tr>
              )}
              {pagePlans.map((p) => (
                <PlanRow
                  key={p.id}
                  plan={p}
                  onToggleVisible={toggleVisible}
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
              <h3>{editing ? "Modifier" : "Nouveau plan / étude"}</h3>
              {saveError && (
                <div className="error-text">
                  <Icon name="alertCircle" size={14} /> {saveError}
                </div>
              )}
              <Plans3DForm initialData={editing} onSave={handleSave} onCancel={closeForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
