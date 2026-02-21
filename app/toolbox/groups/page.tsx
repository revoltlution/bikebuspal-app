"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase/client";

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Query for groups where the user is the owner
        const q = query(
          collection(db, "groups"), 
          where("ownerId", "==", user.uid)
        );
        
        const snap = await getDocs(q);
        setGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-scroll bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-32 flex flex-col gap-4">
        
        {/* ACTION: CREATE NEW GROUP */}
        <Link href="/groups/create" className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-[2.5rem] py-12 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all group bg-white/50">
          <span className="material-symbols-rounded text-4xl group-hover:scale-110 transition-transform">group_add</span>
          <span className="font-black uppercase italic tracking-[0.15em] text-xs">Establish New Group</span>
        </Link>

        {loading ? (
          <div className="p-20 text-center animate-pulse">
            <span className="font-black uppercase text-slate-300 italic tracking-widest">Gathering Communities...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {groups.length === 0 && !loading && (
              <p className="text-center text-slate-400 text-[10px] font-bold uppercase py-10">No groups founded yet.</p>
            )}
            
            {groups.map(group => (
              <div key={group.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-rounded">hub</span>
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-slate-900 leading-none">{group.name}</h4>
                    <p className="text-[9px] font-black uppercase text-slate-400 mt-1 tracking-wider">
                      {group.memberCount || 0} Members • {group.neighborhood || 'Portland'}
                    </p>
                  </div>
                </div>
                
                <Link 
                  href={`/groups/edit/${group.id}`} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                >
                  <span className="material-symbols-rounded text-sm">settings</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}