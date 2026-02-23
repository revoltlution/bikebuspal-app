"use client";

import { useEffect, useMemo } from "react";
import { useMap } from "@/src/context/MapContext";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const MapControl = dynamic(() => import("@/src/components/MapControl"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 animate-pulse" />
});

export default function GlobalMap() {
  const { mode, setMode, activeRoute, mapCenter } = useMap();
  const pathname = usePathname();

  useEffect(() => {
    // Better Regex to catch /schedule/[id] but exclude /schedule/create or /schedule/edit
    const isTripDetails = pathname.match(/^\/schedule\/(?!create|edit)[a-zA-Z0-9_-]+$/);

    if (pathname === "/discover") {
      setMode('discovery');
    } else if (pathname === "/today" || isTripDetails) {
      setMode('trip');
    } else if (pathname === "/login") {
      setMode('hidden');
    } else {
      // Keep map visible but dimmed for other routes if needed, 
      // otherwise 'hidden' is fine.
      setMode('hidden'); 
    }
  }, [pathname, setMode]);

  // Use useMemo to prevent unnecessary re-renders of the heavy MapControl
  const normalizedData = useMemo(() => {
    if (!activeRoute?.coordinates) return [] as [number, number][];
    return activeRoute.coordinates.map(p => [p.lat, p.lng] as [number, number]);
  }, [activeRoute?.coordinates]);

  const start = useMemo(() => 
    activeRoute?.startPoint ? [activeRoute.startPoint.lat, activeRoute.startPoint.lng] as [number, number] : null
  , [activeRoute?.startPoint]);

  const end = useMemo(() => 
    activeRoute?.endPoint ? [activeRoute.endPoint.lat, activeRoute.endPoint.lng] as [number, number] : null
  , [activeRoute?.endPoint]);

  if (mode === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-0 transition-opacity duration-700">
      <MapControl 
        customData={mode === 'trip' ? normalizedData : []} 
        center={mapCenter}
        startPoint={mode === 'trip' ? start : null}
        endPoint={mode === 'trip' ? end : null}
      />
      
      {/* The Vignette: Crucial for UI legibility over the map */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60 pointer-events-none" />
    </div>
  );
}