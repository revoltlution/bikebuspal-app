"use client";

import { useEffect, useState, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";
import { getSecureRiderData, RiderData } from "@/src/lib/riderService";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";
import Link from "next/link";

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
  participants: string[]; // Normalized to match your rules
  recurrence?: string;
}

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setActiveRoute, setMode } = useMap();
  
  const [trip, setTrip] = useState<TripData | null>(null);
  const [participants, setParticipants] = useState<RiderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTripData = async () => {
      try {
        // 1. Fetch from 'trips' collection
        const tripSnap = await getDoc(doc(db, "trips", id));
        if (!tripSnap.exists()) {
          router.push("/schedule");
          return;
        }

        const tripData = { id: tripSnap.id, ...tripSnap.data() } as TripData;
        setTrip(tripData);

        // 2. Map Preview Logic
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

        // 3. Resolve Participant Metadata
        const participantUids = tripData.participants || [];
        if (participantUids.length > 0) {
          const results = await Promise.all(
            participantUids.map((uid) => getSecureRiderData(uid))
          );
          setParticipants(results);
        }
      } catch (err) {
        console.error("Permissions or Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTripData();
    return () => setMode('discovery');
  }, [id, router, setActiveRoute, setMode]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user || !trip) return;

    try {
      const tripRef = doc(db, "trips", id);
      await updateDoc(tripRef, { participants: arrayUnion(user.uid) });
      
      // Optimistic Update
      setTrip(prev => prev ? ({ ...prev, participants: [...prev.participants, user.uid] }) : null);
      const newRider = await getSecureRiderData(user.uid);
      setParticipants(prev => [...prev, newRider]);
    } catch (err) {
      console.error("Join Error:", err);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300 animate-pulse">Syncing Trip...</div>;

  const isLeader = auth.currentUser?.uid === trip?.leaderId;
  const isJoined = trip?.participants?.includes(auth.currentUser?.uid || "");

  return (
    <div className="flex-1 pb-40 animate-in fade-in duration-500">
      
      {/* 1. Header: Glassmorphism over the Map Route Start */}
      <div className="h-56 relative flex items-end px-6 pb-6 pointer-events-none">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 pointer-events-auto shadow-sm w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
              {trip?.recurrence === 'none' ? 'One-Time' : `Recurring: ${trip?.recurrence}`}
            </span>
            {isLeader && (
              <Link href={`/schedule/edit/${id}`} className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors">
                <span className="material-symbols-rounded !text-sm">edit</span> Edit
              </Link>
            )}
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-3">{trip?.title}</h2>
          <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2">{trip?.description}</p>
        </div>
      </div>

      <div className="px-6 space-y-4 max-w-xl mx-auto pointer-events-auto">
        
        {/* 2. Symmetrical Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Departure</p>
            <p className="text-lg font-black italic uppercase">{trip?.startTime}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Mode</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-emerald-600 !text-sm">
                {trip?.mode === 'walking' ? 'directions_walk' : 'directions_bike'}
              </span>
              <p className="text-lg font-black italic uppercase text-emerald-600">{trip?.mode}</p>
            </div>
          </div>
        </section>

        {/* 3. The Map Peek Spacer */}
        <div className="h-24 flex items-center justify-center pointer-events-none">
           <div className="bg-white/20 backdrop-blur-[2px] px-4 py-1.5 rounded-full border border-white/30">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">View Path on Map</p>
           </div>
        </div>

        {/* 4. The Participants List */}
        <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black italic uppercase text-sm tracking-tight">Added to Schedule ({participants.length})</h4>
          </div>
          
          <div className="space-y-5">
            {participants.map((p) => (
              <div key={p.uid} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`} alt="" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">{p.displayName}</p>
                    <p className="text-[8px] font-black uppercase text-blue-600 mt-1">
                       {p.uid === trip?.leaderId ? "Organizer" : "Participant"}
                    </p>
                  </div>
                </div>
                {p.uid === trip?.leaderId && (
                  <span className="material-symbols-rounded text-amber-500 !text-lg">verified</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Action Button */}
        {!isJoined ? (
          <button 
            onClick={handleJoin}
            className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
          >
            Add to my schedule
          </button>
        ) : (
          <div className="w-full bg-slate-50 text-slate-400 py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest border border-slate-100 text-center">
            Already Scheduled
          </div>
        )}
      </div>
    </div>
  );
}