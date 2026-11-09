import { useState } from "react";
import { loadAdminCredentials, saveAdminCredentials } from "../data/seedData";
import { getSupabase, isSupabaseConnected } from "../supabase";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icons";

export default function SecurityPanel() {
  const { authSource } = useAuth();
  const [currentEmail, setCurrentEmail] = useState(() => loadAdminCredentials().email);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetFields(nextEmail) {
    setCurrentEmail(nextEmail);
    setNewEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newEmail.trim() && !newPassword) {
      setError("Renseignez un nouvel email et/ou un nouveau mot de passe.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    setSubmitting(true);

    // A real Supabase Auth session changes credentials via updateUser,
    // re-verifying the current password with a fresh sign-in first (Supabase
    // itself has no local credentials table to check against). Falls back
    // to the legacy local comparison/save when not using a Supabase session.
    if (isSupabaseConnected && authSource === "supabase") {
      try {
        const supabase = await getSupabase();
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });
        if (reauthError) {
          setError("Email ou mot de passe actuel incorrect.");
          setSubmitting(false);
          return;
        }
        const updates = {};
        if (newEmail.trim()) updates.email = newEmail.trim();
        if (newPassword) updates.password = newPassword;
        const { data, error: updateError } = await supabase.auth.updateUser(updates);
        setSubmitting(false);
        if (updateError) {
          console.error("SecurityPanel: Supabase updateUser failed", updateError);
          setError("Échec de l'enregistrement.");
          return;
        }
        setSuccess("Identifiants mis à jour avec succès.");
        resetFields(data.user.email);
      } catch (err) {
        console.error("SecurityPanel: Supabase updateUser failed", err);
        setError("Échec de l'enregistrement.");
        setSubmitting(false);
      }
      return;
    }

    const stored = loadAdminCredentials();
    if (
      currentEmail.trim().toLowerCase() !== stored.email.toLowerCase() ||
      currentPassword !== stored.password
    ) {
      setError("Email ou mot de passe actuel incorrect.");
      setSubmitting(false);
      return;
    }

    const next = {
      email: newEmail.trim() ? newEmail.trim() : stored.email,
      password: newPassword ? newPassword : stored.password,
    };
    const ok = saveAdminCredentials(next);
    setSubmitting(false);
    if (!ok) {
      setError("Échec de l'enregistrement.");
      return;
    }

    setSuccess("Identifiants mis à jour avec succès.");
    resetFields(next.email);
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Sécurité / Accès Admin</h3>
      </div>

      {error && (
        <div className="error-text">
          <Icon name="alertCircle" size={14} /> {error}
        </div>
      )}
      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="form-group">
            <label>Email actuel</label>
            <input
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Mot de passe actuel *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Requis pour confirmer le changement"
            />
          </div>
        </div>

        <div className="field-grid">
          <div className="form-group">
            <label>Nouvel email (optionnel)</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>
          <div className="form-group">
            <label>Nouveau mot de passe (optionnel)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Requis si un nouveau mot de passe est saisi"
          />
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn--secondary btn--sm" disabled={submitting}>
            <Icon name="lock" size={16} /> {submitting ? "Enregistrement..." : "Mettre à jour les identifiants"}
          </button>
        </div>
      </form>
    </div>
  );
}
