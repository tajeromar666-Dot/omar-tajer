import { useEffect, useState } from "react";
import { clearCache, clearMediaCache, DATA_CHANGE_EVENT } from "../data/seedData";
import { getStorageUsageEstimate, onMediaSync } from "../utils/storage";
import Icon from "../components/Icons";

function formatMo(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

// navigator.storage.estimate() measures the whole origin (every IndexedDB
// database, Cache API, localStorage...), not the media store specifically
// — there's no way to isolate it further. Since media dominates that
// total, it's still a useful proxy; the label below reflects that it's an
// overall figure rather than claiming to be IndexedDB-only.
export default function StoragePanel() {
  const [usage, setUsage] = useState(0);
  const [quota, setQuota] = useState(0);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("");

  async function refresh() {
    const estimate = await getStorageUsageEstimate();
    setUsage(estimate.usage);
    setQuota(estimate.quota);
    setSupported(estimate.supported);
  }

  useEffect(() => {
    refresh();
    window.addEventListener(DATA_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const unsubscribe = onMediaSync(refresh);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      unsubscribe();
    };
  }, []);

  const percent = quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;
  const isHigh = percent >= 80;

  async function handleClearCache() {
    const removedLocal = clearCache();
    const removedMedia = await clearMediaCache();
    await refresh();
    const total = removedLocal + removedMedia;
    setMessage(
      total > 0
        ? `${total} élément(s) temporaire(s) supprimé(s).`
        : "Aucune donnée temporaire à supprimer — tout ce qui reste est utilisé par le site."
    );
    setTimeout(() => setMessage(""), 3500);
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Stockage</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={handleClearCache}>
          <Icon name="trash" size={14} /> Vider le cache
        </button>
      </div>
      {supported ? (
        <>
          <div className="storage-usage__bar">
            <div
              className={`storage-usage__fill ${isHigh ? "storage-usage__fill--high" : ""}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="field-hint" style={{ marginTop: 8, marginBottom: 0 }}>
            {formatMo(usage)} utilisés sur {formatMo(quota)} disponibles ({percent}%) — images et
            vidéos sont stockées via IndexedDB, avec une capacité bien supérieure à l'ancienne
            limite de 5 Mo du navigateur.
            {isHigh && " Pensez à utiliser des URLs d'image plutôt que des fichiers."}
          </p>
        </>
      ) : (
        <p className="field-hint" style={{ marginTop: 0, marginBottom: 0 }}>
          L'estimation de l'espace de stockage n'est pas disponible dans ce navigateur.
        </p>
      )}
      {message && (
        <div className="form-success" style={{ marginTop: 12 }}>
          {message}
        </div>
      )}
    </div>
  );
}
