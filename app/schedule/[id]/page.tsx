"use client";

import { useEffect, useState, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Added arrayRemove
import { BRANDING } from "@/src/lib/branding";
import { getSecureRiderData, RiderData } from "@/src/lib/riderService";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";
import Link from "next/link";

interface TripData {
  id: string;
  leaderIds: string[]; // Standardized to plural array
  participants: string[];
  title: string;
  description: string;
  mode: string;
  difficulty: string;
  date: string;
  startTime: string;
  endTime?: string;
  routeId?: string;
  recurrence: string;
}

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setActiveRoute, setMode } = useMap();
  
  const [trip, setTrip] = useState<TripData | null>(null);
  const [participants, setParticipants] = useState<RiderData[]>([]);
  const [loading, setLoading] = useState(true);

  // Logic: Join
  const handleJoin = async (role: 'participant' | 'leader') => {
    const user = auth.currentUser;
    if (!user) return router.push('/login');
    const tripRef = doc(db, "trips", id);
    
    try {
      const updates: any = { participants: arrayUnion(user.uid) };
      if (role === 'leader') updates.leaderIds = arrayUnion(user.uid);

      await updateDoc(tripRef, updates);
      window.location.reload(); 
    } catch (err) { console.error("Join error:", err); }
  };

  // Logic: Remove
  const handleRemoveFromSchedule = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const tripRef = doc(db, "trips", id);
    
    try {
      await updateDoc(tripRef, {
        participants: arrayRemove(user.uid),
        leaderIds: arrayRemove(user.uid)
      });
      window.location.reload();
    } catch (err) { console.error("Remove error:", err); }
  };

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const tripSnap = await getDoc(doc(db, "trips", id));
        if (!tripSnap.exists()) {
          router.push("/schedule");
          return;
        }

        const data = tripSnap.data();
        const tripData: TripData = {
          id: tripSnap.id,
          leaderIds: data.leaderIds || (data.leaderId ? [data.leaderId] : []), // Handle migration from singular to plural
          participants: data.participants || [],
          title: data.title || "",
          description: data.description || "",
          mode: data.mode || "bicycle",
          difficulty: data.difficulty || "easy",
          date: data.date || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          routeId: data.routeId || "",
          recurrence: data.recurrence || "none",
        };

        setTrip(tripData);

        if (tripData.participants.length > 0) {
          const results = await Promise.all(
            tripData.participants.map((uid) => getSecureRiderData(uid))
          );
          setParticipants(results);
        }
      } catch (err) { console.error("Fetch error:", err); } 
      finally { setLoading(false); }
    };

    loadTrip();
  }, [id, router]);

  useEffect(() => {
    if (trip?.routeId) {
      const fetchRoute = async () => {
        const routeSnap = await getDoc(doc(db, "routes", trip.routeId!));
        if (routeSnap.exists()) {
          setActiveRoute({
            id: trip.routeId!,
            coordinates: routeSnap.data().coordinates || []
          });
          setMode('trip');
        }
      };
      fetchRoute();
    }
    return () => { setActiveRoute(null); setMode('discovery'); };
  }, [trip?.routeId, setActiveRoute, setMode]);

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-slate-300 animate-pulse">Syncing...</div>;

  const currentUserId = auth.currentUser?.uid || "";
  const isLeader = trip?.leaderIds?.includes(currentUserId);
  const isJoined = trip?.participants?.includes(currentUserId);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pb-40">
      <div className="max-w-xl mx-auto p-6 space-y-4">
        
        {/* 1. MAIN PANEL */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 w-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <span className="material-symbols-rounded text-emerald-600 !text-sm">
                {trip?.mode === 'walking' ? 'directions_walk' : 'directions_bike'}
              </span>
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{trip?.mode}</span>
            </div>
            {isLeader && (
              <Link href={`/schedule/edit/${id}`} className="text-slate-300 hover:text-blue-600 transition-colors">
                <span className="material-symbols-rounded">edit_square</span>
              </Link>
            )}
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">{trip?.title}</h2>
          <p className="text-sm font-bold text-slate-500 leading-relaxed">{trip?.description}</p>
        </section>

        {/* 2. LOGISTICS */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 w-full flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-rounded">calendar_month</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Date & Recurrence</p>
              <p className="text-sm font-black italic uppercase tracking-tight">
                {trip?.date ? new Date(trip.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
              </p>
              <p className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">
                {trip?.recurrence === 'none' ? 'One-time Trip' : `Recurring: ${trip?.recurrence}`}
              </p>
            </div>
          </div>
          <div className="h-px bg-slate-100 w-full" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-rounded">schedule</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Timing</p>
              <p className="text-sm font-black italic uppercase tracking-tight">
                {trip?.startTime} {trip?.endTime ? `— ${trip.endTime}` : ''}
              </p>
            </div>
          </div>
        </section>

        {/* 3. PARTICIPATION PANEL */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 w-full space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Trip Leaders</p>
              <div className="flex -space-x-3 overflow-hidden">
                {participants.filter(p => trip?.leaderIds?.includes(p.uid)).map((leader, i) => (
                  <img 
                    key={i} 
                    className="h-12 w-12 rounded-full ring-4 ring-emerald-100 border-2 border-emerald-500 bg-slate-100 object-cover" 
                    src={leader.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} 
                    alt="Leader" 
                  />
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black italic text-slate-900 leading-none">{participants.length}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Total Added</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {isJoined ? (
              <button onClick={handleRemoveFromSchedule} className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                Remove from Schedule
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => handleJoin('participant')} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all">
                  Add to Schedule
                </button>
                <button onClick={() => handleJoin('leader')} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all">
                  Join as Leader
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 4. MAP PREVIEW */}
        <section className="relative w-full h-80 rounded-[2.5rem] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] border-4 border-white bg-transparent group">
          <div className="absolute inset-0 map-hole-punch" />
          <div className="absolute top-6 left-6 z-20">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Live Route Preview</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] rounded-[2.5rem]" />
        </section>
      </div>
    </div>
  );
}