import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { RideRoleButtons } from "@/components/RideRoleButtons";
import { StarRouteButton } from "@/components/StarRouteButton";

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

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const { routeId } = await params;
  if (!routeId) redirect("/routes");

  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const db = adminDb();

  const routeSnap = await db.collection("routes").doc(routeId).get();
  if (!routeSnap.exists) redirect("/routes");
  const route = routeSnap.data() as RouteDoc;

  const now = new Date();
  const ridesSnap = await db
    .collection("rideInstances")
    .where("routeId", "==", routeId)
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc")
    .limit(10)
    .get();

  const rides = ridesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RideInstanceDoc) }));

  const userSnap = await db.collection("users").doc(user.uid).get();
  const starredRouteIds = new Set<string>((userSnap.data()?.starredRouteIds ?? []) as string[]);

  return (
    <main className="page">
      <p>
        <Link className="link" href="/routes">← Back to Routes</Link>
      </p>

      <h1 style={{ marginTop: 8 }}>{route.name}</h1>
      <p>
        {route.schoolName} • {route.city}
      </p>
      <p>
        <strong>Meet:</strong> {route.startLocationLabel}
      </p>

      <h2 style={{ marginTop: 24 }}>Upcoming rides</h2>

      <div className="stack" style={{ marginTop: 12 }}>
        {rides.length === 0 ? (
          <p>No upcoming rides found.</p>
        ) : (
          rides.map((r) => {
            const start = new Date(r.startDateTime.toDate()).toLocaleString();
            const leaders = r.leaderUserIds?.length ?? 0;
            const min = route.minLeadersNeeded ?? 1;
            
            const joined = r.joinedUserIds?.length ?? 0;
            const leaderNeeded = leaders < min;

            const iJoined = (r.joinedUserIds ?? []).includes(user.uid);
            const iLead = (r.leaderUserIds ?? []).includes(user.uid);
            const isJoined = (r.joinedUserIds ?? []).includes(user.uid);
            const isLeader = (r.leaderUserIds ?? []).includes(user.uid);

            return (
              <div key={r.id} className="card">
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{start}</div>
                    <div>
                      {leaderNeeded ? "⚠️ Leader needed" : `✅ Leaders: ${leaders}`} • Joined: {joined}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <RideRoleButtons
                        rideId={r.id}
                        isJoined={(r.joinedUserIds ?? []).includes(user.uid)}
                        isLeader={(r.leaderUserIds ?? []).includes(user.uid)}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                        <StarRouteButton routeId={r.id} starred={starredRouteIds.has(r.id)} />
                        <Link className="link" href={`/routes/${r.id}`}>View Scheduled Rides →</Link>
                        </div>
                    <div className="badge">{r.status}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
