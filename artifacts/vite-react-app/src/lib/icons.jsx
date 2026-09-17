export function Supernova({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <defs>
        <radialGradient id="novaCore">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      <g stroke="#fcd34d" strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
        <path d="M12 1.5v4" /><path d="M12 18.5v4" />
        <path d="M1.5 12h4" /><path d="M18.5 12h4" />
        <path d="M4.6 4.6l2.8 2.8" /><path d="M16.6 16.6l2.8 2.8" />
        <path d="M19.4 4.6l-2.8 2.8" /><path d="M7.4 16.6l-2.8 2.8" />
      </g>
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#f9a8d4" strokeWidth="0.7" opacity="0.5" />
      <circle cx="12" cy="12" r="4" fill="url(#novaCore)" />
    </svg>
  );
}

export function BlackHole({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <g transform="rotate(-24 12 12)">
        <path d="M1.7 11.2a10.3 3.3 0 0 1 20.6 0" fill="none"
          stroke="currentColor" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      </g>
      <circle cx="12" cy="12" r="4.3" fill="#06010f" stroke="currentColor"
        strokeWidth="0.8" opacity="0.85" />
      <g transform="rotate(-24 12 12)">
        <path d="M22.3 12.8a10.3 3.3 0 0 1 -20.6 0" fill="none"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
