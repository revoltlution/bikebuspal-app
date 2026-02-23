"use client";

import { useState } from "react";
import { parseGPX } from "@/src/utils/gpxParser";
import { useMap } from "@/src/context/MapContext";
import { db, auth } from "@/src/lib/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface GpxUploaderProps {
  onUploadSuccess: (routeId: string) => void;
}

export default function GpxUploader({ onUploadSuccess }: GpxUploaderProps) {
  const { setActiveRoute } = useMap();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      // 1. Use your existing parser
      const coords = await parseGPX(file);
      
      // 2. Format for our DB structure {lat, lng}
      const formattedCoords = coords.map(([lat, lng]) => ({ lat, lng }));

      // 3. Preview on Global Map immediately
      setActiveRoute({ id: 'preview', coordinates: formattedCoords });

      // 4. Persist to Firestore
      const docRef = await addDoc(collection(db, "routes"), {
        name: file.name.replace('.gpx', ''),
        coordinates: formattedCoords,
        createdBy: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        type: 'gpx_upload'
      });

      onUploadSuccess(docRef.id);
    } catch (err) {
      console.error("GPX Upload Failed:", err);
      alert("Error parsing GPX file. Ensure it is a valid track.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept=".gpx" 
        onChange={handleFileChange} 
        className="hidden" 
        id="gpx-upload"
      />
      <label 
        htmlFor="gpx-upload"
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] transition-all cursor-pointer
          ${isUploading ? 'bg-slate-50 border-blue-200 animate-pulse' : 'bg-white border-slate-200 hover:border-blue-400'}
        `}
      >
        <span className="material-symbols-rounded text-blue-600 text-3xl mb-2">upload_file</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isUploading ? 'Processing Path...' : 'Drop GPX File'}
        </span>
      </label>
    </div>
  );
}