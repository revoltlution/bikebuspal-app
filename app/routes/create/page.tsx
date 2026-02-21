"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
// Use the explicit file path
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/src/lib/firebase/client";

// Dynamically load MapControl for previewing
const MapPreview = dynamic(() => import("@/src/components/MapControl"), { ssr: false });

export default function CreateRoutePage() {
  const router = useRouter();
  const [routeName, setRouteName] = useState("");
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const points = Array.from(xml.getElementsByTagName("trkpt"));

    const parsedCoords = points
      .map((pt) => [
        parseFloat(pt.getAttribute("lat") || "0"),
        parseFloat(pt.getAttribute("lon") || "0"),
      ] as [number, number])
      // Filter out identical consecutive points to keep the array clean
      .filter((point, i, arr) => {
        if (i === 0) return true;
        return point[0] !== arr[i - 1][0] || point[1] !== arr[i - 1][1];
      });

    setCoords(parsedCoords);
  };

  const saveToFirestore = async () => {
    // 1. Get the current user directly from the auth instance
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to publish a route.");
      return;
    }

    setLoading(true);
    try {
      const firestoreReadyCoords = coords.map(c => ({ 
        lat: c[0], 
        lng: c[1] 
      }));

      // 2. Add the document with your schema fields
      await addDoc(collection(db, "routes"), {
        name: routeName || "Unnamed Route",
        coordinates: firestoreReadyCoords,
        active: true,
        city: "Portland",
        schoolName: "James John Elementary", // Or your state variable
        startLocationLabel: "Meet at George Park",
        startTimeLocal: "08:00",
        weekday: 2,
        createdBy: user.uid, // This is the magic key for your Delete rule
        planner: user.displayName || "Revolution",
        updatedAt: serverTimestamp(),
      });

      router.push("/map");
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Save Failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black italic uppercase">Create New Route</h1>
      
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-slate-500">Route Name</label>
        <input 
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          placeholder="e.g. JJE: George Park"
          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-slate-500">Upload GPX File</label>
        <input type="file" accept=".gpx" onChange={handleGpxUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700" />
      </div>

        {coords.length > 0 && (
          <div className="h-64 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
            <MapPreview 
              key={`preview-${coords.length}`} 
              customData={coords.map(c => ({ lat: c[0], lng: c[1] }))} 
            />
          </div>
        )}

      <button 
        onClick={saveToFirestore}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Publish Route"}
      </button>
    </div>
  );
}