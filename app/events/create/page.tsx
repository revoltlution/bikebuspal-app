"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, addDoc, getDocs, query, Timestamp } from "firebase/firestore";
import Link from "next/link";

export default function CreateEventPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      const q = query(collection(db, "routes"));
      const snap = await getDocs(q);
      setRoutes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRoutes();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!selectedRouteId || !eventDate || !user) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${eventDate}T${eventTime}`);

      await addDoc(collection(db, "events"), {
        routeId: selectedRouteId,
        dateTime: Timestamp.fromDate(startDateTime),
        leaderId: user.uid,
        riders: [user.uid], // Creator is the first rider
        status: "scheduled",
        createdAt: Timestamp.now(),
        // Adding route name here as a 'denormalized' field 
        // makes the Today/Schedule queries much faster later
        routeName: routes.find(r => r.id === selectedRouteId)?.name || "New Ride"
      });

      setIsSuccess(true);
      setTimeout(() => router.push("/schedule"), 1500);
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
          <span className="material-symbols-rounded !text-4xl">check</span>
        </div>
        <h2 className="text-2xl font-black italic uppercase text-slate-900">Ride Published!</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Redirecting to schedule...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-start px-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Schedule <br/>A Ride
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Turn a route into a mission</p>
        </div>
        <Link href="/toolbox" className="p-3 bg-slate-100 rounded-full text-slate-400">
          <span className="material-symbols-rounded">close</span>
        </Link>
      </header>

      <form onSubmit={handleCreateEvent} className="flex flex-col gap-6">
        {/* 1. SELECT ROUTE */}
        <div className="flex flex-col gap-3">
          <label className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Select Path</label>
          <div className="relative group">
            <select 
              required
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full p-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm font-black italic uppercase text-slate-900 focus:border-blue-500 outline-none appearance-none transition-all"
            >
              <option value="" className="not-italic font-sans">Choose a route...</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span className="material-symbols-rounded absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">expand_more</span>
          </div>
        </div>

        {/* 2. DATE & TIME */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <label className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
            <input 
              type="date" 
              required
              className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</label>
            <input 
              type="time" 
              value={eventTime}
              className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <div className="mt-6 px-2">
          <button 
            type="submit" 
            disabled={loading || !selectedRouteId || !eventDate}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-20"
          >
            {loading ? "Creating..." : "Publish Event"}
          </button>
          
          <p className="text-center text-[9px] font-bold text-slate-300 uppercase mt-6 leading-relaxed">
            By publishing, this event will be visible <br/> to the Bike Bus community.
          </p>
        </div>
      </form>
    </div>
  );
}