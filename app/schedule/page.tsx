"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function SchedulePage() {
  const [myRoutes, setMyRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySchedule = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Query routes where the current user is in the followedBy array
        const q = query(
          collection(db, "routes"), 
          where("followedBy", "array-contains", auth.currentUser.uid)
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyRoutes(data);
      } catch (err) {
        console.error("Schedule Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMySchedule();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      <header className="px-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          My <br/>Commitments
        </h2>
      </header>

      {myRoutes.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <span className="material-symbols-rounded text-slate-300 !text-5xl mb-4">star_outline</span>
          <p className="font-black italic uppercase text-slate-400 text-sm">Nothing scheduled</p>
          <Link href="/discover" className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
            Find your Bus
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myRoutes.map(route => (
            <Link 
              key={route.id} 
              href={`/map?route=${route.id}`}
              className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm active:scale-95 transition-all"
            >
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Weekly • 08:00 AM</p>
                <h3 className="font-black italic uppercase text-slate-900 truncate pr-4">{route.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{route.neighborhood || "Portland"}</p>
              </div>
              <span className="material-symbols-rounded text-blue-500">event_available</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}