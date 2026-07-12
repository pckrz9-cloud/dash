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
}

interface BoosendDay {
  date: string;
  conversations: number | null;
  leads: number | null;
}

interface StatsResponse {
  connected: { instagram: boolean; calendly: boolean };
  errors: { instagram: string | null; calendly: string | null };
  lastSyncAt: string | null;
  latest: Snapshot | null;
  previous: Snapshot | null;
  history: {
    capturedAt: string;
    igFollowers: number | null;
    igReachDay: number | null;
  }[];
  boosend: {
    latest: BoosendDay | null;
    previous: BoosendDay | null;
    history: BoosendDay[];
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

  const { connected, errors, latest, previous, history, boosend, calls, lastSyncAt } = data;
  const nothingConnected = !connected.instagram && !connected.calendly;

  const followerHistory = seriesFrom(history, "capturedAt", "igFollowers");
  const conversationHistory = seriesFrom(boosend.history, "date", "conversations");

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
            Instagram and Calendly accounts in{" "}
            <Link href="/settings" className="font-semibold text-series1">
              Settings
            </Link>{" "}
            and your stats will start flowing in automatically.
          </p>
        </div>
      )}

      {(errors.instagram || errors.calendly) && (
        <div className="card">
          <p className="text-sm font-semibold text-bad">⚠ Connection issues</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-2">
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
          BooSend — AI appointment setter
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="DM conversations"
            value={boosend.latest?.conversations}
            delta={delta(boosend.latest?.conversations, boosend.previous?.conversations)}
            hint="Auto via BooSend webhook"
          />
          <StatTile
            label="Leads captured"
            value={boosend.latest?.leads}
            delta={delta(boosend.latest?.leads, boosend.previous?.leads)}
            hint="Auto via BooSend webhook"
          />
          <StatTile
            label="Calls booked (upcoming)"
            value={connected.calendly ? calls.length : null}
            hint={connected.calendly ? "From Calendly, automatic" : "Connect Calendly in Settings"}
          />
          <BoosendEntry
            latest={boosend.latest}
            onSaved={() => mutate()}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Instagram followers over time"
          points={followerHistory}
          color="var(--series-1)"
        />
        <TrendChart
          title="BooSend conversations over time"
          points={conversationHistory}
          color="var(--series-2)"
        />
      </section>

      <CallsList calls={calls} connected={connected.calendly} />
    </div>
  );
}

// Inline form to correct/override today's BooSend numbers. Day-to-day the
// counts arrive automatically via the client's BooSend webhook (Settings).
function BoosendEntry({
  latest,
  onSaved,
}: {
  latest: BoosendDay | null;
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
    const res = await fetch("/api/boosend", {
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
      <p className="text-sm text-ink-2">Adjust today&apos;s BooSend stats</p>
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
            : "Optional — counts are automatic once your BooSend webhook is set up in Settings"}
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
