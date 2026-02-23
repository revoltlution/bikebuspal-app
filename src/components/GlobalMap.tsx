"use client";

import { useEffect } from "react";
import { useMap } from "@/src/context/MapContext";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Import your existing MapControl dynamically to avoid SSR issues
const MapControl = dynamic(() => import("@/src/components/MapControl"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 animate-pulse" />
});

export default function GlobalMap() {
  const { mode, setMode, activeRoute, mapCenter } = useMap();
  const pathname = usePathname();

  // Logic to switch Map Modes based on the URL
  useEffect(() => {
    if (pathname === "/discover") {
      setMode('discovery');
    } else if (pathname === "/today" || pathname.includes("/schedule/")) {
      setMode('trip');
    } else if (pathname === "/login") {
      setMode('hidden');
    } else {
      setMode('hidden'); // Default to hidden or a very light background map
    }
  }, [pathname, setMode]);

  if (mode === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-0 transition-opacity duration-700">
      {/* MapControl will handle the actual rendering. 
          We pass it the activeRoute coordinates if we are in 'trip' mode,
          or an empty array (or all-route array) if in 'discovery'.
      */}
      <MapControl 
        customData={mode === 'trip' ? activeRoute?.coordinates || [] : []} 
        center={mapCenter}
      />
      
      {/* Subtle Vignette to keep UI readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 pointer-events-none" />
    </div>
  );
}