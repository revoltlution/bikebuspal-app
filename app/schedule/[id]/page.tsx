"use client";

import { useEffect, useState, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";
import { getSecureRiderData, RiderData } from "@/src/lib/riderService";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";

interface TripData {
  id: string;
  routeId?: string;
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  mode?: string;
  difficulty?: string;
  leaderId?: string;
  participants?: string[];
  isPublic?: boolean;
}
// This page is for viewing a specific trip's details, manifest, and route preview
export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setActiveRoute, setMode } = useMap();
  
  const [trip, setTrip] = useState<TripData | null>(null);
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTripAndRoute = async () => {
      try {
        // 1. NORMALIZED: Fetch from 'trips'
        const tripRef = doc(db, "trips", id); 
        const tripSnap = await getDoc(tripRef);

        if (!tripSnap.exists()) {
          router.push("/schedule");
          return;
        }

        const tripData = { id: tripSnap.id, ...tripSnap.data() } as TripData;
        setTrip(tripData);

        // 2. Fetch Route Coordinates
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

        // 3. Fetch Secure Manifest
        if (tripData.participants) {
          const riderPromises = tripData.participants.map((uid: string) => 
            getSecureRiderData(uid)
          );
          const riderResults = await Promise.all(riderPromises);
          setRiders(riderResults);
        }
      } catch (err) {
        console.error("Permission or Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTripAndRoute();
    return () => setMode('discovery');
  }, [id, router, setActiveRoute, setMode]);

  const handleJoinTrip = async () => {
    const user = auth.currentUser;
    if (!user || !trip) return;

    try {
      const tripRef = doc(db, "trips", id);
      await updateDoc(tripRef, {
        participants: arrayUnion(user.uid)
      });

      setTrip(prev => prev ? ({
        ...prev,
        participants: [...(prev.participants || []), user.uid]
      }) : null);

      alert(`Joined the ${BRANDING.term.event}!`);
    } catch (err) {
      console.error("Join Error:", err);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300 animate-pulse">Syncing Trip...</div>;

  const isLeader = auth.currentUser?.uid === trip?.leaderId;
  const isJoined = trip?.participants?.includes(auth.currentUser?.uid || "");

  return (
    <div className="flex-1 pb-32 animate-in fade-in duration-500 pointer-events-none">
      
      {/* HEADER CARD: Glassmorphic title over map */}
      <div className="h-72 relative overflow-hidden flex items-end px-6 pb-8">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50 pointer-events-auto w-full max-w-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
              {trip?.date ? new Date(trip.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </span>
            {trip?.difficulty && (
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                {trip.difficulty}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-[0.9] mb-4">
            {trip?.title}
          </h2>
          <p className="text-sm font-medium text-slate-600 leading-snug">
            {trip?.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-6 pointer-events-auto max-w-xl mx-auto">
        
        {/* STATS GRID */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="material-symbols-rounded text-blue-600 mb-2">schedule</span>
            <p className="text-[10px] font-black uppercase text-slate-400">Departure</p>
            <p className="text-lg font-black italic uppercase text-slate-900">{trip?.startTime}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="material-symbols-rounded text-emerald-600 mb-2">
              {trip?.mode === 'walking' ? 'directions_walk' : 'directions_bike'}
            </span>
            <p className="text-[10px] font-black uppercase text-slate-400">Mode</p>
            <p className="text-lg font-black italic uppercase text-emerald-600">{trip?.mode}</p>
          </div>
        </section>

        {/* MANIFEST */}
        <section className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="font-black italic uppercase text-sm tracking-tight">The Fleet ({riders.length})</h4>
            {isLeader && (
              <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-full">Organizer</span>
            )}
          </div>
          
          <div className="space-y-4">
            {riders.map((rider) => (
              <div key={rider.uid} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50">
                    <img 
                      src={rider.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.uid}`} 
                      alt="Avatar" 
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">{rider.displayName || "Anonymous"}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase italic mt-1">
                      {rider.uid === trip?.leaderId ? "Leader" : "Traveler"}
                    </p>
                  </div>
                </div>
                {rider.uid === trip?.leaderId && (
                  <span className="material-symbols-rounded text-amber-500 !text-lg">verified</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACTION BUTTON */}
        {!isJoined ? (
          <button 
            onClick={handleJoinTrip}
            className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Join {BRANDING.term.event}
          </button>
        ) : (
          <button className="w-full bg-slate-900 text-white/50 py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest border border-slate-800 cursor-default">
            Joined
          </button>
        )}
      </div>
    </div>
  );
}