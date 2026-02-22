"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

export default function EditRoutePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State matching our Rich Schema
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("bike bus");
  const [difficulty, setDifficulty] = useState("easy");
  const [neighborhood, setNeighborhood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 1. Load existing data
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
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  // 2. Update Logic
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

  // 3. Delete Logic
  const handleDelete = async () => {
    if (!confirm("Permanently delete this route? This cannot be undone.")) return;
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

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase().trim()]);
      setTagInput("");
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="font-black italic uppercase text-slate-300 animate-pulse">Retrieving Path Data...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-y-scroll bg-slate-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-40 flex flex-col gap-8">
        
        <header className="flex justify-between items-end px-2">
          <div>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Workshop</p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              Edit <br/>Route
            </h2>
          </div>
          <button 
            onClick={handleDelete}
            className="mb-1 bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 active:bg-red-600 active:text-white transition-all"
          >
            Delete
          </button>
        </header>

        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Route Name</label>
            <input 
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Description / Vibe</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm"
            />
          </div>

          {/* Mode & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm">
                <option value="bike bus">Bike Bus</option>
                <option value="walking school bus">Walking Bus</option>
                <option value="scooter">Scooter</option>
                <option value="gravel bike">Gravel Bike</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm">
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
              placeholder="e.g. St. Johns"
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Tags</label>
            <div className="flex flex-wrap gap-2 px-4 mb-2">
              {tags.map(tag => (
                <span key={tag} className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-2">
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
                placeholder="Add tag..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-blue-600 text-white px-8 rounded-2xl font-black italic">ADD</button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {saving ? "Updating Database..." : "Update Route"}
          </button>
        </form>
      </div>
    </div>
  );
}