export interface Call {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  inviteeName: string | null;
  inviteeEmail: string | null;
  joinUrl: string | null;
}

export default function CallsList({
  calls,
  connected,
}: {
  calls: Call[];
  connected: boolean;
}) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold">Upcoming calls</h3>
      {!connected ? (
        <p className="py-6 text-center text-sm text-muted">
          Connect Calendly in Settings to see your booked calls here.
        </p>
      ) : calls.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No upcoming calls booked yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--gridline)]">
          {calls.map((c) => {
            const start = new Date(c.startTime);
            const end = new Date(c.endTime);
            return (
              <li key={c.id} className="flex items-center gap-4 py-3">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs uppercase text-muted">
                    {start.toLocaleDateString(undefined, { month: "short" })}
                  </p>
                  <p className="text-xl font-bold leading-tight">
                    {start.getDate()}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-sm text-ink-2">
                    {start.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {end.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {c.inviteeName && ` · ${c.inviteeName}`}
                  </p>
                </div>
                {c.joinUrl && (
                  <a
                    href={c.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost shrink-0 !py-1.5 text-series1"
                  >
                    Join
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
