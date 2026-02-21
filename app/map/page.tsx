// app/map/page.tsx
import MapClient from "./MapClient";

export default function MapPage() {
  // Temporary hardcoded data to verify the deploy works
  const dummyRoutes = {
    jje_george_park: [
      [45.590217, -122.740359], [45.592194, -122.739349], [45.593156, -122.740034],
      [45.593468, -122.741440], [45.594054, -122.743788], [45.594709, -122.746600],
      [45.595168, -122.748508], [45.593768, -122.749336], [45.591243, -122.750748],
      [45.590026, -122.751531], [45.589934, -122.751592]
    ]
  };

  return <MapClient initialRoutes={dummyRoutes} />;
}