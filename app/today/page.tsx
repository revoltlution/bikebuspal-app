"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export default function TodayPage() {
  const [nextRoute, setNextRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyActiveMission = async () => {
      // Wait for auth to initialize
      const user = auth.currentUser;
      
      try {
        // 1. Try to find a route the user is specifically following
        let q = query(
          collection(db, "routes"),
          where("followedBy", "array-contains", user?.uid || "guest"),
          limit(1)
        );
        
        let snap = await getDocs(q);
        
        // 2. Fallback: If no followed routes, just show the next available community route
        if (snap.empty) {
          q = query(collection(db, "routes"), limit(1));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          setNextRoute({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error("Mission Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchMyActiveMission();
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-400 animate-pulse">Scanning for missions...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* 1. THE HERO: Dynamic Mission Card */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-50" />
        
        <div className="relative z-10">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            {nextRoute ? "Active Mission" : "No Rides Scheduled"}
          </p>
          
          <h2 className="text-3xl font-black italic uppercase leading-tight tracking-tighter">
            {nextRoute?.name?.split(' - ')[0] || "Explore"} <br />
            <span className="text-blue-500 text-xl tracking-normal not-italic font-bold">
              {nextRoute?.name?.split(' - ')[1] || "New Routes"}
            </span>
          </h2>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Meeting</span>
              <span className="text-lg font-black italic">08:00 AM</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Neighborhood</span>
              <span className="text-lg font-black italic truncate">{nextRoute?.neighborhood || "Portland"}</span>
            </div>
          </div>

          {nextRoute && (
            <Link 
              href={`/map?mode=live&route=${nextRoute.id}`}
              className="mt-8 flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
            >
              <span className="material-symbols-rounded animate-pulse">sensors</span>
              Go Live Now
            </Link>
          )}
        </div>
      </section>

      {/* 2. COMMUNITY PULSE */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-blue-600 mb-2">group</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Riders</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1">12 Joined</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="material-symbols-rounded text-amber-500 mb-2">warning</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leader</p>
          <p className="text-xl font-black text-slate-900 leading-none mt-1 uppercase italic">Needed</p>
        </div>
      </div>

      {/* 3. TOOLBOX LINK */}
      <Link href="/toolbox" className="flex items-center justify-between p-5 bg-slate-100 rounded-2xl border border-slate-200 group active:scale-95 transition-all">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-slate-500 group-hover:text-blue-600 transition-colors">handyman</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Audit your Toolbox</span>
        </div>
        <span className="material-symbols-rounded text-slate-400">chevron_right</span>
      </Link>
    </div>
  );
}