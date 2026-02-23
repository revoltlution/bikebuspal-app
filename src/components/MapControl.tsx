"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapControlProps {
  customData: [number, number][];
  center?: { lat: number; lng: number };
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
}

export default function MapControl({ customData, center }: MapControlProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const endMarkerRef = useRef<L.CircleMarker | null>(null);

  // 1. INITIALIZE MAP
  useEffect(() => {
    if (!containerRef.current) return;

    // GUARD: Prevents "Map container is already initialized" crash
    if ((containerRef.current as any)._leaflet_id) return;

    // Create single map instance
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: false, // Prevents page scroll hijacking
      preferCanvas: true 
    });

    map.setView([center?.lat || 45.5231, center?.lng || -122.6765], 13);

    // Add Tile Layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Refresh size after DOM settling
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // 2. DRAW ROUTE & FLY-TO
  useEffect(() => {
    // Validation
    const validLatLngs = (customData || []).filter(
      (p) => 
        Array.isArray(p) && 
        p.length >= 2 && 
        typeof p[0] === 'number' && !isNaN(p[0]) &&
        typeof p[1] === 'number' && !isNaN(p[1])
    ) as L.LatLngExpression[];

    if (!mapRef.current || validLatLngs.length === 0) {
      [routeLayerRef, startMarkerRef, endMarkerRef].forEach(ref => {
        if (ref.current) {
          ref.current.remove();
          ref.current = null;
        }
      });
      return;
    }

    // Update Polyline
    if (routeLayerRef.current) routeLayerRef.current.remove();
    routeLayerRef.current = L.polyline(validLatLngs, {
      color: "#2563eb",
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // Update Markers
    if (startMarkerRef.current) startMarkerRef.current.remove();
    startMarkerRef.current = L.circleMarker(validLatLngs[0], {
      radius: 8,
      fillColor: "#10b981", 
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    }).addTo(mapRef.current);

    const lastIndex = validLatLngs.length - 1;
    if (endMarkerRef.current) endMarkerRef.current.remove();
    endMarkerRef.current = L.circleMarker(validLatLngs[lastIndex], {
      radius: 8,
      fillColor: "#ef4444", 
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    }).addTo(mapRef.current);

    // Fit View
    try {
      const bounds = L.latLngBounds(validLatLngs);
      mapRef.current.fitBounds(bounds, {
        padding: [40, 40],
        animate: true
      });
    } catch (e) {
      console.warn("Map Bounds Error:", e);
    }

  }, [customData]);

  return (
    <div className="w-full h-full min-h-[300px] relative"> 
      <div 
        ref={containerRef} 
        className="absolute inset-0" 
      />
    </div>
  );
}