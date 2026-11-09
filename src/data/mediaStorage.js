import { getSupabase, isSupabaseConnected } from "../supabase";

const BUCKET = "cia-media";

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function safeName(file) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${stamp}.${ext}`;
}

// Uploads to Supabase Storage and returns its public URL; falls back to the
// existing base64 data-URL flow (unchanged) when Supabase isn't configured
// or the upload fails for any reason, so callers can treat the resolved
// value as "just a string to store" either way — no UI changes needed at
// the call sites beyond awaiting this instead of using FileReader inline.
export async function uploadMedia(file, folder) {
  if (isSupabaseConnected) {
    try {
      const supabase = await getSupabase();
      const path = `${folder}/${safeName(file)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    } catch (err) {
      console.error(`uploadMedia: Supabase Storage upload failed, falling back to base64 (${folder})`, err);
    }
  }
  return readAsDataURL(file);
}
