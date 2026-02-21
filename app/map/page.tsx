"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// This is the "magic" for Next.js and Maps. 
// We load the Map component only on the client side.
const MapControl = dynamic(() => import("../../src/components/MapControl"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 animate-pulse">
      <span className="material-symbols-rounded text-4xl text-slate-300">map</span>
      <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest">INITIALIZING MAP...</p>
    </div>
  )
});

export default function MapPage() {
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Map Viewport Container */}
      <div className="w-full h-[60vh] rounded-3xl overflow-hidden relative shadow-lg border border-slate-200 bg-slate-50">
        
        <MapControl />
        
        {/* Floating Toggle Overlay */}
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

      {/* Dynamic Bottom Sheet UI */}
      <section className="mt-8 px-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
            {isLive ? "Live Tools" : "Nearby Routes"}
          </h2>
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-red-600 animate-pulse">LIVE SIGNAL</span>
              <span className="flex h-2 w-2 rounded-full bg-red-600"></span>
            </div>
          )}
        </div>

        {isLive ? (
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-rounded text-amber-500 mb-1">running_with_errors</span>
              <span className="text-[10px] font-black text-slate-700">RUNNING LATE</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-rounded text-blue-500 mb-1">share_location</span>
              <span className="text-[10px] font-black text-slate-700">SHARE GPS</span>
            </button>
            <button className="col-span-2 flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl active:scale-95 transition-transform text-red-700">
              <span className="material-symbols-rounded font-bold">emergency</span>
              <span className="text-xs font-black uppercase">Request Urgent Help</span>
            </button>
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 font-medium italic">
              Tap a route on the map to see specific stops and times.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}