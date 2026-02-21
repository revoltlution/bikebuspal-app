"use client"; // Required for usePathname

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/today", label: "Today", icon: "📅" },
    { href: "/routes", label: "Routes", icon: "🚲" },
    { href: "/map", label: "Map", icon: "📍" },
    { href: "/groups", label: "Groups", icon: "👥" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <html lang="en">
      <body className="antialiased">
        <main className="page min-h-screen">
          {children}
        </main>

        <nav className="bottom-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}