import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadMessages, loadProjects, SERVICE_CATEGORIES } from "../data/seedData";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icons";

export default function Overview() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setProjects(loadProjects());
    setMessages(loadMessages());
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;
  const featuredCount = projects.filter((p) => p.featured).length;

  const stats = [
    {
      label: "Projets publiés",
      value: projects.length,
      icon: "folder",
      color: "blue",
    },
    {
      label: "Messages reçus",
      value: messages.length,
      icon: "mail",
      color: "red",
    },
    {
      label: "Services proposés",
      value: SERVICE_CATEGORIES.length,
      icon: "tool",
      color: "yellow",
    },
    {
      label: "Projets en vedette",
      value: featuredCount,
      icon: "award",
      color: "dark",
    },
  ];

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Vue d'ensemble</h1>
          <p>Bienvenue, {user?.email} — voici l'état actuel du site.</p>
        </div>
      </div>

      <div className="stat-cards">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <span className={`stat-card__icon stat-card__icon--${s.color}`}>
              <Icon name={s.icon} size={22} />
            </span>
            <div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Derniers messages</h3>
          <Link to="/admin/messages" className="btn btn--secondary btn--sm">
            Voir tout <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        {messages.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)" }}>
            Aucun message reçu pour le moment.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Statut</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.slice(0, 5).map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className={`badge ${m.read ? "badge--gray" : "badge--blue"}`}>
                        {m.read ? "Lu" : "Non lu"}
                      </span>
                    </td>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{new Date(m.date).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Derniers projets</h3>
          <Link to="/admin/projets" className="btn btn--secondary btn--sm">
            Gérer <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Année</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images?.[0] ? (
                      <img className="table-thumb" src={p.images[0]} alt={p.title} />
                    ) : (
                      <span className="table-thumb table-thumb--icon">
                        <Icon name="video" size={16} />
                      </span>
                    )}
                  </td>
                  <td>{p.title}</td>
                  <td>
                    <span className="badge badge--blue">{p.category}</span>
                  </td>
                  <td>{p.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
