export function ChartDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="drainBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-drain-400)" stopOpacity={1} />
          <stop offset="100%" stopColor="var(--color-drain-600)" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="drainBarH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-drain-400)" stopOpacity={1} />
          <stop offset="100%" stopColor="var(--color-drain-600)" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="drainArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-drain-400)" stopOpacity={0.7} />
          <stop offset="100%" stopColor="var(--color-drain-400)" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="coolArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-cool-500)" stopOpacity={0.7} />
          <stop offset="100%" stopColor="var(--color-cool-500)" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="coolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-cool-500)" />
          <stop offset="100%" stopColor="var(--color-cool-600)" />
        </linearGradient>
        <linearGradient id="poolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-pool)" />
          <stop offset="100%" stopColor="var(--color-pool)" />
        </linearGradient>
        <filter id="uname-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
    </svg>
  );
}
