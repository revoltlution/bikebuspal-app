import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminDb";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { FieldValue } from "firebase-admin/firestore";

type Role = "none" | "volunteer" | "leader";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { rideId, role } = (await req.json().catch(() => ({}))) as {
    rideId?: string;
    role?: Role;
  };

  if (!rideId || typeof rideId !== "string") {
    return NextResponse.json({ error: "invalid_rideId" }, { status: 400 });
  }
  if (role !== "none" && role !== "volunteer" && role !== "leader") {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const db = adminDb();
  const ref = db.collection("rideInstances").doc(rideId);
  const uid = user.uid;

  const patch: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

  if (role === "none") {
    patch.joinedUserIds = FieldValue.arrayRemove(uid);
    patch.leaderUserIds = FieldValue.arrayRemove(uid);
  } else if (role === "volunteer") {
    patch.joinedUserIds = FieldValue.arrayUnion(uid);
    patch.leaderUserIds = FieldValue.arrayRemove(uid);
  } else if (role === "leader") {
    patch.joinedUserIds = FieldValue.arrayUnion(uid);
    patch.leaderUserIds = FieldValue.arrayUnion(uid);
  }

  await ref.set(patch, { merge: true });
  return NextResponse.json({ ok: true });
}
