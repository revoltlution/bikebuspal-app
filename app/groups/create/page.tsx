"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

export default function CreateGroupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // State
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "groups"), {
        name,
        description,
        type,
        neighborhood,
        tags,
        contact,
        ownerId: auth.currentUser.uid,
        members: [auth.currentUser.uid], // Owner is the first member
        active: true,
        createdAt: serverTimestamp(),
      });
      router.push("/toolbox/groups");
    } catch (err) {
      console.error(err);
      alert("Failed to establish group.");
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
    <div className="max-w-2xl mx-auto px-4 pb-40 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        
        {/* Group Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Group Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abernethy Bike Bus" className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" />
        </div>

        {/* Type & Neighborhood */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Group Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold appearance-none shadow-sm">
              <option value="school active transportation">School Transit</option>
              <option value="school PTA">School PTA</option>
              <option value="bike club">Bike Club</option>
              <option value="walking club">Walking Club</option>
              <option value="commuting club">Commuting</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Neighborhood</label>
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. Hosford-Abernethy" className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">About the Community</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" />
        </div>

        {/* Contact Info (The "Bureaucracy" Section) */}
        <div className="bg-slate-100/50 p-6 rounded-[2.5rem] flex flex-col gap-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Official Channels</label>
          <input placeholder="Email" value={contact.email} onChange={(e) => setContact({...contact, email: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
          <input placeholder="Instagram handle" value={contact.instagram} onChange={(e) => setContact({...contact, instagram: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
          <input placeholder="Associated School (if any)" value={contact.school} onChange={(e) => setContact({...contact, school: e.target.value})} className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-sm outline-none" />
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
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 font-bold text-xs outline-none shadow-sm" placeholder="Add tag..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <button type="button" onClick={addTag} className="bg-emerald-600 text-white px-8 rounded-2xl font-black italic shadow-md">ADD</button>
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50">
          {saving ? "Establishing Hub..." : "Charter Group"}
        </button>
      </form>
    </div>
  );
}