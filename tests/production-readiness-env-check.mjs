import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localConfig = join(root, "config.local.js");
const hiddenLocalConfig = join(root, "config.local.js.env-check-hidden");
const env = {
  ...process.env,
  WOOGI_APP_URL: "",
  WOOGI_API_BASE_URL: "",
  WOOGI_FIREBASE_API_KEY: "demo-api-key",
  WOOGI_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
  WOOGI_FIREBASE_PROJECT_ID: "demo-project",
  WOOGI_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
  WOOGI_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  WOOGI_FIREBASE_APP_ID: "1:123456789:web:abc",
  WOOGI_ADMIN_UIDS: "uid-a,uid-b"
};
let movedLocalConfig = false;
if (existsSync(localConfig)) {
  renameSync(localConfig, hiddenLocalConfig);
  movedLocalConfig = true;
}

let result;
try {
  result = spawnSync(process.execPath, ["tests/production-readiness-check.mjs"], {
    cwd: root,
    env,
    encoding: "utf8"
  });
} finally {
  if (movedLocalConfig) renameSync(hiddenLocalConfig, localConfig);
}
const output = `${result.stdout || ""}${result.stderr || ""}`;

if (result.status !== 0) {
  throw new Error(`readiness environment check failed:\n${output}`);
}
for (const expected of [
  "PASS Cloud Run Firebase browser environment fields are populated",
  "PASS Cloud Run environment includes admin UI UIDs - 2 uid(s)"
]) {
  if (!output.includes(expected)) throw new Error(`readiness environment check missing: ${expected}`);
}
if (output.includes("Cloud Run Firebase browser environment is incomplete")) {
  throw new Error("readiness environment check incorrectly reported incomplete Firebase browser environment");
}

console.log("production readiness environment checks passed");
