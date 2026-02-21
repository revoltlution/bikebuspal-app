"use client";

import Link from "next/link";
import { auth } from "@/src/lib/firebase/client";

export default function ToolboxPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      
      {/* SECTION: BUILD */}
      <section>
        <div className="flex items-center gap-2 px-2 mb-4">
          <span className="material-symbols-rounded text-blue-600 !text-lg">construct</span>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Infrastructure</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link href="/routes/create" className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="material-symbols-rounded">add_road</span>
              </div>
              <div>
                <p className="font-black italic uppercase text-slate-900 leading-none">New Route</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Upload GPX or Draw</p>
              </div>
            </div>
            <span className="material-symbols-rounded text-slate-300">chevron_right</span>
          </Link>

          <Link href="/groups/create" className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <span className="material-symbols-rounded">group_add</span>
              </div>
              <div>
                <p className="font-black italic uppercase text-slate-900 leading-none">New Group</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Found a community</p>
              </div>
            </div>
            <span className="material-symbols-rounded text-slate-300">chevron_right</span>
          </Link>

          <Link href="/events/create" className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <span className="material-symbols-rounded">calendar_add_on</span>
            </div>
            <div>
              <p className="font-black italic uppercase text-slate-900 leading-none">Schedule a Ride</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Create a one-time or recurring event</p>
            </div>
          </div>
          <span className="material-symbols-rounded text-slate-300">chevron_right</span>
        </Link>
        </div>
      </section>

      {/* SECTION: MANAGEMENT */}
      <section>
        <div className="flex items-center gap-2 px-2 mb-4">
          <span className="material-symbols-rounded text-slate-500 !text-lg">inventory_2</span>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">The Workshop</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/toolbox/routes" className="p-6 bg-slate-100 rounded-[2rem] flex flex-col gap-4 active:scale-95 transition-all">
            <span className="material-symbols-rounded text-slate-600">directions_bike</span>
            <p className="font-black italic uppercase text-slate-900 text-sm leading-none">My <br/>Routes</p>
          </Link>
          <Link href="/toolbox/groups" className="p-6 bg-slate-100 rounded-[2rem] flex flex-col gap-4 active:scale-95 transition-all">
            <span className="material-symbols-rounded text-slate-600">hub</span>
            <p className="font-black italic uppercase text-slate-900 text-sm leading-none">My <br/>Groups</p>
          </Link>
        </div>
      </section>

      {/* SECTION: SYSTEM */}
      <section className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col">
          <Link href="/settings/profile" className="flex items-center gap-4 p-4 text-slate-400 hover:text-slate-900 transition-all group">
            <span className="material-symbols-rounded">settings</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Account Settings</span>
          </Link>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-4 p-4 text-red-500/40 hover:text-red-600 transition-all"
          >
            <span className="material-symbols-rounded">logout</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Shutdown Session</span>
          </button>
        </div>
      </section>
    </div>
  );
}