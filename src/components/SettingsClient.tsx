"use client";

import useSWR from "swr";
import { useState } from "react";

interface IntegrationInfo {
  manychatKey: string | null;
  igToken: string | null;
  igUserId: string | null;
  calendlyToken: string | null;
  lastSyncAt: string | null;
  errors: { manychat: string | null; instagram: string | null; calendly: string | null };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsClient() {
  const { data, mutate } = useSWR<IntegrationInfo>(
    "/api/settings/integrations",
    fetcher
  );
  const [form, setForm] = useState({
    manychatKey: "",
    igToken: "",
    igUserId: "",
    calendlyToken: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(clear?: ("manychat" | "instagram" | "calendly")[]) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/settings/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clear }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Failed to save.");
      return;
    }
    const errs = Object.entries(json.errors ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    setMessage(
      errs.length > 0
        ? `Saved, but some connections failed — ${errs.join(" · ")}`
        : "Saved and synced ✓"
    );
    setForm({ manychatKey: "", igToken: "", igUserId: "", calendlyToken: "" });
    mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Connections</h1>
        <p className="text-sm text-ink-2">
          Paste your API keys once — your dashboard keeps itself up to date from
          then on. Keys are stored encrypted and are only used for your own
          account.
        </p>
      </div>

      {message && (
        <div className="card">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <section className="card space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">ManyChat</h2>
            <p className="text-sm text-muted">
              ManyChat → Settings → API → copy your API key.
            </p>
          </div>
          <StatusPill saved={data?.manychatKey ?? null} error={data?.errors.manychat ?? null} />
        </header>
        <input
          className="input"
          placeholder={data?.manychatKey ? `Saved (${data.manychatKey}) — paste to replace` : "ManyChat API key"}
          value={form.manychatKey}
          onChange={(e) => setForm((f) => ({ ...f, manychatKey: e.target.value }))}
        />
        {data?.manychatKey && (
          <button onClick={() => save(["manychat"])} className="text-sm text-bad" disabled={busy}>
            Disconnect ManyChat
          </button>
        )}
      </section>

      <section className="card space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Instagram</h2>
            <p className="text-sm text-muted">
              Needs a professional IG account: a long-lived Graph API access
              token (instagram_basic + instagram_manage_insights) and your IG
              user ID. Your agency can set this up with you.
            </p>
          </div>
          <StatusPill saved={data?.igToken ?? null} error={data?.errors.instagram ?? null} />
        </header>
        <input
          className="input"
          placeholder={data?.igToken ? `Saved (${data.igToken}) — paste to replace` : "Instagram access token"}
          value={form.igToken}
          onChange={(e) => setForm((f) => ({ ...f, igToken: e.target.value }))}
        />
        <input
          className="input"
          placeholder={data?.igUserId ? `IG user ID: ${data.igUserId} — type to replace` : "IG user ID (e.g. 1784140700…)"}
          value={form.igUserId}
          onChange={(e) => setForm((f) => ({ ...f, igUserId: e.target.value }))}
        />
        {data?.igToken && (
          <button onClick={() => save(["instagram"])} className="text-sm text-bad" disabled={busy}>
            Disconnect Instagram
          </button>
        )}
      </section>

      <section className="card space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Calendly</h2>
            <p className="text-sm text-muted">
              Calendly → Integrations → API &amp; webhooks → personal access
              token.
            </p>
          </div>
          <StatusPill saved={data?.calendlyToken ?? null} error={data?.errors.calendly ?? null} />
        </header>
        <input
          className="input"
          placeholder={data?.calendlyToken ? `Saved (${data.calendlyToken}) — paste to replace` : "Calendly personal access token"}
          value={form.calendlyToken}
          onChange={(e) => setForm((f) => ({ ...f, calendlyToken: e.target.value }))}
        />
        {data?.calendlyToken && (
          <button onClick={() => save(["calendly"])} className="text-sm text-bad" disabled={busy}>
            Disconnect Calendly
          </button>
        )}
      </section>

      <button onClick={() => save()} disabled={busy} className="btn-primary">
        {busy ? "Saving & testing…" : "Save & test connections"}
      </button>
    </div>
  );
}

function StatusPill({ saved, error }: { saved: string | null; error: string | null }) {
  if (!saved) {
    return (
      <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-muted">
        Not connected
      </span>
    );
  }
  if (error) {
    return (
      <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs font-medium text-bad">
        ✕ Error
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs font-medium text-good">
      ✓ Connected
    </span>
  );
}
