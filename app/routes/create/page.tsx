"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

const MapPreview = dynamic(() => import("@/src/components/MapControl"), { ssr: false });

export default function CreateRoutePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Default States
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("bike bus");
  const [difficulty, setDifficulty] = useState("easy");
  const [neighborhood, setNeighborhood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coords, setCoords] = useState<{lat: number, lng: number}[]>([]);

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const points = Array.from(xml.getElementsByTagName("trkpt"));
    const parsedCoords = points
      .map((pt) => ({
        lat: parseFloat(pt.getAttribute("lat") || "0"),
        lng: parseFloat(pt.getAttribute("lon") || "0"),
      }))
      .filter((point, i, arr) => i === 0 || point.lat !== arr[i - 1].lat || point.lng !== arr[i - 1].lng);
    setCoords(parsedCoords);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Please sign in to create a route.");
    if (coords.length === 0) return alert("Please upload a GPX file for the route path.");

    setSaving(true);
    try {
      await addDoc(collection(db, "routes"), {
        name: routeName,
        description,
        preferredMode: mode,
        difficulty,
        neighborhood,
        tags,
        coordinates: coords,
        createdBy: auth.currentUser.uid, // Required for your 'My Routes' filter
        active: true, // Required for your 'My Routes' filter
        createdAt: serverTimestamp(),
      });
      router.push("/toolbox/routes");
    } catch (err) {
      console.error("Create error:", err);
      alert("Failed to establish new route.");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase().trim()]);
      setTagInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-40 flex flex-col gap-8 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        {/* Route Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Route Name</label>
          <input 
            required
            value={routeName} 
            onChange={(e) => setRouteName(e.target.value)} 
            placeholder="e.g. Alameda Elementary Morning Bus"
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm" 
          />
        </div>

        {/* GPX Upload (Primary Action) */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Upload Path (GPX)</label>
          <input 
            type="file" 
            accept=".gpx" 
            onChange={handleGpxUpload} 
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-blue-600 file:text-white shadow-sm" 
          />
          {coords.length > 0 ? (
            <div className="mt-2 h-48 w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
              <MapPreview key={`preview-${coords.length}`} customData={coords} />
            </div>
          ) : (
            <div className="mt-2 h-48 w-full rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center bg-white/50">
              <p className="text-[10px] font-black uppercase text-slate-300 italic">No path data loaded</p>
            </div>
          )}
        </div>

        

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Description / Vibe</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="A flat, low-traffic route perfect for beginners..."
            rows={3} 
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm" 
          />
        </div>

        {/* Mode & Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Mode</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)} 
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm"
            >
              <option value="bike bus">Bike Bus</option>
              <option value="walking school bus">Walking Bus</option>
              <option value="scooter">Scooter</option>
              <option value="gravel bike">Gravel Bike</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Difficulty</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)} 
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Neighborhood */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Neighborhood</label>
          <input 
            value={neighborhood} 
            onChange={(e) => setNeighborhood(e.target.value)} 
            placeholder="e.g. Northeast Portland"
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" 
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Tags</label>
          <div className="flex flex-wrap gap-2 px-4 mb-2">
            {tags.map(tag => (
              <span key={tag} className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 px-2">
            <input 
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)} 
              className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 font-bold text-xs outline-none shadow-sm" 
              placeholder="e.g. flat, hills, paved" 
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} 
            />
            <button type="button" onClick={addTag} className="bg-blue-600 text-white px-8 rounded-2xl font-black italic shadow-md active:scale-95 transition-all">ADD</button>
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-100 mt-4">
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Deploying Route..." : "Establish Route"}
          </button>
        </div>
        
      </form>
    </div>
  );
}