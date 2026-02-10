import admin from "firebase-admin";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function adminInit() {
  if (admin.apps.length) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(json)),
  });
}

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// NOTE: This uses a simple “local time” approximation for America/Los_Angeles.
// Good enough for MVP; if you want DST-perfect, we’ll swap to Luxon.
function startDateTimeFor(dateObj, hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const d = new Date(dateObj);
  d.setHours(hh, mm, 0, 0);
  return d;
}

async function upsertRoutes(db) {
  // Edit these to your real initial routes
  const routes = [
    {
      id: "james-john-es",
      name: "James John Bike Bus",
      schoolName: "James John Elementary",
      city: "Portland",
      weekday: 2, // Tue (0=Sun)
      startTimeLocal: "08:00",
      timezone: "America/Los_Angeles",
      startLocationLabel: "Meet at George Park",
      active: true,
      minLeadersNeeded: 3
    },
    {
      id: "sitton-es",
      name: "Sitton Bike Bus",
      schoolName: "Sitton Elementary",
      city: "Portland",
      weekday: 4, // Thu
      startTimeLocal: "08:00",
      timezone: "America/Los_Angeles",
      startLocationLabel: "Main entrance meetup",
      active: true,
      minLeadersNeeded: 2
    },
  ];

  const batch = db.batch();
  for (const r of routes) {
    const ref = db.collection("routes").doc(r.id);
    batch.set(ref, { ...r, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  await batch.commit();
  return routes;
}

async function generateRideInstances(db, routes, days = 14) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  for (const route of routes) {
    for (let d = new Date(now); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== route.weekday) continue;

      const dateStr = ymd(d);
      const startDt = startDateTimeFor(d, route.startTimeLocal);

      const rideId = `${route.id}_${dateStr}`;
      const ref = db.collection("rideInstances").doc(rideId);

      await ref.set(
        {
          routeId: route.id,
          date: dateStr,
          startDateTime: admin.firestore.Timestamp.fromDate(startDt),
          leaderUserIds: [],
          joinedUserIds: [],
          status: "scheduled",
          timezone: route.timezone,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
}

async function main() {
  adminInit();
  const db = admin.firestore();

  const routes = await upsertRoutes(db);
  await generateRideInstances(db, routes, 14);

  console.log("Seed complete:", { routes: routes.length, rideInstancesDays: 14 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
