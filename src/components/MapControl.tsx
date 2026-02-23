"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPoint {
  lat: number;
  lng: number;
}

interface MapControlProps {
  customData: MapPoint[];
  center?: { lat: number; lng: number };
}

export default function MapControl({ customData, center }: MapControlProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

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
      // Clear existing route if data is empty
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      return;
    }

    const latLngs = customData.map(p => [p.lat, p.lng] as L.LatLngExpression);

    // Remove old layer if it exists
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
    }

    // Add new route line
    routeLayerRef.current = L.polyline(latLngs, {
      color: "#2563eb", // Blue-600
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // TRIGGER THE FLY-TO
    const bounds = L.latLngBounds(latLngs);
    mapRef.current.flyToBounds(bounds, {
      padding: [80, 80], // Space for our UI overlays
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