"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/src/lib/firebase/client"; 
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

interface MapPoint { lat: number; lng: number; }
interface MapControlProps { customData: MapPoint[]; }

const MapControl = dynamic<MapControlProps>(() => import("@/src/components/MapControl"), { 
  ssr: false,
  loading: () => <div className="h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading...</div>
});

// 1. Export a default component with a Suspense boundary
export default function MapClient() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-slate-50 animate-pulse" />}>
      <MapClientContent />
    </Suspense>
  );
}

// 2. The main logic moves into this internal component
function MapClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // 3. Helper to update the URL and state simultaneously
  const handleRouteChange = (id: string) => {
    setSelectedRouteId(id);
    // Updates URL to /map?route=XYZ without a full page refresh
    router.push(`/map?route=${id}`, { scroll: false });
  };

  const shareRoute = () => {
    if (!activeRoute?.coordinates || activeRoute.coordinates.length === 0) return;

    // Google Maps uses 'lat,lng' format. 
    // We'll take the first point as start and last as end.
    const start = `${activeRoute.coordinates[0].lat},${activeRoute.coordinates[0].lng}`;
    const end = `${activeRoute.coordinates[activeRoute.coordinates.length - 1].lat},${activeRoute.coordinates[activeRoute.coordinates.length - 1].lng}`;
    
    // Create a waypoints string for everything in between
    const waypoints = activeRoute.coordinates
      .slice(1, -1)
      .map((p: any) => `${p.lat},${p.lng}`)
      .join('|');

    // Corrected URL line
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}&waypoints=${waypoints}&travelmode=bicycling`;

    // Copy to clipboard
    navigator.clipboard.writeText(googleMapsUrl);
    alert("Google Maps link copied to clipboard!");
  };

  const deleteRoute = async (id: string) => {
    if (!confirm("Delete this route forever?")) return;
    try {
      await deleteDoc(doc(db, "routes", id));
      const remainingRoutes = routes.filter(r => r.id !== id);
      setRoutes(remainingRoutes);
      // Fallback to first remaining route or empty
      const nextId = remainingRoutes[0]?.id || "";
      handleRouteChange(nextId);
      alert("Route deleted.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "routes"));
        const firestoreRoutes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRoutes(firestoreRoutes);

        // 1. Grab the ID from the URL
        const urlRouteId = searchParams.get("route");

        // 2. Priority Logic: 
        // If URL ID exists and matches a real route, use it.
        // Otherwise, fallback to the first route in the list.
        if (urlRouteId && firestoreRoutes.some(r => r.id === urlRouteId)) {
          setSelectedRouteId(urlRouteId);
        } else if (firestoreRoutes.length > 0) {
          setSelectedRouteId(firestoreRoutes[0].id);
          // Optional: Update URL to match the default selection
          router.replace(`/map?route=${firestoreRoutes[0].id}`, { scroll: false });
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
    // Adding searchParams to the dependency array ensures it re-syncs 
    // if the user hits the back/forward buttons
  }, [searchParams]);

  const activeRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="flex flex-col h-full px-4">
      <div className="w-full h-[60vh] rounded-3xl overflow-hidden relative shadow-lg border border-slate-200">
        <MapControl customData={activeRoute?.coordinates || []} />
        
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
          <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white/20">
            <button onClick={() => setIsLive(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!isLive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>BROWSE</button>
            <button onClick={() => setIsLive(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isLive ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}>LIVE RIDE</button>
          </div>

          {!isLive && routes.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <select 
                  value={selectedRouteId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 text-sm font-bold text-slate-800 appearance-none focus:outline-none"
                >
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">unfold_more</span>
              </div>

            {/* Container for Icon Buttons */}
            <div className="flex gap-2 mt-1">
              {/* Share Button (Always visible if a route is selected) */}
              {activeRoute && (
                <button 
                  onClick={shareRoute}
                  title="Share Google Maps Link"
                  className="flex-1 flex items-center justify-center bg-white/90 backdrop-blur-md text-slate-700 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-rounded text-xl">share</span>
                </button>
              )}

              {/* Delete Button (Owner Only) */}
              {activeRoute?.createdBy === auth.currentUser?.uid && (
                <button 
                  onClick={() => deleteRoute(activeRoute.id)}
                  title="Delete Route"
                  className="flex-1 flex items-center justify-center bg-red-500/10 backdrop-blur-md text-red-600 py-2 rounded-xl border border-red-200 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-rounded text-xl">delete</span>
                </button>
              )}
            </div>
        </div>

          )}
        </div>

        {!isLive && (
          <button onClick={() => router.push("/routes/create")} className="absolute bottom-6 right-6 z-[1000] flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white/20">
            <span className="material-symbols-rounded text-3xl">add</span>
          </button>
        )}
      </div>
      
      <div className="mt-6">
         <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tight">{loading ? "Loading..." : (activeRoute?.name || "No Routes")}</h2>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeRoute?.neighborhood || "St. Johns"}</p>
      </div>
    </div>
  );
}