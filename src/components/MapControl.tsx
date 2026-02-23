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

  const map = L.map(containerRef.current, {
    zoomControl: false,
    attributionControl: false,
    // Add this to help with initialization
    preferCanvas: true 
  });

  map.setView([center?.lat || 45.5231, center?.lng || -122.6765], 13);

  // Use OSM temporarily - it's the most robust against referrer blocking
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Inside MapControl.tsx - Ensure these settings are NOT disabled
  mapRef.current = L.map(containerRef.current, {
    zoomControl: false, // Keep false for clean look
    dragging: true,      // MUST be true for interaction
    scrollWheelZoom: false, // Recommended for mobile so they can still scroll the page
    touchZoom: true,
    attributionControl: false
  });

  // IMPORTANT: The "Next.js Lifecycle" Refresh
  const timer = setTimeout(() => {
    map.invalidateSize();
    console.log("Map Container Height:", containerRef.current?.offsetHeight);
  }, 500);

  return () => {
    clearTimeout(timer);
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
  <div className="w-full h-full min-h-[100dvh] relative"> 
    <div 
      ref={containerRef} 
      className="absolute inset-0" 
    />
  </div>
);
}