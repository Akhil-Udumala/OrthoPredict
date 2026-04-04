import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const distAssetsDir = path.resolve(process.cwd(), "dist/assets");

if (!fs.existsSync(distAssetsDir)) {
  console.error("dist/assets does not exist. Run `npm run build` first.");
  process.exit(1);
}

const assetNames = fs.readdirSync(distAssetsDir);
const lazyResultChunks = assetNames.filter(
  (name) => name.includes("ResultCard-") || name.includes("WhatIfSimulator-"),
);

if (lazyResultChunks.length > 0) {
  console.error(
    `Found click-time lazy result chunks that can trigger stale asset 404s: ${lazyResultChunks.join(", ")}`,
  );
  process.exit(1);
}

console.log("Verified: no lazy-loaded ResultCard/WhatIfSimulator chunks are emitted in dist.");
