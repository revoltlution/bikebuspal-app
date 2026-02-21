import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bike Bus Pal",
  description: "Ride together, stay safe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* The 'page' class from your CSS handles the padding-bottom and max-width */}
        <main className="page">
          {children}
        </main>

        {/* Persistent Bottom Navigation */}
        <nav className="bottom-nav">
          <Link href="/today" className="nav-item">
            <span className="nav-icon">📅</span>
            <span>Today</span>
          </Link>
          <Link href="/routes" className="nav-item">
            <span className="nav-icon">🚲</span>
            <span>Routes</span>
          </Link>
          <Link href="/map" className="nav-item">
            <span className="nav-icon">📍</span>
            <span>Map</span>
          </Link>
          <Link href="/groups" className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Groups</span>
          </Link>
          <Link href="/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}