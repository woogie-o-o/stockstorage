const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for discovered search check");

const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();

socket.addEventListener("message", (event) => {
  const payload = JSON.parse(event.data);
  if (!payload.id) return;
  const entry = pending.get(payload.id);
  if (!entry) return;
  pending.delete(payload.id);
  if (payload.error) entry.reject(new Error(payload.error.message || JSON.stringify(payload.error)));
  else entry.resolve(payload.result);
});
socket.addEventListener("close", () => {
  for (const entry of pending.values()) entry.reject(new Error("CDP socket closed"));
  pending.clear();
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression, { awaitPromise = false } = {}) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails, null, 2));
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 12000) {
  const startedAt = Date.now();
  let lastValue;
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(expression, { awaitPromise: true });
    if (lastValue) return lastValue;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const debug = await evaluate(`
    (() => ({
      hash: location.hash,
      title: document.querySelector("main h1")?.textContent?.trim() || "",
      text: document.querySelector("main")?.textContent?.replace(/\\s+/g, " ").trim().slice(0, 500) || ""
    }))()
  `).catch(() => null);
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}; debug=${JSON.stringify(debug)}`);
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 760
  });
}

await send("Runtime.enable");
await send("Page.enable");
await setViewport(1440, 900);
await send("Page.navigate", { url: `${appUrl}/#home` });
await waitFor(`Boolean(document.querySelector("main"))`);
await evaluate(`localStorage.clear();`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector('form[data-form="global-search"]'))`);

await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="global-search"]');
    form.querySelector('[name="q"]').value = "AAPL";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`location.hash === "#stock/US_AAPL"`, 30000);
await waitFor(`
  (() => {
    const text = document.querySelector("main")?.textContent || "";
    const chart = document.querySelector('canvas[data-chart="ohlc"]');
    const hasLiveQuote = text.includes("LIVE") && !text.includes("현재가 출처스냅샷") && !text.includes("$0.00");
    const hasHistorySource = text.includes("Nasdaq") || text.includes("Yahoo Finance");
    return text.includes("AAPL") &&
      hasLiveQuote &&
      hasHistorySource &&
      JSON.parse(chart?.dataset.points || "[]").length > 100;
  })()
`, 18000);

const desktop = await evaluate(`
  (() => {
    const text = document.querySelector("main")?.textContent || "";
    const chart = document.querySelector('canvas[data-chart="ohlc"]');
    const hasLiveQuote = text.includes("LIVE") && !text.includes("현재가 출처스냅샷") && !text.includes("$0.00");
    const hasHistorySource = text.includes("Nasdaq") || text.includes("Yahoo Finance");
    return {
      hash: location.hash,
      hasTicker: text.includes("AAPL"),
      hasLiveQuote,
      hasHistorySource,
      chartPoints: JSON.parse(chart?.dataset.points || "[]").length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      viewport: {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }
    };
  })()
`);

await setViewport(390, 844);
await new Promise((resolve) => setTimeout(resolve, 500));
const mobile = await evaluate(`
  ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewport: {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }
  })
`);

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

if (!desktop.hasTicker || !desktop.hasLiveQuote) throw new Error(`Discovered quote failed: ${JSON.stringify(desktop)}`);
if (!desktop.hasHistorySource || desktop.chartPoints < 100) throw new Error(`Discovered chart failed: ${JSON.stringify(desktop)}`);
if (desktop.overflowX || mobile.overflowX) throw new Error(`Discovered detail overflow: ${JSON.stringify({ desktop, mobile })}`);

console.log(JSON.stringify({ desktop, mobile }, null, 2));
