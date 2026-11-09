import { loadColorOverrides, loadSectionThemes, sectionThemeStyle } from "../data/seedData";
import useLiveStorage from "./useLiveStorage";

// The per-section theme preset + manual color overrides chosen in
// Apparence, as the inline style object for that section's root element
// (undefined when the section has no preset — it keeps the design default).
export default function useSectionTheme(sectionKey) {
  const [themes] = useLiveStorage(loadSectionThemes);
  const [overrides] = useLiveStorage(loadColorOverrides);
  return sectionThemeStyle(themes, sectionKey, overrides);
}
