import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  return JSON.parse(json);
}

export function adminAuth() {
  if (!getApps().length) {
    initializeApp({ credential: cert(getServiceAccount()) });
  }
  return getAuth();
}
