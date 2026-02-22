"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. Identify if we are on a "Root" page or a "Sub" page
  const rootPages = ["/today", "/schedule", "/discover", "/toolbox"];
  const isRootPage = rootPages.includes(pathname);

  const getPageTitle = () => {
    if (pathname.includes("/routes/create")) return "Create Path";
    if (pathname.includes("/routes/edit")) return "Edit Path";
    if (pathname === "/toolbox/routes") return "My Routes";
    if (pathname === "/toolbox/groups") return "My Groups";
    const current = { "/today": "Today", "/discover": "Discover", "/toolbox": "Toolbox" }[pathname];
    return current || "Bike Bus Pal";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* GLOBAL HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-[100] px-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          {/* BACK BUTTON: Only shows on Sub-pages */}
          {!isRootPage && (
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
          )}
          
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
            {getPageTitle()}
          </h1>
        </div>

        <Link href="/settings/profile" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
          <span className="material-symbols-rounded text-slate-400">person</span>
        </Link>
      </header>

      {/* MAIN CONTENT: pt-20 ensures content starts BELOW the 80px header */}
      <main className="flex-1 pt-20 relative">
        {children}
      </main>

      {/* NAVBAR: Only shows on Root-pages */}
      {isRootPage && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
          {/* Your existing Navbar Component */}
        </nav>
      )}
    </div>
  );
}