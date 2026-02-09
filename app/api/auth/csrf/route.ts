import { NextResponse } from "next/server";

export async function GET() {
  const csrfToken = crypto.randomUUID();

  const res = NextResponse.json({ csrfToken });
  res.cookies.set("csrfToken", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}
