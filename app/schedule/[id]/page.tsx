"use client";

import { useEffect, useState, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { updateDoc, arrayUnion } from "firebase/firestore"; // Add arrayUnion to imports
import { BRANDING } from "@/src/lib/branding";
import { getSecureRiderData, RiderData } from "@/src/lib/riderService";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";

// 1. Move outside the component
interface TripData {
  id: string;
  routeId?: string;
  title?: string;
  date?: string;
  startTime?: string;
  mode?: string;
  leaderId?: string;
  participants?: string[];
}

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setActiveRoute, setMode } = useMap();
  
  // 2. Type the state properly
  const [trip, setTrip] = useState<TripData | null>(null);
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleJoinTrip = async () => {
    const user = auth.currentUser;
    if (!user || !trip) return;

    try {
      const tripRef = doc(db, "rides", id);
      
      // 1. Update Firestore
      await updateDoc(tripRef, {
        participants: arrayUnion(user.uid)
      });

      // 2. Refresh local state so the manifest updates immediately
      // We spread the existing trip and append the new participant
      setTrip((prev: TripData | null) => prev ? ({
        ...prev,
        participants: [...(prev.participants || []), user.uid]
      }) : null);

      alert(`Success! You've joined the ${BRANDING.term.event}.`);
    } catch (err) {
      console.error("Error joining fleet:", err);
      alert("Could not join at this time. Please try again.");
    }
  };

  useEffect(() => {
    const loadTripAndRoute = async () => {
      const tripRef = doc(db, "rides", id);
      const tripSnap = await getDoc(tripRef);

      if (!tripSnap.exists()) {
        router.push("/schedule");
        return;
      }

      // 3. Cast the data here
      const tripData = { id: tripSnap.id, ...tripSnap.data() } as TripData;
      setTrip(tripData);

      // Now tripData.routeId is recognized
      if (tripData.routeId) {
        const routeSnap = await getDoc(doc(db, "routes", tripData.routeId));
        if (routeSnap.exists()) {
          setActiveRoute({
            id: tripData.routeId,
            coordinates: routeSnap.data().coordinates || []
          });
          setMode('trip');
        }
      }

      // 4. tripData.participants is now recognized
      if (tripData.participants) {
        const riderPromises = tripData.participants.map((uid: string) => 
          getSecureRiderData(uid)
        );
        const riderResults = await Promise.all(riderPromises);
        setRiders(riderResults);
      }
      setLoading(false);
    };

    loadTripAndRoute();
    return () => setMode('discovery');
  }, [id, router, setActiveRoute, setMode]);

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300 animate-pulse">Syncing Fleet...</div>;

  // These two lines are likely your main error culprits:
  const isLeader = auth.currentUser?.uid === trip?.leaderId;
  const isJoined = trip?.participants?.includes(auth.currentUser?.uid || "");

  return (
    <div className="flex-1 pb-32 animate-in fade-in duration-500 pointer-events-none">
      
      {/* 1. Header Area: Transparent so GlobalMap shows through */}
      <div className="h-64 relative overflow-hidden flex items-end px-6 pb-6">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-white/20 pointer-events-auto">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
            {trip?.title}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">
            {trip?.date ? new Date(trip.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-6 pointer-events-auto">
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="material-symbols-rounded text-blue-600 mb-2">schedule</span>
            <p className="text-[10px] font-black uppercase text-slate-400">Departure</p>
            <p className="text-lg font-black italic uppercase">{trip?.startTime}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="material-symbols-rounded text-emerald-600 mb-2">leafy_green</span>
            <p className="text-[10px] font-black uppercase text-slate-400">Mode</p>
            <p className="text-lg font-black italic uppercase text-emerald-600">{trip?.mode}</p>
          </div>
        </section>

        {/* 3. The Manifest */}
        <section className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="font-black italic uppercase text-sm tracking-tight">The Fleet ({riders.length})</h4>
            {isLeader && (
                <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-full">
                    Organizer
                </span>
            )}
          </div>
          
          <div className="space-y-3">
            {riders.map((rider) => (
              <div key={rider.uid} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <img 
                      src={rider.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.uid}`} 
                      alt={rider.displayName || "Rider"} 
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">
                      {rider.displayName || "Anonymous Rider"}
                    </p>
                    {rider.isAuthorized && (rider.dependents?.length ?? 0) > 0 ? (
                      <p className="text-[9px] font-black uppercase text-blue-600 mt-1">
                        + {rider.dependents?.join(", ")}
                      </p>
                    ) : (
                      <p className="text-[8px] font-bold text-slate-300 uppercase italic mt-1">
                        {rider.isAuthorized ? "Solo" : "🔒 Private"}
                      </p>
                    )}
                  </div>
                </div>

                {/* FIXED: Added optional chaining to trip */}
                {rider.uid === trip?.leaderId && (
                  <span className="material-symbols-rounded text-amber-500 !text-lg">verified</span>
                )}
              </div>
            ))}
          </div>
      </section>
      
        {/* 4. Action Button */}
        {!isJoined ? (
          <button className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            Join {BRANDING.term.event}
          </button>
        ) : (
          <button className="w-full bg-slate-100 text-slate-400 py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest border border-slate-200">
            Already in Fleet
          </button>
        )}
      </div>
    </div>
  );
}