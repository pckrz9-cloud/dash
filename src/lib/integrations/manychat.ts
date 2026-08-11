// ManyChat Public API (https://api.manychat.com)
// Note: the public API exposes account/page info but only some plans return
// subscriber totals, so every numeric field is parsed defensively.

export interface ManyChatStats {
  pageName: string | null;
  subscribers: number | null;
}

const BASE = "https://api.manychat.com";

async function mcFetch(path: string, apiKey: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ManyChat API ${res.status}: ${await safeText(res)}`);
  }
  return res.json();
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return "";
  }
}

export async function fetchManyChatStats(apiKey: string): Promise<ManyChatStats> {
  const info = await mcFetch("/fb/page/getInfo", apiKey);
  const data = info?.data ?? {};

  // Subscriber totals are only present on some accounts/plans.
  const subscribers =
    toNum(data.subscribers_count) ??
    toNum(data.active_subscribers) ??
    toNum(data.subscribers) ??
    null;

  return {
    pageName: typeof data.name === "string" ? data.name : null,
    subscribers,
  };
}

function toNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
