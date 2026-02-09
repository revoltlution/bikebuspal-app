"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function LogoutButton() {
  async function onLogout() {
    // 1) Clear server session cookie
    await fetch("/api/auth/logout", { method: "POST" });

    // 2) Clear client Firebase auth session
    await signOut(auth);

    // 3) Redirect
    window.location.href = "/login";
  }

  return (
    <button onClick={onLogout} style={{ padding: 10 }}>
      Logout
    </button>
  );
}
