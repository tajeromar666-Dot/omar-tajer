import { memo } from "react";
import Reveal from "./Reveal";

// Category chips above a gallery — horizontally scrollable on small
// screens instead of wrapping into several rows.
function FilterBar({ options, value, onChange, labelFor }) {
  return (
    <Reveal className="filters" role="toolbar">
      {options.map((f) => (
        <button
          key={f}
          type="button"
          className={`filters__btn${value === f ? " is-active" : ""}`}
          aria-pressed={value === f}
          onClick={() => onChange(f)}
        >
          {labelFor(f)}
        </button>
      ))}
    </Reveal>
  );
}

export default memo(FilterBar);
