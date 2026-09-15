// Unified storage API: IndexedDB for media (images/video — large payloads,
// far bigger quota than localStorage's ~5MB per-origin cap), localStorage
// for small text data (settings, credentials, toggles, colors...).
//
// IndexedDB signals failure via onerror/rejected requests, not a plain
// synchronous throw the way localStorage does — every operation below is
// explicitly wired to reject on error rather than relying on try/catch
// around a synchronous call, since that's a real, easy-to-miss gotcha
// coming from a localStorage mental model.

const DB_NAME = "cia-media-db";
const DB_VERSION = 1;
const STORE_NAME = "media";
const SYNC_CHANNEL_NAME = "cia-media-sync";

let dbPromise = null;

// Same-tab updates already flow through the existing DATA_CHANGE_EVENT
// custom event (see seedData.js). BroadcastChannel restores the CROSS-TAB
// sync that localStorage's native `storage` event used to provide for
// free — IndexedDB writes fire no equivalent, so without this, editing in
// one tab would silently stop showing up live in another open tab for
// anything backed by IndexedDB.
let syncChannel = null;
function getSyncChannel() {
  if (syncChannel) return syncChannel;
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    syncChannel = null;
  }
  return syncChannel;
}

// Subscribes to cross-tab media writes; returns an unsubscribe function.
// `onMessage` receives the media key that changed.
export function onMediaSync(onMessage) {
  const channel = getSyncChannel();
  if (!channel) return () => {};
  const handler = (event) => onMessage(event.data?.key);
  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
}

function broadcastMediaChange(key) {
  const channel = getSyncChannel();
  if (!channel) return;
  try {
    channel.postMessage({ key });
  } catch {
    /* ignore — same-tab DATA_CHANGE_EVENT already covers this session */
  }
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable in this browser/context"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onblocked = () => {
      console.error("storage.js: IndexedDB open blocked — another tab is holding an older version open");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
  return dbPromise;
}

// Stores `data` (any structured-cloneable value — arrays, objects, strings)
// under `key` in the media object store.
export async function saveMedia(key, data) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ key, data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error(`saveMedia(${key}) failed`));
    tx.onabort = () => reject(tx.error || new Error(`saveMedia(${key}) aborted`));
  });
  broadcastMediaChange(key);
  return true;
}

// Resolves to the stored value, or `undefined` if nothing is stored yet
// under that key.
export async function getMedia(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.data : undefined);
    req.onerror = () => reject(req.error || new Error(`getMedia(${key}) failed`));
  });
}

export async function deleteMedia(key) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error(`deleteMedia(${key}) failed`));
  });
  broadcastMediaChange(key);
  return true;
}

// Every key currently stored in the media object store — used by the
// storage panel's "Vider le cache" to find IndexedDB entries that no
// longer correspond to a known data domain.
export async function listMediaKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error("listMediaKeys failed"));
  });
}

// ---- Small text data (settings, credentials, toggles, colors...) --------
// Thin, synchronous, try/catch-guarded localStorage wrappers — a simpler
// parallel API alongside seedData.js's existing read()/write(), which also
// carry the quota-recovery cascade seedData.js already has for its own
// domains. These exist to satisfy the unified API shape directly.

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function deleteData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ---- Usage estimate for the storage indicator ----------------------------
// navigator.storage.estimate() measures the WHOLE origin (every IndexedDB
// database, Cache API, localStorage...) — there's no way to isolate
// cia-media-db specifically. Since media dominates that total, it's still
// a useful proxy; callers should label it as overall site storage, not
// "media DB only".
export async function getStorageUsageEstimate() {
  if (navigator.storage?.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage || 0, quota: quota || 0, supported: true };
    } catch {
      /* fall through to unsupported */
    }
  }
  return { usage: 0, quota: 0, supported: false };
}
