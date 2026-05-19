const usdFull = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNum = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const intNum = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return usdFull.format(value).replace(/\s+/, "");
}

export function formatUsdCompact(value: number): string {
  if (Math.abs(value) < 1000) {
    return "$" + intNum.format(Math.round(value));
  }
  return "$" + compactNum.format(value).toLowerCase();
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
