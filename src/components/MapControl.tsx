"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPoint {
  lat: number;
  lng: number;
}

interface MapControlProps {
  customData: [number, number][];
  center?: { lat: number; lng: number };
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
}

export default function MapControl({ customData, center, startPoint, endPoint }: MapControlProps) {  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const endMarkerRef = useRef<L.CircleMarker | null>(null);
  

  // 1. INITIALIZE MAP
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // 1. Create the instance
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
    });

    // 2. Set the initial view
    map.setView([center?.lat || 45.5231, center?.lng || -122.6765], 13);

    // 3. Add tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // 4. THE CRITICAL RE-SYNC
    // Wait for the next macro-task to ensure the DOM is painted
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. DRAW ROUTE & FLY-TO
  // 2. DRAW ROUTE & FLY-TO
  useEffect(() => {
    // 1. Strict Data Validation: Ensure we actually have numbers
    const validLatLngs = (customData || []).filter(
      (p) => 
        Array.isArray(p) && 
        p.length >= 2 && 
        typeof p[0] === 'number' && !isNaN(p[0]) &&
        typeof p[1] === 'number' && !isNaN(p[1])
    ) as L.LatLngExpression[];

    // 2. Guard: If no valid data, cleanup and exit before Leaflet crashes
    if (!mapRef.current || validLatLngs.length === 0) {
      [routeLayerRef, startMarkerRef, endMarkerRef].forEach(ref => {
        if (ref.current) {
          ref.current.remove();
          ref.current = null;
        }
      });
      return;
    }

    // 3. Update the Polyline
    if (routeLayerRef.current) routeLayerRef.current.remove();
    routeLayerRef.current = L.polyline(validLatLngs, {
      color: "#2563eb",
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // 4. Update START Marker [0]
    if (startMarkerRef.current) startMarkerRef.current.remove();
    startMarkerRef.current = L.circleMarker(validLatLngs[0], {
      radius: 8,
      fillColor: "#10b981", 
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
      pane: 'markerPane'
    }).addTo(mapRef.current);

    // 5. Update FINISH Marker [last]
    const lastIndex = validLatLngs.length - 1;
    if (endMarkerRef.current) endMarkerRef.current.remove();
    endMarkerRef.current = L.circleMarker(validLatLngs[lastIndex], {
      radius: 8,
      fillColor: "#ef4444", 
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
      pane: 'markerPane'
    }).addTo(mapRef.current);

    // 6. Fit Bounds (only if map is ready)
    try {
      const bounds = L.latLngBounds(validLatLngs);
      mapRef.current.flyToBounds(bounds, {
        padding: [80, 80],
        duration: 1.5
      });
    } catch (e) {
      console.warn("Could not fly to bounds:", e);
    }

  }, [customData]);

  return (
  <div className="h-full w-full min-h-[400px] relative"> 
    <div 
      ref={containerRef} 
      className="absolute inset-0" // Absolute fill ensures it takes parent's 400px
    />
  </div>
);
}