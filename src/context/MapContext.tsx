"use client";

import React, { createContext, useContext, useState } from 'react';

type MapMode = 'discovery' | 'trip' | 'live' | 'hidden';
interface MapPoint {
  lat: number;
  lng: number;
}

interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  activeRoute: { id: string; coordinates: MapPoint[] } | null; // Typed strictly
  setActiveRoute: (route: { id: string; coordinates: MapPoint[] } | null) => void;
  // ... rest of interface
  mapCenter: { lat: number; lng: number };
  setMapCenter: (coords: { lat: number; lng: number }) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<MapMode>('discovery'); // Default to discovery
  const [activeRoute, setActiveRoute] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 45.5231, lng: -122.6765 });

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