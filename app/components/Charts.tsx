"use client";
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { App, Trend } from "@/lib/types";
import { formatCount, parseDownloads } from "@/lib/insights";

const BRAND = "#0a5c50";
const INK = "#0f1b2d";
const MUTED = "#566579";
const LINE = "#d9e0e8";

function axisLabel(d: string) {
  const [a, b] = d.split(" – ");
  if (/\d{4}/.test(a)) return a;
  const y = (b ?? "").match(/\d{4}/)?.[0];
  return y ? `${a}, ${y}` : a;
}

/** Weekly Google Trends interest for the last 12 months. Hover, touch or use the arrow keys to read a week. */
export function TrendChart({ data }: { data: Trend[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (!data?.length) {
    return <p className="text-sm text-muted">Google Trends returned no data for this idea&apos;s keyword.</p>;
  }

  const W = 640,
    H = 250,
    L = 34,
    R = 12,
    T = 30,
    B = 30;
  const n = data.length;
  const x = (i: number) => L + (i / Math.max(n - 1, 1)) * (W - L - R);
  const y = (v: number) => H - B - (v / 100) * (H - T - B);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`;
  let peak = 0;
  data.forEach((d, i) => {
    if (d.value > data[peak].value) peak = i;
  });

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }
  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
    else if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? n - 1) + 1));
    else return;
    e.preventDefault();
  }

  const tipW = 178;
  const tipX = hover === null ? 0 : Math.min(W - R - tipW, Math.max(L, x(hover) - tipW / 2));

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-pan-y select-none"
      role="img"
      tabIndex={0}
      aria-label={`Weekly search interest over the last 12 months. Peak ${data[peak].value} out of 100 in ${data[peak].date}. Use the arrow keys to read each week.`}
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
    >
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke={LINE} />
          <text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
            {g}
          </text>
        </g>
      ))}
      <path d={area} fill={BRAND} opacity="0.1" />
      <path d={line} fill="none" stroke={BRAND} strokeWidth="2.4" strokeLinejoin="round" />

      <circle cx={x(peak)} cy={y(data[peak].value)} r="4.5" fill={BRAND} />
      <text x={x(peak)} y={y(data[peak].value) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
        Peak
      </text>
      <circle cx={x(n - 1)} cy={y(data[n - 1].value)} r="4.5" fill="#fff" stroke={BRAND} strokeWidth="2.4" />

      <text x={L} y={H - 8} fontSize="11" fill={MUTED}>
        {axisLabel(data[0].date)}
      </text>
      <text x={x(Math.floor((n - 1) / 2))} y={H - 8} textAnchor="middle" fontSize="11" fill={MUTED}>
        {axisLabel(data[Math.floor((n - 1) / 2)].date)}
      </text>
      <text x={W - R} y={H - 8} textAnchor="end" fontSize="11" fill={MUTED}>
        Now
      </text>

      {hover !== null && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={T - 4} y2={H - B} stroke={INK} strokeOpacity="0.3" />
          <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill={BRAND} stroke="#fff" strokeWidth="2" />
          <rect x={tipX} y={2} width={tipW} height={34} rx="6" fill={INK} />
          <text x={tipX + 10} y={17} fontSize="10.5" fill="#cbd5e1">
            {data[hover].date}
          </text>
          <text x={tipX + 10} y={30} fontSize="12" fontWeight="700" fill="#fff">
            Interest {data[hover].value} / 100
          </text>
        </g>
      )}
    </svg>
  );
}

type Pt = { a: App; i: number; d: number; r: number };

/** Competing apps plotted by rating (across) and downloads (up, log scale). */
export function Landscape({ apps }: { apps: App[] }) {
  const [active, setActive] = useState<number | null>(null);

  const pts: Pt[] = [];
  apps.forEach((a, i) => {
    const d = parseDownloads(a.downloads);
    if (d && d > 0 && typeof a.rating === "number" && a.rating > 0) pts.push({ a, i, d, r: a.rating });
  });

  if (pts.length < 2) {
    return <p className="text-sm text-muted">Not enough apps with both a rating and a download count to plot.</p>;
  }

  const W = 640,
    H = 310,
    L = 46,
    R = 18,
    T = 20,
    B = 42;
  const minR = Math.min(...pts.map((p) => p.r));
  const xlo = Math.min(3.5, Math.floor(minR * 2) / 2);
  const xhi = 5;
  const logs = pts.map((p) => Math.log10(p.d));
  const ylo = Math.floor(Math.min(...logs));
  let yhi = Math.ceil(Math.max(...logs));
  if (yhi - ylo < 2) yhi = ylo + 2;

  const x = (r: number) => L + ((r - xlo) / (xhi - xlo)) * (W - L - R);
  const y = (lg: number) => H - B - ((lg - ylo) / (yhi - ylo)) * (H - T - B);

  // Spread apps that share the exact same rating and download band so none hide behind another.
  const seen = new Map<string, number>();
  const placed = pts.map((p) => {
    const key = `${p.r}|${Math.log10(p.d).toFixed(2)}`;
    const k = seen.get(key) ?? 0;
    seen.set(key, k + 1);
    const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 11;
    return { ...p, cx: x(p.r) + off, cy: y(Math.log10(p.d)) };
  });

  // Greedy label placement: biggest apps first, skip any label that would collide.
  const boxes: [number, number, number, number][] = [];
  const labels = new Map<number, { text: string; x: number; anchor: "start" | "end"; y: number }>();
  [...placed]
    .sort((p, q) => q.d - p.d)
    .forEach((p) => {
      const text = p.a.title.split(/[:\-–|]/)[0].trim().slice(0, 22);
      const w = text.length * 5.7;
      const right = p.cx + 11 + w < W - R;
      const x0 = right ? p.cx + 11 : p.cx - 11 - w;
      const box: [number, number, number, number] = [x0, p.cy - 8, x0 + w, p.cy + 8];
      const clash = boxes.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]));
      if (!clash) {
        boxes.push(box);
        labels.set(p.i, { text, x: right ? p.cx + 11 : p.cx - 11, anchor: right ? "start" : "end", y: p.cy + 4 });
      }
    });

  const xTicks: number[] = [];
  for (let t = xlo; t <= xhi + 0.001; t += 0.5) xTicks.push(+t.toFixed(1));
  const yTicks: number[] = [];
  for (let t = ylo; t <= yhi; t++) yTicks.push(t);

  const sel = placed.find((p) => p.i === active);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label="Competing apps by rating and downloads">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={LINE} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
              {formatCount(10 ** t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={T} y2={H - B} stroke={LINE} strokeOpacity="0.6" />
            <text x={x(t)} y={H - B + 16} textAnchor="middle" fontSize="11" fill={MUTED}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={MUTED}>
          Rating on Google Play
        </text>
        <text
          transform={`translate(11 ${(T + H - B) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill={MUTED}
        >
          Downloads
        </text>

        <text x={L + 8} y={T + 14} fontSize="10.5" fill={MUTED} fontStyle="italic">
          Big, rated lower: room to beat
        </text>
        <text x={W - R - 8} y={T + 14} fontSize="10.5" fill={MUTED} fontStyle="italic" textAnchor="end">
          Big and well rated: hard to displace
        </text>
        <text x={W - R - 8} y={H - B - 8} fontSize="10.5" fill={MUTED} fontStyle="italic" textAnchor="end">
          Small, but well rated
        </text>

        {placed.map((p) => {
          const lab = labels.get(p.i);
          const on = active === p.i;
          return (
            <g
              key={p.i}
              tabIndex={0}
              role="button"
              aria-label={`${p.a.title}, rating ${p.r}, ${p.a.downloads} downloads`}
              onPointerEnter={() => setActive(p.i)}
              onFocus={() => setActive(p.i)}
              onClick={() => setActive(p.i)}
              className="cursor-pointer outline-none"
            >
              <circle cx={p.cx} cy={p.cy} r="16" fill="transparent" />
              <circle
                cx={p.cx}
                cy={p.cy}
                r={on ? 9 : 7}
                fill={BRAND}
                fillOpacity={on ? 1 : 0.72}
                stroke="#fff"
                strokeWidth="2"
              />
              {lab && (
                <text x={lab.x} y={lab.y} textAnchor={lab.anchor} fontSize="11" fill={INK} fontWeight={on ? 700 : 500}>
                  {lab.text}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 min-h-[1.5rem] text-sm" aria-live="polite">
        {sel ? (
          <>
            <a href={sel.a.link} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
              {sel.a.title}
            </a>
            <span className="text-muted">
              {" "}
              · rated {sel.r} · {sel.a.downloads} downloads
            </span>
          </>
        ) : (
          <span className="text-muted">Hover, tap or tab to a dot to see which app it is.</span>
        )}
      </p>
    </div>
  );
}
