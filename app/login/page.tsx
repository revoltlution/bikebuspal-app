"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

async function ensureCsrf() {
  const r = await fetch("/api/auth/csrf", { method: "GET" });
  const { csrfToken } = await r.json();
  return csrfToken as string;
}

async function createSession(idToken: string, csrfToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, csrfToken }),
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const savedEmail = window.localStorage.getItem("emailForSignIn") || "";
        const emailToUse = savedEmail || window.prompt("Confirm your email") || "";
        const userCred = await signInWithEmailLink(auth, emailToUse, window.location.href);

        const csrfToken = await ensureCsrf();
        const idToken = await userCred.user.getIdToken(true);
        await createSession(idToken, csrfToken);

        window.localStorage.removeItem("emailForSignIn");
        window.location.href = "/today";
      }
    })().catch((e) => setStatus(String(e)));
  }, []);

  async function onGoogle() {
    setStatus("");
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);

    const csrfToken = await ensureCsrf();
    const idToken = await userCred.user.getIdToken(true);
    await createSession(idToken, csrfToken);

    window.location.href = "/today";
  }

  async function onEmailLink() {
    try {
        setStatus("");

        if (!email.trim()) {
        setStatus("Enter an email first.");
        return;
        }

        const actionCodeSettings = {
        //url: `${window.location.origin}/login`, // later for production
        url: "http://localhost:3000/login",
        handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", email.trim());
        setStatus("Email link sent. Check your inbox.");
    } catch (e: any) {
        console.error(e);
        setStatus(e?.message ?? String(e));
    }
    }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Sign in</h1>

      <button onClick={onGoogle} style={{ width: "100%", padding: 12 }}>
        Continue with Google
      </button>

      <hr style={{ margin: "20px 0" }} />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email for magic link"
        style={{ width: "100%", padding: 12, marginBottom: 12 }}
      />
      <button onClick={onEmailLink} style={{ width: "100%", padding: 12 }}>
        Send sign-in link
      </button>

      {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}
    </div>
  );
}
