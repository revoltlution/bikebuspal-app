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
          const nextRideTime = nextRide
            ? new Date(nextRide.startDateTime.toDate()).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : `${weekdayName[r.weekday]}s at ${r.startTimeLocal}`;

          const leaders = nextRide?.leaderUserIds?.length ?? 0;
          const joined = nextRide?.joinedUserIds?.length ?? 0;

          return (
            <div key={r.id} className="card" style={{ padding: '24px', borderRadius: '32px', border: '1px solid #e2e8f0', background: 'white' }}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#0f172a' }}>{r.name}</div>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginTop: '4px' }}>
                    {r.schoolName} • {r.city}
                  </div>
                  
                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#475569' }}><strong>NEXT MISSION:</strong> {nextRideTime}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}><strong>MEET:</strong> {r.startLocationLabel}</div>
                  </div>
                </div>

                <div style={{ textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: leaders === 0 ? '#f59e0b' : '#10b981' }}>
                        {leaders === 0 ? "⚠️ Leader needed" : "✅ Leader assigned"}
                    </div>

                    <div style={{ fontSize: '10px', fontWeight: 700, background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                        Riders: {joined}
                    </div>

                    {/* ACTION ROW */}
                    <div style={{ display: "flex", gap: '8px', marginTop: '8px' }}>
                        <StarRouteButton routeId={r.id} starred={starredRouteIds.has(r.id)} />
                        
                        {/* THE NEW EDIT BUTTON */}
                        <Link 
                          href={`/routes/edit/${r.id}`} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: '40px', 
                            height: '40px', 
                            background: '#f1f5f9', 
                            borderRadius: '12px',
                            color: '#64748b'
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>edit_note</span>
                        </Link>

                        <Link 
                          className="link" 
                          href={`/routes/${r.id}`}
                          style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', alignSelf: 'center', marginLeft: '8px' }}
                        >
                          View →
                        </Link>
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
