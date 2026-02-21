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
  [45.590217, -122.740359], [45.592194, -122.739349], [45.593156, -122.740034],
  [45.593468, -122.741440], [45.594054, -122.743788], [45.594709, -122.746600],
  [45.595168, -122.748508], [45.593768, -122.749336], [45.591243, -122.750748],
  [45.590026, -122.751531], [45.589934, -122.751592]
] as [number, number][],

  jje_jersey: [
    [45.5975, -122.7554], // N Burr Ave & N Willamette Blvd (Start)
    [45.5958, -122.7554], // N Burr Ave & N Jersey St
    [45.5958, -122.7538], // N Jersey St & N Charleston Ave
    [45.5898, -122.7538], // N Charleston Ave (End)
  ] as [number, number][],

  jje_columbia_collective: [
    [45.5942, -122.7410], // N Taft Ave (East of Columbia Way)
    [45.5931, -122.7410], // N Taft Ave & N Cecelia St
    [45.5931, -122.7445], // N Cecelia St & N Macrum Ave
    [45.5912, -122.7445], // N Macrum Ave & N Fessenden St
    [45.5895, -122.7445], // N Macrum Ave & N Seneca St
    [45.5895, -122.7475], // N Seneca St & N Minerva Ave
    [45.5885, -122.7475], // N Minerva Ave & N Gilbert Ave
    [45.5875, -122.7475], // N Gilbert Ave & N Central St
    [45.5875, -122.7554], // N Central St & N Burr Ave
    [45.5946, -122.7554], // N Burr Ave & N Hudson St (Joins George Park)
  ] as [number, number][],

  alameda: [
    [45.5482, -122.6305], // NE 24th & Fremont (Example start)
    [45.5482, -122.6255], 
    [45.5415, -122.6255],
    [45.5415, -122.6355],
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
        pathOptions={{ color: '#00b7ff', weight: 8, opacity: 0.8, lineJoin: 'round', lineCap: 'round' }} 
      />
      <Marker position={currentRoute[0]} icon={icon} />
      <Marker position={currentRoute[currentRoute.length - 1]} icon={icon} />
    </MapContainer>
  );
}