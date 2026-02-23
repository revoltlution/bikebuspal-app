"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { BRANDING } from "@/src/lib/branding";

export default function TodayPage() {
  const [upcomingTrip, setUpcomingTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchTodayTrip = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Get today's date in YYYY-MM-DD format (matches HTML date inputs)
      const today = new Date().toISOString().split('T')[0];

      const q = query(
        collection(db, "trips"),
        where("participants", "array-contains", user.uid),
        // 2. Filter out the past
        where("date", ">=", today), 
        orderBy("date", "asc"),
        limit(1)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        setUpcomingTrip({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setUpcomingTrip(null); // Ensure state is cleared if no future trips
      }
    } catch (err) {
      console.error("Today Page Error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchTodayTrip();
}, []);

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-slate-300">Syncing...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 pb-32">
      
      {/* 1. WELCOME HEADER */}
      <section className="pt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
          Ready to Roll, <span className="text-blue-600">{auth.currentUser?.displayName?.split(' ')[0] || 'Rider'}</span>?
        </h1>
      </section>

      {/* 2. MAIN EVENT CARD */}
      {upcomingTrip ? (
        <Link href={`/schedule/${upcomingTrip.id}`}>
          <div className="relative group overflow-hidden bg-slate-900 rounded-[3rem] p-8 shadow-2xl transition-transform active:scale-[0.98]">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-10 -mt-10" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="px-4 py-1.5 bg-blue-600 rounded-full">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Upcoming Trip</p>
                </div>
                <p className="text-xl font-black text-white italic">{upcomingTrip.startTime}</p>
              </div>

              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                {upcomingTrip.title}
              </h2>

              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-rounded !text-sm">directions_bike</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{upcomingTrip.mode}</span>
                </div>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-rounded !text-sm">group</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{upcomingTrip.participants?.length || 0} Joined</span>
                </div>
              </div>

              <button className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl group-hover:bg-blue-50 transition-colors">
                View Route Details
              </button>
            </div>
          </div>
        </Link>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center">
          <span className="material-symbols-rounded text-slate-200 !text-6xl mb-4">calendar_today</span>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">No trips scheduled for today</p>
          <Link href="/discover" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">
            Find a Ride
          </Link>
        </div>
      )}

      {/* 3. QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => window.location.href='/toolbox/routes/create'} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-rounded">add_location</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Route</p>
        </button>

        <button onClick={() => window.location.href='/schedule/create'} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-rounded">event</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Trip</p>
        </button>
      </div>

    </div>
  );
}