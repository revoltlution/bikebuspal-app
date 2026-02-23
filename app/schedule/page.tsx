"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function SchedulePage() {
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeFilter, setActiveFilter] = useState('all'); // all, today, biking, walking
  const [selectedHub, setSelectedHub] = useState('all');
  const [hubs, setHubs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, "trips"), where("date", ">=", today), orderBy("date", "asc"));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setAllTrips(fetched);
        setFilteredTrips(fetched);

        // Fetch Hubs for the filter dropdown
        if (user) {
          const hSnap = await getDocs(query(collection(db, "groups"), where("members", "array-contains", user.uid)));
          setHubs(hSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...allTrips];
    const todayStr = new Date().toISOString().split('T')[0];

    if (activeFilter === 'today') result = result.filter(t => t.date === todayStr);
    if (activeFilter === 'biking') result = result.filter(t => t.mode === 'bicycle');
    if (activeFilter === 'walking') result = result.filter(t => t.mode === 'walking');
    if (selectedHub !== 'all') result = result.filter(t => t.hubId === selectedHub);

    setFilteredTrips(result);
  }, [activeFilter, selectedHub, allTrips]);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-300 animate-pulse">Filtering Timeline...</div>;

  return (
    <div className="flex-1 pb-32 animate-in fade-in duration-700">
      
      {/* 1. STICKY FILTER BAR */}
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md pt-4 pb-6 px-6 space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Timeline</span>
           <Link href="/schedule/create" className="bg-blue-600 px-4 py-2 rounded-full text-white shadow-lg active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-rounded !text-sm">add</span>
              <span className="text-[10px] font-black uppercase tracking-widest">New Trip</span>
           </Link>
        </div>

        {/* Scrollable Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'biking', label: 'Biking', icon: 'directions_bike' },
            { id: 'walking', label: 'Walking', icon: 'directions_walk' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeFilter === f.id ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {f.icon && <span className="material-symbols-rounded !text-sm">{f.icon}</span>}
              {f.label}
            </button>
          ))}

          {/* Hub Selector inside the chip row */}
          <select 
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="bg-white border border-slate-200 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-blue-500"
          >
            <option value="all">Every Hub</option>
            {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {/* 2. TRIP LIST */}
      <div className="px-6 space-y-4">
        {filteredTrips.map((trip) => (
          <Link key={trip.id} href={`/schedule/${trip.id}`} className="block bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                  {new Date(trip.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mt-1">{trip.title}</h3>
              </div>
              <div className="bg-slate-50 px-3 py-1 rounded-xl text-[9px] font-black uppercase text-slate-400 border border-slate-100">{trip.startTime}</div>
            </div>
            <div className="flex items-center gap-6 mt-4 opacity-50">
              <div className="flex items-center gap-2"><span className="material-symbols-rounded !text-sm">group</span><span className="text-[10px] font-bold">{trip.participants?.length || 0}</span></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded !text-sm">{trip.mode === 'walking' ? 'directions_walk' : 'directions_bike'}</span>
                <span className="text-[10px] font-bold uppercase">{trip.mode}</span>
              </div>
            </div>
          </Link>
        ))}
        {filteredTrips.length === 0 && (
          <div className="py-20 text-center font-bold uppercase text-slate-300 text-xs">No trips match this filter</div>
        )}
      </div>
    </div>
  );
}