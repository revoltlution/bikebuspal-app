"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function SchedulePage() {
  const [scheduledEvents, setScheduledEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      // In MVP, we fetch all routes you've "starred" or simply all active community routes
      const q = query(collection(db, "routes")); 
      const snap = await getDocs(q);
      const routes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Virtual logic: Assume every Tuesday for James John
      const instances = routes.map(r => ({
        ...r,
        nextDate: "Tuesday, Feb 24", // Mocked date logic for MVP
        time: "08:00 AM"
      }));
      
      setScheduledEvents(instances);
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <header className="px-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
          My <br/>Commitments
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
          Your favorited and joined rides
        </p>
      </header>

      {/* TIMELINE SECTION */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <span className="h-px bg-slate-200 flex-grow" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">This Week</span>
          <span className="h-px bg-slate-200 flex-grow" />
        </div>

        {scheduledEvents.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <span className="material-symbols-rounded text-slate-300 !text-5xl mb-4">calendar_today</span>
             <p className="font-black italic uppercase text-slate-400">Empty Schedule</p>
             <Link href="/discover" className="text-blue-600 text-[10px] font-black uppercase mt-2 block">Find a route</Link>
          </div>
        ) : (
          scheduledEvents.map((event, idx) => (
            <div key={event.id} className="relative flex gap-4 group">
              {/* Date Indicator Side-Pill */}
              <div className="flex flex-col items-center shrink-0 w-12 pt-1">
                <span className="text-[10px] font-black text-blue-600 uppercase">Feb</span>
                <span className="text-2xl font-black leading-none">24</span>
              </div>

              {/* Event Card */}
              <Link href={`/map?route=${event.id}`} className="flex-grow bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black italic uppercase text-slate-900 leading-tight">
                    {event.name || "Unnamed Route"}
                  </h3>
                  <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-tighter">
                    {event.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="material-symbols-rounded !text-sm">location_on</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                    {event.neighborhood || "Portland"}
                  </span>
                </div>
              </Link>
            </div>
          ))
        )}
      </section>

      {/* CTA: DISCOVER MORE */}
      <section className="px-2">
        <Link href="/discover" className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-xl transition-all active:scale-95">
          <span className="material-symbols-rounded">search</span>
          Explore Community Events
        </Link>
      </section>
    </div>
  );
}