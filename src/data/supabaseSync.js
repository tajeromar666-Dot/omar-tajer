import { isSupabaseConnected, supabase } from "../supabase";
import { getData, onMediaSync } from "../utils/storage";

// Reusable per-table sync engine for the array-shaped domains (projects,
// plans3d, messages, testimonials, team). Settings is key-value shaped and
// handled separately in seedData.js.
//
// Design notes (see the approved plan for the full reasoning):
// - `load()` stays synchronous: seeded with an empty array instantly, then
//   filled in from local storage (IndexedDB for media-heavy tables) and/or
//   Supabase once each resolves — via the same DATA_CHANGE_EVENT pub-sub
//   `useLiveStorage` already listens to, so no component needs to change.
//   Because IndexedDB is async, these 4 tables now render an empty array
//   for a brief moment on cold load before real data appears — a disclosed
//   trade-off, not a bug; IndexedDB reads typically settle in milliseconds.
// - `writeSeq` is a per-table write-generation guard: a background fetch
//   (regular or realtime-triggered) that resolves after a newer save has
//   already completed is discarded, so a slow fetch can never revert a
//   just-confirmed save.
// - `remoteResolved` is a second guard specific to racing the LOCAL read
//   against the SUPABASE fetch on first load: without it, "resolves last"
//   and "is authoritative" would be the same thing only by coincidence —
//   IndexedDB is usually fast but isn't guaranteed to win the race (first
//   open() triggers onupgradeneeded; a second tab mid-version-change can
//   block). Once fetchFromSupabase successfully applies a result, the
//   local read is barred from overwriting it even if it resolves after —
//   Supabase stays authoritative whenever it's reachable, exactly as
//   before this change.
// - `reconcile()` is exported but never called automatically from
//   `load()` — it's only invoked from the authenticated admin dashboard
//   (DashboardLayout), so an anonymous public visitor's browser can never
//   win the race and lock auto-seeded placeholder defaults into Supabase.
//   It compares local ids against remote ids and upserts whatever's
//   missing remotely — not just when the table is totally empty.
export function createTableSync({
  table,
  localRead,
  localWrite,
  toRow,
  fromRow,
  notify,
  orderBy = { column: "created_at", ascending: false },
}) {
  let cache = null;
  let writeSeq = 0;
  let fetchStarted = false;
  let realtimeStarted = false;
  let localLoadStarted = false;
  let remoteResolved = false;
  // Settlement tracking for the two concurrent first-load sources (remote
  // fetch + local fallback read) — see evaluateStatus() below, which is the
  // single place that decides "loading" vs "ready" vs "error" from these.
  let remoteSettled = false;
  let localSettled = false;
  let localHasData = false;
  // "idle" (Supabase not configured — local data only, no loading/error UI),
  // "loading" (first-load outcome not known yet), "ready" (something usable
  // is showing — remote succeeded, or remote failed but local fallback has
  // data), "error" (remote failed AND local fallback is empty — the only
  // case that should ever show an error+retry UI). Consumers read this via
  // getStatus()/useLiveStorage to drive a first-load skeleton and a retry
  // UI — see Portfolio.jsx / Plans3D.jsx.
  let status = "idle";

  // The single source of truth for `status`, called after every settlement
  // (remote success/failure, local success/failure). Never regresses out of
  // "ready" — once something usable is on screen, a later background
  // failure (e.g. a realtime-triggered refetch) must not yank it back to an
  // error screen; it just keeps showing the last-known-good cache.
  function evaluateStatus() {
    if (!isSupabaseConnected) return; // local-only mode: stays "idle" forever
    if (status === "ready") return;
    const next =
      remoteResolved || localHasData
        ? "ready"
        : localSettled && remoteSettled
        ? "error"
        : "loading";
    if (next !== status) {
      status = next;
      notify();
    }
  }

  function applyFetchResult(rows, seqAtStart) {
    if (seqAtStart !== writeSeq) return; // stale relative to a newer save — drop it
    cache = rows.map(fromRow);
    remoteResolved = true;
    localWrite(cache); // best-effort mirror, not awaited
    evaluateStatus();
  }

  async function fetchFromSupabase() {
    const seqAtStart = writeSeq;
    // --- temporary debug logging: connection status + exact table name,
    // and (below) the full error or the returned data — remove once the
    // "Impossible de charger" issue is confirmed fixed in production. ---
    console.log(`[supabaseSync:${table}] fetching — isSupabaseConnected=${isSupabaseConnected}, table="${table}"`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .order(orderBy.column, { ascending: orderBy.ascending });
      if (error) throw error;
      console.log(`[supabaseSync:${table}] fetch succeeded — rows:`, data);
      applyFetchResult(data || [], seqAtStart);
    } catch (err) {
      console.log(`[supabaseSync:${table}] fetch FAILED — full error object:`, err);
      console.error(`supabaseSync(${table}): fetch failed, checking local fallback`, err);
      if (seqAtStart === writeSeq) {
        remoteSettled = true;
        evaluateStatus();
      }
    }
  }

  function getStatus() {
    return status;
  }

  function retry() {
    if (!isSupabaseConnected) return;
    // Give immediate feedback (skeleton, not the stale error) even though
    // remoteSettled/localSettled are already true from the failed attempt.
    if (status === "error") {
      status = "loading";
      notify();
    }
    fetchFromSupabase();
  }

  async function loadFromLocal() {
    const seqAtStart = writeSeq;
    try {
      const data = await localRead();
      // Bail if a save already landed, or Supabase already won this load
      // cycle — a slow local read must never clobber a more-authoritative
      // result with stale data.
      if (seqAtStart !== writeSeq || remoteResolved) return;
      if (Array.isArray(data) && data.length) {
        cache = data;
        localHasData = true;
        notify();
      }
    } catch (err) {
      // IndexedDB read itself threw (unavailable/broken) — last resort:
      // legacy localStorage data from before this domain moved to
      // IndexedDB, so a page reload can't make previously-saved content
      // vanish just because the primary read failed.
      console.error(`supabaseSync(${table}): local read failed, falling back to localStorage`, err);
      const legacy = getData(table, null);
      if (seqAtStart === writeSeq && !remoteResolved && Array.isArray(legacy) && legacy.length) {
        cache = legacy;
        localHasData = true;
        notify();
      }
    } finally {
      if (seqAtStart === writeSeq) {
        localSettled = true;
        evaluateStatus();
      }
    }
  }

  function startRealtime() {
    if (realtimeStarted) return;
    realtimeStarted = true;
    try {
      supabase
        .channel(`${table}-changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          fetchFromSupabase();
        })
        .subscribe();
    } catch (err) {
      console.error(`supabaseSync(${table}): realtime subscription failed`, err);
    }
  }

  // Cross-tab parity for the local (IndexedDB) mirror — the native
  // `storage` event only fires for localStorage, so without this, an edit
  // in one tab wouldn't show up live in another while relying on local
  // storage alone (Supabase's realtime channel already covers this when
  // Supabase is reachable).
  onMediaSync((changedKey) => {
    if (changedKey === table) loadFromLocal();
  });

  function load() {
    if (cache === null) {
      cache = [];
      if (!localLoadStarted) {
        localLoadStarted = true;
        loadFromLocal();
      }
    }
    if (isSupabaseConnected && !fetchStarted) {
      fetchStarted = true;
      fetchFromSupabase();
      startRealtime();
    }
    return cache;
  }

  async function save(items) {
    writeSeq += 1;
    remoteResolved = false;
    if (isSupabaseConnected) {
      try {
        const rows = items.map((item, index) => toRow(item, index));
        const { error } = await supabase.from(table).upsert(rows);
        if (error) throw error;

        // upsert alone never deletes — anything present in the previous
        // cache but missing from the new array must be removed server-side.
        const nextIds = new Set(items.map((i) => i.id));
        const removedIds = (cache || []).map((i) => i.id).filter((id) => !nextIds.has(id));
        if (removedIds.length) {
          const { error: delError } = await supabase.from(table).delete().in("id", removedIds);
          if (delError) throw delError;
        }

        cache = items;
        remoteResolved = true;
        localWrite(items); // best-effort mirror, not awaited
        notify();
        return true;
      } catch (err) {
        console.error(`supabaseSync(${table}): save failed, falling back to local storage`, err);
      }
    }
    const ok = await localWrite(items);
    if (ok) {
      // Quota recovery inside localWrite may have trimmed the saved data
      // — re-read so the in-memory cache reflects what actually
      // persisted, not what was requested.
      cache = await localRead();
      notify();
    }
    return ok;
  }

  async function reconcile() {
    if (!isSupabaseConnected) return;
    try {
      const localItems = await localRead();
      if (!Array.isArray(localItems) || localItems.length === 0) return;

      const { data, error } = await supabase.from(table).select("id");
      if (error) throw error;
      const remoteIds = new Set((data || []).map((r) => r.id));
      const missing = localItems.filter((item) => !remoteIds.has(item.id));
      if (missing.length === 0) return;

      const { error: upsertError } = await supabase
        .from(table)
        .upsert(missing.map((item, index) => toRow(item, index)));
      if (upsertError) throw upsertError;
      console.info(`supabaseSync(${table}): reconciled ${missing.length} locally-held row(s) into Supabase`);
      await fetchFromSupabase();
    } catch (err) {
      console.error(`supabaseSync(${table}): reconcile failed`, err);
    }
  }

  return { load, save, migrateIfEmpty: reconcile, getStatus, retry };
}

// Same "sync-looking load(), async background resolve + notify()" shape as
// createTableSync, minus the Supabase branch entirely — for domains with no
// corresponding Supabase table (partners, Excellence slider, hero slides).
// `localRead`/`localWrite` are async (IndexedDB-backed in practice).
export function createLocalMediaSync({ key, defaultValue, localRead, localWrite, notify }) {
  let cache = null;
  let writeSeq = 0;
  let loadStarted = false;

  async function loadFromLocal() {
    const seqAtStart = writeSeq;
    try {
      const data = await localRead();
      if (seqAtStart !== writeSeq) return;
      if (data !== undefined && data !== null) {
        cache = data;
      } else {
        // Nothing stored yet — seed it, mirroring the existing
        // read-with-default-then-persist-default behavior in seedData.js.
        cache = defaultValue;
        localWrite(defaultValue);
      }
      notify();
    } catch (err) {
      // IndexedDB unavailable/broken in this browser — last resort: legacy
      // localStorage data from before this domain moved to IndexedDB, so
      // a reload can't make previously-saved content vanish just because
      // the primary read failed. Only if that's also empty does this
      // degrade to holding the in-memory default for the session (writes
      // then won't durably persist, which is a disclosed trade-off).
      console.error(`localMediaSync(${key}): local read failed, falling back to localStorage`, err);
      const legacy = getData(key, null);
      cache = legacy !== null && legacy !== undefined ? legacy : defaultValue;
      notify();
    }
  }

  onMediaSync((changedKey) => {
    if (changedKey === key) loadFromLocal();
  });

  function load() {
    if (cache === null) {
      cache = defaultValue;
      if (!loadStarted) {
        loadStarted = true;
        loadFromLocal();
      }
    }
    return cache;
  }

  async function save(value) {
    writeSeq += 1;
    try {
      const ok = await localWrite(value);
      if (ok) {
        cache = value;
        notify();
      }
      return ok;
    } catch (err) {
      console.error(`localMediaSync(${key}): save failed`, err);
      return false;
    }
  }

  return { load, save };
}
