"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import JoinButton from "@/src/components/JoinButton"; // Assuming you saved the join button there

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        // Query upcoming events
        // In app/discover/page.tsx
        const q = query(
        collection(db, "events"),
        where("status", "==", "scheduled"),
        orderBy("dateTime", "asc")
        );
        
        const snap = await getDocs(q);
        
        const hydrated = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const routeSnap = await getDoc(doc(db, "routes", data.routeId));
            return { 
              id: d.id, 
              ...data, 
              routeInfo: routeSnap.exists() ? routeSnap.data() : { name: "Unknown" },
              jsDate: data.dateTime.toDate()
            };
          })
        );
        
        setEvents(hydrated);
      } catch (err) {
        console.error("Discover Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicEvents();
  }, []);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-400">Scanning for rides...</div>;

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      <header className="px-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Find a bus near you</p>
      </header>

      <div className="flex flex-col gap-4 px-2">
        {events.length === 0 ? (
          <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
            <p className="font-black italic uppercase text-slate-400">No events found</p>
            <Link href="/toolbox" className="text-blue-600 text-[10px] font-black uppercase mt-2 block">Create the first one!</Link>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                    {event.jsDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h3 className="text-xl font-black italic uppercase text-slate-900 truncate pr-4">
                    {event.routeInfo.name}
                  </h3>
                </div>
                <div className="bg-slate-900 text-white px-3 py-2 rounded-2xl text-center min-w-[60px]">
                  <p className="text-[10px] font-black leading-none uppercase">
                    {event.jsDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[0]}
                  </p>
                  <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">
                    {event.jsDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[1]}
                  </p>
                </div>
              </div>

              {/* Inside your Route Card mapping */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-black italic uppercase text-lg leading-tight">{route.name}</h3>
                  {/* MODE BADGE */}
                  <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md">
                    {route.preferredMode || 'Bike Bus'}
                  </span>
                </div>

                {/* DIFFICULTY & NEIGHBORHOOD */}
                <div className="flex gap-2 mt-2">
                  <span className={`text-[9px] font-black uppercase ${
                    route.difficulty === 'hard' ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    {route.difficulty || 'Easy'}
                  </span>
                  <span className="text-[9px] font-black uppercase text-slate-400">•</span>
                  <span className="text-[9px] font-black uppercase text-slate-400">
                    {route.neighborhood || 'Portland'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {route.description || "No description provided."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                <div className="flex -space-x-2">
                  {/* Mock avatars for riders */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black">
                      {event.riders?.length > 3 && i === 3 ? `+${event.riders.length - 2}` : ""}
                    </div>
                  ))}
                </div>
                
                <JoinButton event={event} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}