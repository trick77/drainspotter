const PALETTE = [
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#22d3ee", // cyan-400
  "#5eead4", // teal-300
  "#7dd3fc", // sky-300
  "#a5b4fc", // indigo-300
  "#94a3b8", // slate-400
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function modelColor(model: string): string {
  return PALETTE[hash(model) % PALETTE.length];
}

export function modelColorWithAlpha(model: string, alpha: number): string {
  const hex = modelColor(model);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
