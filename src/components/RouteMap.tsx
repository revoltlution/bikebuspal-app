"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface RouteMapProps {
  coordinates: [number, number][]; // [[lng, lat], ...]
  zoom?: number;
}

export default function RouteMap({ coordinates, zoom = 14 }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Clean, high-contrast style
      center: coordinates[0],
      zoom: zoom,
      interactive: false // Keep it static for the header
    });

    map.current.on('load', () => {
      // Add the Route Line
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2563eb', // Blue-600
          'line-width': 6,
          'line-opacity': 0.8
        },
      });

      // Fit map to the route
      const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
      for (const coord of coordinates) {
        bounds.extend(coord);
      }
      map.current?.fitBounds(bounds, { padding: 40, animate: false });
    });
  }, [coordinates, zoom]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}