import { CIA_LOGO } from "../assets/logos";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  LEGAL_INFO_FIELDS,
  loadColorOverrides,
  loadLegalInfo,
  loadSectionThemes,
  loadServices,
  loadSettings,
  loadSocial,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";
import { whatsappHref } from "./SocialFloating";

const SOCIAL_ICONS = [
  { key: "facebook", icon: "facebook", getHref: (s) => s.facebook.url },
  { key: "linkedin", icon: "linkedin", getHref: (s) => s.linkedin.url },
  { key: "instagram", icon: "instagram", getHref: (s) => s.instagram.url },
  { key: "whatsapp", icon: "whatsapp", getHref: (s) => whatsappHref(s.whatsapp.number) },
];

export default function Footer() {
  const { t } = useLanguage();
  const [settings] = useLiveStorage(loadSettings);
  const [services] = useLiveStorage(loadServices);
  const [social] = useLiveStorage(loadSocial);
  const [legalInfo] = useLiveStorage(loadLegalInfo);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const logo = settings.logo || CIA_LOGO;
  const year = new Date().getFullYear();
  const activeLegalFields = LEGAL_INFO_FIELDS.filter(
    (f) => legalInfo[f.key]?.enabled && legalInfo[f.key]?.value?.trim()
  );

  const quickLinks = [
    { href: "#hero", label: t.nav.home },
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#plans3d", label: t.nav.plans3d },
    { href: "#portfolio", label: t.nav.portfolio },
    { href: "#temoignages", label: t.nav.testimonials },
    { href: "#team", label: t.nav.team },
    { href: "#contact", label: t.nav.contact },
  ];

  const activeSocial = SOCIAL_ICONS.filter((s) => {
    const entry = social[s.key];
    const hasValue = s.key === "whatsapp" ? entry.number.trim() : entry.url.trim();
    return entry.enabled && hasValue;
  });

  return (
    <footer className="footer" style={sectionThemeStyle(sectionThemes, "footer", colorOverrides)}>
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__logo">
              <img src={logo} alt="CIA — Construction Industrielle Africaine" />
            </div>
            <p className="footer__about">{t.footer.about}</p>
            {activeSocial.length > 0 && (
              <div className="footer__social">
                {activeSocial.map((s) => (
                  <a
                    key={s.key}
                    href={s.getHref(social)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.key}
                  >
                    <Icon name={s.icon} size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4>{t.footer.quickLinks}</h4>
            <ul className="footer__links">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

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
              <li>
                <Icon name="mapPin" size={16} /> {settings.address}
              </li>
              <li>
                <Icon name="phone" size={16} /> {settings.phone1}
              </li>
              <li>
                <Icon name="phone" size={16} /> {settings.phone2}
              </li>
              <li>
                <Icon name="mail" size={16} /> {settings.email1}
              </li>
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
          <a href="/admin/login">{t.footer.adminLink}</a>
        </div>
      </div>
    </footer>
  );
}
