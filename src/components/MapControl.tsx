"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sample Portland Bike Bus Route (e.g., around Alameda/Sitton area)
const bikeBusRoute = [
  [45.541, -122.635],
  [45.541, -122.630],
  [45.545, -122.630],
  [45.548, -122.625],
] as [number, number][];

const yellowOptions: L.PathOptions = { 
  color: '#FFD700', // Bike Bus Yellow
  weight: 8, 
  opacity: 0.8,
  lineJoin: 'round',
  lineCap: 'round' // Added for smoother ends on the segments
};

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapControl({ center = [45.541, -122.635] as [number, number] }) {
  return (
    <MapContainer 
      center={center} 
      zoom={15} 
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* The Bike Bus Yellow Line */}
      <Polyline pathOptions={yellowOptions} positions={bikeBusRoute} />

      {/* Starting Point Marker */}
      <Marker position={bikeBusRoute[0]} icon={icon} />
    </MapContainer>
  );
}