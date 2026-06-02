function numOrNull(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function getSecondThursday(year, month) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const dow = firstDay.getUTCDay();
  const firstThursday = 1 + ((4 - dow + 7) % 7);
  return firstThursday + 7;
}

function getNightFuturesSymbol(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const quarterMonths = [3, 6, 9, 12];
  let expiryMonth = quarterMonths.find((m) => m >= month);
  let expiryYear = year;
  if (!expiryMonth) {
    expiryMonth = 3;
    expiryYear = year + 1;
  }
  if (expiryMonth === month && expiryYear === year && day > getSecondThursday(year, month)) {
    const index = quarterMonths.indexOf(expiryMonth);
    if (index < quarterMonths.length - 1) {
      expiryMonth = quarterMonths[index + 1];
    } else {
      expiryMonth = 3;
      expiryYear = year + 1;
    }
  }
  return `A0${String(expiryYear - 2010).padStart(2, "0")}${String(expiryMonth).padStart(2, "0")}`;
}

function nightFuturesSession(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hour = kst.getUTCHours();
  const sessionDate = hour < 5 ? new Date(kst.getTime() - 24 * 60 * 60 * 1000) : kst;
  return {
    label: "18:00~05:00 KST",
    active: hour >= 18 || hour < 5,
    date: sessionDate.toISOString().slice(0, 10),
  };
}

function normalizeKisTickFields(fields) {
  if (!Array.isArray(fields) || fields.length < 6) return null;
  const price = numOrNull(fields[3]);
  if (!price || price <= 0) return null;
  return {
    price,
    change: numOrNull(fields[4]) ?? 0,
    changeRate: numOrNull(fields[5]) ?? 0,
  };
}

function parseKisNightFuturesMessage(message, symbol, decryptFn = null) {
  const raw = String(message || "");
  if (!raw || raw.startsWith("{")) return null;
  const parts = raw.split("|");
  if (parts.length < 4 || parts[1] !== "H0UPANC0") return null;
  let payload = parts[3];
  if (parts[0] === "1") {
    if (!decryptFn) return null;
    payload = decryptFn(payload);
  }
  const records = payload.includes(`^${symbol}`) ? payload.split(`^${symbol}`) : [payload];
  const first = records[0] || payload;
  return normalizeKisTickFields(first.split("^"));
}

module.exports = {
  getNightFuturesSymbol,
  getSecondThursday,
  nightFuturesSession,
  normalizeKisTickFields,
  numOrNull,
  parseKisNightFuturesMessage,
};
