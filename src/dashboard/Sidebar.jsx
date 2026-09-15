import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CIA_LOGO } from "../assets/logos";
import { loadSettings } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "../components/Icons";

const LINKS = [
  { to: "/admin", label: "Vue d'ensemble", icon: "grid", end: true },
  { to: "/admin/projets", label: "Projets", icon: "folder" },
  { to: "/admin/messages", label: "Messages", icon: "mail" },
  { to: "/admin/apparence", label: "Apparence", icon: "palette" },
  { to: "/admin/hero", label: "Hero", icon: "layers" },
  { to: "/admin/apropos", label: "À Propos", icon: "building" },
  { to: "/admin/services", label: "Services", icon: "tool" },
  { to: "/admin/plans3d", label: "Plans 3D", icon: "cube" },
  { to: "/admin/excellence", label: "Excellence", icon: "award" },
  { to: "/admin/partenaires", label: "Partenaires", icon: "handshake" },
  { to: "/admin/temoignages", label: "Témoignages", icon: "thumbsUp" },
  { to: "/admin/equipe", label: "Équipe", icon: "users" },
  { to: "/admin/parametres", label: "Paramètres", icon: "gear" },
];

export default function Sidebar({ onNavigate, open }) {
  const { logout } = useAuth();
  const [settings] = useLiveStorage(loadSettings);

  return (
    <aside className={`dashboard__sidebar ${open ? "open" : ""}`}>
      <div className="sidebar__logo">
        <img src={settings.logo || CIA_LOGO} alt="CIA" />
        <span>Administration</span>
      </div>

      <nav className="sidebar__nav">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
            onClick={onNavigate}
          >
            <Icon name={l.icon} size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__logout">
        <button className="sidebar__link" onClick={logout} style={{ width: "100%" }}>
          <Icon name="logout" size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
