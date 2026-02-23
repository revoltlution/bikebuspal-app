"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";

export default function CreateTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    mode: "bicycle", // bicycle, walking, carpool, transit
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "rides"), {
        ...formData,
        leaderId: user.uid,
        participants: [user.uid],
        status: "scheduled",
        createdAt: serverTimestamp(),
        // Carbon logic: non-car modes will trigger "Carbon Saved" badges later
        isCarbonSaving: formData.mode !== "carpool", 
      });
      router.push("/schedule");
    } catch (err) {
      console.error("Error creating trip:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pb-32 mt-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">New {BRANDING.term.event}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan a shared commute</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Trip Name */}
        <section className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Identify the Trip</label>
          <input 
            required
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Morning School Run" 
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm focus:border-blue-500" 
          />
        </section>

        {/* Mode Selection */}
        <section className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Mode of Travel</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'bicycle', icon: 'directions_bike', label: 'Bike' },
              { id: 'walking', icon: 'directions_walk', label: 'Walk' },
              { id: 'transit', icon: 'directions_bus', label: 'Bus/Train' },
              { id: 'carpool', icon: 'directions_car', label: 'Carpool' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFormData({...formData, mode: mode.id})}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                  formData.mode === mode.id 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-slate-100 bg-white text-slate-400'
                }`}
              >
                <span className="material-symbols-rounded">{mode.icon}</span>
                <span className="text-xs font-black uppercase tracking-tight">{mode.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <section className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Date</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="p-5 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" 
            />
          </section>
          <section className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Start Time</label>
            <input 
              type="time" 
              required
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
              className="p-5 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" 
            />
          </section>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Initializing..." : `Launch ${BRANDING.term.event}`}
        </button>
      </form>
    </div>
  );
}