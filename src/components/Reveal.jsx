import useInView from "../hooks/useInView";

// Fades + slides its children in (opacity/transform only, see .reveal in
// sections.css) the first time it scrolls into view. `delay` is a stagger step
// index — callers pass `i % columns` so the stagger restarts each row.
export default function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal${inView ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { ...style, "--reveal-delay": `${delay * 80}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
