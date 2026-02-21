"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
// 1. Added auth, deleteDoc, and doc imports
import { db, auth } from "@/src/lib/firebase/client"; 
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

interface MapPoint {
  lat: number;
  lng: number;
}

interface MapControlProps {
  customData: MapPoint[];
}

const MapControl = dynamic<MapControlProps>(() => import("@/src/components/MapControl"), { 
  ssr: false,
  loading: () => <div className="h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading...</div>
});

export default function MapClient({ initialRoutes = {} }: { initialRoutes?: any }) {
  const router = useRouter();
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // 2. Moved deleteRoute INSIDE the component to access setRoutes
  const deleteRoute = async (id: string) => {
    if (!confirm("Delete this route forever?")) return;
    
    try {
      await deleteDoc(doc(db, "routes", id));
      // Update local state so the route disappears immediately
      setRoutes(prev => prev.filter(r => r.id !== id));
      setSelectedRouteId(routes.find(r => r.id !== id)?.id || "");
      alert("Route deleted successfully.");
    } catch (err: any) {
      alert("Error deleting route: " + err.message);
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
        
        if (firestoreRoutes.length > 0) {
          setRoutes(firestoreRoutes);
          setSelectedRouteId(firestoreRoutes[0].id);
        }
      } catch (err) {
        console.error("Firestore fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, []);

  const activeRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="flex flex-col h-full px-4">
      <div className="w-full h-[60vh] rounded-3xl overflow-hidden relative shadow-lg border border-slate-200">
        <MapControl customData={activeRoute?.coordinates || []} />
        
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
          {/* ... Browse/Live Toggle ... */}
          <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white/20">
            <button onClick={() => setIsLive(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!isLive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>BROWSE</button>
            <button onClick={() => setIsLive(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isLive ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}>LIVE RIDE</button>
          </div>

          {!isLive && routes.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <select 
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 text-sm font-bold text-slate-800 appearance-none focus:outline-none"
                >
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">unfold_more</span>
              </div>

              {/* 3. Delete button logic - using auth.currentUser.uid */}
              {activeRoute?.createdBy === auth.currentUser?.uid && (
                <button 
                  onClick={() => deleteRoute(activeRoute.id)}
                  className="bg-red-500/10 backdrop-blur-md text-red-600 py-2 rounded-xl text-[10px] font-black tracking-widest border border-red-200 shadow-sm transition-all active:scale-95"
                >
                  DELETE THIS ROUTE
                </button>
              )}
            </div>
          )}
        </div>

        {/* ... FAB Button ... */}
        {!isLive && (
          <button onClick={() => router.push("/routes/create")} className="absolute bottom-6 right-6 z-[1000] flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all border-4 border-white/20">
            <span className="material-symbols-rounded text-3xl">add</span>
          </button>
        )}
      </div>
      
      {/* ... Route Info Section ... */}
      <div className="mt-6">
         <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tight">{loading ? "Loading..." : (activeRoute?.name || "No Routes")}</h2>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeRoute?.neighborhood || "St. Johns"}</p>
      </div>
    </div>
  );
}