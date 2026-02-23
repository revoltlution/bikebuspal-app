import { BRANDING } from "@/src/lib/branding";
import ClientLayout from "./ClientLayout"; // We'll create this next
import "./globals.css";

export const viewport = {
  themeColor: BRANDING.isWay2Z ? "#059669" : "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: BRANDING.name,
  description: BRANDING.motto,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRANDING.name,
  },
  manifest: "/manifest", 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body className="antialiased bg-transparent text-slate-900 overflow-x-hidden">
        {/* All the "use client" logic moves into this component */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}