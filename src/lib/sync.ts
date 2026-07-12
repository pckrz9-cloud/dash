import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { fetchInstagramStats } from "@/lib/integrations/instagram";
import { fetchUpcomingCalls } from "@/lib/integrations/calendly";

// Don't hit the external APIs more often than this per client; the dashboard
// polls freely and this gate keeps us inside everyone's rate limits.
export const SYNC_STALE_MS = 10 * 60 * 1000;

const inFlight = new Set<string>();

/**
 * Pull fresh stats for ONE user from all connected integrations and persist
 * them. Always scoped to the given userId — this is the tenant boundary.
 */
export async function syncUser(userId: string, force = false): Promise<void> {
  const integration = await prisma.integration.findUnique({ where: { userId } });
  if (!integration) return;

  const stale =
    !integration.lastSyncAt ||
    Date.now() - integration.lastSyncAt.getTime() > SYNC_STALE_MS;
  if (!force && !stale) return;
  if (inFlight.has(userId)) return;
  inFlight.add(userId);

  try {
    const errors: {
      instagramError: string | null;
      calendlyError: string | null;
    } = { instagramError: null, calendlyError: null };

    const snapshot: Record<string, number | string | null> = {};

    // --- Instagram ---
    if (integration.igTokenEnc && integration.igUserId) {
      try {
        const ig = await fetchInstagramStats(
          decrypt(integration.igTokenEnc),
          integration.igUserId
        );
        snapshot.igFollowers = ig.followers;
        snapshot.igFollows = ig.follows;
        snapshot.igMedia = ig.media;
        snapshot.igReachDay = ig.reachDay;
        snapshot.igProfileViewsDay = ig.profileViewsDay;
        snapshot.igAccountsEngagedDay = ig.accountsEngagedDay;
        snapshot.igUsername = ig.username;
      } catch (e) {
        errors.instagramError = errMsg(e);
      }
    }

    // --- Calendly ---
    if (integration.calendlyTokenEnc) {
      try {
        const calls = await fetchUpcomingCalls(decrypt(integration.calendlyTokenEnc));
        await prisma.$transaction([
          prisma.upcomingCall.deleteMany({ where: { userId } }),
          prisma.upcomingCall.createMany({
            data: calls.map((c) => ({
              userId,
              eventUri: c.eventUri,
              name: c.name,
              startTime: c.startTime,
              endTime: c.endTime,
              inviteeName: c.inviteeName,
              inviteeEmail: c.inviteeEmail,
              joinUrl: c.joinUrl,
            })),
          }),
        ]);
      } catch (e) {
        errors.calendlyError = errMsg(e);
      }
    }

    // Only record a snapshot if at least one metric came back.
    const hasData = Object.values(snapshot).some((v) => v !== null && v !== undefined);
    if (hasData) {
      await prisma.statSnapshot.create({ data: { userId, ...snapshot } });
    }

    await prisma.integration.update({
      where: { userId },
      data: { lastSyncAt: new Date(), ...errors },
    });
  } finally {
    inFlight.delete(userId);
  }
}

/** Sync every client that has credentials configured (used by the cron). */
export async function syncAllUsers(): Promise<{ synced: number }> {
  const integrations = await prisma.integration.findMany({
    select: { userId: true },
  });
  let synced = 0;
  for (const { userId } of integrations) {
    try {
      await syncUser(userId, true);
      synced++;
    } catch (e) {
      console.error(`Sync failed for user ${userId}:`, e);
    }
  }
  return { synced };
}

function errMsg(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).slice(0, 300);
}
