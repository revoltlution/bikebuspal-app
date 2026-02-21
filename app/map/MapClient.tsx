"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

// Firebase Imports
import { db, auth } from "@/src/lib/firebase/client"; 
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";

// Your New Profile Helper
import { syncUserProfile } from "@/src/lib/firebase/profile";

interface MapPoint { lat: number; lng: number; }
interface MapControlProps { customData: MapPoint[]; }

const MapControl = dynamic<MapControlProps>(() => import("@/src/components/MapControl"), { 
  ssr: false,
  loading: () => <div className="h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading...</div>
});

export default function MapClient() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-slate-50 animate-pulse" />}>
      <MapClientContent />
    </Suspense>
  );
}

function MapClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");

  const shareRoute = () => {
    const activeRoute = routes.find(r => r.id === selectedRouteId);
    if (!activeRoute?.coordinates || activeRoute.coordinates.length === 0) return;

    const start = `${activeRoute.coordinates[0].lat},${activeRoute.coordinates[0].lng}`;
    const end = `${activeRoute.coordinates[activeRoute.coordinates.length - 1].lat},${activeRoute.coordinates[activeRoute.coordinates.length - 1].lng}`;
    
    const waypoints = activeRoute.coordinates
      .slice(1, -1)
      .map((p: any) => `${p.lat},${p.lng}`)
      .join('|');

    // FIXED: Cleaned up the URL template string
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}&waypoints=${waypoints}&travelmode=bicycling`;

    navigator.clipboard.writeText(googleMapsUrl);
    alert("Google Maps link copied to clipboard!");
  };

  const deleteRoute = async (id: string) => {
    if (!confirm("Delete this route forever?")) return;
    try {
      await deleteDoc(doc(db, "routes", id));
      const remainingRoutes = routes.filter(r => r.id !== id);
      setRoutes(remainingRoutes);
      const nextId = remainingRoutes[0]?.id || "";
      updatePreference(nextId, isLive);
      alert("Route deleted.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [userProfile, routesSnap] = await Promise.all([
          syncUserProfile(user), 
          getDocs(collection(db, "routes"))
        ]);

        const firestoreRoutes = routesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRoutes(firestoreRoutes);
        setProfile(userProfile);

        const savedId = userProfile?.preferences?.lastRouteId;
        const initialId = firestoreRoutes.some(r => r.id === savedId) 
          ? savedId 
          : firestoreRoutes[0]?.id || "";

        setSelectedRouteId(initialId);
        setIsLive(userProfile?.preferences?.isLive || false);
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updatePreference = async (routeId: string, live: boolean) => {
    setSelectedRouteId(routeId);
    setIsLive(live);

    if (auth.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          "preferences.lastRouteId": routeId,
          "preferences.isLive": live
        });
      } catch (err) {
        console.error("Pref Update Error:", err);
      }
    }
  };
  
  const neighborhoods = ["All", ...Array.from(new Set(routes.map(r => r.neighborhood).filter(Boolean)))];

  const filteredRoutes = selectedNeighborhood === "All" 
    ? routes 
    : routes.filter(r => r.neighborhood === selectedNeighborhood);
  
  const activeRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50">
      
      {/* 1. Neighborhood Filter - Only in Browse */}
      {!isLive && routes.length > 0 && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto pb-3 no-scrollbar shrink-0">
          {neighborhoods.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNeighborhood(n)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                selectedNeighborhood === n
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* 2. THE MAP ENGINE - Flex Fill */}
      <div 
        className={`relative transition-all duration-700 ease-in-out flex-grow ${
          isLive 
            ? 'm-0 rounded-none z-[2000]' 
            : 'mx-4 mb-2 rounded-3xl border border-slate-200 shadow-lg overflow-hidden'
        }`}
      >
        <MapControl customData={activeRoute?.coordinates || []} />

        {/* FLOATING HEADER - Frosted Glass */}
        <div className="absolute top-4 left-4 right-4 z-[2001] flex flex-col gap-2">
          <div className={`flex p-1 rounded-2xl shadow-xl border transition-all duration-500 ${
            isLive ? 'bg-white/70 backdrop-blur-md border-white/40' : 'bg-white/95 border-white/20'
          }`}>
            <button
              onClick={() => updatePreference(selectedRouteId, false)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!isLive ? "bg-blue-600 text-white shadow-md" : "text-slate-500"}`}
            >
              BROWSE
            </button>
            <button
              onClick={() => updatePreference(selectedRouteId, true)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isLive ? "bg-red-600 text-white shadow-md animate-pulse" : "text-slate-500"}`}
            >
              {isLive && <span className="inline-block w-2 h-2 rounded-full bg-white mr-2 animate-ping" />}
              LIVE RIDE
            </button>
          </div>

          {/* Floating Route Selector in Browse */}
          {!isLive && filteredRoutes.length > 0 && (
            <div className="relative">
              <select
                value={selectedRouteId}
                onChange={(e) => updatePreference(e.target.value, isLive)}
                className="w-full bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 text-sm font-bold text-slate-800 appearance-none"
              >
                {filteredRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* LIVE MODE TOOLS (Floating HUD) */}
        {isLive && (
          <div className="absolute bottom-8 left-4 right-4 z-[2001] animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-white/80 backdrop-blur-lg p-4 rounded-3xl border border-white/40 shadow-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Current Route</p>
                <h3 className="text-lg font-black italic uppercase leading-none">{activeRoute?.name || "Active Ride"}</h3>
              </div>
              <button 
                onClick={shareRoute}
                className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <span className="material-symbols-rounded">share</span>
              </button>
            </div>
          </div>
        )}

        {/* BROWSE MODE TOOLS (Corner Icons) */}
        {!isLive && activeRoute && (
          <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
            <button onClick={shareRoute} className="w-10 h-10 bg-white/90 backdrop-blur-md text-slate-600 rounded-full shadow-lg border border-white/20"><span className="material-symbols-rounded">share</span></button>
            {activeRoute?.createdBy === auth.currentUser?.uid && (
              <button onClick={() => deleteRoute(activeRoute.id)} className="w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-full shadow-lg border border-white/20"><span className="material-symbols-rounded">delete</span></button>
            )}
          </div>
        )}
        
        {!isLive && (
          <button onClick={() => router.push("/routes/create")} className="absolute bottom-4 right-4 z-[1000] w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl border-4 border-white/20"><span className="material-symbols-rounded">add</span></button>
        )}
      </div>

      {/* 3. INFO DRAWER (Bottom Section) - Shinks/Disappears in Live */}
      <div className={`transition-all duration-500 ease-in-out px-6 ${
        isLive ? 'h-0 opacity-0' : 'h-24 opacity-100 pt-2'
      }`}>
        <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tight leading-none">
          {activeRoute?.name || "No Route Selected"}
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          {activeRoute?.neighborhood || "Portland, OR"}
        </p>
      </div>
    </div>
  );
} // <--- This final bracket was missing!