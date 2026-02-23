export const BRANDING = {
  isWay2Z: process.env.NEXT_PUBLIC_APP_MODE === 'way2z',
  name: process.env.NEXT_PUBLIC_APP_MODE === 'way2z' ? 'Way2Z' : 'Bike Bus Pal',
  motto: 'Neighbors helping neighbors travel together',
  term: {
    route: 'Route',
    event: 'Trip',
    events: 'Trips',
    group: 'Hub',
    leader: 'Organizer',
    user: 'Participant',
  },
  theme: {
    primary: 'bg-blue-600', // BBP Blue
    accent: 'text-blue-600',
    way2zPrimary: 'bg-emerald-600', // Way2Z Green
  },
  titles: {
    // Root Pages
    "/today": "Today",
    "/schedule": "Schedule",
    "/discover": "Discover",
    "/toolbox": "Toolbox",
    // Sub-pages
    "trip-details": "Trip Details",
    "edit-trip": "Edit Trip",
    "new-trip": "Create New Trip",
    "route-details": "Route Details",
    "edit-route": "Edit Route",
    "new-route": "Create New Route",   
    "group-details": "Hub Details",
    "edit-group": "Edit Hub",
    "new-group": "Create New Hub",
    "profile": "Your Profile"
  }
};

export const COLLECTIONS = {
  TRIPS: 'trips',
  ROUTES: 'routes',
  GROUPS: 'groups',
  USERS: 'users'
};
