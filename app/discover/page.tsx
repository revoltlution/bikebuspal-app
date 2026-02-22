"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import JoinButton from "@/src/components/JoinButton";

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
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
              routeInfo: routeSnap.exists() ? routeSnap.data() : { name: "Unknown Route" },
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

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="font-black italic uppercase text-slate-300 animate-pulse tracking-widest">
        Scanning for rides...
      </div>
    </div>
  );

  return (
    /* Standardized padding: pt-24 to clear header, pb-32 to clear nav */
    <div className="min-h-screen bg-slate-50 pt-24 pb-32 px-4 overflow-y-auto animate-in fade-in duration-500">
      
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {events.length === 0 ? (
          <div className="p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
            <span className="material-symbols-rounded text-slate-300 text-4xl">pedal_bike</span>
            <div>
              <p className="font-black italic uppercase text-slate-400">No active missions found</p>
              <Link href="/toolbox" className="text-blue-600 text-[10px] font-black uppercase mt-2 block tracking-widest">
                Create the first one +
              </Link>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4 group active:scale-[0.99] transition-all">
              
              {/* DATE & TIME HEADER */}
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                    {event.jsDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h3 className="text-xl font-black italic uppercase text-slate-900 truncate pr-4 leading-none">
                    {event.routeInfo.name}
                  </h3>
                </div>
                <div className="bg-slate-900 text-white px-3 py-2 rounded-2xl text-center min-w-[65px] shadow-lg">
                  <p className="text-[11px] font-black leading-none uppercase">
                    {event.jsDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[0]}
                  </p>
                  <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter mt-0.5">
                    {event.jsDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[1]}
                  </p>
                </div>
              </div>

              {/* ROUTE METADATA PANEL */}
              <div className="bg-slate-50 rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm">
                      {event.routeInfo.preferredMode || 'Bike Bus'}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-slate-200 bg-white ${
                      event.routeInfo.difficulty === 'hard' ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {event.routeInfo.difficulty || 'Easy'}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {event.routeInfo.neighborhood || 'Portland'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic font-medium">
                  {event.routeInfo.description || "A community-led mission to get kids moving safely."}
                </p>
              </div>

              {/* FOOTER: RIDERS & JOIN */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Team Size</span>
                  <div className="flex -space-x-2">
                    {(event.riders || []).slice(0, 4).map((rider: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600">
                        {event.riders?.length > 4 && i === 3 ? `+${event.riders.length - 3}` : ""}
                        {!(event.riders?.length > 4 && i === 3) && <span className="material-symbols-rounded text-sm">person</span>}
                      </div>
                    ))}
                    {(!event.riders || event.riders.length === 0) && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                         <span className="material-symbols-rounded text-sm text-slate-300">person_add</span>
                      </div>
                    )}
                  </div>
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