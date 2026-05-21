#!/usr/bin/env node
/**
 * generate-demo-csv.mjs
 * Reads scripts/source-real.csv, truncates to 2026-04-15, anonymizes usernames,
 * sets organization to DemoOrg, and writes public/demo.csv.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Name lists (exact order matters)
// ---------------------------------------------------------------------------
const TOP_DRAINERS = [
  "gastown-steve",
  "chief-token-officer",
  "sir-burns-a-lot",
  "count-contextula",
  "lord-of-the-pool",
  "duke-of-drain",
  "promptzilla",
  "token-shredder",
  "quota-muncher",
  "voldetoken",
];

const BOTTOM_LURKERS = [
  "copilot-bünzli",
  "lizenz-leiche",
  "enablement-target",
  "quota-coward",
  "token-tumbleweed",
  "untapped-potential",
  "ghost-coder",
  "inference-abstainer",
  "auto-complete-amish",
  "still-on-stackoverflow",
];

const MIDDLE_POOL = [
  "coffee-driven-dev","regex-rita","merge-conflict-mary","bug-magnet","rubber-ducker",
  "semicolon-skipper","cache-miss-carl","null-pointer-nina","stale-branch-bob","force-push-fred",
  "off-by-one-olivia","yaml-yorick","regex-overlord","typo-tornado","diff-detective",
  "rebase-renegade","lint-larry","ci-whisperer","monorepo-monk","schema-shaman",
  "mock-master","scope-creep-sam","edge-case-edgar","callback-cassandra","hotfix-hank",
  "stack-tracer","log-spelunker","deadlock-dora","race-condition-rocco","memory-leak-lulu",
  "feature-flag-flo","graphql-gremlin","promise-pauline","async-anders","json-jongleur",
  "regex-runaway","ssh-samurai","cron-conductor","kubernetes-koen","docker-dietrich",
  "terraform-tilda","ansible-anna","grafana-gunter","prometheus-pete","kafka-klaus",
  "redis-renate","postgres-petra","elastic-ernst","kibana-karim","git-gardener",
];

// ---------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields with doubled-quote escaping
// ---------------------------------------------------------------------------
function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // quoted field
      i++; // skip opening quote
      let val = "";
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          val += line[i++];
        }
      }
      fields.push(val);
      if (line[i] === ",") i++; // skip comma separator
    } else {
      // unquoted field
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

// ---------------------------------------------------------------------------
// Read & parse source CSV
// ---------------------------------------------------------------------------
const srcPath = resolve(ROOT, "scripts", "source-real.csv");
let raw = readFileSync(srcPath, "utf-8");

// Strip UTF-8 BOM if present
if (raw.charCodeAt(0) === 0xfeff) {
  raw = raw.slice(1);
}

// Normalize line endings
const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim() !== "");

const headerLine = lines[0];
const headers = parseCSVLine(headerLine);

// Find column indices
const dateIdx = headers.indexOf("date");
const usernameIdx = headers.indexOf("username");
const organizationIdx = headers.indexOf("organization");
const aicGrossIdx = headers.indexOf("aic_gross_amount");

if (dateIdx === -1 || usernameIdx === -1 || organizationIdx === -1 || aicGrossIdx === -1) {
  console.error("Could not find required columns. Headers:", headers);
  process.exit(1);
}

// Parse data rows
const allRows = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < headers.length) continue; // skip malformed
  allRows.push(fields);
}

console.log(`Total source rows: ${allRows.length}`);

// ---------------------------------------------------------------------------
// Truncate to dates <= 2026-04-15
// ---------------------------------------------------------------------------
const CUTOFF = "2026-04-15";
const truncatedRows = allRows.filter(row => row[dateIdx] <= CUTOFF);

console.log(`Rows after truncation (≤ ${CUTOFF}): ${truncatedRows.length}`);

// ---------------------------------------------------------------------------
// Compute aic_gross_amount totals per original username on truncated data
// ---------------------------------------------------------------------------
const totals = new Map(); // username -> total aic_gross_amount
for (const row of truncatedRows) {
  const user = row[usernameIdx];
  const amount = parseFloat(row[aicGrossIdx]) || 0;
  totals.set(user, (totals.get(user) ?? 0) + amount);
}

const uniqueUsers = [...totals.keys()];
console.log(`Unique users in truncated data: ${uniqueUsers.length}`);

// ---------------------------------------------------------------------------
// Assign aliases
// ---------------------------------------------------------------------------

// Sort desc by total for top drainers
const sortedDesc = [...uniqueUsers].sort((a, b) => totals.get(b) - totals.get(a));
// Sort asc by total (positive only) for bottom lurkers
const sortedAscPositive = [...uniqueUsers]
  .filter(u => totals.get(u) > 0)
  .sort((a, b) => totals.get(a) - totals.get(b));

const aliasMap = new Map();

// Assign top drainers (top-10 wins in case of conflict)
const topUsers = sortedDesc.slice(0, Math.min(10, sortedDesc.length));
for (let i = 0; i < topUsers.length; i++) {
  aliasMap.set(topUsers[i], TOP_DRAINERS[i]);
}

// Assign bottom lurkers (skip if already assigned as top drainer)
let lurkerIdx = 0;
for (const user of sortedAscPositive) {
  if (lurkerIdx >= 10) break;
  if (aliasMap.has(user)) continue; // top-10 wins
  aliasMap.set(user, BOTTOM_LURKERS[lurkerIdx++]);
}

// Assign middle pool — remaining users sorted desc by total
let poolIdx = 0;
let devIdx = 1;
const middleUsers = sortedDesc.filter(u => !aliasMap.has(u));
for (const user of middleUsers) {
  if (poolIdx < MIDDLE_POOL.length) {
    aliasMap.set(user, MIDDLE_POOL[poolIdx++]);
  } else {
    aliasMap.set(user, `dev-${String(devIdx++).padStart(2, "0")}`);
  }
}

// Any remaining users (e.g., zero-spend users not in sortedAscPositive)
for (const user of uniqueUsers) {
  if (!aliasMap.has(user)) {
    aliasMap.set(user, `dev-${String(devIdx++).padStart(2, "0")}`);
  }
}

// ---------------------------------------------------------------------------
// Print summary
// ---------------------------------------------------------------------------
console.log("\n--- Top-10 Drainers ---");
for (let i = 0; i < topUsers.length; i++) {
  console.log(`  ${TOP_DRAINERS[i].padEnd(25)} ← ${topUsers[i]} (total: ${totals.get(topUsers[i]).toFixed(4)})`);
}

console.log("\n--- Bottom-10 Lurkers ---");
let shown = 0;
for (const user of sortedAscPositive) {
  if (!BOTTOM_LURKERS.includes(aliasMap.get(user))) continue;
  console.log(`  ${aliasMap.get(user).padEnd(25)} ← ${user} (total: ${totals.get(user).toFixed(4)})`);
  if (++shown >= 10) break;
}

// ---------------------------------------------------------------------------
// Build output rows
// ---------------------------------------------------------------------------
function quoteField(val) {
  // Quote all fields to match source style
  return `"${String(val).replace(/"/g, '""')}"`;
}

const outLines = [];
// Header
outLines.push(headers.map(quoteField).join(","));

for (const row of truncatedRows) {
  const newRow = [...row];
  const origUser = row[usernameIdx];
  newRow[usernameIdx] = aliasMap.get(origUser) ?? origUser;
  newRow[organizationIdx] = "DemoOrg";
  outLines.push(newRow.map(quoteField).join(","));
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outDir = resolve(ROOT, "public");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "demo.csv");
writeFileSync(outPath, outLines.join("\n") + "\n", "utf-8");

console.log(`\nWrote ${outLines.length - 1} data rows to ${outPath}`);
