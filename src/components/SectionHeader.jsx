import Reveal from "./Reveal";

// Shared tag + title (with accent words) + subtitle block used by every
// section. Title colors come from the section's --s-title / --s-accent
// variables, which the contrast guard keeps readable.
export default function SectionHeader({ tag, titleA, accent, titleB, subtitle, align = "center" }) {
  return (
    <Reveal className={`section-head section-head--${align}`}>
      {tag && <span className="section-tag">{tag}</span>}
      <h2 className="section-title">
        {titleA && `${titleA} `}
        {accent && <span>{accent}</span>}
        {titleB && ` ${titleB}`}
      </h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </Reveal>
  );
}
