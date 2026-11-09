import { createContext, useContext, useEffect, useRef, useState } from "react";
import { loadAdminCredentials, STORAGE_KEYS } from "../data/seedData";
import { getSupabase, isSupabaseConnected } from "../supabase";

const AuthContext = createContext(null);

// Guards both the initial session check and sign-in against a hung network
// call — without this, a paused/unreachable Supabase project could block
// `ready` forever and lock the admin out of their own dashboard, which is a
// worse failure mode than a normal rejected login.
const AUTH_TIMEOUT_MS = 6000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase auth timed out")), ms)),
  ]);
}

function readLocalSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.auth);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.isAuthenticated ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authSource, setAuthSource] = useState(null); // 'supabase' | 'local' | null
  // onAuthStateChange's listener closure is set up once on mount, so it can
  // never see later `authSource` state updates directly — this ref is kept
  // in sync alongside the state so that closure always reads the current
  // value instead of the one captured at mount time.
  const authSourceRef = useRef(null);

  function setSource(value) {
    authSourceRef.current = value;
    setAuthSource(value);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isSupabaseConnected) {
        try {
          const { data, error } = await withTimeout(
            getSupabase().then((supabase) => supabase.auth.getSession()),
            AUTH_TIMEOUT_MS
          );
          if (!cancelled && !error && data?.session) {
            setUser({ email: data.session.user.email });
            setSource("supabase");
            setReady(true);
            return;
          }
        } catch (err) {
          console.error(
            "AuthContext: getSession failed/unreachable, falling back to local session",
            err
          );
        }
      }
      if (!cancelled) {
        const localSession = readLocalSession();
        if (localSession) {
          setUser({ email: localSession.email });
          setSource("local");
        }
        setReady(true);
      }
    }

    init();

    let subscription;
    if (isSupabaseConnected) {
      // Subscribed once the (lazily loaded) client is ready.
      getSupabase().then((supabase) => {
        if (cancelled) return;
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            setUser({ email: session.user.email });
            setSource("supabase");
          } else if (authSourceRef.current === "supabase") {
            // Only clear if the current session actually came from
            // Supabase — an event firing while on the local fallback path
            // must not wipe a valid local session.
            setUser(null);
            setSource(null);
          }
        });
        subscription = data?.subscription;
      }).catch((err) => {
        console.error("AuthContext: onAuthStateChange subscription failed", err);
      });
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    if (isSupabaseConnected) {
      try {
        const { data, error } = await withTimeout(
          getSupabase().then((supabase) => supabase.auth.signInWithPassword({ email, password })),
          AUTH_TIMEOUT_MS
        );
        if (!error && data?.session) {
          setUser({ email: data.user.email });
          setSource("supabase");
          return true;
        }
        // Supabase responded but didn't hand back a session — could be a
        // genuinely wrong password, but could just as easily be a
        // misconfigured/invalid project key (indistinguishable from here,
        // and the current admin-credentials workflow in Sécurité / Accès
        // Admin must keep working either way) — fall through to the local
        // check rather than hard-failing.
        if (error) {
          console.error(
            "AuthContext: Supabase sign-in rejected, falling back to local credentials",
            error
          );
        }
      } catch (err) {
        // Network/unreachable/timeout — Supabase configured but not
        // actually working right now; fall through to the local check.
        console.error(
          "AuthContext: signInWithPassword unreachable, falling back to local credentials",
          err
        );
      }
    }

    // Local fallback — always available, so admin credentials managed via
    // Sécurité / Accès Admin (localStorage) keep working regardless of
    // Supabase's configuration state.
    const credentials = loadAdminCredentials();
    if (
      email.trim().toLowerCase() === credentials.email.toLowerCase() &&
      password === credentials.password
    ) {
      const session = { isAuthenticated: true, email: credentials.email };
      localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(session));
      setUser({ email: credentials.email });
      setSource("local");
      return true;
    }
    return false;
  }

  async function logout() {
    if (isSupabaseConnected && authSourceRef.current === "supabase") {
      try {
        const supabase = await getSupabase();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("AuthContext: signOut failed", err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.auth);
    setUser(null);
    setSource(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, ready, authSource, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
