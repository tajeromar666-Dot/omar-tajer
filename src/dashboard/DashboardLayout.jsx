import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { runMigrations } from "../data/seedData";
import { isSupabaseConnected } from "../supabase";
import Sidebar from "./Sidebar";
import Icon from "../components/Icons";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // One-time "seed Supabase from localStorage if the table is still empty"
  // migration — only ever runs from here, behind the authenticated route
  // guard, so an anonymous public visitor's browser can never trigger it.
  useEffect(() => {
    runMigrations();
  }, []);

  return (
    <div className="dashboard">
      <div
        className={`navbar__mobile-overlay ${mobileOpen ? "open" : ""}`}
        style={{ zIndex: 1499 }}
        onClick={() => setMobileOpen(false)}
      />
      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <main className="dashboard__main">
        <button
          className="btn-icon"
          style={{ display: "none", marginBottom: 16 }}
          id="mobile-sidebar-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Icon name="menu" size={18} />
        </button>
        {!isSupabaseConnected && (
          <div className="supabase-warning-banner">
            <Icon name="alertCircle" size={16} />
            Supabase non configuré — données sauvegardées en localStorage
            uniquement. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
            dans le fichier .env puis redémarrez le serveur.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
