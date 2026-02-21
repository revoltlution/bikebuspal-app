"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";

export default function TodayPage() {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMission = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Find the next event you've joined
        const q = query(
          collection(db, "events"),
          where("riders", "array-contains", user.uid),
          where("dateTime", ">=", Timestamp.now()),
          orderBy("dateTime", "asc"),
          limit(1)
        );

        const snap = await getDocs(q);
        if (!snap.empty) {
          setEvent({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error("Mission Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged(() => fetchMission());
    return () => unsub();
  }, []);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-400 animate-pulse">Scanning Horizon...</div>;

  // Determine if the event is actually "Today"
  const isToday = event && new Date(event.dateTime.toDate()).toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-40 pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            {isToday ? "Active Mission" : "Upcoming Mission"}
          </p>
          
          <h2 className="text-3xl font-black italic uppercase leading-[0.9] tracking-tighter">
            {event?.routeName?.split(' - ')[0] || "No Active"} <br />
            <span className="text-blue-500 text-xl tracking-normal not-italic font-bold">
              {event?.routeName?.split(' - ')[1] || "Missions"}
            </span>
          </h2>

          {event ? (
            <>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                    {isToday ? "Meeting" : event.dateTime.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xl font-black italic">
                    {event.dateTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</span>
                  <span className="text-xl font-black italic uppercase text-blue-400">
                    {isToday ? "Ready" : "Scheduled"}
                  </span>
                </div>
              </div>

              <Link 
                href={`/map?mode=live&route=${event.routeId}&event=${event.id}`}
                className={`mt-8 flex items-center justify-center gap-3 w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
                  isToday ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40" : "bg-slate-800 text-slate-400"
                }`}
              >
                <span className="material-symbols-rounded animate-pulse">sensors</span>
                {isToday ? "Go Live Now" : "View Route Details"}
              </Link>
            </>
          ) : (
            <Link href="/discover" className="mt-8 block text-center text-xs font-black uppercase tracking-widest text-slate-500 border border-slate-800 p-4 rounded-xl">
              Find a ride to get started
            </Link>
          )}
        </div>
      </section>

      {/* RIDER STATS - Dynamically showing event data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-blue-600 mb-2">group</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Riders</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1">
            {event?.riders?.length || 0} Joined
          </p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-amber-500 mb-2">warning</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leader</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1 uppercase italic">
            {event?.leaderId ? "Confirmed" : "Needed"}
          </p>
        </div>
      </div>

      <Link href="/toolbox" className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-200 group active:scale-95 transition-all">
        <div className="flex items-center gap-4">
          <span className="material-symbols-rounded text-slate-400 group-hover:text-blue-600 transition-colors">handyman</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 leading-none">Audit your toolbox</span>
        </div>
        <span className="material-symbols-rounded text-slate-300">chevron_right</span>
      </Link>
    </div>
  );
}