"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";

export default function EditGroupPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("school active transportation");
  const [neighborhood, setNeighborhood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Contact State
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    instagram: "",
    website: "",
    school: "",
    schoolRep: ""
  });

  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "groups", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setDescription(data.description || "");
          setType(data.type || "school active transportation");
          setNeighborhood(data.neighborhood || "");
          setTags(data.tags || []);
          setContact({
            email: data.contact?.email || "",
            phone: data.contact?.phone || "",
            instagram: data.contact?.instagram || "",
            website: data.contact?.website || "",
            school: data.contact?.school || "",
            schoolRep: data.contact?.schoolRep || ""
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const groupRef = doc(db, "groups", id as string);
      await updateDoc(groupRef, {
        name,
        description,
        type,
        neighborhood,
        tags,
        contact,
        updatedAt: serverTimestamp(),
      });
      router.push("/toolbox/groups");
    } catch (err) {
      console.error(err);
      alert("Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Permanently dissolve this community group? This cannot be undone.");
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "groups", id as string));
      router.push("/toolbox/groups");
    } catch (err) {
      console.error(err);
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
    <div className="flex items-center justify-center min-h-[60vh] font-black uppercase italic text-slate-300">
      Scanning Hub...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pb-40 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleUpdate} className="flex flex-col gap-6">
        
        {/* Group Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Group Name</label>
          <input 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" 
          />
        </div>

        {/* Type & Neighborhood */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Group Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm"
            >
              <option value="school active transportation">School Transit</option>
              <option value="school PTA">School PTA</option>
              <option value="bike club">Bike Club</option>
              <option value="walking club">Walking Club</option>
              <option value="commuting club">Commuting</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Neighborhood</label>
            <input 
              value={neighborhood} 
              onChange={(e) => setNeighborhood(e.target.value)} 
              className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" 
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">About the Community</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={4} 
            className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" 
          />
        </div>

        {/* Official Channels Section */}
        <div className="bg-slate-100/50 p-6 rounded-[2.5rem] flex flex-col gap-4 border border-slate-100">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Official Channels</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Email" value={contact.email} onChange={(e) => setContact({...contact, email: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
            <input placeholder="Instagram handle" value={contact.instagram} onChange={(e) => setContact({...contact, instagram: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
            <input placeholder="Website" value={contact.website} onChange={(e) => setContact({...contact, website: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
            <input placeholder="Associated School" value={contact.school} onChange={(e) => setContact({...contact, school: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Discovery Tags</label>
          <div className="flex flex-wrap gap-2 px-4 mb-2">
            {tags.map(tag => (
              <span key={tag} className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                {tag} <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
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
            <button type="button" onClick={addTag} className="bg-emerald-600 text-white px-8 rounded-2xl font-black italic shadow-md active:scale-95 transition-all">ADD</button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
          <button 
            type="submit" 
            disabled={saving} 
            className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Syncing..." : "Update Charter"}
          </button>
          
          <button 
            type="button" 
            onClick={handleDelete} 
            className="text-red-500 font-black uppercase text-[10px] tracking-[0.2em] py-4 hover:bg-red-50 rounded-2xl transition-colors"
          >
            Dissolve Group Permanently
          </button>
        </div>
      </form>
    </div>
  );
}