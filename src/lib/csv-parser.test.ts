import { describe, it, expect } from "vitest";
import { parseUsageCsv, ParseError } from "./csv-parser";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sampleCsv = readFileSync(join(__dirname, "../fixtures/sample.csv"), "utf8");

describe("parseUsageCsv", () => {
  it("parses current AI credits CSV with all required columns", async () => {
    const result = await parseUsageCsv(sampleCsv);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].username).toBe("alice");
    expect(result.rows[0].sku).toBe("copilot_ai_credit");
    expect(result.rows[0].unitType).toBe("ai-credits");
    expect(result.rows[0].model).toBe("Auto: GPT-5.4");
    expect(result.rows[0].aicQuantity).toBeCloseTo(100.5, 5);
    expect(result.rows[0].aicGrossAmount).toBeCloseTo(1.005, 5);
  });

  it("treats AI credit quantity '0' as 0 number", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-06-01","alice","copilot","copilot_ai_credit","GPT-5.4","0","ai-credits","0.01","0","0","0","1900","DemoOrg","","5","0.05"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows[0].quantity).toBe(0);
    expect(result.rows[0].aicGrossAmount).toBeCloseTo(0.05, 5);
  });

  it("rejects CSV missing required columns", async () => {
    const csv = `"date","username","model"\n"2026-04-01","alice","GPT-5.4"`;
    await expect(parseUsageCsv(csv)).rejects.toThrow(ParseError);
    await expect(parseUsageCsv(csv)).rejects.toThrow(/aic_gross_amount/);
  });

  it("returns empty rows array for header-only CSV", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows).toHaveLength(0);
  });

  it("normalizes floating-point quantity values", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-06-01","alice","copilot","copilot_ai_credit","GPT-5.4","29.69999999999998","ai-credits","0.01","0.2969999999999998","0.2969999999999998","0","1900","DemoOrg","","185.27","1.8527"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows[0].quantity).toBeCloseTo(29.7, 5);
  });

  it("falls back to gross amount for AI credit reports with zeroed aic columns", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","repository","cost_center_name","aic_quantity","aic_gross_amount"
"2026-06-01","alice","copilot","copilot_ai_credit","GPT-5.4","367.05044250000014","ai-credits","0.01","3.670504425000002","3.670504425000002","0","1900","DemoOrg","","","0","0"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows[0].aicQuantity).toBeCloseTo(367.0504425, 5);
    expect(result.rows[0].aicGrossAmount).toBeCloseTo(3.670504425, 5);
  });

  it("rejects legacy premium request reports", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-04-01","alice","copilot","copilot_premium_request","GPT-5.4","29.7","requests","0.04","1.188","1.188","0","False","300","DemoOrg","","185.27","1.8527"`;
    await expect(parseUsageCsv(csv)).rejects.toThrow(ParseError);
    await expect(parseUsageCsv(csv)).rejects.toThrow(/legacy premium request/i);
  });
});
