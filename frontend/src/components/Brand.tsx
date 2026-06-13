export function WayfarerMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#f0a830" strokeWidth="1.3" />
      <circle cx="16" cy="16" r="8.5" stroke="#f0a830" strokeWidth="0.8" opacity="0.5" />
      {/* compass needle */}
      <path d="M16 5 L19 16 L16 14 L13 16 Z" fill="#f0a830" />
      <path d="M16 27 L13 16 L16 18 L19 16 Z" fill="#b87d1f" />
      <circle cx="16" cy="16" r="1.6" fill="#0a0c10" stroke="#f0a830" strokeWidth="1" />
      {/* cardinal ticks */}
      <path d="M16 1.5v2M16 28.5v2M1.5 16h2M28.5 16h2" stroke="#f0a830" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
