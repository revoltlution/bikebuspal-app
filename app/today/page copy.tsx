export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/src/lib/firebase/adminDb";
import { getUserFromSession } from "@/src/lib/auth/getUserFromSession";
import { LogoutButton } from "@/src/components/LogoutButton";
import { BecomeLeaderButton } from "@/src/components/BecomeLeaderButton";
import TodayHero from "@/src/components/TodayHero";

// Type definitions for the IDE
type RouteDoc = {
  name: string;
  schoolName: string;
  city: string;
  startLocationLabel: string;
  startTimeLocal: string;
  weekday: number;
  active: boolean;
  minLeadersNeeded?: number;
};

type RideInstanceDoc = {
  routeId: string;
  date: string;
  startDateTime: any; 
  leaderUserIds: string[];
  joinedUserIds: string[];
  status: "scheduled" | "active" | "ended" | "canceled";
};

export default async function TodayPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const db = adminDb();
  const now = new Date();

  // Data Fetching Logic
  const userSnap = await db.collection("users").doc(user.uid).get();
  const userDoc = (userSnap.exists ? userSnap.data() : {}) as any;
  const starred = new Set<string>(userDoc.starredRouteIds ?? []);

  const routesSnap = await db.collection("routes").where("active", "==", true).get();
  const routes = routesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RouteDoc) }));
  const routesById = new Map(routes.map((r) => [r.id, r]));

  const myRidesSnap = await db
    .collection("rideInstances")
    .where("joinedUserIds", "array-contains", user.uid)
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc")
    .limit(10)
    .get();

  const myRides = myRidesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RideInstanceDoc) }));
  const nextRide = myRides.find((r) => r.status === "active") ?? myRides[0];
  const activeRoute = nextRide ? routesById.get(nextRide.routeId) : null;

  return (
    <main className="page">
      
      <TodayHero user={user} route={activeRoute} ride={nextRide} />

      <section className="mb-8">
        <h2 className="text-xl font-black tracking-tight mb-4">Your Schedule</h2>
        <div className="stack gap-3">
          {myRides.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 text-sm italic">
              Nothing on your schedule yet.
            </div>
          ) : (
            myRides.map((r) => {
              const route = routesById.get(r.routeId);
              const isLeader = (r.leaderUserIds ?? []).includes(user.uid);
              const when = new Date(r.startDateTime.toDate()).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              
              return (
                <Link key={r.id} href={`/routes/${r.routeId}`} className="card flex items-center justify-between p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isLeader ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                      <span className="material-symbols-rounded">
                        {isLeader ? 'shield_person' : 'directions_bike'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{route?.name}</h4>
                      <p className="text-xs font-medium text-slate-500">{when} • {r.status}</p>
                    </div>
                  </div>
                  <span className="material-symbols-rounded text-slate-300">chevron_right</span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}