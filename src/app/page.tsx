import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <>
      <Nav name={session.user.name ?? ""} isAdmin={session.user.role === "ADMIN"} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <DashboardClient firstName={(session.user.name ?? "").split(" ")[0]} />
      </main>
    </>
  );
}
