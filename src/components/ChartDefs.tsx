export function ChartDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="drainBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="drainBarH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="drainArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coolArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="poolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="uname-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
    </svg>
  );
}
