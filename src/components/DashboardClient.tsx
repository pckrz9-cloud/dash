"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import StatTile from "@/components/StatTile";
import TrendChart, { TrendPoint } from "@/components/TrendChart";
import CallsList, { Call } from "@/components/CallsList";

interface Snapshot {
  capturedAt: string;
  igFollowers: number | null;
  igFollows: number | null;
  igMedia: number | null;
  igReachDay: number | null;
  igProfileViewsDay: number | null;
  igAccountsEngagedDay: number | null;
  igUsername: string | null;
  mcSubscribers: number | null;
  mcPageName: string | null;
}

interface ManychatDay {
  date: string;
  conversations: number | null;
  leads: number | null;
}

interface StatsResponse {
  connected: { manychat: boolean; instagram: boolean; calendly: boolean };
  errors: { manychat: string | null; instagram: string | null; calendly: string | null };
  lastSyncAt: string | null;
  latest: Snapshot | null;
  previous: Snapshot | null;
  history: {
    capturedAt: string;
    igFollowers: number | null;
    igReachDay: number | null;
    mcSubscribers: number | null;
  }[];
  manychat: {
    latest: ManychatDay | null;
    previous: ManychatDay | null;
    history: ManychatDay[];
  };
  calls: Call[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardClient({ firstName }: { firstName: string }) {
  const { data, isLoading, mutate } = useSWR<StatsResponse>("/api/stats", fetcher, {
    refreshInterval: 60_000, // auto-update: re-poll every minute
    revalidateOnFocus: true,
  });
  const [refreshing, setRefreshing] = useState(false);

  async function forceRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await mutate();
    } finally {
      setRefreshing(false);
    }
  }

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted">Loading your stats…</p>;
  }

  const { connected, errors, latest, previous, history, manychat, calls, lastSyncAt } = data;
  const nothingConnected =
    !connected.manychat && !connected.instagram && !connected.calendly;

  const followerHistory = seriesFrom(history, "capturedAt", "igFollowers");
  const conversationHistory = seriesFrom(manychat.history, "date", "conversations");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            {firstName ? `Hey ${firstName} 👋` : "Your dashboard"}
          </h1>
          <p className="text-sm text-ink-2">
            {lastSyncAt
              ? `Last updated ${new Date(lastSyncAt).toLocaleString()}`
              : "Waiting for your first sync"}
            {latest?.igUsername && ` · @${latest.igUsername}`}
          </p>
        </div>
        <button onClick={forceRefresh} disabled={refreshing} className="btn-ghost">
          {refreshing ? "Refreshing…" : "↻ Refresh now"}
        </button>
      </div>

      {nothingConnected && (
        <div className="card border-series1">
          <p className="text-sm">
            <span className="font-semibold">Get set up:</span> connect your
            ManyChat, Instagram and Calendly accounts in{" "}
            <Link href="/settings" className="font-semibold text-series1">
              Settings
            </Link>{" "}
            and your stats will start flowing in automatically.
          </p>
        </div>
      )}

      {(errors.manychat || errors.instagram || errors.calendly) && (
        <div className="card">
          <p className="text-sm font-semibold text-bad">⚠ Connection issues</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-2">
            {errors.manychat && <li>ManyChat: {errors.manychat}</li>}
            {errors.instagram && <li>Instagram: {errors.instagram}</li>}
            {errors.calendly && <li>Calendly: {errors.calendly}</li>}
          </ul>
          <p className="mt-2 text-sm text-muted">
            Update your keys in{" "}
            <Link href="/settings" className="text-series1">Settings</Link>.
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Instagram
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="Followers"
            value={latest?.igFollowers}
            delta={delta(latest?.igFollowers, previous?.igFollowers)}
            hint={connected.instagram ? undefined : "Connect Instagram in Settings"}
          />
          <StatTile
            label="Reach (today)"
            value={latest?.igReachDay}
            delta={delta(latest?.igReachDay, previous?.igReachDay)}
            hint={connected.instagram ? "Accounts reached" : "Connect Instagram in Settings"}
          />
          <StatTile
            label="Profile views (today)"
            value={latest?.igProfileViewsDay}
            delta={delta(latest?.igProfileViewsDay, previous?.igProfileViewsDay)}
            hint={connected.instagram ? undefined : "Connect Instagram in Settings"}
          />
          <StatTile
            label="Posts"
            value={latest?.igMedia}
            hint={connected.instagram ? "Total published" : "Connect Instagram in Settings"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          ManyChat — AI appointment setter
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="DM conversations"
            value={manychat.latest?.conversations}
            delta={delta(manychat.latest?.conversations, manychat.previous?.conversations)}
            hint="Auto via ManyChat flow"
          />
          <StatTile
            label="Leads captured"
            value={manychat.latest?.leads}
            delta={delta(manychat.latest?.leads, manychat.previous?.leads)}
            hint="Auto via ManyChat flow"
          />
          <StatTile
            label="Calls booked (upcoming)"
            value={connected.calendly ? calls.length : null}
            hint={connected.calendly ? "From Calendly, automatic" : "Connect Calendly in Settings"}
          />
          <StatTile
            label="Contacts"
            value={latest?.mcSubscribers}
            delta={delta(latest?.mcSubscribers, previous?.mcSubscribers)}
            hint={
              connected.manychat
                ? "From the ManyChat API"
                : "Connect ManyChat in Settings"
            }
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <p className="text-sm text-ink-2">Connected ManyChat account</p>
            <p className="mt-1 truncate text-lg font-semibold">
              {latest?.mcPageName ?? (connected.manychat ? "…" : "Not connected")}
            </p>
            <p className="mt-1 text-sm text-muted">
              Your AI setter runs on this ManyChat account.
            </p>
          </div>
          <ManychatEntry latest={manychat.latest} onSaved={() => mutate()} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Instagram followers over time"
          points={followerHistory}
          color="var(--series-1)"
        />
        <TrendChart
          title="ManyChat conversations over time"
          points={conversationHistory}
          color="var(--series-2)"
        />
      </section>

      <CallsList calls={calls} connected={connected.calendly} />
    </div>
  );
}

// Inline form to correct/override today's ManyChat numbers. Day-to-day the
// counts arrive automatically from the client's ManyChat flows (Settings).
function ManychatEntry({
  latest,
  onSaved,
}: {
  latest: ManychatDay | null;
  onSaved: () => void;
}) {
  const [conversations, setConversations] = useState("");
  const [leads, setLeads] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const body: Record<string, number> = {};
    if (conversations.trim() !== "") body.conversations = Number(conversations);
    if (leads.trim() !== "") body.leads = Number(leads);
    if (Object.keys(body).length === 0) return;
    setBusy(true);
    setSaved(false);
    const res = await fetch("/api/manychat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setConversations("");
      setLeads("");
      setSaved(true);
      onSaved();
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const loggedToday = latest?.date?.slice(0, 10) === today;

  return (
    <div className="card">
      <p className="text-sm text-ink-2">Adjust today&apos;s ManyChat stats</p>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          min={0}
          className="input !px-2"
          placeholder="Convos"
          aria-label="DM conversations today"
          value={conversations}
          onChange={(e) => setConversations(e.target.value)}
        />
        <input
          type="number"
          min={0}
          className="input !px-2"
          placeholder="Leads"
          aria-label="Leads today"
          value={leads}
          onChange={(e) => setLeads(e.target.value)}
        />
      </div>
      <button onClick={save} disabled={busy} className="btn-primary mt-2 w-full !py-1.5">
        {busy ? "Saving…" : "Save"}
      </button>
      <p className="mt-1 text-xs text-muted">
        {saved
          ? "Saved ✓"
          : loggedToday
            ? "Updated today ✓"
            : "Optional — counts are automatic once your ManyChat flow is set up in Settings"}
      </p>
    </div>
  );
}

function delta(
  current: number | null | undefined,
  prev: number | null | undefined
): number | null {
  if (current == null || prev == null) return null;
  return current - prev;
}

function seriesFrom<T>(
  rows: T[],
  dateKey: keyof T,
  valueKey: keyof T
): TrendPoint[] {
  // one point per day (the last entry of each day)
  const byDay = new Map<string, TrendPoint>();
  for (const r of rows) {
    const v: unknown = r[valueKey];
    const d: unknown = r[dateKey];
    if (typeof v !== "number" || typeof d !== "string") continue;
    byDay.set(d.slice(0, 10), { date: d, value: v });
  }
  return [...byDay.values()];
}
