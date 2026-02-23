"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/src/lib/firebase/client";

import { 
  doc, 
  updateDoc, 
  Timestamp, 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc // ADD THIS
} from "firebase/firestore";

import { useMap } from "@/src/context/MapContext"; // Use the brain
import { BRANDING } from "@/src/lib/branding";

interface TripData {
    id: string;
    routeId?: string;
    title?: string;
    date?: string;
    startTime?: string;
    participants?: string[];
    // add other fields you use
    }

export default function TodayPage() {
  const router = useRouter();
  const { setMode, setActiveRoute } = useMap(); // Pull map controls
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  

  // 1. THE GO-LIVE HANDLER
  const handleGoLive = async () => {
    const user = auth.currentUser;
    if (!user || !trip) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        activeRouteId: trip.routeId,
        activeTripId: trip.id,
        isLive: true,
        lastLiveAt: Timestamp.now()
      });

      // Instead of changing pages, we change the MAP MODE
      setMode('live');
      // You could still redirect to a focused view if you prefer, 
      // but keeping it here is very "Uber-like".
    } catch (err) {
      console.error("Error activating live trip:", err);
    }
  };

  // 2. DATA FETCHING
  useEffect(() => {
    const fetchTodayTrip = async () => {
        const user = auth.currentUser;
        if (!user) {
        setLoading(false);
        return;
        }


        try {
        // 1. Get the next upcoming ride
        const q = query(
            collection(db, "rides"),
            where("participants", "array-contains", user.uid),
            where("date", ">=", new Date().toISOString().split('T')[0]),
            orderBy("date", "asc"),
            limit(1)
        );

        const snap = await getDocs(q);
        
        if (!snap.empty) {
        // Use the interface here to satisfy the IDE
        const tripData: TripData = { 
            id: snap.docs[0].id, 
            ...snap.docs[0].data() 
        }; 
        
        setTrip(tripData);

        // Now tripData.routeId is recognized as valid
        if (tripData.routeId) {
            const routeDoc = await getDoc(doc(db, "routes", tripData.routeId));
            
            if (routeDoc.exists()) {
            const routeData = routeDoc.data();
            
            setActiveRoute({
                id: tripData.routeId,
                coordinates: routeData.coordinates || []
            });
            }
        }
        }
        } catch (err) {
        console.error("Data Sync Error:", err);
        } finally {
        setLoading(false);
        }
    };

    fetchTodayTrip();
    }, [setActiveRoute]);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-400">Scanning Horizon...</div>;

  return (
    <div className="flex-1 flex flex-col justify-end min-h-[calc(100vh-80px)] pointer-events-none">
      
      {/* Main content container. 
          pointer-events-auto allows clicking on the card.
          flex-col-reverse or justify-end pushes the card to the bottom.
      */}
      <div className="w-full px-4 pb-32 animate-in slide-in-from-bottom-20 duration-700 pointer-events-auto">
        
        <section className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden border border-white/10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-40 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                {trip ? `Your Next ${BRANDING.term.event}` : "System Idle"}
              </p>
              {trip && (
                <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                  Ready
                </div>
              )}
            </div>
            
            <h2 className="text-4xl font-black italic uppercase leading-[0.85] tracking-tighter mb-8">
              {trip?.title || "No Upcoming Trips"}
            </h2>

            {trip ? (
              <>
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Departure</span>
                    <span className="text-2xl font-black italic uppercase">{trip.startTime}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fleet</span>
                    <span className="text-2xl font-black italic uppercase">{trip.participants?.length || 0} Joined</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoLive}
                  className="group relative flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 overflow-hidden"
                >
                  <span className="material-symbols-rounded animate-pulse group-hover:scale-125 transition-transform">sensors</span>
                  Go Live Now
                </button>
              </>
            ) : (
              <Link href="/discover" className="block text-center p-6 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 font-bold uppercase text-xs hover:text-white transition-colors">
                Explore Neighbor Routes
              </Link>
            )}
          </div>
        </section>

        {/* AUDIT TOOLBOX LINK - Glass style to look good over a map */}
        <Link href="/toolbox" className="mt-4 flex items-center justify-between p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 group active:scale-95 transition-all shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-rounded text-white">handyman</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Audit your toolbox</span>
          </div>
          <span className="material-symbols-rounded text-white/30 group-hover:text-white transition-colors">chevron_right</span>
        </Link>
      </div>
    </div>
  );
}