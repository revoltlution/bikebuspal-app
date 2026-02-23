"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";
import Link from "next/link";

interface Trip {
  id: string;
  title: string;
  date: string;
  startTime: string;
  mode: 'bicycle' | 'walking' | 'transit' | 'carpool';
  leaderId: string;
  isLeader: boolean;
  isCarbonSaving: boolean;
}

const MODE_ICONS = {
  bicycle: { icon: 'directions_bike', color: 'text-blue-600' },
  walking: { icon: 'directions_walk', color: 'text-emerald-600' },
  transit: { icon: 'directions_bus', color: 'text-purple-600' },
  carpool: { icon: 'directions_car', color: 'text-orange-600' }
};



export default function SchedulePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  // Inside SchedulePage component
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  // Split the trips based on date
  const now = new Date();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTrips = trips.filter(t => t.date >= todayStr);
  const pastTrips = trips.filter(t => t.date < todayStr);

  const displayTrips = filter === 'upcoming' ? upcomingTrips : pastTrips;

  useEffect(() => {
    const fetchTrips = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "rides"),
          where("participants", "array-contains", user.uid),
          orderBy("date", "asc")
        );

        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isLeader: doc.data().leaderId === user.uid
        })) as Trip[];

        setTrips(fetched);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300 tracking-widest">Syncing {BRANDING.term.events}...</div>;

  return (
    <div className="flex-1 px-6 pb-32 mt-6 animate-in fade-in duration-500">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Your {BRANDING.term.events}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{BRANDING.motto}</p>
        </div>
        <Link href="/schedule/create" className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-transform">
          <span className="material-symbols-rounded">add</span>
        </Link>
      </div>

      {/* --- TAB SWITCHER (NEW LOCATION) --- */}
      <div className="flex p-1 bg-slate-200/50 rounded-[1.5rem] mb-8 w-fit">
        <button 
          onClick={() => setFilter('upcoming')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            filter === 'upcoming' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
          }`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setFilter('past')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            filter === 'past' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
          }`}
        >
          Past {BRANDING.term.events}
        </button>
      </div>

      {/* --- TRIPS LIST --- */}
      {displayTrips.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
          <span className="material-symbols-rounded text-4xl text-slate-200 mb-4">calendar_today</span>
          <p className="font-bold text-slate-400 uppercase text-xs tracking-tight">
            No {filter} {BRANDING.term.events.toLowerCase()} found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayTrips.map(trip => { // Use displayTrips here!
            const mode = MODE_ICONS[trip.mode] || MODE_ICONS.bicycle;
            return (
              <Link key={trip.id} href={`/schedule/${trip.id}`} className="block group">
                {/* ... Card Content ... */}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}