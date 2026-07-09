// Calendly API v2 (https://api.calendly.com) using a personal access token.

export interface CalendlyCall {
  eventUri: string;
  name: string;
  startTime: Date;
  endTime: Date;
  inviteeName: string | null;
  inviteeEmail: string | null;
  joinUrl: string | null;
}

const BASE = "https://api.calendly.com";

async function calFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.title ?? `HTTP ${res.status}`;
    throw new Error(`Calendly API: ${msg}`);
  }
  return json;
}

export async function fetchUpcomingCalls(token: string): Promise<CalendlyCall[]> {
  const me = await calFetch("/users/me", token);
  const userUri: string = me?.resource?.uri;
  if (!userUri) throw new Error("Calendly API: could not resolve current user");

  const minStart = new Date().toISOString();
  const events = await calFetch(
    `/scheduled_events?user=${encodeURIComponent(userUri)}&status=active&min_start_time=${encodeURIComponent(minStart)}&sort=start_time:asc&count=25`,
    token
  );

  const collection: any[] = events?.collection ?? [];
  const calls: CalendlyCall[] = [];

  for (const ev of collection) {
    const call: CalendlyCall = {
      eventUri: ev.uri,
      name: ev.name ?? "Scheduled call",
      startTime: new Date(ev.start_time),
      endTime: new Date(ev.end_time),
      inviteeName: null,
      inviteeEmail: null,
      joinUrl: typeof ev.location?.join_url === "string" ? ev.location.join_url : null,
    };

    // Pull the invitee's name/email so the client can see who booked.
    try {
      const eventId = String(ev.uri).split("/").pop();
      const invitees = await calFetch(
        `/scheduled_events/${eventId}/invitees?count=1`,
        token
      );
      const inv = invitees?.collection?.[0];
      if (inv) {
        call.inviteeName = inv.name ?? null;
        call.inviteeEmail = inv.email ?? null;
      }
    } catch {
      // invitee lookup is best-effort
    }

    calls.push(call);
  }

  return calls;
}
