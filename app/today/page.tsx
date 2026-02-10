export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { LogoutButton } from "@/components/LogoutButton";
import { BecomeLeaderButton } from "@/components/BecomeLeaderButton";

type RouteDoc = {
  name: string;
  schoolName: string;
  city: string;
  startLocationLabel: string;
  startTimeLocal: string;
  weekday: number;
  active: boolean;
  minLeadersNeeded?: number; // default to 1 when missing
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

  const myRidesAll = myRidesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as RideInstanceDoc) }))
    .filter((r) => r.status === "scheduled" || r.status === "active");

    const nextRide = myRidesAll.find((r) => r.status === "active") ?? myRidesAll[0];
    const myRides = myRidesAll;

  

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
      const iLead = (ride.leaderUserIds ?? []).includes(user.uid);
      const min = routesById.get(ride.routeId)?.minLeadersNeeded ?? 1;

      // only “needs attention” if no leaders AND you are not already leading
      if (leaders > min) return null;
      if (iLead) return null;

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

                {(() => {
                const leaders = nextRide.leaderUserIds?.length ?? 0;
                const iLead = (nextRide.leaderUserIds ?? []).includes(user.uid);
                const min = routesById.get(nextRide.routeId)?.minLeadersNeeded ?? 1;
                const needsAttention = leaders < min && !iLead;

                return (
                    <>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <span className={`pill ${iLead ? "pillLeader" : "pillJoined"}`}>
                        {iLead ? "Leader" : "Joined"}
                        </span>
                        {leaders === 0 ? (
                        <span className="pill pillWarn">Leader needed</span>
                        ) : (
                        <span className="pill pillOk">Leader assigned</span>
                        )}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        {needsAttention ? <BecomeLeaderButton rideId={nextRide.id} /> : null}
                        <Link className="link" href={`/routes/${nextRide.routeId}`}>
                        View details →
                        </Link>
                    </div>
                    </>
                );
                })()}
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

          {/* Starred Routes */}
        <section style={{ marginTop: 16 }}>
        <h2>Starred Routes</h2>
        <div className="card">
            {starred.size === 0 ? (
            <div className="muted">Star routes to keep them on your radar.</div>
            ) : (
            <div className="stack">
                {[...starred].map((routeId) => {
                const route = routesById.get(routeId);
                const ride = nextByRoute.get(routeId);
                return (
                    <div key={routeId} className="card" style={{ boxShadow: "none" }}>
                    <div style={{ fontWeight: 700 }}>{route?.name ?? routeId}</div>
                    <div className="badge">
                        {ride
                        ? `Next: ${new Date(ride.startDateTime.toDate()).toLocaleString()} • Leaders: ${
                            ride.leaderUserIds?.length ?? 0
                            } • Joined: ${ride.joinedUserIds?.length ?? 0}`
                        : "No upcoming ride found"}
                    </div>
                    <div style={{ marginTop: 6 }}>
                        <Link className="link" href={`/routes/${routeId}`}>
                        View →
                        </Link>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>
        </section>

      {/* My Schedule */}
      <section style={{ marginTop: 16 }}>
        <h2>Upcoming (next 5 days)</h2>
        <div className="card">
          {myRides.length === 0 ? (
            <div className="muted">Nothing on your schedule yet.</div>
          ) : (
            <div className="stack">
              {myRides.map((r) => {
                const routeName = routesById.get(r.routeId)?.name ?? r.routeId;
                const when = new Date(r.startDateTime.toDate()).toLocaleString();

                const leaders = r.leaderUserIds?.length ?? 0;
                const joined = r.joinedUserIds?.length ?? 0;
                const iLead = (r.leaderUserIds ?? []).includes(user.uid);

                const min = routesById.get(r.routeId)?.minLeadersNeeded ?? 1;
                const needsAttention = leaders < min && !iLead;

                return (
                    <div
                    key={r.id}
                    className={`card ${iLead ? "cardLeader" : "cardJoined"}`}
                    style={{ boxShadow: "none" }}
                    >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                        <div style={{ fontWeight: 700 }}>{routeName}</div>
                        <div className="badge">{when}</div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            <span className={`pill ${iLead ? "pillLeader" : "pillJoined"}`}>
                            {iLead ? "Leader" : "Joined"}
                            </span>

                            {leaders === 0 ? (
                            <span className="pill pillWarn">Leaders needed: {leaders}/{min}</span>
                            ) : (
                            <span className="pill pillOk">Leader assigned</span>
                            )}

                            <span className="pill pillNeutral">Leaders: {leaders}</span>
                            <span className="pill pillNeutral">Joined: {joined}</span>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            {needsAttention ? <BecomeLeaderButton rideId={r.id} /> : null}
                            <Link className="link" href={`/routes/${r.routeId}`}>View details →</Link>
                        </div>
                        </div>

                        <div className="badge">{r.status}</div>
                    </div>
                    </div>
                );
                })}

            </div>
          )}
        </div>
      </section>
    </main>
  );
}
