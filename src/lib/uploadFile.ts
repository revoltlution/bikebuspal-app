import { ref, deleteObject,uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase/client";

export const deleteGroupImage = async (fileUrl: string) => {
  if (!fileUrl) return;
  // Create a reference from the URL
  const fileRef = ref(storage, fileUrl);
  try {
    await deleteObject(fileRef);
  } catch (err) {
    console.error("Storage deletion failed:", err);
    // Even if storage fails (e.g. file already gone), we should let the UI update
  }
};

export const uploadGroupImage = async (groupId: string, file: File, type: 'thumbnail' | 'gallery') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  
  // Make sure this path structure matches your Rules!
  // Path: groups/[id]/[filename]
  const storageRef = ref(storage, `groups/${groupId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};