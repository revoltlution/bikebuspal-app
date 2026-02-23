"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { BRANDING } from "@/src/lib/branding";
import GpxUploader from "@/src/components/GpxUploader";

export default function CreateTripPage() {
  const router = useRouter();
  
  // Data State
  const [hubs, setHubs] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mode: "bicycle", // bicycle, walking, scooter
    difficulty: "easy", // easy, moderate, hard
    hubId: "",
    routeId: "",
    isPublic: true,
    startTime: "",
    endTime: "",
    recurrence: "none", // none, daily, weekly, monthly
    selectedDays: [] as string[], // for weekly ['Mon', 'Wed']
    thumbnailUrl: "",
    gallery: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Fetch Hubs user belongs to
      const hubSnap = await getDocs(query(collection(db, "groups"), where("members", "array-contains", user.uid)));
      setHubs(hubSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Fetch Personal Routes
      const routeSnap = await getDocs(query(collection(db, "routes"), where("createdBy", "==", user.uid)));
      setRoutes(routeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "rides"), {
        ...formData,
        leaderId: auth.currentUser?.uid,
        participants: [auth.currentUser?.uid],
        createdAt: Timestamp.now(),
      });
      router.push(`/schedule/${docRef.id}`);
    } catch (err) {
      console.error("Trip Creation Error:", err);
    }
  };

  return (
    <div className="p-6 pb-40 max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter italic">Create {BRANDING.term.event}</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Deploy your neighborhood fleet</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: CONTEXT */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest">1. Group & Privacy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold outline-none shadow-sm appearance-none"
              onChange={(e) => setFormData({...formData, hubId: e.target.value})}
            >
              <option value="">Standalone Trip (No Hub)</option>
              {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <div className="flex items-center justify-between bg-slate-100 px-6 rounded-3xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest">Public Trip</span>
              <input 
                type="checkbox" 
                checked={formData.isPublic} 
                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                className="w-5 h-5 accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: THE ROUTE */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest text-slate-400">2. The Path</h3>
                <button 
                type="button"
                onClick={() => setShowUploader(!showUploader)}
                className="text-[10px] font-black uppercase text-blue-600 underline"
                >
                {showUploader ? "Select Existing" : "Upload New GPX"}
                </button>
            </div>

            {showUploader ? (
                <GpxUploader onUploadSuccess={(id) => setFormData({...formData, routeId: id})} />
            ) : (
                <select 
                required
                value={formData.routeId}
                className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold"
                onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                >
                <option value="">-- Choose Route --</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            )}
            </section>

        {/* SECTION 3: DETAILS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest">3. Details & Difficulty</h3>
          <input 
            type="text" placeholder="Trip Title (e.g. Morning Ainsworth Bus)"
            className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm"
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <textarea 
            placeholder="Describe the vibe, stops, or requirements..."
            className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm h-32"
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
             <select className="bg-white p-4 rounded-2xl border border-slate-200 font-bold" onChange={(e) => setFormData({...formData, mode: e.target.value})}>
                <option value="bicycle">Bicycle</option>
                <option value="walking">Walking</option>
                <option value="scooter">Scooter</option>
             </select>
             <select className="bg-white p-4 rounded-2xl border border-slate-200 font-bold" onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                <option value="easy">Easy (Flat & Slow)</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard (Hills / Fast)</option>
             </select>
          </div>
        </div>

        {/* SECTION 4: SCHEDULE & RECURRENCE */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest">4. Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="time" className="bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm" onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
            <input type="time" className="bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm" onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
          </div>
          
          <select 
            className="w-full bg-slate-900 text-white p-5 rounded-3xl font-bold shadow-xl"
            onChange={(e) => setFormData({...formData, recurrence: e.target.value})}
          >
            <option value="none">One-Time Event</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          
          {formData.recurrence === 'weekly' && (
            <div className="flex justify-between p-2 animate-in slide-in-from-top-2">
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <button 
                  key={i} type="button"
                  className="w-10 h-10 rounded-full border border-slate-200 font-black text-xs hover:bg-blue-600 hover:text-white transition-colors"
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
        >
          Confirm & Deploy Trip
        </button>
      </form>
    </div>
  );
}