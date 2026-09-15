import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadColorOverrides,
  loadPartners,
  loadSectionThemes,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";

export default function Partners() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [partners] = useLiveStorage(loadPartners);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);

  if (!visibility.partners) return null;

  return (
    <section
      id="partners"
      className="section partners"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "partners", colorOverrides)}
    >
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.partners.tag}</span>
          <h2 className="section-title">
            {t.partners.titleA} <span>{t.partners.titleAccent}</span> {t.partners.titleB}
          </h2>
          <p className="section-subtitle">{t.partners.subtitle}</p>
        </div>

        <div className="partners__grid">
          {partners.map((p, i) => (
            <div
              className="partner-logo fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
              key={p.id}
              title={p.name}
            >
              <img src={p.logo} alt={p.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
