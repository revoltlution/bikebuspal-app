// ... (Your existing imports)
import TodayHero from "@/src/components/TodayHero";

export default async function TodayPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  // ... (Your existing DB logic stays exactly as is until the return statement)

  const activeRide = nextRide;
  const activeRoute = activeRide ? routesById.get(activeRide.routeId) : null;

  return (
    <main className="page">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Hello, {user.email?.split('@')[0]}</h1>
          <p className="text-sm text-slate-500 font-medium">Portland, Oregon</p>
        </div>
        <LogoutButton />
      </div>

      {/* Modern Hero Section */}
      <TodayHero user={user} route={activeRoute} ride={activeRide} />

      {/* Upcoming Section */}
      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-black tracking-tight">Your Schedule</h2>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">5 Days</span>
        </div>

        <div className="stack gap-3">
          {myRides.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 text-sm italic">
              Nothing on your schedule yet.
            </div>
          ) : (
            myRides.map((r) => {
              const route = routesById.get(r.routeId);
              const isLeader = (r.leaderUserIds ?? []).includes(user.uid);
              const when = new Date(r.startDateTime.toDate()).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              
              return (
                <Link key={r.id} href={`/routes/${r.routeId}`} className="card flex items-center justify-between p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isLeader ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                      <span className="material-symbols-rounded">
                        {isLeader ? 'shield_person' : 'directions_bike'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{route?.name}</h4>
                      <p className="text-xs font-medium text-slate-500">{when} • {r.status}</p>
                    </div>
                  </div>
                  <span className="material-symbols-rounded text-slate-300">chevron_right</span>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Starred Routes */}
      <section>
        <h2 className="text-xl font-black tracking-tight mb-4">Starred Routes</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {[...starred].map((routeId) => {
            const route = routesById.get(routeId);
            return (
              <Link key={routeId} href={`/routes/${routeId}`} className="flex-shrink-0 w-40 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <span className="material-symbols-rounded text-amber-400 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <p className="font-bold text-sm truncate">{route?.name}</p>
                <p className="text-[10px] text-slate-500">{route?.schoolName}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}