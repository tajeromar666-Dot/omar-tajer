import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  LEGAL_INFO_FIELDS,
  loadColorOverrides,
  loadLegalInfo,
  loadLocations,
  loadMaps,
  loadMessages,
  loadSectionThemes,
  loadSettings,
  loadVisibility,
  saveMessages,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };

export default function Contact() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [settings] = useState(loadSettings());
  const [maps] = useLiveStorage(loadMaps);
  const [locations] = useLiveStorage(loadLocations);
  const [legalInfo] = useLiveStorage(loadLegalInfo);
  const activeLocations = locations.filter((l) => l.active);
  const activeLegalFields = LEGAL_INFO_FIELDS.filter(
    (f) => legalInfo[f.key]?.enabled && legalInfo[f.key]?.value?.trim()
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = t.contact.errorNameRequired;
    if (!form.email.trim()) errs.email = t.contact.errorEmailRequired;
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t.contact.errorEmailInvalid;
    if (!form.phone.trim()) errs.phone = t.contact.errorPhoneRequired;
    if (!form.message.trim()) errs.message = t.contact.errorMessageRequired;
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const messages = loadMessages();
    const newMessage = {
      id: `m_${Date.now()}`,
      ...form,
      date: new Date().toISOString(),
      read: false,
    };
    saveMessages([newMessage, ...messages]);
    setForm(EMPTY_FORM);
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  }

  if (!visibility.contact) return null;

  return (
    <section id="contact" className="section" ref={ref} style={sectionThemeStyle(sectionThemes, "contact", colorOverrides)}>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.contact.tag}</span>
          <h2 className="section-title">
            {t.contact.titleA} <span>{t.contact.titleAccent}</span> {t.contact.titleB}
          </h2>
          <p className="section-subtitle">{t.contact.subtitle}</p>
        </div>

        <div className="contact__grid">
          <div className="reveal">
            <div className="contact-info__item">
              <span className="contact-info__icon">
                <Icon name="mapPin" size={20} />
              </span>
              <div>
                <h4>{t.contact.addressLabel}</h4>
                <p>{settings.address}</p>
              </div>
            </div>
            <div className="contact-info__item">
              <span className="contact-info__icon">
                <Icon name="phone" size={20} />
              </span>
              <div>
                <h4>{t.contact.phoneLabel}</h4>
                <a href={`tel:${settings.phone1.replace(/\s/g, "")}`}>
                  {settings.phone1}
                </a>
                <a href={`tel:${settings.phone2.replace(/\s/g, "")}`}>
                  {settings.phone2}
                </a>
              </div>
            </div>
            <div className="contact-info__item">
              <span className="contact-info__icon">
                <Icon name="mail" size={20} />
              </span>
              <div>
                <h4>{t.contact.emailLabel}</h4>
                <a href={`mailto:${settings.email1}`}>{settings.email1}</a>
                <a href={`mailto:${settings.email2}`}>{settings.email2}</a>
              </div>
            </div>

            {maps.enabled && maps.embedUrl && (
              <div className="contact__map">
                <iframe
                  title="CIA — Mediouna, Casablanca"
                  src={maps.embedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {activeLegalFields.length > 0 && (
              <div className="legal-info">
                {activeLegalFields.map((f) => (
                  <span key={f.key}>
                    <strong>{f.label}:</strong> {legalInfo[f.key].value}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="contact-form reveal reveal-delay-1">
            {sent && <div className="form-success">{t.contact.successMessage}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t.contact.formNameLabel}</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t.contact.formNamePlaceholder}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">{t.contact.formPhoneLabel}</label>
                  <input
                    id="phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder={t.contact.formPhonePlaceholder}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">{t.contact.formEmailLabel}</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder={t.contact.formEmailPlaceholder}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">{t.contact.formMessageLabel}</label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={t.contact.formMessagePlaceholder}
                />
                {errors.message && (
                  <span className="form-error">{errors.message}</span>
                )}
              </div>

              <button type="submit" className="btn btn--primary btn--block">
                {t.contact.submitBtn} <Icon name="send" size={16} />
              </button>
            </form>
          </div>
        </div>

        {activeLocations.length > 0 && (
          <div className="locations-block reveal">
            <h3 className="locations-block__title">{t.contact.locationsTitle}</h3>
            <div className="locations-grid">
              {activeLocations.map((l) => (
                <div className="location-card" key={l.id}>
                  <div className="location-card__body">
                    <h4>{l.name}</h4>
                    {l.address && (
                      <p>
                        <Icon name="mapPin" size={15} /> {l.address}
                      </p>
                    )}
                    {l.phone && (l.showPhone ?? true) && (
                      <p>
                        <Icon name="phone" size={15} />{" "}
                        <a href={`tel:${l.phone.replace(/\s/g, "")}`}>{l.phone}</a>
                      </p>
                    )}
                    {l.email && (l.showEmail ?? true) && (
                      <p>
                        <Icon name="mail" size={15} />{" "}
                        <a href={`mailto:${l.email}`}>{l.email}</a>
                      </p>
                    )}
                  </div>
                  {l.mapUrl && (l.showMap ?? true) && (
                    <div className="location-card__map">
                      <iframe
                        title={l.name}
                        src={l.mapUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
