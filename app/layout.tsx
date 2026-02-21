// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // Ensure this path is correct relative to this file

export const metadata: Metadata = {
  title: "Bike Bus Pal",
  description: "Portland's Bike Bus Organizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}