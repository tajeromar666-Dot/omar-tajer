import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadAbout,
  loadColorOverrides,
  loadSectionThemes,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";
import MediaVideo from "./MediaVideo";

const DEFAULT_ABOUT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs>
      <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1E5AA8"/>
        <stop offset="1" stop-color="#0d1b33"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#ag)"/>
    <g stroke="rgba(255,255,255,0.18)" stroke-width="6" fill="none">
      <path d="M60 560 L60 220 L400 60 L740 220 L740 560"/>
      <path d="M60 400 L740 400"/>
      <path d="M60 300 L740 300"/>
      <path d="M200 560 L200 260"/>
      <path d="M400 560 L400 160"/>
      <path d="M600 560 L600 260"/>
    </g>
    <circle cx="400" cy="60" r="10" fill="#F4B400"/>
  </svg>
`)}`;

export default function About() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [about] = useLiveStorage(loadAbout);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);
  const paragraphs = about.description.split("\n").filter(Boolean);

  if (!visibility.about) return null;

  return (
    <section
      id="about"
      className="section steel-texture"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "about", colorOverrides)}
    >
      <div className="container about__grid">
        <div className="about__image-wrap reveal">
          {about.mediaType === "video" && (about.video || about.videoUrl) ? (
            <MediaVideo video={about.video} videoUrl={about.videoUrl} title="À propos de CIA" />
          ) : (
            <img src={about.image || DEFAULT_ABOUT_IMAGE} alt="Chantier industriel CIA" />
          )}
          <div className="about__badge">
            <span className="about__badge-number">{about.badgeNumber}</span>
            <span className="about__badge-label">{about.badgeLabel}</span>
          </div>
        </div>

        <div className="about__content reveal reveal-delay-1">
          <span className="section-tag">{t.about.tag}</span>
          <h2 className="section-title">
            {about.title.replace(about.titleAccent, "").trim()}{" "}
            <span>{about.titleAccent}</span>
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          <div className="about__values">
            {about.values.map((v) => (
              <div className="about__value" key={v.id}>
                <span className="about__value-icon">
                  <Icon name={v.icon} size={22} />
                </span>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
