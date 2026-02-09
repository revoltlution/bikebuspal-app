import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const routeId = body?.routeId;
  const star = Boolean(body?.star);

  if (!routeId || typeof routeId !== "string") {
    return NextResponse.json({ error: "invalid_routeId" }, { status: 400 });
  }

  const db = adminDb();
  const ref = db.collection("users").doc(user.uid);

  await ref.set(
    {
      starredRouteIds: star ? FieldValue.arrayUnion(routeId) : FieldValue.arrayRemove(routeId),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
