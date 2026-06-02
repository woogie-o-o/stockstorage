import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const app = readFileSync(join(root, "src/app.js"), "utf8");

function extractFunctionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function: ${name}`);
  let bodyStart = -1;
  let parenDepth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "(") parenDepth += 1;
    if (source[i] === ")") parenDepth -= 1;
    if (source[i] === "{" && parenDepth === 0) {
      bodyStart = i;
      break;
    }
  }
  if (bodyStart < 0) throw new Error(`missing function body: ${name}`);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unterminated function: ${name}`);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext([
  extractFunctionSource(app, "finiteNumberOrNull"),
  extractFunctionSource(app, "normalizeNightFutures")
].join("\n\n"), sandbox, { timeout: 1000 });

function assert(condition, message, data) {
  if (!condition) throw new Error(`${message}: ${JSON.stringify(data)}`);
}

const nullSnapshot = sandbox.normalizeNightFutures({
  price: null,
  change: null,
  changeRate: null,
  available: false,
  history: [{ time: "2026-06-01T18:00:00+09:00", price: null }]
});
assert(nullSnapshot.price === null, "Null price should stay null", nullSnapshot);
assert(nullSnapshot.available === false, "Null price should not be available", nullSnapshot);
assert(nullSnapshot.history.length === 0, "Null history points should be dropped", nullSnapshot);

const zeroSnapshot = sandbox.normalizeNightFutures({
  price: 0,
  available: true,
  history: [{ time: "2026-06-01T18:00:00+09:00", price: 0 }]
});
assert(zeroSnapshot.price === 0, "Zero price should stay numeric for display fallback", zeroSnapshot);
assert(zeroSnapshot.available === false, "Zero price should not be treated as a snapshot", zeroSnapshot);
assert(zeroSnapshot.history.length === 0, "Zero history points should be dropped", zeroSnapshot);

const liveSnapshot = sandbox.normalizeNightFutures({
  symbol: "A01606",
  price: "382.15",
  previousClose: "380.00",
  history: [
    { time: "2026-06-01T18:00:00+09:00", price: "381.20" },
    { time: "2026-06-01T18:01:00+09:00", price: "382.15" }
  ]
});
assert(liveSnapshot.available === true, "Positive price should mark snapshot available", liveSnapshot);
assert(liveSnapshot.price === 382.15, "String price should parse", liveSnapshot);
assert(liveSnapshot.change === 2.1499999999999773, "Change should derive from previous close", liveSnapshot);
assert(liveSnapshot.history.length === 2, "Positive history points should remain", liveSnapshot);

console.log(JSON.stringify({
  nullSnapshot: { price: nullSnapshot.price, available: nullSnapshot.available, history: nullSnapshot.history.length },
  zeroSnapshot: { price: zeroSnapshot.price, available: zeroSnapshot.available, history: zeroSnapshot.history.length },
  liveSnapshot: { price: liveSnapshot.price, available: liveSnapshot.available, history: liveSnapshot.history.length }
}, null, 2));
