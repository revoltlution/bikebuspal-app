"use client";

import React, { createContext, useContext, useState } from 'react';

type MapMode = 'discovery' | 'trip' | 'live' | 'hidden';

// Ensure this matches what your Map library (Mapbox/Leaflet) expects.
// If your GPX parser gives you [number, number], use that instead.
interface MapPoint {
  lat: number;
  lng: number;
}

interface ActiveRoute {
  id: string;
  coordinates: MapPoint[];
  startPoint?: MapPoint; // Optional
  endPoint?: MapPoint;   // Optional
}

interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  activeRoute: ActiveRoute | null; 
  setActiveRoute: (route: ActiveRoute | null) => void; // Signature must match!
  mapCenter: MapPoint;
  setMapCenter: (coords: MapPoint) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<MapMode>('discovery');
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [mapCenter, setMapCenter] = useState<MapPoint>({ lat: 45.5231, lng: -122.6765 });

  return (
    <MapContext.Provider value={{ mode, setMode, activeRoute, setActiveRoute, mapCenter, setMapCenter }}>
      {children}
    </MapContext.Provider>
  );
}

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMap must be used within a MapProvider");
  return context;
};