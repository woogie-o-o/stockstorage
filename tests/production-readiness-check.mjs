import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict") || process.env.WOOGI_STRICT_READINESS === "1";
const baseUrl = (process.env.WOOGI_APP_URL || process.env.WOOGI_API_BASE_URL || "").trim();
const rows = [];

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function record(level, title, detail = "", strictFail = false) {
  const effectiveLevel = strict && strictFail && level === "warn" ? "fail" : level;
  rows.push({ level: effectiveLevel, title, detail });
}

function requireFile(file, strictFail = true) {
  if (existsSync(join(root, file))) {
    record("pass", `file present: ${file}`);
  } else {
    record("fail", `file missing: ${file}`, "", strictFail);
  }
}

function commandExists(command, strictFail = false) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status === 0) {
    record("pass", `command available: ${command}`, result.stdout.trim());
  } else {
    record("warn", `command unavailable: ${command}`, "Install it before an actual deploy run.", strictFail);
  }
}

function evaluateBrowserConfig(file) {
  const sandbox = { window: {}, console: { log() {}, warn() {}, error() {} } };
  vm.createContext(sandbox);
  vm.runInContext(read(file), sandbox, { filename: file, timeout: 1000 });
  return sandbox.window;
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const lib = target.protocol === "https:" ? https : http;
    const req = lib.get(target, { timeout: 5000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (error) {
          reject(new Error(`invalid JSON from ${url}: ${error.message}`));
        }
      });
    });
    req.on("timeout", () => req.destroy(new Error(`timeout from ${url}`)));
    req.on("error", reject);
  });
}

for (const file of [
  "index.html",
  "config.example.js",
  "firebase.json",
  "firebase/firestore.rules",
  "firebase/firestore.indexes.json",
  "firebase/storage.rules",
  "functions/index.js",
  "functions/analysis.js",
  "functions/package.json",
  "Dockerfile",
  ".dockerignore",
  "server.py"
]) {
  requireFile(file);
}

const example = evaluateBrowserConfig("config.example.js");
const exampleFirebase = example.WOOGI_FIREBASE_CONFIG || {};
const expectedFirebaseFields = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
const browserFirebaseEnvFields = {
  apiKey: "WOOGI_FIREBASE_API_KEY",
  authDomain: "WOOGI_FIREBASE_AUTH_DOMAIN",
  projectId: "WOOGI_FIREBASE_PROJECT_ID",
  storageBucket: "WOOGI_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "WOOGI_FIREBASE_MESSAGING_SENDER_ID",
  appId: "WOOGI_FIREBASE_APP_ID"
};

function recordAdminConfig(admins, source) {
  if (admins.length) {
    record("pass", `${source} includes admin UI UIDs`, `${admins.length} uid(s)`);
  } else {
    record("warn", `${source} has no WOOGI_ADMIN_UIDS UI hints`, "For production authorization, use a rules UID or custom claim { admin: true }.");
  }
}

for (const field of expectedFirebaseFields) {
  if (Object.prototype.hasOwnProperty.call(exampleFirebase, field)) {
    record("pass", `config.example.js documents Firebase field: ${field}`);
  } else {
    record("fail", `config.example.js missing Firebase field: ${field}`);
  }
}

if (example.WOOGI_API_BASE_URL === "") {
  record("pass", "config.example.js keeps WOOGI_API_BASE_URL empty by default");
} else {
  record("fail", "config.example.js should not hardcode an API base URL");
}

if (existsSync(join(root, "config.local.js"))) {
  try {
    const local = evaluateBrowserConfig("config.local.js");
    const cfg = local.WOOGI_FIREBASE_CONFIG || {};
    const missing = expectedFirebaseFields.filter((field) => !String(cfg[field] || "").trim());
    if (missing.length) {
      record("warn", "config.local.js has empty Firebase fields", missing.join(", "), true);
    } else {
      record("pass", "config.local.js Firebase fields are populated");
    }
    const admins = Array.isArray(local.WOOGI_ADMIN_UIDS) ? local.WOOGI_ADMIN_UIDS.filter(Boolean) : [];
    recordAdminConfig(admins, "config.local.js");
  } catch (error) {
    record("fail", "config.local.js could not be evaluated", error.message);
  }
} else {
  const envConfig = Object.fromEntries(
    Object.entries(browserFirebaseEnvFields).map(([field, envName]) => [field, String(process.env[envName] || "").trim()])
  );
  const missing = expectedFirebaseFields.filter((field) => !envConfig[field]);
  if (!missing.length) {
    record("pass", "Cloud Run Firebase browser environment fields are populated");
    const admins = String(process.env.WOOGI_ADMIN_UIDS || "").split(",").map((uid) => uid.trim()).filter(Boolean);
    recordAdminConfig(admins, "Cloud Run environment");
  } else {
    record(
      "warn",
      "config.local.js is not present and Cloud Run Firebase browser environment is incomplete",
      missing.map((field) => browserFirebaseEnvFields[field]).join(", "),
      true
    );
  }
}

