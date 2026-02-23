"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, addDoc, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";

export default function CreateTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- Recurrence State ---
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const daysOfWeek = [
    { label: 'S', value: 'SU', dayNum: 0 },
    { label: 'M', value: 'MO', dayNum: 1 },
    { label: 'T', value: 'TU', dayNum: 2 },
    { label: 'W', value: 'WE', dayNum: 3 },
    { label: 'T', value: 'TH', dayNum: 4 },
    { label: 'F', value: 'FR', dayNum: 5 },
    { label: 'S', value: 'SA', dayNum: 6 },
  ];

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    mode: "bicycle",
    description: "",
  });

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const rrule = isRecurring ? `RRULE:FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}` : null;

      // 1. Create the Parent Series Document
      const seriesRef = await addDoc(collection(db, "series"), {
        title: formData.title,
        leaderId: user.uid,
        mode: formData.mode,
        rrule,
        createdAt: serverTimestamp(),
      });

      // 2. Generate Trip Instances (Next 4 weeks)
      const startDate = new Date(formData.date + 'T00:00:00');
      const dayNums = selectedDays.map(d => daysOfWeek.find(dow => dow.value === d)?.dayNum);

      // If not recurring, just do the one date. 
      // If recurring, loop through 28 days and check if the day matches selectedDays.
      const loopLimit = isRecurring ? 28 : 1;
      
      for (let i = 0; i < loopLimit; i++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + i);
        
        const dayMatch = dayNums.includes(current.getDay());
        
        if (!isRecurring || dayMatch) {
          const tripRef = doc(collection(db, "rides"));
          batch.set(tripRef, {
            ...formData,
            date: current.toISOString().split('T')[0],
            seriesId: seriesRef.id,
            leaderId: user.uid,
            participants: [user.uid],
            status: "scheduled",
            isCarbonSaving: formData.mode !== "carpool",
            createdAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      router.push("/schedule");
    } catch (err) {
      console.error("Error creating trip series:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pb-32 mt-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">New {BRANDING.term.event}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{BRANDING.motto}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Identity Section */}
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

        {/* Travel Mode Section */}
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

        {/* Logistics Section */}
        <div className="grid grid-cols-2 gap-4">
          <section className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Start Date</label>
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

        {/* Recurrence Section */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-black italic uppercase text-sm">Recurring {BRANDING.term.event}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Set a neighborhood schedule</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {isRecurring && (
            <div className="flex justify-between gap-1 animate-in fade-in zoom-in-95 duration-200">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full font-black text-xs transition-all border-2 ${
                    selectedDays.includes(day.value)
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <button 
          type="submit" 
          disabled={loading || (isRecurring && selectedDays.length === 0)}
          className="mt-4 w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Building Fleet..." : `Launch ${BRANDING.term.event}`}
        </button>
      </form>
    </div>
  );
}