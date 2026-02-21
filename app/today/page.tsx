"use client";

import { useState } from "react";
import Link from "next/link";

export default function TodayPage() {
  // Mocking an upcoming event for the MVP feel
  const [hasActiveEvent, setHasActiveEvent] = useState(true);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* 1. THE HERO: Current or Next Event */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-50" />
        
        <div className="relative z-10">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            {hasActiveEvent ? "Coming Up Now" : "Next Ride"}
          </p>
          
          <h2 className="text-3xl font-black italic uppercase leading-tight tracking-tighter">
            JJE Bike Bus <br />
            <span className="text-blue-500 text-xl tracking-normal not-italic font-bold">To Villain Crepes</span>
          </h2>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting</span>
              <span className="text-lg font-black">08:00 AM</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</span>
              <span className="text-lg font-black italic">George Park</span>
            </div>
          </div>

          {/* THE BIG ACTION */}
          {hasActiveEvent && (
            <Link 
              href="/map?mode=live&route=jje-villain"
              className="mt-8 flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              <span className="material-symbols-rounded animate-pulse">sensors</span>
              Go Live Now
            </Link>
          )}
        </div>
      </section>

      {/* 2. SECONDARY ACTIONS: Community Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-blue-600 mb-2">group</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendees</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1">12 Riders</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-amber-500 mb-2">warning</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leader</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1 uppercase italic">Needed</p>
        </div>
      </div>

      {/* 3. QUICK NAV TO GEAR/FOUNDATION */}
      <Link href="/gear" className="flex items-center justify-between p-5 bg-slate-100 rounded-2xl border border-slate-200 group">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-slate-500 group-hover:text-blue-600 transition-colors">handyman</span>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">Prepare your gear</span>
        </div>
        <span className="material-symbols-rounded text-slate-400">chevron_right</span>
      </Link>
    </div>
  );
}