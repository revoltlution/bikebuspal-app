"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/src/lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { uploadAvatar } from "@/src/lib/uploadFile";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile State
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [shareGps, setShareGps] = useState(true);
  const [dependents, setDependents] = useState<string[]>([]);
  const [depInput, setDepInput] = useState("");

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState({
    email: true,
    preEvent: true,
    eventUpdates: true,
    eventCompleted: false,
    groupUpdates: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/");

      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || "");
        setFullName(data.fullName || "");
        setAvatarUrl(data.avatarUrl || user.photoURL || "");
        setShareGps(data.shareGps ?? true);
        setDependents(data.dependents || []);
        setNotifications(data.notifications || {
          email: true,
          preEvent: true,
          eventUpdates: true,
          eventCompleted: false,
          groupUpdates: true,
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser;
    if (!file || !user) return;

    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateProfile(user, { photoURL: url });
      setAvatarUrl(url);
      alert("Avatar Updated!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        displayName,
        fullName,
        avatarUrl,
        shareGps,
        dependents,
        notifications,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert("Profile Synced.");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addDependent = () => {
    if (depInput.trim() && !dependents.includes(depInput.trim())) {
      setDependents([...dependents, depInput.trim()]);
      setDepInput("");
    }
  };

  if (loading) return (
    <div className="p-20 text-center font-black italic uppercase text-slate-300">
      Loading Command Center...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pb-40 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-xl overflow-hidden relative group">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
          ) : (
            <span className="material-symbols-rounded text-6xl text-slate-400 flex items-center justify-center h-full">person</span>
          )}
          
          <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all text-white">
            <span className="material-symbols-rounded">add_a_photo</span>
            <span className="text-[8px] font-black uppercase mt-1">{uploading ? '...' : 'Change'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
          </label>
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">@{displayName || "rider"}</h2>
      </div>

      <div className="flex flex-col gap-8">
        {/* Identity Section */}
        <section className="flex flex-col gap-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Identity</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Screen Name" className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm" />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="p-6 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none shadow-sm" />
        </section>

        {/* Dependents Section */}
        <section className="flex flex-col gap-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Dependents (Kids)</label>
          <div className="flex flex-wrap gap-2 px-2">
            {dependents.map(name => (
              <span key={name} className="bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2">
                {name} <button type="button" onClick={() => setDependents(dependents.filter(d => d !== name))}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              value={depInput} 
              onChange={(e) => setDepInput(e.target.value)} 
              placeholder="Add kid's name..." 
              className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 font-bold text-xs outline-none" 
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDependent())}
            />
            <button type="button" onClick={addDependent} className="bg-slate-900 text-white px-6 rounded-2xl font-black italic">ADD</button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-slate-100/50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notification Preferences</label>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Email Notifications</span>
            <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="w-6 h-6 accent-blue-600" />
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {[
              { key: 'preEvent', label: 'Pre-Event Reminders' },
              { key: 'eventUpdates', label: 'Route/Time Changes' },
              { key: 'eventCompleted', label: 'Event Completion' },
              { key: 'groupUpdates', label: 'New Group Activity' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                <button 
                  type="button"
                  onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key as keyof typeof notifications]})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Section */}
        <section className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
          <div>
            <h4 className="font-black italic uppercase text-sm">Beacon Mode</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Share GPS when leading a mission</p>
          </div>
          <input type="checkbox" checked={shareGps} onChange={(e) => setShareGps(e.target.checked)} className="w-6 h-6 accent-blue-600" />
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-4">
        <button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
            {saving ? "Syncing..." : "Update Profile"}
        </button>
        
        <div className="flex flex-col items-center gap-2">
            {!confirmSignOut ? (
            <button 
                onClick={() => setConfirmSignOut(true)} 
                className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] py-4 hover:text-red-500 transition-colors"
            >
                Sign Out of Bike Bus Pal
            </button>
            ) : (
            <div className="flex flex-col items-center gap-3 py-2 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Are you sure?</p>
                <div className="flex gap-4">
                <button 
                    onClick={() => signOut(auth).then(() => router.push("/"))} 
                    className="bg-red-500 text-white px-8 py-3 rounded-full font-black italic uppercase text-[10px] tracking-widest shadow-lg active:scale-90 transition-transform"
                >
                    Yes, Sign Out
                </button>
                <button 
                    onClick={() => setConfirmSignOut(false)} 
                    className="bg-slate-200 text-slate-600 px-8 py-3 rounded-full font-black italic uppercase text-[10px] tracking-widest active:scale-90 transition-transform"
                >
                    Cancel
                </button>
                </div>
            </div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
}