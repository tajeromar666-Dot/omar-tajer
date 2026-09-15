import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadColorOverrides,
  loadSectionThemes,
  loadServices,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";

export default function Services() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [services] = useLiveStorage(loadServices);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);

  if (!visibility.services) return null;

  return (
    <section
      id="services"
      className="section steel-texture"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "services", colorOverrides)}
    >
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.services.tag}</span>
          <h2 className="section-title">
            {t.services.titleA} <span>{t.services.titleAccent}</span> {t.services.titleB}
          </h2>
          <p className="section-subtitle">{t.services.subtitle}</p>
        </div>

        <div className="grid grid-3">
          {services.map((s, i) => (
            <div
              className="service-card fade-up"
              style={{ animationDelay: `${(i % 3) * 0.08}s` }}
              key={s.id}
            >
              <div className="service-card__top">
                <span className="service-card__number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="service-card__icon">
                  <Icon name={s.icon} size={26} />
                </div>
              </div>
              <h3 className="service-card__title">{s.title}</h3>
              <p className="service-card__desc">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
