import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <>
      <Nav name={session.user.name ?? ""} isAdmin={session.user.role === "ADMIN"} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <SettingsClient />
      </main>
    </>
  );
}
