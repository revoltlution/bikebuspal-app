"use client";

import { BecomeLeaderButton } from "@/components/BecomeLeaderButton";
import Link from "next/link";

interface TodayHeroProps {
  user: { uid: string };
  route?: any; // RouteDoc
  ride?: any;  // RideInstanceDoc & { id: string }
}

export default function TodayHero({ user, route, ride }: TodayHeroProps) {
  if (!ride || !route) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 mb-6">
        <span className="material-symbols-rounded text-5xl text-slate-400 mb-3 font-light">bedtime</span>
        <h2 className="text-xl font-bold text-slate-800 italic tracking-tight">So much empty</h2>
        <p className="text-sm text-slate-500 max-w-[220px] mt-2">No bike buses joined for today. Ready to find a new route?</p>
        <Link href="/routes" className="btn primary mt-4 w-full text-center">Browse Routes</Link>
      </div>
      
    );
  }

  const iLead = (ride.leaderUserIds ?? []).includes(user.uid);
  const leaders = ride.leaderUserIds?.length ?? 0;
  const min = route.minLeadersNeeded ?? 1;
  const needsAttention = leaders < min && !iLead;
  const when = new Date(ride.startDateTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl p-6 mb-8 relative overflow-hidden">
      {/* Decorative background icon */}
      <span className="material-symbols-rounded absolute -right-4 -top-4 text-9xl opacity-10 rotate-12 pointer-events-none">
        directions_bike
      </span>

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Next Mission</span>
            <h1 className="text-2xl font-black tracking-tight">{route.name}</h1>
            <p className="text-sm opacity-80 font-medium">{route.schoolName}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${ride.status === 'active' ? 'bg-green-400 text-green-950 animate-pulse' : 'bg-white/20 text-white'}`}>
            {ride.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-8">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">Roll out</p>
            <p className="text-2xl font-black">{when}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">Meeting At</p>
            <p className="text-sm font-bold truncate">{route.startLocationLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {needsAttention && (
            <div className="flex items-center gap-2 bg-amber-400/20 text-amber-200 p-3 rounded-xl border border-amber-400/30">
              <span className="material-symbols-rounded text-lg">warning</span>
              <p className="text-xs font-bold uppercase tracking-tight">Leader Needed for this ride!</p>
            </div>
          )}
          
          <div className="flex gap-3">
            {needsAttention ? (
              <BecomeLeaderButton rideId={ride.id} />
            ) : (
              <Link href={`/routes/${ride.routeId}`} className="btn w-full bg-white text-blue-700 border-none font-black py-4 rounded-2xl text-center shadow-lg active:scale-95 transition-all">
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}