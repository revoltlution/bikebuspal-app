import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";


export default async function TodayPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <main className="page">
        <LogoutButton />
        
      <h1>Today</h1>
      <p>Signed in as: {user.email ?? user.uid}</p>

      <p><Link className="link" href="/routes">View Routes →</Link></p>

      <section style={{ marginTop: 24 }}>
        <h2>Next Ride</h2>
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div><strong>Route:</strong> (coming soon)</div>
          <div><strong>Time:</strong> (coming soon)</div>
          <div><strong>Leader status:</strong> (coming soon)</div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Needs Attention</h2>
        <p>(Starred routes with no leader)</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>My Schedule</h2>
        <p>(Rides you’ve joined)</p>
      </section>
      
    </main>
  );
}
