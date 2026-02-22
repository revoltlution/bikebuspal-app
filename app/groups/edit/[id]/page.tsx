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

  // State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [contact, setContact] = useState({
    email: "", phone: "", instagram: "", website: "", school: "", schoolRep: ""
  });

  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      const docRef = doc(db, "groups", id as string);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setDescription(data.description || "");
        setType(data.type || "bike club");
        setNeighborhood(data.neighborhood || "");
        setTags(data.tags || []);
        setContact(data.contact || contact);
      }
      setLoading(false);
    };
    fetchGroup();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "groups", id as string), {
        name, description, type, neighborhood, tags, contact,
        updatedAt: serverTimestamp(),
      });
      router.push("/toolbox/groups");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently dissolve this group?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "groups", id as string));
      router.push("/toolbox/groups");
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase().trim()]);
      setTagInput("");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] font-black uppercase italic text-slate-300">Scanning Hub...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-40 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleUpdate} className="flex flex-col gap-6">
        
        {/* Same input fields as Create Page, but using current state */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Group Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold shadow-sm outline-none" />
        </div>

        {/* ... (Repeat Select for Type, Inputs for Neighborhood, Description, Contact as above) ... */}

        <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
          <button type="submit" disabled={saving} className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl">
            {saving ? "Updating Charter..." : "Save Changes"}
          </button>
          
          <button type="button" onClick={handleDelete} className="text-red-500 font-black uppercase text-[10px] tracking-widest py-4">
            Dissolve Group Permanently
          </button>
        </div>
      </form>
    </div>
  );
}