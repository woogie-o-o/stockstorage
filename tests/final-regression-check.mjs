import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const args = new Set(process.argv.slice(2));
const skipCdp = args.has("--skip-cdp");
const strict = args.has("--strict");
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const cdpPort = process.env.CDP_PORT || "9223";

async function fetchJson(url, label) {
  const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? { signal: AbortSignal.timeout(5000) }
    : {};
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(`${label} is not ready at ${url}: ${error.message}`);
  }
}

async function preflight() {
  const healthUrl = new URL("/healthz", appUrl).toString();
  const health = await fetchJson(healthUrl, "app server");
  if (health?.ok !== true) {
    throw new Error(`app server returned an unexpected health payload from ${healthUrl}`);
  }
  if (!skipCdp) {
    const pages = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`, "CDP Chrome");
    if (!Array.isArray(pages)) {
      throw new Error(`CDP Chrome returned an unexpected /json/list payload on port ${cdpPort}`);
    }
  }
}

const checks = [
  ["local regression with live API smoke", [
    "local-regression-check.mjs",
    "--live",
    ...(strict ? ["--strict"] : [])
  ]]
];

if (!skipCdp) {
  checks.push(["CDP browser regression", ["cdp-run-all.mjs"]]);
}

try {
  await preflight();
} catch (error) {
  console.error(`Preflight failed: ${error.message}`);
  console.error(skipCdp
    ? "Start server.py or set WOOGI_APP_URL before running final regression."
    : [
        "Start server.py and CDP Chrome, or run with --skip-cdp when browser regression is unavailable.",
        'CDP Chrome example: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9223 --disable-gpu --disable-background-networking --disable-sync --no-first-run --no-default-browser-check --user-data-dir=/private/tmp/woogi-cdp about:blank'
      ].join("\n"));
  process.exit(1);
}

for (const [label, commandArgs] of checks) {
  console.log(`\n▶ ${label}`);
  const [script, ...scriptArgs] = commandArgs;
  const result = spawnSync(process.execPath, [join(here, script), ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, WOOGI_APP_URL: appUrl }
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`\nfinal regression checks passed${skipCdp ? " without CDP" : ""}${strict ? " in strict mode" : ""}`);
