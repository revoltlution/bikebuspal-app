"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StarRouteButton({
  routeId,
  starred,
}: {
  routeId: string;
  starred: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    try {
      setBusy(true);
      await fetch("/api/user/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId, star: !starred }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
        type="button"
        className={`btn ${starred ? 'starred' : ''}`}
        disabled={busy}
        onClick={toggle}
        aria-label={starred ? "Unstar route" : "Star route"}
        title={starred ? "Unstar route" : "Star route"}
    >
        <span style={{ color: starred ? '#FFD700' : 'inherit', marginRight: '6px' }}>
        {starred ? '★' : '☆'}
        </span>
        {starred ? "Starred" : "Star"}
    </button>
    );
}