const firebaseJson = JSON.parse(read("firebase.json"));
if (firebaseJson.firestore?.rules === "firebase/firestore.rules" && firebaseJson.firestore?.indexes === "firebase/firestore.indexes.json") {
  record("pass", "firebase.json points to Firestore rules and indexes");
} else {
  record("fail", "firebase.json Firestore paths are incomplete");
}
if (firebaseJson.storage?.rules === "firebase/storage.rules") {
  record("pass", "firebase.json points to Storage rules");
} else {
  record("fail", "firebase.json Storage rules path is incomplete");
}
if (firebaseJson.functions?.source === "functions" && firebaseJson.functions?.runtime === "nodejs22") {
  record("pass", "firebase.json points to nodejs22 Functions source");
} else {
  record("fail", "firebase.json Functions runtime/source is incomplete");
}

const functionsIndex = read("functions/index.js");
for (const token of ["OPENAI_API_KEY", "generateStockAiAnalysis", "getMarketProviderConfig", "https://api.openai.com/v1/responses"]) {
  if (functionsIndex.includes(token)) {
    record("pass", `Functions implementation includes ${token}`);
  } else {
    record("fail", `Functions implementation missing ${token}`);
  }
}
for (const token of ["DART_API_KEY", "KIS_APP_KEY", "KIS_APP_SECRET"]) {
  if (functionsIndex.includes(token) || process.env[token]) {
    record("pass", `optional market-data secret wired or present: ${token}`);
  } else {
    record("warn", `optional market-data secret not wired: ${token}`, "Only required when DART/KIS provider calls are enabled.");
  }
}

const dockerfile = read("Dockerfile");
for (const token of ["WOOGI_HOST=0.0.0.0", "PORT=8080", "COPY --chown=appuser:appuser", "USER appuser", "EXPOSE 8080"]) {
  if (dockerfile.includes(token)) {
    record("pass", `Dockerfile includes ${token}`);
  } else {
    record("fail", `Dockerfile missing ${token}`);
  }
}

const dockerignore = read(".dockerignore");
for (const token of [".git/", ".env", "config.local.js", "data/", "tests/", "functions/node_modules/", "functions/.env", "screenshots/", "*.log"]) {
  if (dockerignore.includes(token)) {
    record("pass", `.dockerignore excludes ${token}`);
  } else {
    record("fail", `.dockerignore should exclude ${token}`);
  }
}

commandExists("python3", true);
commandExists("node", true);
commandExists("firebase", true);
commandExists("docker", false);

if (baseUrl) {
  try {
    const healthUrl = new URL("/healthz", baseUrl).toString();
    const result = await fetchJson(healthUrl);
    if (result.status === 200 && result.body?.ok === true) {
      record("pass", "server health endpoint responds", healthUrl);
    } else {
      record("fail", "server health endpoint returned an unexpected response", `${healthUrl} -> ${result.status}`);
    }
  } catch (error) {
    record("fail", "server health endpoint failed", error.message);
  }
} else {
  record("warn", "WOOGI_APP_URL/WOOGI_API_BASE_URL not set", "Set one to verify /healthz against a running server.", true);
}

const counts = rows.reduce((acc, row) => {
  acc[row.level] = (acc[row.level] || 0) + 1;
  return acc;
}, {});

function nextAction(row) {
  if (row.title.includes("config.local.js")) {
    return "Create config.local.js from config.example.js or set the Cloud Run WOOGI_FIREBASE_* browser environment fields.";
  }
  if (row.title.includes("WOOGI_APP_URL") || row.title.includes("health endpoint")) {
    return "Start server.py and set WOOGI_APP_URL or WOOGI_API_BASE_URL to verify /healthz.";
  }
  if (row.title.includes("firebase")) {
    return "Install Firebase CLI before deploying Firestore, Storage, and Functions.";
  }
  if (row.title.includes("docker")) {
    return "Install Docker before validating the container image locally.";
  }
  if (row.title.includes("DART_API_KEY")) {
    return "Set DART_API_KEY as a Functions secret before enabling DART-backed provider calls.";
  }
  if (row.title.includes("KIS_APP_KEY") || row.title.includes("KIS_APP_SECRET")) {
    return "Set KIS_APP_KEY and KIS_APP_SECRET as Functions secrets before enabling KIS provider calls.";
  }
  return row.detail || "Resolve this item before production deploy.";
}

console.log(`production readiness checks (${strict ? "strict" : "advisory"})`);
for (const row of rows) {
  const label = row.level.toUpperCase().padEnd(4, " ");
  console.log(`${label} ${row.title}${row.detail ? ` - ${row.detail}` : ""}`);
}
console.log(`summary: ${counts.pass || 0} pass, ${counts.warn || 0} warn, ${counts.fail || 0} fail`);

const remaining = rows.filter((row) => row.level !== "pass");
if (remaining.length) {
  console.log("next actions:");
  for (const row of remaining) {
    console.log(`- ${row.title}: ${nextAction(row)}`);
  }
}

if ((counts.fail || 0) > 0) {
  process.exit(1);
}
