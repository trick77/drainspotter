import Papa from "papaparse";
import type { UsageRow } from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const REQUIRED_COLUMNS = [
  "date",
  "username",
  "product",
  "sku",
  "model",
  "quantity",
  "unit_type",
  "applied_cost_per_quantity",
  "gross_amount",
  "discount_amount",
  "net_amount",
  "exceeds_quota",
  "total_monthly_quota",
  "organization",
  "cost_center_name",
  "aic_quantity",
  "aic_gross_amount",
] as const;

export type ParseResult = {
  rows: UsageRow[];
};

function num(v: unknown): number {
  if (v === "" || v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function bool(v: unknown): boolean {
  return String(v).toLowerCase() === "true";
}

export function parseUsageCsv(input: string | File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(input as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        try {
          const fields = results.meta.fields ?? [];
          const missing = REQUIRED_COLUMNS.filter((c) => !fields.includes(c));
          if (missing.length > 0) {
            return reject(
              new ParseError(
                `CSV missing required columns: ${missing.join(", ")}`
              )
            );
          }
          const rows: UsageRow[] = results.data.map((r) => ({
            date: String(r.date ?? "").trim(),
            username: String(r.username ?? "").trim(),
            product: String(r.product ?? "").trim(),
            sku: String(r.sku ?? "").trim(),
            model: String(r.model ?? "").trim(),
            quantity: num(r.quantity),
            unitType: String(r.unit_type ?? "").trim(),
            appliedCostPerQuantity: num(r.applied_cost_per_quantity),
            grossAmount: num(r.gross_amount),
            discountAmount: num(r.discount_amount),
            netAmount: num(r.net_amount),
            exceedsQuota: bool(r.exceeds_quota),
            totalMonthlyQuota: num(r.total_monthly_quota),
            organization: String(r.organization ?? "").trim(),
            costCenterName: String(r.cost_center_name ?? "").trim(),
            aicQuantity: num(r.aic_quantity),
            aicGrossAmount: num(r.aic_gross_amount),
          }));
          resolve({ rows });
        } catch (err) {
          reject(err);
        }
      },
      error: (err: Error) => reject(new ParseError(err.message)),
    });
  });
}
