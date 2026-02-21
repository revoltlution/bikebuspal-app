"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Helper component to handle the "FlyTo" animation
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

const routesData = {
  jje_george_park: [
    [45.5946, -122.7565], // Burr & Hudson (Start)
    [45.5925, -122.7565], // Burr & Seneca
    [45.5925, -122.7551], // Seneca & Charleston
    [45.5898, -122.7551], // Charleston (JJE / Library)
  ] as [number, number][],

  jje_jersey: [
    [45.5975, -122.7565], // Burr & Willamette (Start)
    [45.5958, -122.7565], // Burr & Jersey
    [45.5958, -122.7551], // Jersey & Charleston
    [45.5898, -122.7551], // Charleston (End)
  ] as [number, number][],

  jje_columbia_collective: [
    [45.5941, -122.7420], // Taft Ave (East of Columbia Way)
    [45.5930, -122.7420], // Taft & Cecelia
    [45.5930, -122.7455], // Cecelia & Macrum
    [45.5910, -122.7455], // Macrum & Fessenden
    [45.5895, -122.7455], // Macrum & Seneca
    [45.5895, -122.7485], // Seneca & Minerva
    [45.5885, -122.7485], // Minerva & Gilbert
    [45.5875, -122.7485], // Gilbert & Central
    [45.5875, -122.7565], // Central & Burr
    [45.5946, -122.7565], // Burr & Hudson (Joins George Park)
  ] as [number, number][],

  alameda: [
    [45.541, -122.635],
    [45.541, -122.630],
    [45.545, -122.630],
    [45.548, -122.625],
  ] as [number, number][]
};

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapControl({ activeRoute = 'jje_george_park' }: { activeRoute: string }) {
  const currentRoute = routesData[activeRoute as keyof typeof routesData] || routesData.jje_george_park;
  const center = currentRoute[0];

  return (
    <MapContainer center={center} zoom={15} className="h-full w-full">
      <ChangeView center={center} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline 
        positions={currentRoute} 
        pathOptions={{ color: '#FFD700', weight: 8, opacity: 0.8, lineJoin: 'round', lineCap: 'round' }} 
      />
      <Marker position={currentRoute[0]} icon={icon} />
      <Marker position={currentRoute[currentRoute.length - 1]} icon={icon} />
    </MapContainer>
  );
}