import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient throws synchronously if given anything that isn't a real
// http(s) URL — so with placeholder .env values (the default until a real
// project is configured) it would crash the whole app at import time.
// Validate first and only ever construct the client when it's safe to.
const isValid = !!supabaseUrl && supabaseUrl.startsWith("https://") && !!supabaseKey;

export const isSupabaseConnected = isValid;

export const supabase = isValid ? createClient(supabaseUrl, supabaseKey) : null;
