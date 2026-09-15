import { isSupabaseConnected } from "../supabase";

// TEMPORARY diagnostic — remove once live Supabase sync is confirmed working.
// Shows, directly on the deployed public site, whether this build actually
// has valid Supabase env vars baked in (isSupabaseConnected) or is silently
// running on the local/IndexedDB fallback.
export default function SupabaseDebugBadge() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        zIndex: 99999,
        padding: "6px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: "monospace",
        color: "#fff",
        background: isSupabaseConnected ? "#1a7f37" : "#b42318",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        pointerEvents: "none",
      }}
    >
      Supabase: {isSupabaseConnected ? "CONNECTED" : "LOCAL FALLBACK"}
    </div>
  );
}
