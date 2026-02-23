import { db } from "./firebase/client";
import { doc, getDoc } from "firebase/firestore";

export interface RiderData {
  uid: string;
  displayName: string;
  avatarUrl: string;
  dependents?: string[]; // Only present if authorized
  isAuthorized: boolean;
}

export const getSecureRiderData = async (riderUid: string): Promise<RiderData> => {
  const publicRef = doc(db, "users", riderUid);
  const privateRef = doc(db, "users", riderUid, "private", "metadata");

  try {
    // Attempt to fetch both. If private fails, the catch block triggers.
    const [publicSnap, privateSnap] = await Promise.all([
      getDoc(publicRef),
      getDoc(privateRef)
    ]);

    const publicData = publicSnap.data() || {};
    
    // If the rules allow this read, privateSnap will have data
    if (privateSnap.exists()) {
      return {
        uid: riderUid,
        displayName: publicData.displayName || "Unknown Rider",
        avatarUrl: publicData.avatarUrl || "",
        dependents: privateSnap.data().dependents || [],
        isAuthorized: true
      };
    }

    // Fallback if private doc doesn't exist but read was technically "allowed"
    return {
      uid: riderUid,
      displayName: publicData.displayName || "Unknown Rider",
      avatarUrl: publicData.avatarUrl || "",
      isAuthorized: false
    };

  } catch (error: any) {
    // If Firebase Rules block the read, we land here (Error 403)
    console.log(`Access restricted for rider: ${riderUid}`);
    
    // Fetch just the public data as a secondary attempt if the Promise.all failed
    const publicSnap = await getDoc(publicRef);
    const publicData = publicSnap.data() || {};

    return {
      uid: riderUid,
      displayName: publicData.displayName || "Unknown Rider",
      avatarUrl: publicData.avatarUrl || "",
      isAuthorized: false
    };
  }
};