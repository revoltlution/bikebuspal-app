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
  <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-100 flex flex-col">
    
    {/* 1. THE MAP BACKGROUND */}
    <div className="absolute inset-0 z-0">
      <MapControl customData={activeRoute?.coordinates || []} />
    </div>

    {/* 2. TOP OVERLAY: Filters, Profile, and Selector */}
    <div className="absolute top-0 left-0 right-0 z-[1001] p-4 pt-6 flex flex-col gap-3 pointer-events-none">
      <div className="flex justify-between items-center w-full">
        {!isLive && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto max-w-[85%]">
            {neighborhoods.map((n) => (
              <button
                key={n}
                onClick={() => setSelectedNeighborhood(n)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                  selectedNeighborhood === n
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white/80 backdrop-blur-md text-slate-500 border-white/20 shadow-lg"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <div className="pointer-events-auto bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/20">
          <span className="material-symbols-rounded text-slate-600">account_circle</span>
        </div>
      </div>

      {/* Mode Toggle & Dropdown Group */}
      <div className="w-full max-w-sm mx-auto pointer-events-auto flex flex-col gap-2">
        <div className="bg-white/70 backdrop-blur-lg p-1 rounded-2xl shadow-2xl border border-white/40">
          <div className="flex gap-1">
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
              LIVE RIDE
            </button>
          </div>
        </div>

        {/* NEW: Dropdown sits right under the buttons in Browse mode */}
        {!isLive && filteredRoutes.length > 0 && (
          <div className="relative animate-in slide-in-from-top-2 duration-300">
            <select
              value={selectedRouteId}
              onChange={(e) => updatePreference(e.target.value, isLive)}
              className="w-full bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20 text-sm font-bold text-slate-800 appearance-none focus:outline-none"
            >
              {filteredRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">unfold_more</span>
          </div>
        )}
      </div>
    </div>

    {/* 3. BOTTOM OVERLAY: Tools & Flexing Details */}
    {/* 'bottom-24' ensures this sits above your bottom navigation bar */}
    <div className="absolute bottom-24 left-4 right-4 z-[1002] flex flex-col pointer-events-none gap-4">
      
      {/* Action Buttons */}
      {!isLive && activeRoute && (
        <div className="flex justify-between items-end w-full pointer-events-auto">
          <div className="flex gap-2">
            <button onClick={shareRoute} className="w-12 h-12 bg-white/80 backdrop-blur-lg text-slate-600 rounded-2xl shadow-xl border border-white/40 flex items-center justify-center active:scale-95 transition-all">
              <span className="material-symbols-rounded">share</span>
            </button>
            {activeRoute?.createdBy === auth.currentUser?.uid && (
              <button onClick={() => deleteRoute(activeRoute.id)} className="w-12 h-12 bg-white/80 backdrop-blur-lg text-red-500 rounded-2xl shadow-xl border border-white/40 flex items-center justify-center active:scale-95 transition-all">
                <span className="material-symbols-rounded">delete</span>
              </button>
            )}
          </div>
          <button onClick={() => router.push("/routes/create")} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-all">
            <span className="material-symbols-rounded text-3xl">add</span>
          </button>
        </div>
      )}

      {/* Route Details "Dock" - Flexes up based on content */}
      <div className="pointer-events-auto bg-white/85 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/40">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
            {isLive ? "• Live Tracking Active" : "Route Details"}
          </p>
          <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tight leading-tight">
            {activeRoute?.name || "Select a Route"}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="material-symbols-rounded text-sm text-slate-400">location_on</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {activeRoute?.neighborhood || "Portland, OR"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
} // <--- This final bracket was missing!