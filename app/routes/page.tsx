import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { StarRouteButton } from "@/components/StarRouteButton";


export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteDoc = {
  name: string;
  schoolName: string;
  city: string;
  weekday: number;
  startTimeLocal: string;
  timezone: string;
  startLocationLabel: string;
  active: boolean;
};

type RideInstanceDoc = {
  routeId: string;
  startDateTime: any; // Firestore Timestamp
  leaderUserIds: string[];
  joinedUserIds: string[];
  status: "scheduled" | "active" | "ended" | "canceled";
};

const weekdayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default async function RoutesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const db = adminDb();

  const routesSnap = await db.collection("routes").where("active", "==", true).get();
  const routes = routesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RouteDoc) }));

  const now = new Date();
  const nextByRoute = new Map<string, (RideInstanceDoc & { id: string })>();
  
  const userSnap = await db.collection("users").doc(user.uid).get();
  const starredRouteIds = new Set<string>((userSnap.data()?.starredRouteIds ?? []) as string[]);


  const ridesSnap = await db
    .collection("rideInstances")
    .where("status", "==", "scheduled")
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc")
    .limit(200)
    .get();

  for (const doc of ridesSnap.docs) {
    const data = doc.data() as RideInstanceDoc;
    if (!nextByRoute.has(data.routeId)) nextByRoute.set(data.routeId, { id: doc.id, ...data });
  }

  return (
    <main className="page">
      <p>
        <Link className="link" href="/today">← Back to Today</Link>
      </p>
      <h1>Routes</h1>

      <div className="stack" style={{ marginTop: 16 }}>
        {routes.map((r) => {
          const nextRide = nextByRoute.get(r.id);
          const leaderNeeded = !nextRide || (nextRide.leaderUserIds?.length ?? 0) === 0;

          const nextRideTime = nextRide
            ? new Date(nextRide.startDateTime.toDate()).toLocaleString()
            : `${weekdayName[r.weekday]} ${r.startTimeLocal}`;

        const leaders = nextRide?.leaderUserIds?.length ?? 0;
        const joined = nextRide?.joinedUserIds?.length ?? 0;

          return (
            <div key={r.id} className="card">
              <div className="row">
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div>{r.schoolName} • {r.city}</div>
                  <div style={{ marginTop: 6 }}><strong>Next:</strong> {nextRideTime}</div>
                  <div><strong>Meet:</strong> {r.startLocationLabel}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                    
                    <div style={{ marginBottom: 6 }}>
                        {leaders === 0 ? "⚠️ Leader needed" : "✅ Leader assigned"}
                    </div>

                    {nextRide ? (
                        <div className="badge">
                        Leaders: {leaders} • Joined: {joined}
                        </div>
                    ) : (
                        <div className="badge">No upcoming ride</div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                        <StarRouteButton routeId={r.id} starred={starredRouteIds.has(r.id)} />
                        <Link className="link" href={`/routes/${r.id}`}>View →</Link>
                        </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
