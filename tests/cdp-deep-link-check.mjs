const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/stock/KS_005930`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP deep link check");

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

async function waitFor(expression, timeoutMs = 18000) {
  const startedAt = Date.now();
  let lastValue;
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(expression, { awaitPromise: true });
    if (lastValue) return lastValue;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const debug = await evaluate(`
    (() => ({
      pathname: location.pathname,
      hash: location.hash,
      title: document.querySelector("main h1")?.textContent?.trim() || "",
      text: document.querySelector("main")?.textContent?.replace(/\\s+/g, " ").trim().slice(0, 500) || ""
    }))()
  `).catch(() => null);
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}; debug=${JSON.stringify(debug)}`);
}

async function navigatePath(path, width = 1280, height = 900) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 760
  });
  await send("Page.navigate", { url: `${appUrl}${path}` });
  await waitFor(`Boolean(document.querySelector("main"))`);
}

async function routeSummary() {
  return await evaluate(`
    (() => ({
      pathname: location.pathname,
      hash: location.hash,
      title: document.querySelector("main h1")?.textContent?.trim() || "",
      text: document.querySelector("main")?.textContent.replace(/\\s+/g, " ").trim() || "",
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      viewport: {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }
    }))()
  `);
}

await send("Runtime.enable");
await send("Page.enable");

await navigatePath("/profile");
await evaluate(`localStorage.clear();`);

await navigatePath("/stock/KS_005930");
await waitFor(`document.querySelector("main h1")?.textContent.includes("삼성전자")`);
const stockPath = await routeSummary();

await navigatePath("/pick/pick_samsung");
await waitFor(`document.querySelector("main h1")?.textContent.includes("삼성전자")`);
const pickAlias = await routeSummary();

await navigatePath("/analysis/market_001");
await waitFor(`document.body.textContent.includes("외국인 선물 수급")`);
const analysisAlias = await routeSummary();

await navigatePath("/post/post_001", 390, 844);
await waitFor(`document.body.textContent.includes("오늘 반도체 수급")`);
const postPathMobile = await routeSummary();

await navigatePath("/journal-share/journal_001");
await waitFor(`document.body.textContent.includes("삼성전자 매수")`);
const journalPath = await routeSummary();

await navigatePath("/index/%5EKS11");
await waitFor(`document.querySelector("main h1")?.textContent.includes("KOSPI")`);
const indexPath = await routeSummary();

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

const result = { stockPath, pickAlias, analysisAlias, postPathMobile, journalPath, indexPath };
if (!stockPath.title.includes("삼성전자")) throw new Error(`Direct stock path failed: ${JSON.stringify(result)}`);
if (!pickAlias.title.includes("삼성전자")) throw new Error(`Legacy pick alias failed: ${JSON.stringify(result)}`);
if (!analysisAlias.text.includes("외국인 선물 수급")) throw new Error(`Legacy analysis alias failed: ${JSON.stringify(result)}`);
if (!postPathMobile.text.includes("오늘 반도체 수급")) throw new Error(`Direct post path failed: ${JSON.stringify(result)}`);
if (!journalPath.title.includes("삼성전자 매수")) throw new Error(`Direct journal share path failed: ${JSON.stringify(result)}`);
if (!indexPath.title.includes("KOSPI")) throw new Error(`Direct index path failed: ${JSON.stringify(result)}`);
for (const [name, value] of Object.entries(result)) {
  if (value.hash) throw new Error(`${name} unexpectedly required hash routing: ${JSON.stringify(result)}`);
  if (value.overflowX) throw new Error(`${name} has horizontal overflow: ${JSON.stringify(result)}`);
}

console.log(JSON.stringify({
  stockPath: stockPath.title,
  pickAlias: pickAlias.title,
  analysisAlias: analysisAlias.title,
  postPathMobile: postPathMobile.viewport,
  journalPath: journalPath.title,
  indexPath: indexPath.title
}, null, 2));
