"use client";

import { useMemo, useRef, useState } from "react";

export interface TrendPoint {
  date: string; // ISO
  value: number;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

/**
 * Single-series line chart (one axis) with crosshair + tooltip on hover.
 * Color is passed by role (CSS var) so light/dark swap automatically.
 */
export default function TrendChart({
  title,
  points,
  color = "var(--series-1)",
}: {
  title: string;
  points: TrendPoint[];
  color?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { path, coords, yTicks, xTicks } = useMemo(() => {
    if (points.length < 2)
      return { path: "", coords: [] as { x: number; y: number }[], yTicks: [] as { y: number; label: string }[], xTicks: [] as { x: number; label: string }[] };

    const xs = points.map((p) => new Date(p.date).getTime());
    const ys = points.map((p) => p.value);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const sx = (t: number) =>
      PAD.left + ((t - xMin) / (xMax - xMin || 1)) * (W - PAD.left - PAD.right);
    const sy = (v: number) =>
      H - PAD.bottom - ((v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

    const coords = points.map((p, i) => ({ x: sx(xs[i]), y: sy(p.value) }));
    const path = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");

    const yTicks = [0, 0.5, 1].map((f) => {
      const v = yMin + f * (yMax - yMin);
      return { y: sy(v), label: compact(v) };
    });

    const xTickIdx = points.length <= 3 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
    const xTicks = xTickIdx.map((i) => ({
      x: coords[i].x,
      label: new Date(points[i].date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

    return { path, coords, yTicks, xTicks };
  }, [points]);

  function onMove(e: React.MouseEvent) {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  }

  const h = hover !== null && coords[hover] ? { c: coords[hover], p: points[hover] } : null;

  return (
    <div className="card">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {points.length < 2 ? (
        <p className="py-12 text-center text-sm text-muted">
          Not enough history yet — the chart appears after a couple of days of
          synced data.
        </p>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={title}
        >
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke="var(--gridline)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={t.y + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--text-muted)"
              >
                {t.label}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={H - PAD.bottom}
            y2={H - PAD.bottom}
            stroke="var(--baseline)"
            strokeWidth={1}
          />
          {xTicks.map((t, i) => (
            <text
              key={i}
              x={t.x}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {t.label}
            </text>
          ))}
          <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          {h && (
            <g>
              <line
                x1={h.c.x}
                x2={h.c.x}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="var(--baseline)"
                strokeWidth={1}
              />
              <circle cx={h.c.x} cy={h.c.y} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {h && (
        <p className="mt-1 text-xs text-ink-2">
          <span className="font-semibold text-ink">{h.p.value.toLocaleString()}</span>{" "}
          on{" "}
          {new Date(h.p.date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
}
