"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

export default function MyRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, "routes"), where("createdBy", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      setRoutes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchRoutes();
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-scroll bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-32 flex flex-col gap-4">
        
        {/* BIG PLUS BUTTON FOR NEW ROUTE */}
        <Link href="/routes/create" className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-slate-300 rounded-[2rem] py-10 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all group">
          <span className="material-symbols-rounded text-3xl group-hover:scale-125 transition-transform">add_circle</span>
          <span className="font-black uppercase italic tracking-widest">New Route</span>
        </Link>

        {loading ? (
          <div className="p-10 text-center animate-pulse font-black uppercase text-slate-300 italic">Scanning Data...</div>
        ) : (
          routes.map(route => (
            <div key={route.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-black uppercase italic text-slate-900">{route.name}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{route.preferredMode}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400">{route.difficulty}</span>
                </div>
              </div>
              <Link href={`/routes/edit/${route.id}`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <span className="material-symbols-rounded">edit</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}