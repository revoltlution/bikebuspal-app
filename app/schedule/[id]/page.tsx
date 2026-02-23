"use client";

import { useEffect, useState, use } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { BRANDING } from "@/src/lib/branding";
import { getSecureRiderData, RiderData } from "@/src/lib/riderService";
import { useRouter } from "next/navigation";
import { useMap } from "@/src/context/MapContext";
import Link from "next/link";

// ADD THIS INTERFACE HERE
interface TripData {
  id: string;
  leaderId: string;
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
  
  const [trip, setTrip] = useState<TripData | null>(null); // Use the type here
  const [participants, setParticipants] = useState<RiderData[]>([]);
  const [loading, setLoading] = useState(true);

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
          leaderId: data.leaderId || "",
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
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [id, router]);

  // Separate Map Preview logic to handle the "Interactive Preview" requirement
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

  const isLeader = auth.currentUser?.uid === trip?.leaderId;
  const isJoined = trip?.participants?.includes(auth.currentUser?.uid || "");
  const organizers = participants.filter(p => p.uid === trip?.leaderId);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pb-40">
      <div className="max-w-xl mx-auto p-6 space-y-4">
        
        {/* 1. MAIN PANEL: Title, Description, Mode */}
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

        {/* 2. LOGISTICS BUBBLE: Date, Time, Recurrence */}
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

        {/* 3. PARTICIPANTS BUBBLE: Avatars & Total Count */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 w-full flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Added to Schedule</p>
            <div className="flex -space-x-3 overflow-hidden">
              {participants.slice(0, 5).map((p, i) => (
                <img key={i} className="h-10 w-10 rounded-full ring-4 ring-white bg-slate-100" src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`} alt="" />
              ))}
              {participants.length > 5 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-black ring-4 ring-white">+{participants.length - 5}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black italic text-slate-900 leading-none">{participants.length}</p>
            <p className="text-[9px] font-black uppercase text-slate-400">Total</p>
          </div>
        </section>

        {/* 4. INTERACTIVE MAP PREVIEW */}
        <section className="bg-white rounded-[2.5rem] h-80 overflow-hidden shadow-sm border border-slate-100 w-full relative group">
           {/* Here, Section 4 becomes the "window" for the map */}
           <div className="absolute inset-0 bg-slate-100 animate-pulse pointer-events-none" />
           {/* The actual Map will be visible here via MapContext fly-to */}
           <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
             Interactive Preview
           </div>
        </section>

        {/* 5. ACTION BUTTON */}
        <button 
          onClick={!isJoined ? () => {} : undefined} 
          className={`w-full py-6 rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95
            ${isJoined ? 'bg-slate-200 text-slate-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}
          `}
        >
          {isJoined ? 'Added to Schedule' : 'Add to my schedule'}
        </button>
      </div>
    </div>
  );
}