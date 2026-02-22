"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import "./globals.css"; // Ensure your Tailwind styles are imported

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const rootPages = ["/today", "/schedule", "/discover", "/toolbox"];
  const isRootPage = rootPages.includes(pathname);

  const getPageTitle = () => {
    if (pathname === "/toolbox/routes") return "My Routes";
    if (pathname === "/toolbox/groups") return "My Groups";
    if (pathname.includes("/routes/create")) return "New Route";
    if (pathname.includes("/routes/edit")) return "Edit Path";
    
    const titles: Record<string, string> = { 
      "/today": "Today", 
      "/schedule": "Schedule", 
      "/discover": "Discover", 
      "/toolbox": "Toolbox" 
    };
    return titles[pathname] || "Bike Bus Pal";
  };

  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <div className="min-h-screen flex flex-col">
          
          {/* HEADER: Standardized 80px */}
          <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md z-[100] px-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              {!isRootPage && (
                <button 
                  onClick={() => router.back()}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-transform"
                >
                  <span className="material-symbols-rounded">arrow_back</span>
                </button>
              )}
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                {getPageTitle()}
              </h1>
            </div>
            <Link href="/settings/profile" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden active:scale-90 transition-transform">
              <span className="material-symbols-rounded text-slate-400">person</span>
            </Link>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 pt-20 relative flex flex-col">
            {children}
          </main>

          {/* NAVBAR: Only shows on Root-pages */}
          {isRootPage && (
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              {/* Replace the div below with your actual Navbar component items */}
              <div className="bg-slate-900 rounded-full p-2 shadow-2xl flex items-center gap-2">
                 <Link href="/today" className={`p-4 rounded-full ${pathname === '/today' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                   <span className="material-symbols-rounded">home</span>
                 </Link>
                 <Link href="/discover" className={`p-4 rounded-full ${pathname === '/discover' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                   <span className="material-symbols-rounded">explore</span>
                 </Link>
                 <Link href="/toolbox" className={`p-4 rounded-full ${pathname === '/toolbox' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                   <span className="material-symbols-rounded">build</span>
                 </Link>
              </div>
            </nav>
          )}
        </div>
      </body>
    </html>
  );
}