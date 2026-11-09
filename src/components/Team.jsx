import { memo } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getTeamStatus, loadCollaborateursCount, loadTeam, loadVisibility, retryTeam } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SectionError, SkeletonGrid } from "./SectionStatus";
import SmartImage from "./SmartImage";
import "../styles/sections.css";

function getInitials(name) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const MemberCard = memo(function MemberCard({ member }) {
  return (
    <article className="member card card--hover">
      <div className="member__photo">
        {member.photo ? (
          <SmartImage src={member.photo} alt={member.name} width={480} height={480} sizes="(min-width: 1024px) 25vw, 50vw" widths={[320, 480, 800]} />
        ) : (
          <span className="member__initials">{getInitials(member.name)}</span>
        )}
      </div>
      <div className="member__body">
        <h3 className="card__title">{member.name}</h3>
        <p className="card__text">{member.role}</p>
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="member__linkedin"
            aria-label={`LinkedIn — ${member.name}`}
          >
            <Icon name="linkedin" size={16} />
          </a>
        )}
      </div>
    </article>
  );
});

export default function Team() {
  const { t } = useLanguage();
  const [team] = useLiveStorage(loadTeam);
  const [status] = useLiveStorage(getTeamStatus);
  const [collaborateursCount] = useLiveStorage(loadCollaborateursCount);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("team");

  if (!visibility.team) return null;
  const loading = status === "loading" && !team.length;
  const failed = status === "error" && !team.length;
  if (!team.length && !loading && !failed) return null;

  return (
    <section id="team" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.team.tag}
          titleA={t.team.titleA}
          accent={t.team.titleAccent}
          titleB={t.team.titleB}
          subtitle={t.team.subtitle}
        />

        {loading ? (
          <SkeletonGrid count={4} className="team__grid" />
        ) : failed ? (
          <SectionError onRetry={retryTeam} />
        ) : (
          <div className="team__grid">
            {team.map((m, i) => (
              <Reveal key={m.id} delay={i % 4}>
                <MemberCard member={m} />
              </Reveal>
            ))}
            <Reveal delay={team.length % 4}>
              <article className="member member--stat card">
                <span className="icon-chip icon-chip--lg">
                  <Icon name="users" size={28} />
                </span>
                <span className="member__stat-number">{collaborateursCount}+</span>
                <h3 className="card__title">{t.team.collaboratorsLabel}</h3>
                <p className="card__text">{t.team.collaboratorsSubtext}</p>
              </article>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
