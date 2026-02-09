import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";

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
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Routes</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {routes.map((r) => {
          const nextRide = nextByRoute.get(r.id);
          const leaderNeeded = !nextRide || (nextRide.leaderUserIds?.length ?? 0) === 0;

          const nextRideTime = nextRide
            ? new Date(nextRide.startDateTime.toDate()).toLocaleString()
            : `${weekdayName[r.weekday]} ${r.startTimeLocal}`;

          return (
            <div key={r.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div>{r.schoolName} • {r.city}</div>
                  <div style={{ marginTop: 6 }}><strong>Next:</strong> {nextRideTime}</div>
                  <div><strong>Meet:</strong> {r.startLocationLabel}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: 8 }}>
                    {leaderNeeded ? "⚠️ Leader needed" : "✅ Leader assigned"}
                  </div>
                  <Link href={`/routes/${r.id}`}>View</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
