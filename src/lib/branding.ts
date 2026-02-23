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
  }
};

export const COLLECTIONS = {
  TRIPS: 'trips',
  ROUTES: 'routes',
  GROUPS: 'groups',
  USERS: 'users'
};