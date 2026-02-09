import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "__session";
const EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  const { idToken, csrfToken } = await req.json();
  const csrfCookie = (await cookies()).get("csrfToken")?.value;

  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    return NextResponse.json({ error: "CSRF" }, { status: 401 });
  }

  const auth = adminAuth();
  const decoded = await auth.verifyIdToken(idToken);

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });

  (await cookies()).set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES_IN_MS / 1000,
  });

  return NextResponse.json({ uid: decoded.uid });
}
