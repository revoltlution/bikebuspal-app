"use client";

import { useEffect, useState } from "react";
import { auth } from "@/src/lib/firebase/client";
import GoogleIcon from "@/src/icons/svg/neutral/web_neutral_rd_na.svg";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setLoading(true);
        const savedEmail = window.localStorage.getItem("emailForSignIn") || "";
        const emailToUse = savedEmail || window.prompt("Confirm your email") || "";
        const userCred = await signInWithEmailLink(auth, emailToUse, window.location.href);

        const csrfToken = await ensureCsrf();
        const idToken = await userCred.user.getIdToken(true);
        await createSession(idToken, csrfToken);

        window.localStorage.removeItem("emailForSignIn");
        window.location.href = "/today";
      }
    })().catch((e) => {
      setStatus(String(e));
      setLoading(false);
    });
  }, []);

  async function onGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const csrfToken = await ensureCsrf();
      const idToken = await userCred.user.getIdToken(true);
      await createSession(idToken, csrfToken);
      window.location.href = "/today";
    } catch (e: any) {
      setStatus(e.message);
      setLoading(false);
    }
  }

  async function onEmailLink() {
    if (!email.trim()) return setStatus("Enter an email first.");
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email.trim());
      setStatus("Check your inbox! Magic link sent.");
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-sm flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Branding */}
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <span className="material-symbols-rounded text-white text-4xl">directions_bike</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Bike Bus <span className="text-blue-600">Pal</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
            The Fleet is Waiting
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Google Button */}
          <button 
            onClick={onGoogle}
            disabled={loading}
            className="w-full bg-white border border-slate-200 p-5 rounded-[2rem] font-bold flex items-center justify-center gap-4 shadow-sm active:scale-95 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <img 
              src={GoogleIcon.src} 
              alt="Google" 
              className="w-6 h-6 object-contain" // Use w-6 (24px) for better balance with the text
            />
            <span className="leading-none">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Email Form */}
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full p-5 bg-white border border-slate-200 rounded-[2rem] font-bold outline-none focus:border-blue-500 shadow-sm transition-colors"
            />
            <button 
              onClick={onEmailLink}
              disabled={loading}
              className="w-full bg-slate-900 text-white p-5 rounded-[2.5rem] font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Send Magic Link"}
            </button>
          </div>
        </div>

        {status && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center">
            <p className="text-xs font-bold text-blue-700">{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}