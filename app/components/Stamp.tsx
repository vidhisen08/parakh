"use client";
import { useId } from "react";
import type { CSSProperties } from "react";

const META = {
  GO: { color: "#137a43", word: "GO", line: "Worth building" },
  PIVOT: { color: "#a8620a", word: "PIVOT", line: "Change the angle" },
  SKIP: { color: "#b3261e", word: "SKIP", line: "Look elsewhere" },
} as const;

export function verdictMeta(v: string) {
  return META[v as keyof typeof META] ?? META.PIVOT;
}

/** The hallmark stamp. The only decorative element in the app, so it gets the care. */
export function Stamp({
  verdict,
  size = 176,
  animate = false,
  tilt = -7,
}: {
  verdict: string;
  size?: number;
  animate?: boolean;
  tilt?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const m = verdictMeta(verdict);
  const fs = m.word.length <= 2 ? 60 : m.word.length <= 4 ? 44 : 36;
  const baseline = 100 + fs * 0.35;
  const ring = "M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0";

  const style = {
    width: size,
    height: size,
    color: m.color,
    transform: animate ? undefined : `rotate(${tilt}deg)`,
    "--tilt": `${tilt}deg`,
  } as CSSProperties;

  return (
    <div className={animate ? "stamp-in shrink-0" : "shrink-0"} style={style}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={`Verdict: ${verdict}. ${m.line}.`}>
        <defs>
          <filter id={`rough-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7" />
          </filter>
          <path id={`ring-${uid}`} d={ring} />
        </defs>
        <g filter={`url(#rough-${uid})`} fill="none" stroke="currentColor">
          <circle cx="100" cy="100" r="95" strokeWidth="4.5" />
          <circle cx="100" cy="100" r="89" strokeWidth="1.3" />
          <circle cx="100" cy="100" r="62" strokeWidth="1.3" />
          <text fill="currentColor" stroke="none" fontSize="11" fontWeight="700" letterSpacing="1.6">
            <textPath href={`#ring-${uid}`} textLength="446" lengthAdjust="spacing">
              PARAKH ASSAY • LIVE GOOGLE DATA •
            </textPath>
          </text>
          <text
            x="100"
            y={baseline}
            textAnchor="middle"
            className="font-display"
            fill="currentColor"
            stroke="none"
            fontSize={fs}
            fontWeight="800"
          >
            {m.word}
          </text>
          <text
            x="100"
            y={baseline + 21}
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="10.5"
            fontWeight="700"
          >
            {m.line}
          </text>
        </g>
      </svg>
    </div>
  );
}
