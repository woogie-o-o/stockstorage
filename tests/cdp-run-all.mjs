import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cdpPort = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const tests = [
  "cdp-market-source-check.mjs",
  "cdp-deep-link-check.mjs",
  "cdp-ai-check.mjs",
  "cdp-local-flows-check.mjs",
  "cdp-admin-auth-search-check.mjs",
  "cdp-discovered-search-check.mjs",
  "cdp-market-analysis-check.mjs",
  "cdp-community-detail-check.mjs",
  "cdp-journal-share-check.mjs",
  "cdp-journal-chart-check.mjs",
  "cdp-secondary-features-check.mjs"
];

async function cleanupTargets() {
  try {
    const pages = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((res) => res.json());
    const appPages = pages.filter((page) => page.type === "page" && String(page.url || "").startsWith(appUrl));
    if (appPages.length) await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).catch(() => null);
    await Promise.all(appPages.map((page) => fetch(`http://127.0.0.1:${cdpPort}/json/close/${page.id}`).catch(() => null)));
    const after = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((res) => res.json()).catch(() => []);
    const blankPages = after.filter((page) => page.type === "page" && page.url === "about:blank");
    await Promise.all(blankPages.slice(1).map((page) => fetch(`http://127.0.0.1:${cdpPort}/json/close/${page.id}`).catch(() => null)));
    await new Promise((resolve) => setTimeout(resolve, 600));
  } catch {
    // Individual tests report a clearer error if Chrome is unavailable.
  }
}

for (const test of tests) {
  await cleanupTargets();
  console.log(`\n▶ ${test}`);
  const result = spawnSync(process.execPath, [join(here, test)], {
    stdio: "inherit",
    env: process.env
  });
  await cleanupTargets();
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("\nCDP checks passed");
