// Instagram Graph API (professional/business IG account connected to a
// Facebook Page). Requires a long-lived access token with
// instagram_basic + instagram_manage_insights and the IG user ID.

export interface InstagramStats {
  username: string | null;
  followers: number | null;
  follows: number | null;
  media: number | null;
  reachDay: number | null;
  profileViewsDay: number | null;
  accountsEngagedDay: number | null;
}

const GRAPH = "https://graph.facebook.com/v21.0";

async function igFetch(url: string) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Instagram API: ${msg}`);
  }
  return json;
}

export async function fetchInstagramStats(
  accessToken: string,
  igUserId: string
): Promise<InstagramStats> {
  const token = encodeURIComponent(accessToken);
  const id = encodeURIComponent(igUserId);

  const profile = await igFetch(
    `${GRAPH}/${id}?fields=username,followers_count,follows_count,media_count&access_token=${token}`
  );

  const stats: InstagramStats = {
    username: profile.username ?? null,
    followers: toNum(profile.followers_count),
    follows: toNum(profile.follows_count),
    media: toNum(profile.media_count),
    reachDay: null,
    profileViewsDay: null,
    accountsEngagedDay: null,
  };

  // Insights vary by account type & API version — fetch each independently
  // so one unsupported metric doesn't sink the rest.
  stats.reachDay = await tryInsight(id, token, "reach", "day", false);
  stats.profileViewsDay = await tryInsight(id, token, "profile_views", "day", true);
  stats.accountsEngagedDay = await tryInsight(id, token, "accounts_engaged", "day", true);

  return stats;
}

async function tryInsight(
  id: string,
  token: string,
  metric: string,
  period: string,
  totalValue: boolean
): Promise<number | null> {
  try {
    const mt = totalValue ? "&metric_type=total_value" : "";
    const json = await igFetch(
      `${GRAPH}/${id}/insights?metric=${metric}&period=${period}${mt}&access_token=${token}`
    );
    const entry = json?.data?.[0];
    if (!entry) return null;
    if (entry.total_value && typeof entry.total_value.value === "number") {
      return entry.total_value.value;
    }
    const values = entry.values;
    if (Array.isArray(values) && values.length > 0) {
      const last = values[values.length - 1];
      return toNum(last?.value);
    }
    return null;
  } catch {
    return null;
  }
}

function toNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
