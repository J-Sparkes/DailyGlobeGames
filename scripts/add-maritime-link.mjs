#!/usr/bin/env node
/**
 * Adds a bidirectional maritime link between two countries (by mapName).
 *
 * Usage:
 *   node scripts/add-maritime-link.mjs "Australia" "Indonesia"
 *
 * Then run:
 *   node scripts/sync-border-graph.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('Usage: node scripts/add-maritime-link.mjs "Country A" "Country B"');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const maritimePath = join(root, "src/data/maritime-links.json");
const links = JSON.parse(readFileSync(maritimePath, "utf8"));

const exists = links.some(
  ([left, right]) =>
    (left === a && right === b) || (left === b && right === a),
);

if (exists) {
  console.log(`Maritime link already exists: ${a} ↔ ${b}`);
  process.exit(0);
}

links.push([a, b]);
links.sort(([a1, b1], [a2, b2]) =>
  `${a1}:${b1}`.localeCompare(`${a2}:${b2}`),
);
writeFileSync(maritimePath, `${JSON.stringify(links, null, 2)}\n`);
console.log(`Added maritime link: ${a} ↔ ${b}`);
console.log("Run: node scripts/sync-border-graph.mjs");
