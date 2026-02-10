"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BecomeLeaderButton({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function becomeLeader() {
    try {
      setBusy(true);
      setMsg("");

      const r = await fetch("/api/rides/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, role: "leader" }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }

      setMsg("You’re the leader.");
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button type="button" className="btn primary" disabled={busy} onClick={becomeLeader}>
        Become Leader
      </button>
      {msg ? <span className="badge">{msg}</span> : null}
    </span>
  );
}
