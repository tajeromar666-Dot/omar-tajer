import { useState } from "react";
import {
  loadMaps,
  loadSettings,
  loadSocial,
  saveMaps,
  saveSettings,
  saveSocial,
} from "../data/seedData";
import Icon from "../components/Icons";
import VisibilityPanel from "./VisibilityPanel";
import SecurityPanel from "./SecurityPanel";
import LocationsPanel from "./LocationsPanel";
import SectionColorsPanel from "./SectionColorsPanel";
import SpacingPanel from "./SpacingPanel";
import WhatsAppPanel from "./WhatsAppPanel";
import LanguagesPanel from "./LanguagesPanel";
import LegalInfoPanel from "./LegalInfoPanel";
import StoragePanel from "./StoragePanel";

const SOCIAL_NETWORKS = [
  { key: "facebook", label: "Facebook", icon: "facebook", field: "url", placeholder: "https://facebook.com/..." },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin", field: "url", placeholder: "https://linkedin.com/company/..." },
  { key: "instagram", label: "Instagram", icon: "instagram", field: "url", placeholder: "https://instagram.com/..." },
  { key: "whatsapp", label: "WhatsApp", icon: "whatsapp", field: "number", placeholder: "06 61 52 70 69" },
];

export default function SettingsTab() {
  const [form, setForm] = useState(loadSettings());
  const [social, setSocial] = useState(loadSocial());
  const [maps, setMaps] = useState(loadMaps());
  const [toast, setToast] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateSocial(network, field, value) {
    setSocial((s) => ({ ...s, [network]: { ...s[network], [field]: value } }));
  }

  function updateMaps(field, value) {
    setMaps((m) => ({ ...m, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await saveSettings(form);
    saveSocial(social);
    saveMaps(maps);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Paramètres</h1>
          <p>Modifiez les informations de l'entreprise affichées sur le site.</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="panel">
          <div className="panel__header">
            <h3>Informations de l'entreprise</h3>
          </div>

          <div className="form-group">
            <label>Nom de l'entreprise</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Responsable</label>
            <input
              type="text"
              value={form.responsable}
              onChange={(e) => update("responsable", e.target.value)}
            />
          </div>

          <div className="field-grid">
            <div className="form-group">
              <label>Téléphone 1</label>
              <input
                type="text"
                value={form.phone1}
                onChange={(e) => update("phone1", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Téléphone 2</label>
              <input
                type="text"
                value={form.phone2}
                onChange={(e) => update("phone2", e.target.value)}
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="form-group">
              <label>Email 1</label>
              <input
                type="email"
                value={form.email1}
                onChange={(e) => update("email1", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email 2</label>
              <input
                type="email"
                value={form.email2}
                onChange={(e) => update("email2", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
        </div>

        <p className="field-hint">
          Le titre et le sous-titre affichés en page d'accueil se gèrent
          maintenant diapositive par diapositive dans l'onglet "Hero".
        </p>

        <div className="panel">
          <div className="panel__header">
            <h3>Réseaux Sociaux</h3>
          </div>
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
            Activez un réseau pour afficher son icône flottante et son lien
            dans le pied de page du site public.
          </p>

          {SOCIAL_NETWORKS.map((net) => (
            <div className="social-row" key={net.key}>
              <span className="social-row__icon">
                <Icon name={net.icon} size={18} />
              </span>
              <div className="social-row__field">
                <label>{net.label}</label>
                <input
                  type="text"
                  value={social[net.key][net.field]}
                  onChange={(e) => updateSocial(net.key, net.field, e.target.value)}
                  placeholder={net.placeholder}
                />
              </div>
              <label
                className="toggle-switch"
                onClick={() => updateSocial(net.key, "enabled", !social[net.key].enabled)}
              >
                <span className={`toggle-switch__track ${social[net.key].enabled ? "on" : ""}`}>
                  <span className="toggle-switch__thumb" />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel__header">
            <h3>Localisation / Maps</h3>
          </div>

          <div className="form-group">
            <label
              className="toggle-switch"
              onClick={() => updateMaps("enabled", !maps.enabled)}
            >
              <span className={`toggle-switch__track ${maps.enabled ? "on" : ""}`}>
                <span className="toggle-switch__thumb" />
              </span>
              Afficher la carte dans la section Contact
            </label>
          </div>

          <div className="form-group">
            <label>URL d'intégration Google Maps (iframe src)</label>
            <input
              type="text"
              value={maps.embedUrl}
              onChange={(e) => updateMaps("embedUrl", e.target.value)}
              placeholder="https://www.google.com/maps?q=...&output=embed"
              disabled={!maps.enabled}
            />
          </div>
          <p className="field-hint">
            Lorsque désactivée, seule l'adresse en texte reste visible dans la
            section Contact.
          </p>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn--secondary">
            <Icon name="checkCircle" size={16} /> Enregistrer les modifications
          </button>
        </div>
      </form>

      <VisibilityPanel />
      <SectionColorsPanel />
      <SpacingPanel />
      <WhatsAppPanel />
      <LegalInfoPanel />
      <LanguagesPanel />
      <LocationsPanel />
      <StoragePanel />
      <SecurityPanel />

      {toast && (
        <div className="save-toast">
          <Icon name="checkCircle" size={16} /> Paramètres enregistrés avec succès.
        </div>
      )}
    </div>
  );
}
