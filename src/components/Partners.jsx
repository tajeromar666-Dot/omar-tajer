import { useLanguage } from "../context/LanguageContext.jsx";
import { getPartnersStatus, loadPartners, loadVisibility, retryPartners } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SectionError, SkeletonGrid } from "./SectionStatus";
import SmartImage from "./SmartImage";
import "../styles/sections.css";

export default function Partners() {
  const { t } = useLanguage();
  const [partners] = useLiveStorage(loadPartners);
  const [status] = useLiveStorage(getPartnersStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("partners");

  if (!visibility.partners) return null;

  return (
    <section id="partners" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.partners.tag}
          titleA={t.partners.titleA}
          accent={t.partners.titleAccent}
          titleB={t.partners.titleB}
          subtitle={t.partners.subtitle}
        />

        {status === "loading" && !partners.length ? (
          <SkeletonGrid count={6} className="partners__grid" />
        ) : status === "error" && !partners.length ? (
          <SectionError onRetry={retryPartners} />
        ) : (
          <ul className="partners__grid">
            {partners.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i % 6} className="partner" title={p.name}>
                <SmartImage src={p.logo} alt={p.name} width={240} height={120} fit="contain" sizes="200px" widths={[240, 480]} />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
