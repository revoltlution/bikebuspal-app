"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

const navItems = [
  { href: "/today", label: "Today", icon: "bolt" },
  { href: "/schedule", label: "Schedule", icon: "event" },
  { href: "/discover", label: "Discover", icon: "search" },
  { href: "/toolbox", label: "Toolbox", icon: "handyman" }, // Replaces Gear
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. Identify if we are on the Map page
  const isMapPage = pathname.startsWith("/map");

  const getPageTitle = () => {
    // 1. Check for explicit Action Pages first
    if (pathname.includes('/routes/create')) return "Create Path";
    if (pathname.includes('/routes/edit')) return "Edit Path";
    if (pathname.includes('/events/create')) return "Schedule Ride";
    if (pathname.includes('/groups/create')) return "New Community";
    
    // 2. Otherwise, fall back to your nav items or branding
    const current = navItems.find(item => pathname.startsWith(item.href));
    return current ? current.label : "Bike Bus Pal";
  };

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      {/* 2. BODY: flex-col and overflow-hidden prevent the 'bounce' and the double-scroll */}
      <body className="antialiased bg-slate-50 h-screen w-screen overflow-hidden flex flex-col">
        
        {/* 3. HEADER: Only render if we AREN'T on the Map page */}
        {!isMapPage && (
          /* Global Header in app/layout.tsx */
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-[100] px-6 flex items-center justify-between border-b border-slate-100">
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
            {getPageTitle()}
          </h1>

          <Link href="/settings/profile" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center transition-transform active:scale-90">
            <span className="material-symbols-rounded text-slate-400">person</span>
          </Link>
        </header>
        )}

        {/* 4. MAIN: Fill the remaining space. relative is key for the absolute map inside */}
        <main className={`flex-grow relative overflow-hidden ${isMapPage ? '' : 'px-4'}`}>
          {children}
        </main>

        {/* 5. NAVIGATION: Always fixed at the bottom, doesn't move */}
        <nav className="bottom-nav shrink-0">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span 
                  className="material-symbols-rounded !text-2xl"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}