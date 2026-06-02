const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const crypto = require("crypto");
const WebSocket = require("ws");
const {
  DEFAULT_MODEL,
  buildDeterministicAnalysis,
  buildOpenAIPrompt,
  extractOutputText,
  parseJsonText,
  mergeAnalysis
} = require("./analysis");
const {
  getNightFuturesSymbol,
  nightFuturesSession,
  parseKisNightFuturesMessage
} = require("./nightFutures");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const DART_API_KEY = defineSecret("DART_API_KEY");
const KIS_APP_KEY = defineSecret("KIS_APP_KEY");
const KIS_APP_SECRET = defineSecret("KIS_APP_SECRET");

initializeApp();

exports.generateStockAiAnalysis = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 60,
  memory: "512MiB",
  secrets: [OPENAI_API_KEY]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login is required to generate stock AI analysis.");
  }

  const generatedAt = new Date().toISOString();
  const fallback = buildDeterministicAnalysis(request.data || {}, generatedAt);
  const apiKey = OPENAI_API_KEY.value();
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: buildOpenAIPrompt(request.data || {}, fallback),
        max_output_tokens: 2400
      })
    });

    if (!response.ok) {
      logger.warn("OpenAI Responses API failed", { status: response.status });
      return fallback;
    }

    const payload = await response.json();
    const generated = parseJsonText(extractOutputText(payload));
    return mergeAnalysis(fallback, generated);
  } catch (error) {
    logger.warn("generateStockAiAnalysis fallback", { message: error.message });
    return fallback;
  }
});

async function getKisApprovalKey(appKey, appSecret) {
  const response = await fetch("https://openapi.koreainvestment.com:9443/oauth2/Approval", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      secretkey: appSecret
    })
  });
  if (!response.ok) throw new Error(`KIS approval failed: ${response.status}`);
  const payload = await response.json();
  if (!payload.approval_key) throw new Error("KIS approval_key missing");
  return payload.approval_key;
}

function decryptKisPayload(encData, key, iv) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "utf8"),
    Buffer.from(iv, "utf8")
  );
  let decoded = decipher.update(encData, "base64", "utf8");
  decoded += decipher.final("utf8");
  return decoded;
}

function fetchKisNightFuturesTick(approvalKey, symbol, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let aesKey = "";
    let aesIv = "";
    const ws = new WebSocket("ws://ops.koreainvestment.com:21000");
    const done = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.terminate();
      } catch (_) {}
      fn(value);
    };
    const timer = setTimeout(() => done(reject, new Error("KIS night futures timeout")), timeoutMs);

    ws.on("open", () => {
      ws.send(JSON.stringify({
        header: {
          approval_key: approvalKey,
          custtype: "P",
          tr_type: "1",
          "content-type": "utf-8"
        },
        body: {
          input: { tr_id: "H0UPANC0", tr_key: symbol }
        }
      }));
    });

    ws.on("message", (raw) => {
      const message = raw.toString();
      if (message.startsWith("{")) {
        try {
          const payload = JSON.parse(message);
          if (payload.header?.tr_id === "PINGPONG") {
            ws.send(message);
            return;
          }
          if (payload.body?.msg1 === "SUBSCRIBE SUCCESS") {
            aesKey = payload.body?.output?.key || "";
            aesIv = payload.body?.output?.iv || "";
          }
          if (payload.body?.rt_cd === "9") {
            done(reject, new Error(payload.body?.msg_cd || "KIS websocket rejected"));
          }
        } catch (_) {}
        return;
      }
      const tick = parseKisNightFuturesMessage(message, symbol, (value) => {
        if (!aesKey || !aesIv) return "";
        return decryptKisPayload(value, aesKey, aesIv);
      });
      if (tick) done(resolve, tick);
    });

    ws.on("error", (error) => done(reject, error));
  });
}

async function fetchKisNightFuturesWithRetry(appKey, appSecret, symbol) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const approvalKey = await getKisApprovalKey(appKey, appSecret);
      return await fetchKisNightFuturesTick(approvalKey, symbol);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError || new Error("KIS night futures failed");
}

async function readNightFuturesHistory(limit = 300) {
  const db = getFirestore();
  const snap = await db.collection("night_futures_prices")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snap.docs.reverse().map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      time: typeof data.timestamp?.toMillis === "function" ? data.timestamp.toMillis() : data.timestamp || data.updatedAt || "",
      price: data.price,
      change: data.change,
      changeRate: data.changeRate,
      symbol: data.symbol || "",
    };
  });
}

exports.recordNightFuturesPrice = onSchedule({
  schedule: "every 1 minutes",
  region: "asia-northeast3",
  timeoutSeconds: 60,
  secrets: [KIS_APP_KEY, KIS_APP_SECRET]
}, async () => {
  const session = nightFuturesSession();
  if (!session.active) return;
  const appKey = KIS_APP_KEY.value();
  const appSecret = KIS_APP_SECRET.value();
  if (!appKey || !appSecret) {
    logger.warn("KIS night futures secrets are missing");
    return;
  }
  const symbol = getNightFuturesSymbol();
  try {
    const tick = await fetchKisNightFuturesWithRetry(appKey, appSecret, symbol);
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const id = kst.toISOString().slice(0, 16).replace("T", "_");
    await getFirestore().collection("night_futures_prices").doc(id).set({
      ...tick,
      symbol,
      timestamp: Timestamp.fromDate(now),
      kstMinute: id,
      source: "KIS OpenAPI"
    }, { merge: true });
  } catch (error) {
    logger.warn("recordNightFuturesPrice failed", { message: error.message, symbol });
  }
});

exports.getKisNightFuturesConfig = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 15,
  secrets: [KIS_APP_KEY, KIS_APP_SECRET]
}, async () => ({
  configured: Boolean(KIS_APP_KEY.value() && KIS_APP_SECRET.value()),
  source: "KIS OpenAPI",
  symbol: getNightFuturesSymbol(),
  session: nightFuturesSession(),
  history: await readNightFuturesHistory(300)
}));

exports.getMarketProviderConfig = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 15,
  secrets: [OPENAI_API_KEY, DART_API_KEY, KIS_APP_KEY, KIS_APP_SECRET]
}, async () => ({
  openAiConfigured: Boolean(OPENAI_API_KEY.value()),
  dartConfigured: Boolean(DART_API_KEY.value()),
  kisConfigured: Boolean(KIS_APP_KEY.value() && KIS_APP_SECRET.value()),
  source: "Firebase Functions secrets"
}));

exports.getKospiNightFutures = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 10
}, async () => {
  const history = await readNightFuturesHistory(300);
  const latest = history.at(-1);
  if (!latest || !Number.isFinite(Number(latest.price)) || Number(latest.price) <= 0) {
    return {
      hasData: false,
      name: `KOSPI200 야간선물 (${getNightFuturesSymbol()})`,
      source: "night_futures_prices"
    };
  }
  return {
    hasData: true,
    name: `KOSPI200 야간선물 (${latest.symbol || getNightFuturesSymbol()})`,
    price: Number(latest.price),
    change: Number(latest.change || 0),
    changeRate: Number(latest.changeRate || 0),
    prevClose: Number(latest.price) - Number(latest.change || 0),
    volume: 0,
    sign: Number(latest.change || 0) >= 0 ? "2" : "4",
    source: "night_futures_prices",
    history
  };
});
