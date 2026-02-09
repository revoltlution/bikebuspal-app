import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function getUserFromSession() {
  const session = (await cookies()).get("__session")?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}
