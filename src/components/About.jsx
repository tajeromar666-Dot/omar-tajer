import { useLanguage } from "../context/LanguageContext.jsx";
import { loadAbout, loadVisibility } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import MediaVideo from "./MediaVideo";
import Reveal from "./Reveal";
import SmartImage from "./SmartImage";
import "../styles/sections.css";

const DEFAULT_ABOUT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
    <defs>
      <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1a1a2e"/>
        <stop offset="1" stop-color="#0a0a0f"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#ag)"/>
    <g stroke="rgba(255,107,53,0.35)" stroke-width="6" fill="none">
      <path d="M80 900 L80 380 L400 180 L720 380 L720 900"/>
      <path d="M80 640 L720 640"/>
      <path d="M80 520 L720 520"/>
      <path d="M240 900 L240 420"/>
      <path d="M400 900 L400 300"/>
      <path d="M560 900 L560 420"/>
    </g>
    <circle cx="400" cy="180" r="12" fill="#F4B400"/>
  </svg>
`)}`;

export default function About() {
  const { t } = useLanguage();
  const [about] = useLiveStorage(loadAbout);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("about");

  if (!visibility.about) return null;

  const paragraphs = (about.description || "").split("\n").filter(Boolean);
  const titleMain = (about.title || "").replace(about.titleAccent || "", "").trim();
  const isVideo = about.mediaType === "video" && (about.video || about.videoUrl);

  return (
    <section id="about" className="section" style={themeStyle}>
      <div className="container about">
        <Reveal className="about__media">
          <div className="about__frame">
            {isVideo ? (
              <MediaVideo video={about.video} videoUrl={about.videoUrl} title="À propos de CIA" />
            ) : (
              <SmartImage
                src={about.image || DEFAULT_ABOUT_IMAGE}
                alt="Chantier industriel CIA"
                width={800}
                height={1000}
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            )}
          </div>
          {(about.badgeNumber || about.badgeLabel) && (
            <div className="about__badge">
              <span className="about__badge-number">{about.badgeNumber}</span>
              <span className="about__badge-label">{about.badgeLabel}</span>
            </div>
          )}
        </Reveal>

        <Reveal className="about__content" delay={1}>
          <span className="section-tag">{t.about.tag}</span>
          <h2 className="section-title">
            {titleMain}
            {about.titleAccent && (
              <>
                {titleMain ? " " : ""}
                <span>{about.titleAccent}</span>
              </>
            )}
          </h2>
          <div className="about__text">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {about.values?.length > 0 && (
            <ul className="about__values">
              {about.values.map((v) => (
                <li className="about__value card" key={v.id}>
                  <span className="icon-chip">
                    <Icon name={v.icon} size={22} />
                  </span>
                  <div>
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </section>
  );
}
