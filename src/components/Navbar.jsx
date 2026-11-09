import { memo, useEffect, useRef, useState } from "react";
import { CIA_LOGO } from "../assets/logos";
import { useLanguage } from "../context/LanguageContext.jsx";
import { loadSettings, loadVisibility } from "../data/seedData";
import { LANGUAGES } from "../data/translations";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";

// Page order; `section` is the visibility key — links to sections hidden
// from Paramètres are dropped instead of pointing at nothing.
const LINKS = [
  { href: "#hero", key: "home", section: "hero" },
  { href: "#about", key: "about", section: "about" },
  { href: "#services", key: "services", section: "services" },
  { href: "#plans3d", key: "plans3d", section: "plans3d" },
  { href: "#portfolio", key: "portfolio", section: "portfolio" },
  { href: "#partners", key: "partners", section: "partners" },
  { href: "#temoignages", key: "testimonials", section: "temoignages" },
  { href: "#why-us", key: "whyus", section: "whyus" },
  { href: "#team", key: "team", section: "team" },
  { href: "#contact", key: "contact", section: "contact" },
];

function LanguageSwitcher() {
  const { language, setLanguage, activeLanguages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const available = LANGUAGES.filter((l) => activeLanguages.includes(l.code));
  const current = available.find((l) => l.code === language) || available[0] || LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (available.length < 2) return null;

  return (
    <div className="lang" ref={wrapRef}>
      <button
        type="button"
        className="lang__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${current.code.toUpperCase()} — ${t.common.chooseLanguage}`}
        aria-expanded={open}
      >
        <span className="lang__code">{current.code.toUpperCase()}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="lang__menu" role="menu">
          {available.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === language}
              className={`lang__option${l.code === language ? " is-active" : ""}`}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
            >
              <span aria-hidden="true">{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const [settings] = useLiveStorage(loadSettings);
  const [visibility] = useLiveStorage(loadVisibility);
  const { t } = useLanguage();
  const logo = settings.logo || CIA_LOGO;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef(null);

  const links = LINKS.filter((l) => visibility[l.section] !== false);

  // rAF-throttled, passive; React skips the re-render when the boolean
  // doesn't actually change.
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      setScrolled(window.scrollY > 24);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="container nav__inner">
          <a href="#hero" className="nav__logo" onClick={close}>
            <img src={logo} alt="CIA — Construction Industrielle Africaine" width="132" height="54" />
          </a>

          <nav className="nav__links" aria-label="Navigation principale">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav__link">
                {t.nav[l.key]}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <LanguageSwitcher />
            {visibility.contact !== false && (
              <a href="#contact" className="btn btn--primary btn--sm nav__cta">
                {t.nav.contactBtn}
              </a>
            )}
            <button
              type="button"
              className={`nav__toggle${open ? " is-open" : ""}`}
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu__overlay${open ? " is-open" : ""}`} onClick={close} aria-hidden="true" />
      <aside id="mobile-menu" className={`mobile-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Menu mobile">
          {links.map((l, i) => (
            <a
              key={l.href}
              ref={i === 0 ? firstLinkRef : undefined}
              href={l.href}
              className="mobile-menu__link"
              onClick={close}
              tabIndex={open ? 0 : -1}
            >
              {t.nav[l.key]}
            </a>
          ))}
        </nav>
        {visibility.contact !== false && (
          <a href="#contact" className="btn btn--primary btn--block" onClick={close} tabIndex={open ? 0 : -1}>
            {t.nav.contactBtn}
          </a>
        )}
      </aside>
    </>
  );
}

export default memo(Navbar);
