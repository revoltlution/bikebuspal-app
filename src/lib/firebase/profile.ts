import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

export const syncUserProfile = async (user: any) => {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New User: Create the profile with defaults
    const newProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      preferences: {
        lastRouteId: "",
        isLive: false,
        neighborhood: "St. Johns"
      },
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    // Existing User: Just update lastSeen
    await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
    return userSnap.data();
  }
};