"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // FIXED: Missing Import

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

    // FIXED: Correct Google Maps Directions URL
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
  const filteredRoutes = selectedNeighborhood === "All" ? routes : routes.filter(r => r.neighborhood === selectedNeighborhood);
  const activeRoute = routes.find(r => r.id === selectedRouteId);

  return (
  /* 1. MAIN CONTAINER: Absolute fill, locked to viewport */
  <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-100 flex flex-col">
    
    {/* 2. THE BACKGROUND MAP: Full screen underlay */}
    <div className="absolute inset-0 z-0">
      <MapControl customData={activeRoute?.coordinates || []} />
    </div>

    {/* 3. TOP OVERLAY: Mode Toggles & In-Line Selector */}
    <div className="absolute top-0 left-0 right-0 z-[1001] p-4 pt-6 flex flex-col gap-3 pointer-events-none">
      
      {/* HEADER ROW: Centered Toggles + Locked Profile Circle */}
      <div className="flex items-center w-full gap-2">
        {/* Left Spacer to maintain perfect center for toggles */}
        <div className="w-10 h-10 shrink-0" /> 

        {/* Centered Mode Toggle - Thin Glass */}
        <div className="flex-grow flex justify-center pointer-events-auto">
          <div className="w-full max-w-[200px] bg-white/30 backdrop-blur-xl p-1 rounded-xl shadow-xl border border-white/30 flex gap-1">
            <button 
              onClick={() => updatePreference(selectedRouteId, false)} 
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${
                !isLive ? "bg-blue-600 text-white shadow-md" : "text-slate-600"
              }`}
            >
              BROWSE
            </button>
            <button 
              onClick={() => updatePreference(selectedRouteId, true)} 
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${
                isLive ? "bg-red-600 text-white shadow-md animate-pulse" : "text-slate-600"
              }`}
            >
              LIVE
            </button>
          </div>
        </div>

        {/* Profile Icon - Locked Circle */}
        <div className="w-10 h-10 shrink-0 flex justify-end pointer-events-auto">
          <Link href="/settings/profile" className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-full shadow-lg border border-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-rounded text-slate-700 !text-2xl">account_circle</span>
          </Link>
        </div>
      </div>

      {/* IN-LINE SELECTOR & NEIGHBORHOOD FILTER - Thin Glass */}
      {!isLive && (
        <div className="flex gap-2 w-full max-w-md mx-auto pointer-events-auto animate-in slide-in-from-top-2">
          {/* Neighborhood Pill Selector */}
          <div className="flex-shrink-0">
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="h-10 px-3 bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl border-none appearance-none focus:outline-none"
            >
              {neighborhoods.map(n => <option key={n} value={n}>{n.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Route Selector - Integrated Glass */}
          <div className="relative flex-grow min-w-0">
            <select
              value={selectedRouteId}
              onChange={(e) => updatePreference(e.target.value, isLive)}
              className="w-full h-10 bg-white/40 backdrop-blur-xl px-4 rounded-xl shadow-xl border border-white/30 text-[11px] font-bold text-slate-800 appearance-none focus:outline-none truncate pr-8"
            >
              {filteredRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 !text-sm">unfold_more</span>
          </div>
        </div>
      )}
    </div>

    {/* 4. BOTTOM OVERLAY: Minimal Tools & Slim Glass Dock */}
    {/* bottom-24 buffer to stay clear of the RootLayout nav items */}
    <div className="absolute bottom-24 left-4 right-4 z-[1002] flex flex-col pointer-events-none gap-2">
      
      {/* Floating Action Buttons */}
      {!isLive && activeRoute && (
        <div className="flex justify-between items-end w-full pointer-events-auto px-1">
          <div className="flex gap-1.5">
            <button onClick={shareRoute} className="w-9 h-9 bg-white/40 backdrop-blur-md text-slate-700 rounded-lg shadow-lg border border-white/30 flex items-center justify-center active:scale-95 transition-all">
              <span className="material-symbols-rounded !text-lg text-slate-800">share</span>
            </button>
            {activeRoute?.createdBy === auth.currentUser?.uid && (
              <button onClick={() => deleteRoute(activeRoute.id)} className="w-9 h-9 bg-white/20 backdrop-blur-md text-red-600 rounded-lg shadow-lg border border-red-500/20 flex items-center justify-center active:scale-95 transition-all">
                <span className="material-symbols-rounded !text-lg">delete</span>
              </button>
            )}
          </div>
          <button onClick={() => router.push("/routes/create")} className="w-11 h-11 bg-blue-600 text-white rounded-lg shadow-xl flex items-center justify-center active:scale-95 transition-all">
            <span className="material-symbols-rounded text-2xl">add</span>
          </button>
        </div>
      )}

      {/* ULTRA SLIM GLASS DOCK */}
      <div className="pointer-events-auto bg-white/30 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-2xl border border-white/40 max-w-sm mx-auto w-full transition-all duration-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            {isLive && (
              <div className="flex items-center gap-1 mb-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                </span>
                <span className="text-[8px] font-black text-red-700 uppercase tracking-tighter">Live Ride</span>
              </div>
            )}
            <h2 className="text-[11px] font-black italic uppercase text-slate-900 tracking-tight leading-none truncate">
              {activeRoute?.name || "Select Route"}
            </h2>
          </div>

          {/* Minimal Ride Icon badge */}
          <div className="flex items-center shrink-0 bg-blue-600/10 px-2 py-1 rounded-md border border-blue-600/20">
             <span className="material-symbols-rounded text-blue-700 !text-base">directions_bike</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}