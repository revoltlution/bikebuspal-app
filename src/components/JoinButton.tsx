"use client";

import { useState } from "react";
import { db, auth } from "@/src/lib/firebase/client";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

// Define the shape of the event prop
interface JoinButtonProps {
  event: {
    id: string;
    riders?: string[];
  };
}

export default function JoinButton({ event }: JoinButtonProps) {
  const user = auth.currentUser;
  const [isJoined, setIsJoined] = useState(event?.riders?.includes(user?.uid || ""));
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!user) return alert("Please sign in to join a ride!");

    setLoading(true);
    const eventRef = doc(db, "events", event.id);

    try {
      if (isJoined) {
        await updateDoc(eventRef, { riders: arrayRemove(user.uid) });
        setIsJoined(false);
      } else {
        await updateDoc(eventRef, { riders: arrayUnion(user.uid) });
        setIsJoined(true);
      }
    } catch (err) {
      console.error("Join Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
        isJoined 
          ? "bg-slate-100 text-slate-400 border border-slate-200" 
          : "bg-blue-600 text-white shadow-lg shadow-blue-200"
      }`}
    >
      {loading ? "..." : isJoined ? "Joined" : "Join Ride"}
    </button>
  );
}