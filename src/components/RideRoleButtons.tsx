"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RideRoleButtons({
  rideId,
  isJoined,
  isLeader,
}: {
  rideId: string;
  isJoined: boolean;
  isLeader: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const effectiveJoined = isJoined || isLeader; // covers inconsistent data

  const status = !effectiveJoined
  ? "Not joined"
  : isLeader
  ? "You’re a leader"
  : "You’re joined as a volunteer";


  async function setRole(role: "none" | "volunteer" | "leader") {
    try {
      setBusy(true);
      setMsg("");

      const r = await fetch("/api/rides/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, role }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }

      setMsg(
        role === "none" ? "Removed from ride." : role === "leader" ? "You are a leader." : "Joined as volunteer."
      );
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
        <strong>Status:</strong> {status}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!effectiveJoined ? (
            <>
            <button type="button" disabled={busy} onClick={() => setRole("volunteer")} style={{ padding: "10px 12px" }}>
                Join as Volunteer
            </button>
            <button type="button" disabled={busy} onClick={() => setRole("leader")} style={{ padding: "10px 12px" }}>
                Join as Leader
            </button>
            </>
        ) : isLeader ? (
            <>
            <button type="button" disabled={busy} onClick={() => setRole("volunteer")} style={{ padding: "10px 12px" }}>
                Step down to Volunteer
            </button>
            <button type="button" disabled={busy} onClick={() => setRole("none")} style={{ padding: "10px 12px" }}>
                Remove from Ride
            </button>
            </>
        ) : (
            <>
            <button type="button" disabled={busy} onClick={() => setRole("leader")} style={{ padding: "10px 12px" }}>
                Become Leader
            </button>
            <button type="button" disabled={busy} onClick={() => setRole("none")} style={{ padding: "10px 12px" }}>
                Remove from Ride
            </button>
            </>
        )}

        {msg ? <span style={{ fontSize: 13, opacity: 0.85 }}>{msg}</span> : null}
        </div>
    </div>
    );
}
