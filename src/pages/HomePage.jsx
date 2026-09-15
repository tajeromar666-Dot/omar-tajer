import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Services from "../components/Services";
import Plans3D from "../components/Plans3D";
import Portfolio from "../components/Portfolio";
import Partners from "../components/Partners";
import Testimonials from "../components/Testimonials";
import WhyUs from "../components/WhyUs";
import Team from "../components/Team";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import SocialFloating from "../components/SocialFloating";
import WhatsAppButton from "../components/WhatsAppButton";
import { findDesignTemplate, loadDesignTemplate } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";

export default function HomePage() {
  const [templateId] = useLiveStorage(loadDesignTemplate);
  const [switching, setSwitching] = useState(false);
  const prevTemplateRef = useRef(templateId);

  // Purely a visual cue — a brief 0.5s opacity dip whenever the chosen
  // Design Template actually changes, so switching feels like a smooth
  // transition rather than an instant style swap. Never affects data.
  useEffect(() => {
    if (prevTemplateRef.current === templateId) return;
    prevTemplateRef.current = templateId;
    setSwitching(true);
    const timer = setTimeout(() => setSwitching(false), 500);
    return () => clearTimeout(timer);
  }, [templateId]);

  const template = findDesignTemplate(templateId);
  const className = [template?.className, switching ? "template-switching" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className || undefined} style={switching ? { opacity: 0.4 } : undefined}>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Plans3D />
        <Portfolio />
        <Partners />
        <Testimonials />
        <WhyUs />
        <Team />
        <Contact />
      </main>
      <Footer />
      <SocialFloating />
      <WhatsAppButton />
    </div>
  );
}
