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
    { id: "jje_george_park", name: "George Park Route", neighborhood: "St. Johns" },
    { id: "jje_jersey", name: "Jersey St Route", neighborhood: "St. Johns" },
    { id: "jje_columbia_collective", name: "Columbia Collective", neighborhood: "St. Johns" },
    { id: "alameda", name: "Alameda Route", neighborhood: "NE Portland" }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="w-full h-[55vh] rounded-3xl overflow-hidden relative shadow-lg">
        {/* activeRoute is now recognized by the IDE */}
        <MapControl activeRoute={selectedRoute} />
        
        <div className="absolute top-4 left-4 right-4 z-[1000] flex bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white/20">
          <button 
            onClick={() => setIsLive(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
              !isLive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            BROWSE
          </button>
          <button 
            onClick={() => setIsLive(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
              isLive ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            LIVE RIDE
          </button>
        </div>
      </div>

      <section className="mt-8 px-2">
        <h2 className="text-xl font-black mb-4 italic uppercase text-slate-900">
          {isLive ? "Live Tools" : "Nearby Routes"}
        </h2>
        
        <div className="stack gap-3">
          {!isLive ? (
            routes.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                className={`card flex items-center justify-between p-4 transition-all ${
                  selectedRoute === route.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'bg-white border-slate-100'
                }`}
              >
                <div className="text-left">
                  <p className="font-black text-slate-900 leading-tight">{route.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{route.neighborhood}</p>
                </div>
                <span className={`material-symbols-rounded ${selectedRoute === route.id ? 'text-blue-600' : 'text-slate-300'}`}>
                  {selectedRoute === route.id ? 'check_circle' : 'arrow_forward_ios'}
                </span>
              </button>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform">
                <span className="material-symbols-rounded text-amber-500 mb-2">schedule</span>
                <span className="text-[10px] font-black uppercase">Running Late</span>
              </button>
              <button className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform">
                <span className="material-symbols-rounded text-blue-500 mb-2">my_location</span>
                <span className="text-[10px] font-black uppercase">Share GPS</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}