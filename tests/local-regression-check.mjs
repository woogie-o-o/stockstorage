import { spawnSync } from "node:child_process";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const includeLive = args.has("--live");
const strict = args.has("--strict");
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

const pyEnv = {
  ...process.env,
  PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || "/tmp",
  PYTHONPATH: [root, process.env.PYTHONPATH].filter(Boolean).join(delimiter)
};

const checks = [
  ["app syntax", process.execPath, ["--check", "src/app.js"]],
  ["functions entry syntax", process.execPath, ["--check", "functions/index.js"]],
  ["functions analysis syntax", process.execPath, ["--check", "functions/analysis.js"]],
  ["functions night futures syntax", process.execPath, ["--check", "functions/nightFutures.js"]],
  ["server syntax", "python3", ["-m", "py_compile", "server.py", "scanner_engine.py", "tests/server-log-message-check.py", "tests/server-browser-config-check.py", "tests/server-security-headers-check.py"], { env: pyEnv }],
  ["static contract", process.execPath, ["tests/static-check.mjs"]],
  ["firestore like integrity", process.execPath, ["tests/firestore-like-integrity-check.mjs"]],
  ["firestore write schema", process.execPath, ["tests/firestore-write-schema-check.mjs"]],
  ["firestore user schema", process.execPath, ["tests/firestore-user-schema-check.mjs"]],
  ["functions analysis helpers", process.execPath, ["tests/functions-analysis-check.mjs"]],
  ["functions provider config", process.execPath, ["tests/functions-provider-config-check.mjs"]],
  ["functions night futures helpers", process.execPath, ["tests/functions-night-futures-check.mjs"]],
  ["server log handling", "python3", ["tests/server-log-message-check.py"], { env: pyEnv }],
  ["server browser config", "python3", ["tests/server-browser-config-check.py"], { env: pyEnv }],
  ["server security headers", "python3", ["tests/server-security-headers-check.py"], { env: pyEnv }],
  ["scanner engine", "python3", ["tests/scanner-engine-check.py"], { env: pyEnv }],
  ["fmkorea parser", "python3", ["tests/fmkorea-parser-check.py"], { env: pyEnv }],
  ["naver market sectors parser", "python3", ["tests/naver-market-sectors-parser-check.py"], { env: pyEnv }],
  ["night futures normalize", process.execPath, ["tests/night-futures-normalize-check.mjs"]],
  ["deployment contract", process.execPath, ["tests/deployment-check.mjs"]],
  ["production readiness environment", process.execPath, ["tests/production-readiness-env-check.mjs"]],
  ["production readiness", process.execPath, [
    "tests/production-readiness-check.mjs",
    ...(strict ? ["--strict"] : [])
  ], {
    env: includeLive ? { ...process.env, WOOGI_APP_URL: appUrl } : process.env
  }]
];

if (includeLive) {
  checks.push(["api smoke", process.execPath, ["tests/api-smoke-check.mjs"], {
    env: { ...process.env, WOOGI_APP_URL: appUrl }
  }]);
  checks.push(["server HTTP contract", process.execPath, ["tests/server-http-contract-check.mjs"], {
    env: { ...process.env, WOOGI_APP_URL: appUrl }
  }]);
}

for (const [label, command, commandArgs, options = {}] of checks) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    env: options.env || process.env
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`\nlocal regression checks passed${includeLive ? " with live API smoke" : ""}${strict ? " in strict mode" : ""}`);
