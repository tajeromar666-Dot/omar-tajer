import { memo } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getServicesStatus, loadServices, loadVisibility, retryServices } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import useSectionTheme from "../hooks/useSectionTheme";
import Icon from "./Icons";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SectionError, SkeletonGrid } from "./SectionStatus";
import "../styles/sections.css";

const ServiceCard = memo(function ServiceCard({ service, number }) {
  return (
    <article className="service card card--hover">
      <div className="service__top">
        <span className="icon-chip icon-chip--lg">
          <Icon name={service.icon} size={28} />
        </span>
        <span className="service__number" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
      </div>
      <h3 className="card__title">{service.title}</h3>
      <p className="card__text">{service.description}</p>
    </article>
  );
});

export default function Services() {
  const { t } = useLanguage();
  const [services] = useLiveStorage(loadServices);
  const [status] = useLiveStorage(getServicesStatus);
  const [visibility] = useLiveStorage(loadVisibility);
  const themeStyle = useSectionTheme("services");

  if (!visibility.services) return null;

  return (
    <section id="services" className="section" style={themeStyle}>
      <div className="container">
        <SectionHeader
          tag={t.services.tag}
          titleA={t.services.titleA}
          accent={t.services.titleAccent}
          titleB={t.services.titleB}
          subtitle={t.services.subtitle}
        />

        {status === "loading" && !services.length ? (
          <SkeletonGrid count={6} className="services__grid" />
        ) : status === "error" && !services.length ? (
          <SectionError onRetry={retryServices} />
        ) : (
          <div className="services__grid">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i % 3}>
                <ServiceCard service={s} number={i + 1} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
