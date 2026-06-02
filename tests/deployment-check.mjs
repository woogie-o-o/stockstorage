import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");

for (const file of ["Dockerfile", ".dockerignore", "server.py", "firebase.json", "functions/package.json"]) {
  if (!existsSync(join(root, file))) throw new Error(`missing deployment artifact: ${file}`);
}

const dockerfile = read("Dockerfile");
for (const token of [
  "FROM python:3.12-slim",
  "ENV WOOGI_HOST=0.0.0.0",
  "ENV PORT=8080",
  "RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin appuser",
  "COPY --chown=appuser:appuser",
  "USER appuser",
  "EXPOSE 8080",
  "CMD [\"python3\", \"server.py\"]"
]) {
  if (!dockerfile.includes(token)) throw new Error(`Dockerfile missing: ${token}`);
}

const dockerignore = read(".dockerignore");
for (const token of [".git/", ".env", "config.local.js", "data/", "tests/", "screenshots/", "functions/node_modules/", "functions/.env", "*.log"]) {
  if (!dockerignore.includes(token)) throw new Error(`.dockerignore missing: ${token}`);
}

const server = read("server.py");
for (const token of [
  "WOOGI_HOST",
  "os.environ.get(\"PORT\")",
  "BROWSER_FIREBASE_ENV_FIELDS",
  "browser_config_script()",
  "if path == \"config.local.js\"",
  "def end_headers(self):",
  "X-Content-Type-Options",
  "Content-Security-Policy",
  "def do_HEAD(self):",
  "ThreadingHTTPServer((HOST, PORT), Handler)",
  "parsed.path == \"/healthz\""
]) {
  if (!server.includes(token)) throw new Error(`server deployment support missing: ${token}`);
}

console.log("deployment checks passed");
