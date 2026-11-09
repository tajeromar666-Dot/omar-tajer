// The Supabase SDK (the largest dependency of the public site) is never
// part of the initial bundle: getSupabase() loads it with a dynamic
// import() once the first paint is done and the browser is idle, then
// creates the client once and shares it. Every caller already treats
// Supabase as asynchronous with a local fallback, so pages render from
// localStorage/IndexedDB first and refresh from Supabase in the background.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient throws synchronously if given anything that isn't a real
// http(s) URL — so with placeholder .env values (the default until a real
// project is configured) it would crash the app. Validate first and only
// ever construct the client when it's safe to.
const isValid = !!supabaseUrl && supabaseUrl.startsWith("https://") && !!supabaseKey;

export const isSupabaseConnected = isValid;

let clientPromise = null;

function afterFirstPaintIdle() {
  return new Promise((resolve) => {
    const idle = () =>
      window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 200);
    requestAnimationFrame(() => setTimeout(idle, 0));
    // rAF never fires in a background tab — don't wait forever there.
    setTimeout(resolve, 3000);
  });
}

export function getSupabase() {
  if (!isValid) return Promise.reject(new Error("Supabase is not configured"));
  if (!clientPromise) {
    clientPromise = afterFirstPaintIdle()
      .then(() => import("@supabase/supabase-js"))
      .then(({ createClient }) => createClient(supabaseUrl, supabaseKey));
    // A failed chunk download must not poison every later call.
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}
