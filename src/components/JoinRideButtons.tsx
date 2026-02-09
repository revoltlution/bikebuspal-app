"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinRideButtons({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function join(asLeader: boolean) {
    try {
      setBusy(true);
      setMsg("");

      const r = await fetch("/api/rides/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, asLeader }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }

      setMsg(asLeader ? "Joined as leader." : "Joined as volunteer.");

      // force server component to refetch
      router.refresh();
      const j = await r.json();
      console.log("JOIN_RESULT", j);

      // optional: also navigate to same URL to be extra sure
      // router.replace(window.location.pathname);
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" disabled={busy} onClick={() => join(false)} style={{ padding: 10 }}>
        Join as Volunteer
      </button>
      <button type="button" disabled={busy} onClick={() => join(true)} style={{ padding: 10 }}>
        Join as Leader
      </button>
      {msg ? <span>{msg}</span> : null}
    </div>
  );
}
