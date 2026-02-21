"use client";

import dynamic from "next/dynamic";
// 1. Ensure useState is imported
import { useState } from "react";

// 2. Define the props for MapControl so the dynamic loader knows what to expect
interface MapControlProps {
  activeRoute: string;
}

const MapControl = dynamic<MapControlProps>(
  () => import("../../src/components/MapControl"), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-100 animate-pulse">
        <p className="text-xs font-black text-slate-400">LOADING MAP...</p>
      </div>
    )
  }
);

export default function MapPage() {
  const [isLive, setIsLive] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("jje_george_park");

  const routes = [
    { id: "jje_george_park", name: "JJE: George Park", neighborhood: "St. Johns" },
    { id: "jje_jersey", name: "JJE: Jersey St", neighborhood: "St. Johns" },
    { id: "jje_columbia_collective", name: "JJE: Columbia Collective", neighborhood: "St. Johns" },
    { id: "alameda", name: "Alameda Route", neighborhood: "NE Portland" }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="w-full h-[60vh] rounded-3xl overflow-hidden relative shadow-lg border border-slate-200">
        <MapControl activeRoute={selectedRoute} />
        
        {/* Combined Overlay Header */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Mode Toggle */}
          <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white/20">
            <button onClick={() => setIsLive(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${!isLive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>BROWSE</button>
            <button onClick={() => setIsLive(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isLive ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}>LIVE RIDE</button>
          </div>

          {/* Route Dropdown (Only shows in Browse mode) */}
          {!isLive && (
            <div className="relative">
              <select 
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 text-sm font-bold text-slate-800 appearance-none focus:outline-none ring-2 ring-transparent focus:ring-blue-500/20"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">unfold_more</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom section can now be dedicated to Stops & Times for the selected route */}
    </div>
  );
}