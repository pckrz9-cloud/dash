export default function StatTile({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: number | null | undefined;
  delta?: number | null;
  hint?: string;
}) {
  const hasValue = value !== null && value !== undefined;
  const showDelta = hasValue && delta !== null && delta !== undefined && delta !== 0;
  return (
    <div className="card">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">
        {hasValue ? value.toLocaleString() : "—"}
      </p>
      {showDelta ? (
        <p className={`mt-1 text-sm font-medium ${delta! > 0 ? "text-good" : "text-bad"}`}>
          {delta! > 0 ? "▲" : "▼"} {Math.abs(delta!).toLocaleString()}{" "}
          <span className="font-normal text-muted">vs previous day</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}
