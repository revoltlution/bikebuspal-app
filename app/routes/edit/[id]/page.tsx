"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

// Dynamically load MapControl for previewing
const MapPreview = dynamic(() => import("@/src/components/MapControl"), { ssr: false });

export default function EditRoutePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("bike bus");
  const [difficulty, setDifficulty] = useState("easy");
  const [neighborhood, setNeighborhood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // GPX Specific State
  const [coords, setCoords] = useState<{lat: number, lng: number}[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "routes", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRouteName(data.name || "");
          setDescription(data.description || "");
          setMode(data.preferredMode || "bike bus");
          setDifficulty(data.difficulty || "easy");
          setNeighborhood(data.neighborhood || "");
          setTags(data.tags || []);
          setCoords(data.coordinates || []); // Load existing path
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

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
      .filter((point, i, arr) => {
        if (i === 0) return true;
        return point.lat !== arr[i - 1].lat || point.lng !== arr[i - 1].lng;
      });

    setCoords(parsedCoords);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const routeRef = doc(db, "routes", id as string);
      await updateDoc(routeRef, {
        name: routeName,
        description,
        preferredMode: mode,
        difficulty,
        neighborhood,
        tags,
        coordinates: coords, // Update with the (potentially new) coordinates
        updatedAt: serverTimestamp(),
      });
      router.push("/toolbox/routes");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

    const handleDelete = async () => {
        // Adding 'window.' prefix prevents "Cannot find name 'confirm'" IDE errors
        const confirmed = window.confirm("Permanently delete this route? This cannot be undone.");
        if (!confirmed) return;

        setSaving(true);
        try {
        await deleteDoc(doc(db, "routes", id as string));
        router.push("/toolbox/routes");
        } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete.");
        } finally {
        setSaving(false);
        }
    };

  if (loading) return <div className="p-20 font-black italic uppercase text-slate-300 animate-pulse text-center">Loading Path...</div>;

  return (
    <div className="fixed inset-0 overflow-y-scroll bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-40 flex flex-col gap-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-end px-2">
          <div>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Workshop</p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Edit <br/>Route</h2>
          </div>
          <button onClick={handleDelete} className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 active:bg-red-600 active:text-white transition-all">Delete</button>
        </header>

        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
          {/* GPX SWAP & PREVIEW */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Update Path (GPX)</label>
            <input 
              type="file" 
              accept=".gpx" 
              onChange={handleGpxUpload} 
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:font-black file:bg-slate-900 file:text-white shadow-sm" 
            />
            
            {coords.length > 0 && (
              <div className="mt-2 h-48 w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
                <MapPreview key={`preview-${coords.length}`} customData={coords} />
              </div>
            )}
          </div>

          {/* ... (Keep Name, Description, Mode, Difficulty inputs from previous version) */}

          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {saving ? "Updating Cloud..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}