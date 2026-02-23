"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";

interface Trip {
  id: string;
  title: string;
  date: string;
  startTime: string;
  mode: string;
  participants: string[];
}

export default function SchedulePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // NORMALIZED: Query the 'trips' collection
        const q = query(
          collection(db, "trips"),
          where("date", ">=", today),
          orderBy("date", "asc")
        );

        const snap = await getDocs(q);
        const fetchedTrips = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Trip));

        setTrips(fetchedTrips);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-300 animate-pulse">Syncing Timeline...</div>;

  return (
    <div className="flex-1 p-6 pb-32 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Schedule</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upcoming Neighborhood Trips</p>
        </div>
        <Link 
          href="/schedule/create"
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
        >
          <span className="material-symbols-rounded">add</span>
        </Link>
      </header>

      <div className="space-y-4">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <Link 
              key={trip.id} 
              href={`/schedule/${trip.id}`}
              className="block bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                    {new Date(trip.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mt-1">{trip.title}</h3>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-400 border border-slate-100">
                  {trip.startTime}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-slate-300 !text-sm">group</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {trip.participants?.length || 0} Joined
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="material-symbols-rounded text-slate-300 !text-sm">
                    {trip.mode === 'walking' ? 'directions_walk' : 'directions_bike'}
                   </span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">{trip.mode}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <p className="text-slate-400 font-bold uppercase text-xs">No trips scheduled yet</p>
            <Link href="/schedule/create" className="text-blue-600 font-black italic uppercase text-sm underline">
              Create the first one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}