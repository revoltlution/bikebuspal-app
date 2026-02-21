"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/src/lib/firebase/client";

const MapPreview = dynamic(() => import("@/src/components/MapControl"), { ssr: false });

export default function CreateRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Existing Logic Props
  const [routeName, setRouteName] = useState("");
  const [coords, setCoords] = useState<[number, number][]>([]);
  
  // NEW Metadata Props
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("bike bus");
  const [difficulty, setDifficulty] = useState("easy");
  const [neighborhood, setNeighborhood] = useState("St. Johns"); // Default for your current routes
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["family-friendly"]);

  // GPX Parsing Logic (Kept identical to yours)
  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const points = Array.from(xml.getElementsByTagName("trkpt"));
    const parsedCoords = points
      .map((pt) => [parseFloat(pt.getAttribute("lat") || "0"), parseFloat(pt.getAttribute("lon") || "0")] as [number, number])
      .filter((point, i, arr) => i === 0 || point[0] !== arr[i - 1][0] || point[1] !== arr[i - 1][1]);
    setCoords(parsedCoords);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase().trim()]);
      setTagInput("");
    }
  };

  const saveToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to publish a route.");
      return;
    }
    if (coords.length === 0) {
      alert("Please upload a GPX file first.");
      return;
    }

    setLoading(true);
    try {
      const firestoreReadyCoords = coords.map(c => ({ lat: c[0], lng: c[1] }));

      await addDoc(collection(db, "routes"), {
        // --- Combined Schema ---
        name: routeName || "Unnamed Route",
        description,
        preferredMode: mode,
        difficulty,
        tags,
        neighborhood,
        coordinates: firestoreReadyCoords,
        active: true,
        city: "Portland",
        schoolName: "James John Elementary",
        startLocationLabel: "Meet at George Park",
        startTimeLocal: "08:00",
        weekday: 2,
        createdBy: user.uid,
        planner: user.displayName || "Revolution",
        updatedAt: serverTimestamp(),
        // Placeholder for future thumbnails
        startThumbnail: "",
        endThumbnail: ""
      });

      router.push("/toolbox/routes");
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Save Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32 px-4 pt-8 max-w-2xl mx-auto overflow-y-auto min-h-screen bg-slate-50">
      <header>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          Create <br/>New Path
        </h2>
        
        {/* GPX.STUDIO HELPER */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <span className="material-symbols-rounded text-blue-600">map</span>
          <p className="text-[11px] font-bold text-blue-900 leading-relaxed uppercase tracking-tight">
            Need to draw a route? Use <a href="https://gpx.studio/" target="_blank" className="underline decoration-2 underline-offset-2">gpx.studio</a>, export the GPX, and upload it below.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {/* Route Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Route Name</label>
          <input 
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="e.g. JJE: George Park"
            className="p-5 bg-white rounded-3xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* GPX Upload & Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">GPX File</label>
          <input type="file" accept=".gpx" onChange={handleGpxUpload} className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-slate-900 file:text-white" />
          
          {coords.length > 0 && (
            <div className="mt-2 h-48 w-full rounded-3xl overflow-hidden border border-slate-200">
              <MapPreview key={`preview-${coords.length}`} customData={coords.map(c => ({ lat: c[0], lng: c[1] }))} />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Description / Vibe</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="p-5 bg-white rounded-3xl border border-slate-200 font-bold outline-none"
            placeholder="e.g. A flat, safe neighborhood path avoiding main roads."
          />
        </div>

        {/* Mode & Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Primary Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-5 bg-white rounded-3xl border border-slate-200 font-bold appearance-none">
              <option value="bike bus">Bike Bus</option>
              <option value="walking school bus">Walking Bus</option>
              <option value="gravel bike">Gravel Bike</option>
              <option value="scooter">Scooter</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="p-5 bg-white rounded-3xl border border-slate-200 font-bold appearance-none">
              <option value="easy">Easy (Flat)</option>
              <option value="medium">Medium (Hills)</option>
              <option value="hard">Hard (Advanced)</option>
            </select>
          </div>
        </div>

        {/* Tags Logic */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Tags</label>
          <div className="flex flex-wrap gap-2 px-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-2">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 font-bold text-xs outline-none"
              placeholder="e.g. protected-lane, scenic"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="bg-slate-900 text-white px-6 rounded-2xl font-black italic">ADD</button>
          </div>
        </div>

        <button 
          onClick={saveToFirestore}
          disabled={loading}
          className="bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
        >
          {loading ? "Syncing to Cloud..." : "Publish Route"}
        </button>
      </div>
    </div>
  );
}