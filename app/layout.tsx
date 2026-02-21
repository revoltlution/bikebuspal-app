"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

const navItems = [
  { href: "/today", label: "Today", icon: "bolt" },        // Action: The Mission Control
  { href: "/schedule", label: "Schedule", icon: "event" },  // Commitment: My favorites/plan
  { href: "/discover", label: "Discover", icon: "search" }, // Growth: Find new stuff
  { href: "/gear", label: "Gear", icon: "handyman" },       // Foundation: GPX/Groups/Settings
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. Identify if we are on the Map page
  const isMapPage = pathname.startsWith("/map");

  const getPageTitle = () => {
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
          <header className="flex justify-between items-center px-6 pt-10 pb-2 shrink-0">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {getPageTitle()}
            </h1>
            
            <Link href="/settings/profile" className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200 shadow-sm">
              <span className="material-symbols-rounded !text-3xl">account_circle</span>
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