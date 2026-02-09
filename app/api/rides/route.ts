import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { rideId, asLeader } = await req.json();
  if (!rideId || typeof rideId !== "string") {
    return NextResponse.json({ error: "invalid_rideId" }, { status: 400 });
  }

  const db = adminDb();
  const ref = db.collection("rideInstances").doc(rideId);

  const patch: Record<string, any> = {
    joinedUserIds: FieldValue.arrayUnion(user.uid),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (asLeader) patch.leaderUserIds = FieldValue.arrayUnion(user.uid);

  await ref.set(patch, { merge: true });

  return NextResponse.json({ ok: true });
}
