"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
// Use the explicit file path
import { db } from "@/src/lib/firebase/client"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
      .filter((_, i) => i % 5 === 0); // Keep it lean

    setCoords(parsedCoords);
  };

  const saveToFirestore = async () => {
    if (!routeName || coords.length === 0) return alert("Missing name or GPX data");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "routes"), {
        name: routeName,
        coordinates: coords,
        status: "active",
        createdAt: serverTimestamp(),
      });
      router.push("/map");
    } catch (error) {
      console.error("Error saving route:", error);
    } finally {
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
            {/* Adding a key based on coords length or a timestamp forces a refresh */}
            <MapPreview 
            key={`preview-${coords.length}`} 
            activeRoute="preview" 
            customData={coords} 
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