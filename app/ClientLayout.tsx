"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/src/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { MapProvider } from "@/src/context/MapContext";
import GlobalMap from "@/src/components/GlobalMap";
import { BRANDING } from "@/src/lib/branding";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser && pathname !== "/login") {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const rootPages = ["/today", "/schedule", "/discover", "/toolbox"];
  const isRootPage = rootPages.includes(pathname);
  const isLoginPage = pathname === "/login";

  const getPageTitle = () => {
    if (pathname.match(/^\/schedule\/(?!create|edit)[a-zA-Z0-9_-]+$/)) return BRANDING.titles["trip-details"];
    if (pathname.match(/^\/toolbox\/routes\/(?!create|edit)[a-zA-Z0-9_-]+$/)) return BRANDING.titles["route-details"];
    if (pathname.match(/^\/toolbox\/groups\/(?!create|edit)[a-zA-Z0-9_-]+$/)) return BRANDING.titles["group-details"];

    const pathMap: Record<string, string> = {
      "/today": BRANDING.titles["/today"],
      "/schedule": BRANDING.titles["/today"],
      "/discover": BRANDING.titles["/discover"],
      "/toolbox": BRANDING.titles["/toolbox"],
      "/schedule/create": BRANDING.titles["new-trip"],
      "/toolbox/routes/create": BRANDING.titles["new-route"],
      "/toolbox/groups/create": BRANDING.titles["new-group"],
      "/settings/profile": BRANDING.titles["profile"],
    };

    if (pathname.includes("/schedule/edit")) return BRANDING.titles["edit-trip"];
    if (pathname.includes("/routes/edit")) return BRANDING.titles["edit-route"];
    if (pathname.includes("/groups/edit")) return BRANDING.titles["edit-group"];

    return pathMap[pathname] || BRANDING.name;
  };

  if (authLoading && !isLoginPage) {
    return (
      <div className="bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className={`w-12 h-12 rounded-[1.2rem] ${BRANDING.isWay2Z ? 'bg-emerald-600' : 'bg-blue-600'}`} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing...</p>
        </div>
      </div>
    );
  }

  return (
    <MapProvider>
      <div className="relative min-h-screen flex flex-col">
        <GlobalMap />
        <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
          {!isLoginPage && (
            <header className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top,0px)] bg-white/80 backdrop-blur-xl z-[100] px-6 flex items-center justify-between border-b border-slate-200/50 pointer-events-auto"
              style={{ height: `calc(5rem + env(safe-area-inset-top, 0px))` }}>
              <div className="flex items-center gap-4">
                {!isRootPage && (
                  <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all hover:bg-slate-50 shadow-sm">
                    <span className="material-symbols-rounded">arrow_back</span>
                  </button>
                )}
                <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                  {getPageTitle()}
                </h1>
              </div>
              <Link href="/settings/profile" className={`w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden active:scale-90 transition-all hover:border-blue-500 ${BRANDING.isWay2Z ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded text-slate-400">person</span>}
              </Link>
            </header>
          )}

          <main className={`flex-1 flex flex-col pointer-events-auto ${isLoginPage ? "pt-0" : "pt-20"}`}>
            {children}
          </main>

          {!isLoginPage && isRootPage && (
            <nav className="fixed bottom-[calc(2.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
              <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-1">
                {[
                  { href: "/today", icon: "home", label: "Today" },
                  { href: "/schedule", icon: "event_upcoming", label: "Trips" },
                  { href: "/discover", icon: "explore", label: "Explore" },
                  { href: "/toolbox", icon: "handyman", label: "Tools" }
                ].map((link) => {
                  const isActive = pathname === link.href;
                  const activeClass = BRANDING.isWay2Z ? 'bg-emerald-600' : 'bg-blue-600';
                  return (
                    <Link key={link.href} href={link.href} className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? `${activeClass} text-white shadow-lg` : 'text-slate-500 hover:text-slate-200'}`}>
                      <span className="material-symbols-rounded !text-[22px]">{link.icon}</span>
                      {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </MapProvider>
  );
}