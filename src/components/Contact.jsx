import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  LEGAL_INFO_FIELDS,
  loadLegalInfo,
  loadLocations,
  loadMaps,
  loadMessages,
  loadSettings,
  loadVisibility,
  saveMessages,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import "../styles/sections.css";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };
const tel = (n) => `tel:${n.replace(/\s/g, "")}`;

function Field({ id, label, error, children }) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const [settings] = useLiveStorage(loadSettings);
  const [maps] = useLiveStorage(loadMaps);
  const [locations] = useLiveStorage(loadLocations);
  const [legalInfo] = useLiveStorage(loadLegalInfo);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("contact");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const activeLocations = locations.filter((l) => l.active);
  const activeLegalFields = LEGAL_INFO_FIELDS.filter(
    (f) => legalInfo[f.key]?.enabled && legalInfo[f.key]?.value?.trim()
  );

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

  const inputProps = (field) => ({
    id: field,
    value: form[field],
    onChange: (e) => update(field, e.target.value),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <section id="contact" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.contact.tag}
          titleA={t.contact.titleA}
          accent={t.contact.titleAccent}
          titleB={t.contact.titleB}
          subtitle={t.contact.subtitle}
        />

        <div className="contact">
          <Reveal className="contact__info">
            <div className="info card">
              <span className="icon-chip">
                <Icon name="mapPin" size={20} />
              </span>
              <div>
                <h3>{t.contact.addressLabel}</h3>
                <p>{settings.address}</p>
              </div>
            </div>
            <div className="info card">
              <span className="icon-chip">
                <Icon name="phone" size={20} />
              </span>
              <div>
                <h3>{t.contact.phoneLabel}</h3>
                {settings.phone1 && <a href={tel(settings.phone1)}>{settings.phone1}</a>}
                {settings.phone2 && <a href={tel(settings.phone2)}>{settings.phone2}</a>}
              </div>
            </div>
            <div className="info card">
              <span className="icon-chip">
                <Icon name="mail" size={20} />
              </span>
              <div>
                <h3>{t.contact.emailLabel}</h3>
                {settings.email1 && <a href={`mailto:${settings.email1}`}>{settings.email1}</a>}
                {settings.email2 && <a href={`mailto:${settings.email2}`}>{settings.email2}</a>}
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
              <p className="legal">
                {activeLegalFields.map((f) => (
                  <span key={f.key}>
                    <strong>{f.label}</strong> {legalInfo[f.key].value}
                  </span>
                ))}
              </p>
            )}
          </Reveal>

          <Reveal className="contact__form card" delay={1}>
            {sent && (
              <div className="form-success" role="status">
                <Icon name="checkCircle" size={20} /> {t.contact.successMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-row">
                <Field id="name" label={t.contact.formNameLabel} error={errors.name}>
                  <input type="text" autoComplete="name" placeholder={t.contact.formNamePlaceholder} {...inputProps("name")} />
                </Field>
                <Field id="phone" label={t.contact.formPhoneLabel} error={errors.phone}>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t.contact.formPhonePlaceholder}
                    {...inputProps("phone")}
                  />
                </Field>
              </div>
              <Field id="email" label={t.contact.formEmailLabel} error={errors.email}>
                <input type="email" autoComplete="email" placeholder={t.contact.formEmailPlaceholder} {...inputProps("email")} />
              </Field>
              <Field id="message" label={t.contact.formMessageLabel} error={errors.message}>
                <textarea rows={5} placeholder={t.contact.formMessagePlaceholder} {...inputProps("message")} />
              </Field>
              <button type="submit" className="btn btn--primary btn--block btn--lg">
                {t.contact.submitBtn} <Icon name="send" size={16} className="btn__arrow" />
              </button>
            </form>
          </Reveal>
        </div>

        {activeLocations.length > 0 && (
          <div className="locations">
            <Reveal as="h3" className="locations__title">
              {t.contact.locationsTitle}
            </Reveal>
            <div className="locations__grid">
              {activeLocations.map((l, i) => (
                <Reveal key={l.id} delay={i % 3}>
                  <article className="location card">
                    <div className="location__body">
                      <h4>{l.name}</h4>
                      {l.address && (
                        <p>
                          <Icon name="mapPin" size={15} /> {l.address}
                        </p>
                      )}
                      {l.phone && (l.showPhone ?? true) && (
                        <p>
                          <Icon name="phone" size={15} /> <a href={tel(l.phone)}>{l.phone}</a>
                        </p>
                      )}
                      {l.email && (l.showEmail ?? true) && (
                        <p>
                          <Icon name="mail" size={15} /> <a href={`mailto:${l.email}`}>{l.email}</a>
                        </p>
                      )}
                    </div>
                    {l.mapUrl && (l.showMap ?? true) && (
                      <div className="location__map">
                        <iframe title={l.name} src={l.mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
