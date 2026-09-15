import { useLanguage } from "../context/LanguageContext.jsx";
import {
  loadCollaborateursCount,
  loadColorOverrides,
  loadSectionThemes,
  loadTeam,
  loadVisibility,
  sectionThemeStyle,
} from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useReveal from "../hooks/useReveal";
import Icon from "./Icons";
import RevealCard from "./RevealCard";

function getInitials(name) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Team() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [team] = useLiveStorage(loadTeam);
  const [collaborateursCount] = useLiveStorage(loadCollaborateursCount);
  const [visibility] = useLiveStorage(loadVisibility);
  const [sectionThemes] = useLiveStorage(loadSectionThemes);
  const [colorOverrides] = useLiveStorage(loadColorOverrides);

  if (!visibility.team || !team.length) return null;

  return (
    <section
      id="team"
      className="section steel-texture"
      ref={ref}
      style={sectionThemeStyle(sectionThemes, "team", colorOverrides)}
    >
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">{t.team.tag}</span>
          <h2 className="section-title">
            {t.team.titleA} <span>{t.team.titleAccent}</span> {t.team.titleB}
          </h2>
          <p className="section-subtitle">{t.team.subtitle}</p>
        </div>

        <div className="grid grid-4 team__grid">
          {team.map((m, i) => (
            <RevealCard className="team-card" index={i % 4} key={m.id}>
              <div className="team-card__photo">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} />
                ) : (
                  <div className="team-card__initials">{getInitials(m.name)}</div>
                )}
              </div>
              <h3>{m.name}</h3>
              <p>{m.role}</p>
              {m.linkedin && (
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="team-card__linkedin"
                  aria-label={`LinkedIn de ${m.name}`}
                >
                  <Icon name="linkedin" size={16} />
                </a>
              )}
            </RevealCard>
          ))}

          <RevealCard className="team-card team-stat-card" index={team.length % 4}>
            <span className="team-stat-card__icon">
              <Icon name="users" size={28} />
            </span>
            <span className="team-stat-card__number">{collaborateursCount}+</span>
            <h3>{t.team.collaboratorsLabel}</h3>
            <p>{t.team.collaboratorsSubtext}</p>
          </RevealCard>
        </div>
      </div>
    </section>
  );
}
