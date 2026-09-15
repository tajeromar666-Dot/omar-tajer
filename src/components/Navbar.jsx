import { useEffect, useRef, useState } from "react";
import { CIA_LOGO } from "../assets/logos";
import { useLanguage } from "../context/LanguageContext.jsx";
import { loadSettings } from "../data/seedData";
import { LANGUAGES } from "../data/translations";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";

function LanguageSwitcher() {
  const { language, setLanguage, activeLanguages } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const available = LANGUAGES.filter((l) => activeLanguages.includes(l.code));
  const current = available.find((l) => l.code === language) || available[0] || LANGUAGES[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (available.length < 2) return null;

  return (
    <div className="lang-switcher" ref={wrapRef}>
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Choisir la langue"
      >
        <span className="lang-switcher__flag">{current.flag}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="lang-switcher__menu">
          {available.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`lang-switcher__option ${l.code === language ? "active" : ""}`}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
            >
              <span className="lang-switcher__flag">{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [settings] = useLiveStorage(loadSettings);
  const { t } = useLanguage();
  const logo = settings.logo || CIA_LOGO;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#hero", label: t.nav.home },
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#plans3d", label: t.nav.plans3d },
    { href: "#portfolio", label: t.nav.portfolio },
    { href: "#partners", label: t.nav.partners },
    { href: "#temoignages", label: t.nav.testimonials },
    { href: "#team", label: t.nav.team },
    { href: "#why-us", label: t.nav.whyus },
    { href: "#contact", label: t.nav.contact },
  ];

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container navbar__container">
          <a href="#hero" className="navbar__logo" onClick={() => setOpen(false)}>
            <img src={logo} alt="CIA — Construction Industrielle Africaine" />
          </a>

          <nav className="navbar__links">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="navbar__link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="navbar__right">
            <LanguageSwitcher />
            <a href="#contact" className="btn btn--primary btn--sm">
              {t.nav.contactBtn}
            </a>
            <button
              className="navbar__toggle"
              aria-label={t.nav.openMenu}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`navbar__mobile-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`navbar__mobile-menu ${open ? "open" : ""}`}>
        <button
          className="btn-icon"
          style={{ alignSelf: "flex-end" }}
          onClick={() => setOpen(false)}
          aria-label={t.nav.closeMenu}
        >
          <Icon name="close" size={18} />
        </button>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="navbar__link"
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
        <a
          href="#contact"
          className="btn btn--primary"
          onClick={() => setOpen(false)}
        >
          {t.nav.contactBtn}
        </a>
      </aside>
    </>
  );
}
