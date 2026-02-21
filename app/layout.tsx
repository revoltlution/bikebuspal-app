"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css"; // <--- IS THIS STILL THERE?

// Mapping our nav items to Material Symbols Rounded names
const navItems = [
  { href: "/today", label: "Today", icon: "calendar_today" },
  { href: "/routes", label: "Routes", icon: "directions_bike" },
  { href: "/map", label: "Map", icon: "explore" },
  { href: "/groups", label: "Groups", icon: "groups" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        {/* Injecting Material Symbols Rounded directly */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900">
        <main className="page min-h-screen">
          {children}
        </main>

        {/* Floating Glassmorphism Nav */}
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
                  className="material-symbols-rounded nav-icon"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}