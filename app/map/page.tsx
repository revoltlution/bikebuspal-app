"use client";

import { useState } from "react";

export default function MapPage() {
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* 1. Map Container - Placeholder for now */}
      <div className="w-full h-[60vh] bg-slate-200 rounded-3xl overflow-hidden relative shadow-inner border border-slate-300">
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
          <span className="material-symbols-rounded text-6xl">map</span>
          <p className="font-bold italic">Map Loading...</p>
        </div>
        
        {/* Floating Toggle for Browse/Live */}
        <div className="absolute top-4 left-4 right-4 flex bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-white/20">
          <button 
            onClick={() => setIsLive(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${!isLive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            BROWSE
          </button>
          <button 
            onClick={() => setIsLive(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${isLive ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            LIVE RIDE
          </button>
        </div>
      </div>

      {/* 2. Bottom Sheet UI */}
      <section className="mt-6 stack gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight">
            {isLive ? "Live Tools" : "Nearby Routes"}
          </h2>
          {isLive && <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping"></span>}
        </div>

        {isLive ? (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn p-4 flex flex-col items-center gap-2 bg-white border-slate-200">
              <span className="material-symbols-rounded text-amber-500">running_with_errors</span>
              <span className="text-[10px] font-bold uppercase">Late</span>
            </button>
            <button className="btn p-4 flex flex-col items-center gap-2 bg-white border-slate-200">
              <span className="material-symbols-rounded text-blue-500">upload_file</span>
              <span className="text-[10px] font-bold uppercase">Share GPS</span>
            </button>
            <button className="btn p-4 flex flex-col items-center gap-2 bg-white border-slate-200 col-span-2">
              <span className="material-symbols-rounded text-red-600">emergency</span>
              <span className="text-[10px] font-bold uppercase">Request Help</span>
            </button>
          </div>
        ) : (
          <div className="card bg-white p-4">
            <p className="text-sm text-slate-500 italic">Select a route above to see its path and stops here.</p>
          </div>
        )}
      </section>
    </div>
  );
}