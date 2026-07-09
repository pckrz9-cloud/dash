import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <>
      <Nav name={session.user.name ?? ""} isAdmin />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminClient />
      </main>
    </>
  );
}
