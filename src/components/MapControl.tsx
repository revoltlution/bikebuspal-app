"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapControlProps {
  // Make activeRoute optional so the Create page doesn't complain
  activeRoute?: string; 
  customData: [number, number][];
}

export default function MapControl({ customData }: MapControlProps) {
  // Guard against empty data
  if (!customData || customData.length === 0) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold italic">
        Waiting for route data...
      </div>
    );
  }

  const center = customData[0];

  return (
    <MapContainer center={center} zoom={15} className="h-full w-full">
      <ChangeView center={center} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline 
        positions={customData} 
        pathOptions={{ color: '#00b7ff', weight: 8, opacity: 0.8, lineJoin: 'round', lineCap: 'round' }} 
      />
      <Marker position={customData[0]} icon={icon} />
      <Marker position={customData[customData.length - 1]} icon={icon} />
    </MapContainer>
  );
}