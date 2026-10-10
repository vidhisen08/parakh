/** Parakh mark: a magnifying lens with a tick inside, for "look closely, then decide". */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="15" fill="#0a5c50" />
      <circle cx="30" cy="30" r="15" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M22 31l6 6 11-14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 41l11 11" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
