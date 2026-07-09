import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncUser } from "@/lib/sync";

export const dynamic = "force-dynamic";

/** Force-refresh the logged-in user's own stats ("Refresh" button). */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await syncUser(session.user.id, true);
  return NextResponse.json({ ok: true });
}
