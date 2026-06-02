const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#stock/KS_005930`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP check");

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
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails, null, 2));
  }
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
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}`);
}

await send("Runtime.enable");
await send("Page.enable");
await waitFor(`Boolean(document.querySelector("main"))`);

await evaluate(`
  localStorage.setItem("woogi-stock-session-v1", JSON.stringify({
    uid: "cdp-local-qa",
    email: "cdp-local-qa@woogi.local",
    nickname: "CDPQA",
    provider: "local",
    isAdmin: false
  }));
`);

await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.body?.textContent.includes("CDPQA")) && Boolean(document.querySelector('[data-action="generate-ai"][data-stock="KS_005930"]'))`, 16000);

const clickResult = await evaluate(`
  (() => {
    const button = document.querySelector('[data-action="generate-ai"][data-stock="KS_005930"]');
    if (!button) return { clicked: false, reason: "button missing" };
    button.click();
    return { clicked: true };
  })();
`);
if (!clickResult.clicked) throw new Error(clickResult.reason || "AI button click failed");

await waitFor(`location.hash.startsWith("#ai/KS_005930")`, 22000);

const qa = await evaluate(`
  (() => {
    const main = document.querySelector("main");
    const text = main ? main.textContent.replace(/\\s+/g, " ").trim() : "";
    const per = (text.match(/PER\\s*([\\d,.]+)/)?.[1] || "").replace(/,$/, "");
    const pbr = (text.match(/PBR\\s*([\\d,.]+)/)?.[1] || "").replace(/,$/, "");
    return {
      hash: location.hash,
      heading: document.querySelector("main h1")?.textContent?.trim() || "",
      per,
      pbr,
      hasPer: Number(per.replaceAll(",", "")) > 0,
      hasPbr: Number(pbr.replaceAll(",", "")) > 0,
      hasNaverFinancials: text.includes("출처는 Naver Finance"),
      hasRecentNews: text.includes("최근 근거 뉴스"),
      newsLinks: document.querySelectorAll(".source-list a").length,
      financialBadges: [...document.querySelectorAll(".badge")].filter((el) => el.textContent.includes("재무")).length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      excerpt: text.slice(0, 900)
    };
  })();
`);

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

if (!qa.hash.startsWith("#ai/KS_005930")) throw new Error(`AI route did not open: ${qa.hash}`);
if (!qa.hasPer || !qa.hasPbr || !qa.hasNaverFinancials) throw new Error(`AI report missing real fundamentals: ${JSON.stringify(qa)}`);
if (!qa.hasRecentNews || qa.newsLinks < 1) throw new Error(`AI report missing news evidence: ${JSON.stringify(qa)}`);
if (qa.overflowX) throw new Error(`AI report has horizontal overflow: ${JSON.stringify(qa)}`);

console.log(JSON.stringify(qa, null, 2));
