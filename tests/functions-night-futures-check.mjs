import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getNightFuturesSymbol,
  getSecondThursday,
  nightFuturesSession,
  normalizeKisTickFields,
  parseKisNightFuturesMessage
} = require("../functions/nightFutures.js");

function assert(condition, message, data) {
  if (!condition) throw new Error(`${message}: ${JSON.stringify(data)}`);
}

assert(getSecondThursday(2026, 6) === 11, "June 2026 second Thursday failed");
assert(getNightFuturesSymbol(new Date("2026-06-01T09:00:00+09:00")) === "A01606", "June 2026 symbol failed");
assert(getNightFuturesSymbol(new Date("2026-06-12T09:00:00+09:00")) === "A01609", "Post-expiry June symbol failed");
assert(getNightFuturesSymbol(new Date("2026-12-11T09:00:00+09:00")) === "A01703", "Post-expiry December symbol failed");

const activeSession = nightFuturesSession(new Date("2026-06-01T20:00:00+09:00"));
const daytimeSession = nightFuturesSession(new Date("2026-06-01T10:00:00+09:00"));
assert(activeSession.active === true && activeSession.date === "2026-06-01", "Night session active failed", activeSession);
assert(daytimeSession.active === false, "Day session inactive failed", daytimeSession);

const fields = ["A01606", "20260601", "181010", "382.15", "2.15", "0.57"];
const tick = normalizeKisTickFields(fields);
assert(tick.price === 382.15 && tick.change === 2.15 && tick.changeRate === 0.57, "Tick field normalization failed", tick);

const message = `0|H0UPANC0|001|${fields.join("^")}`;
const parsed = parseKisNightFuturesMessage(message, "A01606");
assert(parsed.price === 382.15 && parsed.changeRate === 0.57, "KIS websocket message parse failed", parsed);
assert(parseKisNightFuturesMessage('{"header":{"tr_id":"PINGPONG"}}', "A01606") === null, "JSON control message should be ignored");

console.log(JSON.stringify({
  symbol: getNightFuturesSymbol(new Date("2026-06-01T09:00:00+09:00")),
  postExpiry: getNightFuturesSymbol(new Date("2026-06-12T09:00:00+09:00")),
  activeSession,
  tick
}, null, 2));
