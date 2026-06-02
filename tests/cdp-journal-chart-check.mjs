const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `journal-chart-${qaStamp}@woogi.local`;
const password = "qa-journal-chart-password-2026";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for journal chart check");

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

async function waitFor(expression, timeoutMs = 22000) {
  const startedAt = Date.now();
  let lastValue;
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(expression, { awaitPromise: true });
    if (lastValue) return lastValue;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}`);
}

async function navigate(hash, width = 1280, height = 900) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 760
  });
  await send("Page.navigate", { url: `${appUrl}/${hash}` });
  await waitFor(`Boolean(document.querySelector("main"))`);
}

async function chartSummary() {
  return await evaluate(`
    (() => {
      const chart = document.querySelector('canvas[data-chart="journal-candles"]');
      const pixels = chart.getContext("2d").getImageData(0, 0, chart.width, chart.height).data;
      return {
        title: document.querySelector("main h1")?.textContent?.trim() || "",
        points: JSON.parse(chart.dataset.points || "[]").length,
        markers: JSON.parse(chart.dataset.markers || "[]"),
        nonBlankPixels: [...pixels].filter((value, index) => index % 4 === 3 && value > 0).length,
        hasSummary: document.body.textContent.includes("평균 매수가") && document.body.textContent.includes("남은 수량"),
        hasEvents: document.body.textContent.includes("거래 이벤트") && document.body.textContent.includes("HBM 뉴스 이후 눌림 구간 분할 진입"),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        viewport: {
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }
      };
    })()
  `);
}

await send("Runtime.enable");
await send("Page.enable");
await navigate("#profile");
await evaluate(`localStorage.clear();`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector('form[data-form="signup"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="signup"]');
    form.querySelector('[name="nickname"]').value = "JournalChartQA";
    form.querySelector('[name="email"]').value = ${JSON.stringify(email)};
    form.querySelector('[name="password"]').value = ${JSON.stringify(password)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)})`);

await navigate("#journal");
await waitFor(`document.body.textContent.includes("삼성전자") && Boolean(document.querySelector('[data-route="journal-chart"][data-param="KS_005930"]'))`);
await evaluate(`document.querySelector('[data-route="journal-chart"][data-param="KS_005930"]').click(); true;`);
await waitFor(`location.hash === "#journal-chart/KS_005930"`);
await waitFor(`JSON.parse(document.querySelector('canvas[data-chart="journal-candles"]')?.dataset.points || "[]").length > 100`);
await waitFor(`JSON.parse(document.querySelector('canvas[data-chart="journal-candles"]')?.dataset.markers || "[]").length >= 1`);
const desktop = await chartSummary();

await navigate("#journal-chart/KS_005930", 390, 844);
await waitFor(`JSON.parse(document.querySelector('canvas[data-chart="journal-candles"]')?.dataset.points || "[]").length > 100`);
const mobile = await chartSummary();

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

for (const [name, result] of Object.entries({ desktop, mobile })) {
  if (!result.title.includes("삼성전자 매매 차트")) throw new Error(`${name} journal chart title failed: ${JSON.stringify(result)}`);
  if (result.points <= 100 || result.markers.length < 1 || result.nonBlankPixels < 100) throw new Error(`${name} journal chart render failed: ${JSON.stringify(result)}`);
  if (!result.hasSummary || !result.hasEvents) throw new Error(`${name} journal chart content failed: ${JSON.stringify(result)}`);
  if (result.overflowX) throw new Error(`${name} journal chart overflow: ${JSON.stringify(result)}`);
}

console.log(JSON.stringify({ desktop, mobile }, null, 2));
