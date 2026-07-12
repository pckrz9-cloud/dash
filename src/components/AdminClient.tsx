"use client";

import useSWR from "swr";
import { useState } from "react";

interface Invite {
  id: string;
  code: string;
  label: string | null;
  createdAt: string;
  usedAt: string | null;
  usedBy: { email: string; name: string } | null;
}

interface ClientRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSyncAt: string | null;
  connected: { instagram: boolean; calendly: boolean };
  hasErrors: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminClient() {
  const invites = useSWR<{ invites: Invite[] }>("/api/admin/invites", fetcher);
  const clients = useSWR<{ clients: ClientRow[] }>("/api/admin/clients", fetcher);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function createInvite() {
    setBusy(true);
    await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLabel("");
    setBusy(false);
    invites.mutate();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">Invite a client</h1>
          <p className="text-sm text-ink-2">
            Generate a one-time code and send it to your client — they use it at{" "}
            <code className="rounded bg-surface px-1">/signup</code> to create
            their own private account.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="input max-w-xs"
            placeholder="Client name (optional label)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button onClick={createInvite} disabled={busy} className="btn-primary shrink-0">
            {busy ? "Creating…" : "Create invite code"}
          </button>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(invites.data?.invites ?? []).map((inv) => (
                <tr key={inv.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-2 font-mono font-semibold tracking-wider">
                    {inv.code}
                  </td>
                  <td className="px-4 py-2 text-ink-2">{inv.label ?? "—"}</td>
                  <td className="px-4 py-2">
                    {inv.usedAt ? (
                      <span className="text-muted">
                        Used by {inv.usedBy?.name ?? "?"} ({inv.usedBy?.email})
                      </span>
                    ) : (
                      <span className="font-medium text-good">Available</span>
                    )}
                  </td>
                </tr>
              ))}
              {invites.data?.invites?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    No invites yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Clients</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Connections</th>
                <th className="px-4 py-2 font-medium">Last sync</th>
                <th className="px-4 py-2 font-medium">Log BooSend stats (today)</th>
              </tr>
            </thead>
            <tbody>
              {(clients.data?.clients ?? []).map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-2">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    <ConnDot on={c.connected.instagram} label="Instagram" />
                    <ConnDot on={c.connected.calendly} label="Calendly" />
                    {c.hasErrors && (
                      <span className="ml-1 text-xs font-medium text-bad">⚠ errors</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-2">
                    {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-2">
                    <BoosendRowEntry userId={c.id} />
                  </td>
                </tr>
              ))}
              {clients.data?.clients?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No client accounts yet — send someone an invite code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          For privacy, the admin view shows connection health only — each
          client&apos;s stats live in their own account.
        </p>
      </section>
    </div>
  );
}

// BooSend has no public API — the agency can log a client's daily numbers
// here so the client's dashboard stays fresh without them doing data entry.
function BoosendRowEntry({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState("");
  const [leads, setLeads] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const body: Record<string, string | number> = { userId };
    if (conversations.trim() !== "") body.conversations = Number(conversations);
    if (leads.trim() !== "") body.leads = Number(leads);
    if (body.conversations === undefined && body.leads === undefined) return;
    setBusy(true);
    const res = await fetch("/api/admin/boosend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setConversations("");
      setLeads("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        className="input !w-20 !px-2 !py-1"
        placeholder="Convos"
        aria-label="DM conversations today"
        value={conversations}
        onChange={(e) => setConversations(e.target.value)}
      />
      <input
        type="number"
        min={0}
        className="input !w-20 !px-2 !py-1"
        placeholder="Leads"
        aria-label="Leads today"
        value={leads}
        onChange={(e) => setLeads(e.target.value)}
      />
      <button onClick={save} disabled={busy} className="btn-ghost !px-2 !py-1">
        {saved ? "✓" : busy ? "…" : "Save"}
      </button>
    </span>
  );
}

function ConnDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`mr-3 inline-flex items-center gap-1 text-xs ${on ? "text-good" : "text-muted"}`}
    >
      <span aria-hidden>{on ? "●" : "○"}</span>
      {label}
    </span>
  );
}
