import { CIA_LOGO } from "../assets/logos";
import { useLanguage } from "../context/LanguageContext.jsx";
import { LEGAL_INFO_FIELDS, loadLegalInfo, loadServices, loadSettings, loadSocial, loadVisibility } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import { whatsappHref } from "./SocialFloating";
import "../styles/sections.css";

const SOCIAL_ICONS = [
  { key: "facebook", icon: "facebook", getHref: (s) => s.facebook.url },
  { key: "linkedin", icon: "linkedin", getHref: (s) => s.linkedin.url },
  { key: "instagram", icon: "instagram", getHref: (s) => s.instagram.url },
  { key: "whatsapp", icon: "whatsapp", getHref: (s) => whatsappHref(s.whatsapp.number) },
];

const QUICK_LINKS = [
  { href: "#hero", key: "home", section: "hero" },
  { href: "#about", key: "about", section: "about" },
  { href: "#services", key: "services", section: "services" },
  { href: "#plans3d", key: "plans3d", section: "plans3d" },
  { href: "#portfolio", key: "portfolio", section: "portfolio" },
  { href: "#temoignages", key: "testimonials", section: "temoignages" },
  { href: "#team", key: "team", section: "team" },
  { href: "#contact", key: "contact", section: "contact" },
];

export default function Footer() {
  const { t } = useLanguage();
  const [settings] = useLiveStorage(loadSettings);
  const [services] = useLiveStorage(loadServices);
  const [social] = useLiveStorage(loadSocial);
  const [legalInfo] = useLiveStorage(loadLegalInfo);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("footer");
  const logo = settings.logo || CIA_LOGO;
  const year = new Date().getFullYear();
  const activeLegalFields = LEGAL_INFO_FIELDS.filter(
    (f) => legalInfo[f.key]?.enabled && legalInfo[f.key]?.value?.trim()
  );
  const activeSocial = SOCIAL_ICONS.filter((s) => {
    const entry = social[s.key];
    const hasValue = s.key === "whatsapp" ? entry.number.trim() : entry.url.trim();
    return entry.enabled && hasValue;
  });

  return (
    <footer id="site-footer" className="footer" style={themeStyle}>
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src={logo} alt="CIA — Construction Industrielle Africaine" className="footer__logo" width="160" height="65" loading="lazy" />
            <p>{t.footer.about}</p>
            {activeSocial.length > 0 && (
              <div className="footer__social">
                {activeSocial.map((s) => (
                  <a key={s.key} href={s.getHref(social)} target="_blank" rel="noreferrer noopener" aria-label={s.key}>
                    <Icon name={s.icon} size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label={t.footer.quickLinks}>
            <h4>{t.footer.quickLinks}</h4>
            <ul className="footer__links">
              {QUICK_LINKS.filter((l) => visibility[l.section] !== false).map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{t.nav[l.key]}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4>{t.footer.servicesTitle}</h4>
            <ul className="footer__links">
              {services.map((s) => (
                <li key={s.id}>
                  <a href="#services">{s.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t.footer.contactTitle}</h4>
            <ul className="footer__contact">
              {settings.address && (
                <li>
                  <Icon name="mapPin" size={16} /> <span>{settings.address}</span>
                </li>
              )}
              {[settings.phone1, settings.phone2].filter(Boolean).map((p) => (
                <li key={p}>
                  <Icon name="phone" size={16} /> <a href={`tel:${p.replace(/\s/g, "")}`}>{p}</a>
                </li>
              ))}
              {settings.email1 && (
                <li>
                  <Icon name="mail" size={16} /> <a href={`mailto:${settings.email1}`}>{settings.email1}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {activeLegalFields.length > 0 && (
          <div className="footer__legal">
            {activeLegalFields.map((f) => (
              <span key={f.key}>
                {f.label}: {legalInfo[f.key].value}
              </span>
            ))}
          </div>
        )}

        <div className="footer__bottom">
          <span>
            © {year} CIA — Construction Industrielle Africaine. {t.footer.copyright}
          </span>
          <a href="/admin/login" rel="nofollow">
            {t.footer.adminLink}
          </a>
        </div>
      </div>
    </footer>
  );
}
