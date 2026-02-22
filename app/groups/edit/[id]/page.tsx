"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { uploadGroupImage, deleteGroupImage } from "@/src/lib/uploadFile"; // Our new helper

export default function EditGroupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [thumbnail, setThumbnail] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

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
        const snap = await getDoc(doc(db, "groups", id as string));
        if (snap.exists()) {
          const data = snap.data();
          setThumbnail(data.thumbnail || "");
          setGallery(data.gallery || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'gallery') => {
    const file = e.target.files?.[0];
    // Ensure 'id' exists and is a string
    if (!file || !id || typeof id !== 'string') return; 

    setUploading(true);
    try {
      const url = await uploadGroupImage(id, file, type); // Use 'id' directly
      if (type === 'thumbnail') {
        setThumbnail(url);
      } else {
        setGallery([...gallery, url]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeThumbnail = async () => {
    if (thumbnail) {
      await deleteGroupImage(thumbnail);
      setThumbnail("");
    }
  };

  const removeFromGallery = async (urlToRemove: string) => {
    await deleteGroupImage(urlToRemove);
    setGallery(gallery.filter(url => url !== urlToRemove));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== 'string') return;
    
    setSaving(true);
    try {
      const groupRef = doc(db, "groups", id);
      
      // Explicitly package the data to ensure images are included
      const updatedData = {
        name,
        description,
        type,
        neighborhood,
        tags,
        contact,
        thumbnail, // The URL from your thumbnail state
        gallery,   // The Array of URLs from your gallery state
        updatedAt: serverTimestamp(),
      };

      await updateDoc(groupRef, updatedData);
      
      console.log("Group Charter Updated with Media:", updatedData);
      router.push("/toolbox/groups");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to sync charter to the cloud.");
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

        {/* MEDIA SECTION */}
        <div className="flex flex-col gap-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Visual Identity</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thumbnail Upload */}
            <div className="relative h-48 bg-white rounded-[2rem] border border-slate-200 overflow-hidden group shadow-sm">
              {thumbnail ? (
                <>
                <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <span className="material-symbols-rounded !text-sm">delete</span>
                </button>
              </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-[10px] font-black uppercase">No Thumbnail</div>
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                <span className="material-symbols-rounded text-white">add_a_photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'thumbnail')} />
              </label>
            </div>

            {/* Gallery Info */}
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col justify-center">
              <h4 className="font-black italic uppercase text-lg leading-tight">Hub Gallery</h4>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">{gallery.length} Images Uploaded</p>
              <label className="mt-4 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-center text-[10px] font-black uppercase cursor-pointer transition-all">
                Add to Gallery
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} />
              </label>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {gallery.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                  <img src={url} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeFromGallery(url)}
                    className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  >
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
          <button 
            type="submit" 
            disabled={saving} 
            className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Syncing..." : "SAVE CHANGES"}
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