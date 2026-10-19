// Usage: node test/parse.test.js <saved eBay item page.html>
"use strict";
const fs = require("fs");
const assert = require("assert");
require("../src/parse.js");
const { extractMsku, buildMatrix } = globalThis.EbayVariationMatrix;

const file = process.argv[2];
if (!file) {
  console.error("usage: node test/parse.test.js <page.html>");
  process.exit(2);
}
const msku = extractMsku(fs.readFileSync(file, "utf8"));
assert(msku, "MSKU model not found");
const m = buildMatrix(msku);
assert.strictEqual(m.rows.length, Object.keys(msku.variationCombinations).length);
for (const r of m.rows) {
  assert(r.values.every(Boolean), `missing value in ${r.variationId}`);
  assert(r.price != null || r.outOfStock, `missing price in ${r.variationId}`);
}
console.log(m.labels.join(" | "), `| ${m.rows.length} rows, selected ${m.selectedVariationId}`);
for (const r of m.rows.slice(0, 5)) console.log(" ", r.values.join(" / "), "→", r.priceText, "|", r.availability, r.outOfStock ? "(OOS)" : "");
const sel = m.rows.find((r) => r.variationId === m.selectedVariationId);
console.log("selected:", sel && sel.values.join(" / "), sel && sel.priceText);
console.log("ok");
