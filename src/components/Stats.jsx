import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { loadCollaborateursCount, loadVisibility } from "../data/seedData";
import useInView from "../hooks/useInView";
import useLiveStorage from "../hooks/useLiveStorage";
import Reveal from "./Reveal";
import "../styles/sections.css";

const DURATION = 1600;

function Counter({ value, suffix, start }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(value);
      return;
    }
    let frame;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / DURATION, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value]);

  // Width reserved for the final value, so the count-up never reflows.
  return (
    <span className="stat__count" style={{ minWidth: `${String(value).length + suffix.length}ch` }}>
      {count}
      <span className="stat__suffix">{suffix}</span>
    </span>
  );
}

// Key figures band right under the hero — counters start the first time
// the band scrolls into view. Shown/hidden together with the hero, as
// these figures always lived in the hero before.
export default function Stats() {
  const { t } = useLanguage();
  const [collaborateursCount] = useLiveStorage(loadCollaborateursCount);
  const [visibility] = useLiveStorage(loadVisibility);
  const [ref, inView] = useInView();

  if (!visibility.hero) return null;

  const stats = [
    { value: 15, suffix: "+", label: t.hero.statExperience },
    { value: 120, suffix: "+", label: t.hero.statProjects },
    { value: 98, suffix: "%", label: t.hero.statSatisfaction },
    { value: Number(collaborateursCount) || 0, suffix: "+", label: t.hero.statCollaborators },
  ];

  return (
    <section className="stats" aria-label={t.hero.statProjects}>
      <div className="container">
        <div className="stats__grid" ref={ref}>
          {stats.map((s, i) => (
            <Reveal className="stat" delay={i} key={s.label}>
              <div className="stat__value">
                <Counter value={s.value} suffix={s.suffix} start={inView} />
              </div>
              <div className="stat__label">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
