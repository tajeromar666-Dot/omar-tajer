import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { applySectionColors, applySpacing, loadSectionColors, loadSpacing } from "./data/seedData";
import useLiveStorage from "./hooks/useLiveStorage";
import HomePage from "./pages/HomePage.jsx";

// The whole admin area (login page, dashboard shell and its stylesheet) is
// split out of the public bundle: none of it is downloaded until an /admin
// route is actually visited.
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const DashboardLayout = lazy(() => import("./dashboard/DashboardLayout.jsx"));

// Every admin tab is code-split with React.lazy — the dashboard shell
// (DashboardLayout/Sidebar) loads eagerly, but a tab's own JS (and its
// sub-components: forms, media pickers...) is only fetched the moment its
// route is visited, not bundled into the same chunk as every other tab.
const Overview = lazy(() => import("./dashboard/Overview.jsx"));
const ProjectsTab = lazy(() => import("./dashboard/ProjectsTab.jsx"));
const MessagesTab = lazy(() => import("./dashboard/MessagesTab.jsx"));
const ThemeTab = lazy(() => import("./dashboard/ThemeTab.jsx"));
const HeroSlidesTab = lazy(() => import("./dashboard/HeroSlidesTab.jsx"));
const AboutTab = lazy(() => import("./dashboard/AboutTab.jsx"));
const ServicesTab = lazy(() => import("./dashboard/ServicesTab.jsx"));
const PartnersTab = lazy(() => import("./dashboard/PartnersTab.jsx"));
const TeamTab = lazy(() => import("./dashboard/TeamTab.jsx"));
const Plans3DTab = lazy(() => import("./dashboard/Plans3DTab.jsx"));
const ExcellenceTab = lazy(() => import("./dashboard/ExcellenceTab.jsx"));
const TestimonialsTab = lazy(() => import("./dashboard/TestimonialsTab.jsx"));
const SettingsTab = lazy(() => import("./dashboard/SettingsTab.jsx"));

function TabFallback() {
  return (
    <div className="dashboard-tab-loading">
      <span className="dashboard-tab-loading__spinner" />
      Chargement...
    </div>
  );
}

function RouteGuard({ children }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

// Keeps the :root section-color CSS variables in sync with localStorage —
// same-tab saves apply immediately, and a save made in another tab/session
// (native `storage` event) is picked up here too, with no reload needed.
function SectionColorsSync() {
  const [colors] = useLiveStorage(loadSectionColors);
  useEffect(() => {
    applySectionColors(colors);
  }, [colors]);
  return null;
}

// Same live-sync pattern as SectionColorsSync above, for the "Espacement
// des Sections" spacing overrides.
function SpacingSync() {
  const [spacing] = useLiveStorage(loadSpacing);
  useEffect(() => {
    applySpacing(spacing);
  }, [spacing]);
  return null;
}

export default function App() {
  return (
    <>
      <SectionColorsSync />
      <SpacingSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={null}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <RouteGuard>
              <Suspense fallback={null}>
                <DashboardLayout />
              </Suspense>
            </RouteGuard>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<TabFallback />}>
                <Overview />
              </Suspense>
            }
          />
          <Route
            path="projets"
            element={
              <Suspense fallback={<TabFallback />}>
                <ProjectsTab />
              </Suspense>
            }
          />
          <Route
            path="messages"
            element={
              <Suspense fallback={<TabFallback />}>
                <MessagesTab />
              </Suspense>
            }
          />
          <Route
            path="apparence"
            element={
              <Suspense fallback={<TabFallback />}>
                <ThemeTab />
              </Suspense>
            }
          />
          <Route
            path="hero"
            element={
              <Suspense fallback={<TabFallback />}>
                <HeroSlidesTab />
              </Suspense>
            }
          />
          <Route
            path="apropos"
            element={
              <Suspense fallback={<TabFallback />}>
                <AboutTab />
              </Suspense>
            }
          />
          <Route
            path="services"
            element={
              <Suspense fallback={<TabFallback />}>
                <ServicesTab />
              </Suspense>
            }
          />
          <Route
            path="plans3d"
            element={
              <Suspense fallback={<TabFallback />}>
                <Plans3DTab />
              </Suspense>
            }
          />
          <Route
            path="excellence"
            element={
              <Suspense fallback={<TabFallback />}>
                <ExcellenceTab />
              </Suspense>
            }
          />
          <Route
            path="partenaires"
            element={
              <Suspense fallback={<TabFallback />}>
                <PartnersTab />
              </Suspense>
            }
          />
          <Route
            path="temoignages"
            element={
              <Suspense fallback={<TabFallback />}>
                <TestimonialsTab />
              </Suspense>
            }
          />
          <Route
            path="equipe"
            element={
              <Suspense fallback={<TabFallback />}>
                <TeamTab />
              </Suspense>
            }
          />
          <Route
            path="parametres"
            element={
              <Suspense fallback={<TabFallback />}>
                <SettingsTab />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
