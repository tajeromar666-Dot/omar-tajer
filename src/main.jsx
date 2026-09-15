import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { applyLanguageDir, LanguageProvider } from "./context/LanguageContext.jsx";
import {
  applyPresetTheme,
  applySectionColors,
  applySpacing,
  applyTheme,
  loadActiveTheme,
  loadLanguage,
  loadSectionColors,
  loadSpacing,
  loadTheme,
} from "./data/seedData";
import "./index.css";

// Apply any saved theme/section-color/spacing/language overrides before the
// first paint so there's no flash of the default colors, spacing, or text
// direction. applyPresetTheme() runs first as a baseline from the last
// selected color theme; applyTheme(loadTheme()) right after is the
// authoritative call — it carries any custom-picker fine-tuning made on top
// of that theme — so this order never causes a visible flash either way.
applyPresetTheme(loadActiveTheme());
applyTheme(loadTheme());
applySectionColors(loadSectionColors());
applySpacing(loadSpacing());
applyLanguageDir(loadLanguage());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
