const PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#fb7185", // rose
  "#fb923c", // orange
  "#facc15", // yellow
  "#84cc16", // lime
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
