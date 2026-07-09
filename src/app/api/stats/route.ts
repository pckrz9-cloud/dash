import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Everything in this route is scoped to the SESSION user — a client can only
// ever read their own rows.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Refresh from the external APIs if the cached data has gone stale.
  try {
    await syncUser(userId);
  } catch (e) {
    console.error("Sync error:", e);
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [integration, snapshots, calls] = await Promise.all([
    prisma.integration.findUnique({ where: { userId } }),
    prisma.statSnapshot.findMany({
      where: { userId, capturedAt: { gte: since } },
      orderBy: { capturedAt: "asc" },
    }),
    prisma.upcomingCall.findMany({
      where: { userId, startTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
      take: 25,
    }),
  ]);

  const latest = snapshots[snapshots.length - 1] ?? null;
  // "previous" = last snapshot from an earlier calendar day, for deltas.
  const latestDay = latest ? dayKey(latest.capturedAt) : null;
  const previous =
    [...snapshots].reverse().find((s) => dayKey(s.capturedAt) !== latestDay) ?? null;

  return NextResponse.json({
    connected: {
      manychat: Boolean(integration?.manychatKeyEnc),
      instagram: Boolean(integration?.igTokenEnc && integration?.igUserId),
      calendly: Boolean(integration?.calendlyTokenEnc),
    },
    errors: {
      manychat: integration?.manychatError ?? null,
      instagram: integration?.instagramError ?? null,
      calendly: integration?.calendlyError ?? null,
    },
    lastSyncAt: integration?.lastSyncAt ?? null,
    latest,
    previous,
    history: snapshots.map((s) => ({
      capturedAt: s.capturedAt,
      igFollowers: s.igFollowers,
      igReachDay: s.igReachDay,
      mcSubscribers: s.mcSubscribers,
    })),
    calls,
  });
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
