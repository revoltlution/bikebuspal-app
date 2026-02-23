"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/src/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    if (pathname === "/toolbox/routes") return "My Routes";
    if (pathname === "/toolbox/groups") return "My Groups";
    if (pathname.includes("/routes/create")) return "New Route";
    if (pathname.includes("/routes/edit")) return "Edit Path";
    if (pathname.includes("/groups/create")) return "New Hub";
    if (pathname.includes("/groups/edit")) return "Edit Hub";
    if (pathname.includes("/settings/profile")) return "Command Center";
    if (pathname.includes("/schedule/create")) return "New Mission";
    
    const titles: Record<string, string> = { 
      "/today": "Today", 
      "/schedule": "Schedule", 
      "/discover": "Discover", 
      "/toolbox": "Toolbox" 
    };
    return titles[pathname] || "Bike Bus Pal";
  };

  // Prevent UI flicker while checking if user is logged in
  if (authLoading && !isLoginPage) {
    return (
      <html lang="en">
        <body className="bg-slate-50 flex items-center justify-center min-h-screen">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900">
        <div className="min-h-screen flex flex-col">
          
          {/* HEADER: Hidden on Login */}
          {!isLoginPage && (
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md z-[100] px-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                {!isRootPage && (
                  <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-transform hover:bg-slate-100"
                  >
                    <span className="material-symbols-rounded">arrow_back</span>
                  </button>
                )}
                <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                  {getPageTitle()}
                </h1>
              </div>

              <Link 
                href="/settings/profile" 
                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden active:scale-90 transition-all hover:border-blue-400"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-rounded text-slate-400">person</span>
                )}
              </Link>
            </header>
          )}

          {/* MAIN CONTENT: pt-0 on login, pt-20 otherwise */}
          <main className={`flex-1 relative flex flex-col ${isLoginPage ? "pt-0" : "pt-20"}`}>
            {children}
          </main>

          {/* NAVBAR: Only shows on Root-pages AND if logged in */}
          {!isLoginPage && isRootPage && (
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <div className="bg-slate-900 rounded-full p-2 shadow-2xl flex items-center gap-2">
                 {[
                   { href: "/today", icon: "home" },
                   { href: "/schedule", icon: "event_upcoming" },
                   { href: "/discover", icon: "explore" },
                   { href: "/toolbox", icon: "build" }
                 ].map((link) => (
                   <Link 
                    key={link.href}
                    href={link.href} 
                    className={`p-4 rounded-full transition-colors ${pathname === link.href ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                   >
                    <span className="material-symbols-rounded">{link.icon}</span>
                  </Link>
                 ))}
              </div>
            </nav>
          )}
        </div>
      </body>
    </html>
  );
}