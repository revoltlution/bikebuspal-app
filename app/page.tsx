import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/getUserFromSession";

export default async function HomePage() {
  const user = await getUserFromSession();
  redirect(user ? "/today" : "/login");
}

