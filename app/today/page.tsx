export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { LogoutButton } from "@/components/LogoutButton";

type RouteDoc = {
  name: string;
  schoolName: string;
  city: string;
  startLocationLabel: string;
  startTimeLocal: string;
  weekday: number;
  active: boolean;
};

type RideInstanceDoc = {
  routeId: string;
  date: string;
  startDateTime: any; // Firestore Timestamp
  leaderUserIds: string[];
  joinedUserIds: string[];
  status: "scheduled" | "active" | "ended" | "canceled";
};

type UserDoc = {
  starredRouteIds?: string[];
};

export default async function TodayPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const db = adminDb();
  const now = new Date();

  // ---- Load user doc (stars) ----
  const userSnap = await db.collection("users").doc(user.uid).get();
  const userDoc = (userSnap.exists ? (userSnap.data() as UserDoc) : {}) as UserDoc;
  const starred = new Set(userDoc.starredRouteIds ?? []);

  // ---- Load routes (for display labels) ----
  const routesSnap = await db.collection("routes").where("active", "==", true).get();
  const routes = routesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RouteDoc) }));
  const routesById = new Map(routes.map((r) => [r.id, r]));

  // ---- My upcoming joined rides ----
  // NOTE: This query likely requires an index: joinedUserIds (array-contains) + startDateTime (asc)
  const myRidesSnap = await db
    .collection("rideInstances")
    .where("joinedUserIds", "array-contains", user.uid)
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc")
    .limit(10)
    .get();

  const myRides = myRidesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as RideInstanceDoc) }))
    .filter((r) => r.status === "scheduled" || r.status === "active");

  const nextRide = myRides[0];

  // ---- Needs attention: starred routes with next ride lacking leaders ----
  // Efficient approach: pull a window of upcoming rides, then pick first per route.
  const upcomingSnap = await db
    .collection("rideInstances")
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc")
    .limit(200)
    .get();

  const nextByRoute = new Map<string, { id: string } & RideInstanceDoc>();
  for (const doc of upcomingSnap.docs) {
    const data = doc.data() as RideInstanceDoc;
    if (data.status !== "scheduled") continue;
    if (!nextByRoute.has(data.routeId)) nextByRoute.set(data.routeId, { id: doc.id, ...data });
  }

  const needsAttention = [...starred]
    .map((routeId) => {
      const ride = nextByRoute.get(routeId);
      if (!ride) return null;
      const leaders = ride.leaderUserIds?.length ?? 0;
      if (leaders > 0) return null;
      return { routeId, ride };
    })
    .filter(Boolean) as Array<{ routeId: string; ride: { id: string } & RideInstanceDoc }>;

  return (
    <main className="page">
      <div className="row" style={{ alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Today</h1>
        <LogoutButton />
      </div>

      <div className="muted" style={{ marginTop: 6 }}>
        Signed in as: {user.email ?? user.uid}
      </div>

      {/* Next Ride */}
      <section style={{ marginTop: 16 }}>
        <h2>Next Ride</h2>
        <div className="card">
          {nextRide ? (
            <>
              <div style={{ fontWeight: 700 }}>
                {routesById.get(nextRide.routeId)?.name ?? nextRide.routeId}
              </div>
              <div className="badge">
                {new Date(nextRide.startDateTime.toDate()).toLocaleString()} • Leaders:{" "}
                {nextRide.leaderUserIds?.length ?? 0} • Joined: {nextRide.joinedUserIds?.length ?? 0}
              </div>
              <div style={{ marginTop: 8 }}>
                <Link className="link" href={`/routes/${nextRide.routeId}`}>
                  View route →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="muted">No upcoming rides joined yet.</div>
              <div style={{ marginTop: 8 }}>
                <Link className="link" href="/routes">
                  Browse routes →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Needs Attention */}
      <section style={{ marginTop: 16 }}>
        <h2>Needs Attention</h2>
        <div className="card">
          {starred.size === 0 ? (
            <>
              <div className="muted">No starred routes yet.</div>
              <div style={{ marginTop: 8 }}>
                <Link className="link" href="/routes">
                  Star routes from Routes →
                </Link>
              </div>
            </>
          ) : needsAttention.length === 0 ? (
            <div className="muted">No starred routes currently need a leader.</div>
          ) : (
            <div className="stack">
              {needsAttention.map(({ routeId, ride }) => (
                <div key={routeId} className="card" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 700 }}>
                    ⚠️ {routesById.get(routeId)?.name ?? routeId}
                  </div>
                  <div className="badge">
                    Next ride: {new Date(ride.startDateTime.toDate()).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link className="link" href={`/routes/${routeId}`}>
                      Assign a leader →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* My Schedule */}
      <section style={{ marginTop: 16 }}>
        <h2>My Schedule</h2>
        <div className="card">
          {myRides.length === 0 ? (
            <div className="muted">Nothing on your schedule yet.</div>
          ) : (
            <div className="stack">
              {myRides.map((r) => (
                <div key={r.id} className="card" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 700 }}>
                    {routesById.get(r.routeId)?.name ?? r.routeId}
                  </div>
                  <div className="badge">
                    {new Date(r.startDateTime.toDate()).toLocaleString()} •{" "}
                    {r.leaderUserIds?.includes(user.uid) ? "Leader" : "Volunteer"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link className="link" href={`/routes/${r.routeId}`}>
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
