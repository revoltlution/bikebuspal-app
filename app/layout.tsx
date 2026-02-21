"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        {children}
        
        <nav className="bottom-nav">
          {navItems.map((item) => {
            // Checks if current path starts with href (good for sub-pages)
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