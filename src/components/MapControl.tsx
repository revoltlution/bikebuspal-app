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

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false, // Cleaner UI for our floating layout
      attributionControl: false
    }).setView([center?.lat || 45.5231, center?.lng || -122.6765], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. DRAW ROUTE & FLY-TO
  useEffect(() => {
    if (!mapRef.current || !customData || customData.length === 0) {
      // Cleanup everything if data is wiped
      [routeLayerRef, startMarkerRef, endMarkerRef].forEach(ref => {
        if (ref.current) {
          ref.current.remove();
          ref.current = null;
        }
      });
      return;
    }

    const latLngs = customData as L.LatLngExpression[];

    // 1. Update the Polyline
    if (routeLayerRef.current) routeLayerRef.current.remove();
    routeLayerRef.current = L.polyline(latLngs, {
      color: "#2563eb",
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // 2. Update START Marker [0]
    if (startMarkerRef.current) startMarkerRef.current.remove();
    startMarkerRef.current = L.circleMarker(latLngs[0], {
      radius: 8,
      fillColor: "#10b981", // Emerald Green
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
      pane: 'markerPane' // Ensure markers stay above the line
    }).addTo(mapRef.current);

    // 3. Update FINISH Marker [length - 1]
    const lastIndex = latLngs.length - 1;
    if (endMarkerRef.current) endMarkerRef.current.remove();
    endMarkerRef.current = L.circleMarker(latLngs[lastIndex], {
      radius: 8,
      fillColor: "#ef4444", // Red
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
      pane: 'markerPane'
    }).addTo(mapRef.current);

    // 4. Fit Bounds
    const bounds = L.latLngBounds(latLngs);
    mapRef.current.flyToBounds(bounds, {
      padding: [80, 80],
      duration: 1.5
    });

  }, [customData]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full" 
      style={{ background: "#f8fafc" }} 
    />
  );
}