import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CIA_LOGO } from "../assets/logos";
import { loadSettings } from "../data/seedData";
import Icon from "../components/Icons";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [settings] = useState(loadSettings);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      navigate("/admin");
    } else {
      setError("Email ou mot de passe incorrect.");
    }
  }

  return (
    <div className="login-page steel-texture-dark">
      <div className="login-card">
        <div className="login-card__logo">
          <img src={settings.logo || CIA_LOGO} alt="CIA" />
        </div>
        <h2>Espace Administration</h2>
        <p className="subtitle">Connectez-vous pour gérer le contenu du site</p>

        {error && (
          <div className="error-text">
            <Icon name="alertCircle" size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cia.ma"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn--secondary btn--block" disabled={submitting}>
            <Icon name="lock" size={16} /> {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <a href="/" className="back-home">
          <Icon name="arrowRight" size={14} /> Retour au site
        </a>
      </div>
    </div>
  );
}
