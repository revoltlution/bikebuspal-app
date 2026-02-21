"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

// 1. DATA: Your single source of truth for navigation
const navItems = [
  { href: "/today", label: "Today", icon: "calendar_today" },
  { href: "/routes", label: "Routes", icon: "directions_bike" },
  { href: "/map", label: "Map", icon: "explore" },
  { href: "/groups", label: "Groups", icon: "groups" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 2. LOGIC: Determine the title based on the URL
  const getPageTitle = () => {
    const current = navItems.find(item => pathname.startsWith(item.href));
    return current ? current.label : "Bike Bus Pal";
  };

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="antialiased bg-slate-50">
        
        {/* 3. HEADER: Standardized Top Bar */}
        <header className="flex justify-between items-center px-6 pt-10 pb-2 max-w-md mx-auto">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {getPageTitle()}
          </h1>
          
          <Link href="/settings/profile" className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200 shadow-sm">
            <span className="material-symbols-rounded !text-3xl">account_circle</span>
          </Link>
        </header>

        {/* 4. CONTENT: Where your page.tsx files render */}
        <main className="page">
          {children}
        </main>

        {/* 5. NAVIGATION: The persistent bottom bar */}
        <nav className="bottom-nav">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span 
                  className="material-symbols-rounded"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}