"use client";

import { useState, useEffect, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";
import GpxUploader from "@/src/components/GpxUploader";

export default function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setActiveRoute, setMode } = useMap();
  
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mode: "bicycle",
    difficulty: "easy",
    routeId: "",
    isPublic: true,
    date: "",
    startTime: "",
    endTime: "",
    recurrence: "none",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Fetch existing Trip
        const tripSnap = await getDoc(doc(db, "trips", id));
        if (tripSnap.exists()) {
          const data = tripSnap.data();
          // Security Check: Only the leader can edit
          if (data.leaderId !== user.uid) {
            router.push(`/schedule/${id}`);
            return;
          }
          setFormData(data as any);
        }

        const fetchRoutes = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                // This query looks for all routes owned by the user
                const q = query(
                collection(db, "routes"), 
                where("createdBy", "==", user.uid)
                );
                
                const routeSnap = await getDocs(q);
                
                // Map the docs correctly
                const fetchedRoutes = routeSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
                }));
                
                setRoutes(fetchedRoutes);
            } catch (err) {
                console.error("Error fetching routes:", err);
            }
            };

        // 2. Fetch Routes for dropdown
        const routeSnap = await getDocs(query(collection(db, "routes"), where("createdBy", "==", user.uid)));
        setRoutes(routeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id, router]);

  // Preview logic: Same as Create page
  useEffect(() => {
    if (formData.routeId) {
      getDoc(doc(db, "routes", formData.routeId)).then(snap => {
        if (snap.exists()) {
          setActiveRoute({ id: formData.routeId, coordinates: snap.data().coordinates });
          setMode('trip');
        }
      });
    }
  }, [formData.routeId, setActiveRoute, setMode]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "trips", id), formData);
      router.push(`/schedule/${id}`);
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300">Loading Trip Data...</div>;

  return (
    <div className="p-6 pb-40 max-w-2xl mx-auto space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Edit Trip</h1>
        <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6">
        <section className="space-y-4">
          <input 
            type="text" value={formData.title} placeholder="Trip Title"
            className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm"
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <textarea 
            value={formData.description} placeholder="Description"
            className="w-full bg-white p-5 rounded-3xl border border-slate-200 font-bold shadow-sm h-32"
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </section>

        {/* Reuse the Route Selector and Schedule inputs from CreateTripPage here... */}

        <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          Update Trip
        </button>
      </form>
    </div>
  );
}