import { createContext, useContext, useEffect, useState } from "react";
import { loadActiveLanguages, loadLanguage, saveLanguage } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import { DEFAULT_LANGUAGE, getTranslation, RTL_LANGUAGES } from "../data/translations";

const LanguageContext = createContext(null);

// Sets <html lang> / <html dir> — called both here (on change) and once in
// main.jsx before the first paint, so there's no flash of the wrong
// direction on reload.
export function applyLanguageDir(language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => loadLanguage() || DEFAULT_LANGUAGE);
  const [activeLanguages] = useLiveStorage(loadActiveLanguages);

  useEffect(() => {
    applyLanguageDir(language);
  }, [language]);

  // If an admin disables the currently selected language, fall back to
  // French (always active) instead of leaving the site on a hidden locale.
  useEffect(() => {
    if (!activeLanguages.includes(language)) {
      setLanguageState(DEFAULT_LANGUAGE);
      saveLanguage(DEFAULT_LANGUAGE);
    }
  }, [activeLanguages, language]);

  function setLanguage(next) {
    setLanguageState(next);
    saveLanguage(next);
  }

  const t = getTranslation(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, activeLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
