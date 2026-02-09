import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rideId = body?.rideId;
  const asLeader = Boolean(body?.asLeader);

  if (!rideId || typeof rideId !== "string") {
    return NextResponse.json({ error: "invalid_rideId", rideId }, { status: 400 });
  }

  // Debug: prove what user + rideId the server sees
  console.log("JOIN_DEBUG", {
    rideId,
    asLeader,
    uid: user.uid,
    email: user.email,
  });

  const db = adminDb();
  const ref = db.collection("rideInstances").doc(rideId);

  // Write something unmistakable
  const patch: Record<string, any> = {
    debugLastJoinAt: FieldValue.serverTimestamp(),
    debugLastJoinUid: user.uid,
    joinedUserIds: FieldValue.arrayUnion(user.uid),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (asLeader) patch.leaderUserIds = FieldValue.arrayUnion(user.uid);

  await ref.set(patch, { merge: true });

  const snap = await ref.get();
  const data = snap.data() || {};

  return NextResponse.json({
    ok: true,
    project: (db as any)._settings?.projectId, // best-effort debug
    rideId,
    wroteUid: user.uid,
    joinedHasUid: (data.joinedUserIds || []).includes(user.uid),
    leaderHasUid: (data.leaderUserIds || []).includes(user.uid),
    joinedCount: (data.joinedUserIds || []).length,
    leaderCount: (data.leaderUserIds || []).length,
    hasDebug: Boolean(data.debugLastJoinUid),
  });
}
