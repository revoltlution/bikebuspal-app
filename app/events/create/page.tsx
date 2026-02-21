"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";

export default function CreateEventPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("08:00");
  const [loading, setLoading] = useState(false);

  // Load routes owned or followed by the user
  useEffect(() => {
    const fetchRoutes = async () => {
      const q = query(collection(db, "routes")); // In MVP, pull all; later filter by ownership
      const snap = await getDocs(q);
      setRoutes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRoutes();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !eventDate || !auth.currentUser) return;

    setLoading(true);
    try {
      // Combine date and time into a JS Date object
      const startDateTime = new Date(`${eventDate}T${eventTime}`);

      await addDoc(collection(db, "events"), {
        routeId: selectedRouteId,
        dateTime: Timestamp.fromDate(startDateTime),
        leaderId: auth.currentUser.uid,
        riders: [auth.currentUser.uid], // Creator joins by default
        status: "scheduled",
        createdAt: Timestamp.now()
      });

      router.push("/schedule");
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="px-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          Schedule <br/>A Ride
        </h2>
      </header>

      <form onSubmit={handleCreateEvent} className="flex flex-col gap-6">
        {/* 1. SELECT ROUTE */}
        <div className="flex flex-col gap-2">
          <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Select Route</label>
          <select 
            required
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full p-5 bg-white rounded-3xl border border-slate-200 shadow-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Choose a route...</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {/* 2. DATE & TIME */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
            <input 
              type="date" 
              required
              className="p-5 bg-white rounded-3xl border border-slate-200 font-bold"
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</label>
            <input 
              type="time" 
              value={eventTime}
              className="p-5 bg-white rounded-3xl border border-slate-200 font-bold text-slate-900"
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Event"}
        </button>
      </form>
    </div>
  );
}