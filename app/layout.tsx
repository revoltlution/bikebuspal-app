import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        {children}
        
        {/* Manual Nav for testing - Put this directly in layout */}
        <nav className="bottom-nav">
          <a href="/today" className="nav-item">
            <span className="material-symbols-rounded">calendar_today</span>
            <span>Today</span>
          </a>
          <a href="/routes" className="nav-item">
            <span className="material-symbols-rounded">directions_bike</span>
            <span>Routes</span>
          </a>
          <a href="/map" className="nav-item">
            <span className="material-symbols-rounded">explore</span>
            <span>Map</span>
          </a>
          <a href="/settings" className="nav-item">
            <span className="material-symbols-rounded">settings</span>
            <span>Settings</span>
          </a>
        </nav>
      </body>
    </html>
  );
}