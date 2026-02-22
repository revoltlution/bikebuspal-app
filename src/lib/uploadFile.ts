import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase/client";

export const uploadGroupImage = async (groupId: string, file: File, type: 'thumbnail' | 'gallery') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  
  // Make sure this path structure matches your Rules!
  // Path: groups/[id]/[filename]
  const storageRef = ref(storage, `groups/${groupId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};