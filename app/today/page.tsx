import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";

export default async function TodayPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return <div style={{ padding: 16 }}>Today View (uid: {user.uid})</div>;
}
