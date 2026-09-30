import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import useLenis from "./hooks/useLenis";
import Splash from "./components/Splash";
import Navbar from "./components/Navbar";
import WebLines from "./components/WebLines";
import Hero from "./sections/Hero";
import OriginStory from "./sections/OriginStory";
import Arsenal from "./sections/Arsenal";
import Missions from "./sections/Missions";
import AriaSpotlight from "./sections/AriaSpotlight";
import Services from "./sections/Services";
import Signal from "./sections/Signal";
import Footer from "./sections/Footer";

// The splash plays on every load. Add ?nosplash to the URL to skip it while developing.
function shouldShowSplash() {
  try {
    return !new URLSearchParams(window.location.search).has("nosplash");
  } catch {
    return true;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);

  useLenis(!showSplash);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = showSplash ? "hidden" : "";
  }, [showSplash]);

  const finishSplash = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <Splash key="splash" onComplete={finishSplash} />}
      </AnimatePresence>

      <Navbar />

      <main className="page-bg relative z-10 overflow-x-clip">
        {/* web-shooter strands behind every section */}
        <WebLines />

        <Hero ready={!showSplash} />
        <OriginStory />
        <Arsenal />
        <Missions />
        <AriaSpotlight />
        <Services />
        <Signal />
      </main>

      <Footer />
    </>
  );
}