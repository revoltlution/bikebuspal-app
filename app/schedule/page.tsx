"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/src/lib/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy 
} from "firebase/firestore";

export default function SchedulePage() {
  const [scheduledEvents, setScheduledEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySchedule = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Events where the user is a rider
        const eventQuery = query(
          collection(db, "events"),
          where("riders", "array-contains", user.uid),
          orderBy("dateTime", "asc")
        );
        const eventSnap = await getDocs(eventQuery);

        // 2. Hydrate Events with Route Data
        const hydratedEvents = await Promise.all(
          eventSnap.docs.map(async (eventDoc) => {
            const eventData = eventDoc.data();
            
            // Fetch the linked route details
            const routeRef = doc(db, "routes", eventData.routeId);
            const routeSnap = await getDoc(routeRef);
            
            return {
              id: eventDoc.id,
              ...eventData,
              // Fallback if route was deleted
              routeInfo: routeSnap.exists() ? routeSnap.data() : { name: "Unknown Route" },
              // Convert Firestore Timestamp to JS Date
              jsDate: eventData.dateTime.toDate()
            };
          })
        );

        setScheduledEvents(hydratedEvents);
      } catch (err) {
        console.error("Schedule Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedule();
  }, []);

  if (loading) return <div className="p-8 font-black italic uppercase text-slate-400">Loading your commitments...</div>;

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* ... keep your existing header ... */}

      <section className="flex flex-col gap-6 px-2">
        {scheduledEvents.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400">
            No upcoming rides found.
          </div>
        ) : (
          scheduledEvents.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              {/* DATE COLUMN */}
              <div className="flex flex-col items-center shrink-0 w-12 pt-1">
                <span className="text-[10px] font-black text-blue-600 uppercase">
                  {event.jsDate.toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-2xl font-black leading-none">
                  {event.jsDate.getDate()}
                </span>
              </div>

              {/* EVENT CARD */}
              <Link 
                href={`/map?mode=live&route=${event.routeId}&event=${event.id}`} 
                className="flex-grow bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-95 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black italic uppercase text-slate-900 leading-tight">
                    {event.routeInfo.name}
                  </h3>
                  <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">
                    {event.jsDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="material-symbols-rounded !text-sm">location_on</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                    {event.routeInfo.neighborhood}
                  </span>
                </div>
              </Link>
            </div>
          ))
        )}
      </section>
    </div>
  );
}