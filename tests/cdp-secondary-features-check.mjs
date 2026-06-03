const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `secondary-${qaStamp}@woogi.local`;
const password = "qa-secondary-password-2026";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for secondary feature check");

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

await send("Runtime.enable");
await send("Page.enable");
await navigate("#profile");
await evaluate(`localStorage.clear();`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector('form[data-form="signup"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="signup"]');
    form.querySelector('[name="nickname"]').value = "SecondaryQA";
    form.querySelector('[name="email"]').value = ${JSON.stringify(email)};
    form.querySelector('[name="password"]').value = ${JSON.stringify(password)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)})`);

await navigate("#feature-stock/feat_001");
await waitFor(`document.body.textContent.includes("한미반도체 포착 상세") && document.body.textContent.includes("포착 정보") && document.body.textContent.includes("거래량 배수")`);
await waitFor(`JSON.parse(document.querySelector('canvas[data-chart="ohlc"]')?.dataset.points || "[]").length > 50`, 22000);
const featureDetail = await evaluate(`
  (() => {
    const chart = document.querySelector('canvas[data-chart="ohlc"]');
    const candles = JSON.parse(chart.dataset.points || "[]");
    return {
      title: document.querySelector("main h1")?.textContent?.trim() || "",
      values: candles.length,
      chartType: chart.dataset.chart,
      hasChartRanges: ["1일", "1주", "3달", "1년", "5년", "전체"].every((label) => document.body.textContent.includes(label)),
      hasCaptureInfo: document.body.textContent.includes("포착 정보") && document.body.textContent.includes("거래대금") && document.body.textContent.includes("포착 점수"),
      hasActions: document.body.textContent.includes("종목 상세 열기") && document.body.textContent.includes("AI 분석"),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()
`);

await navigate("#journal");
await evaluate(`document.querySelector('[data-action="modal"][data-modal="journal"]').click(); true;`);
await waitFor(`Boolean(document.querySelector('form[data-form="journal"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="journal"]');
    form.querySelector('[name="stockName"]').value = "삼성전자";
    form.querySelector('[name="ticker"]').value = "005930";
    form.querySelector('[name="market"]').value = "KS";
    form.querySelector('[name="action"]').value = "매수";
    form.querySelector('[name="price"]').value = "73500";
    form.querySelector('[name="quantity"]').value = "5";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`!document.querySelector('form[data-form="journal"]') && document.body.textContent.includes("삼성전자")`);

await navigate("#portfolio");
await waitFor(`document.body.textContent.includes("보유 현황") && document.body.textContent.includes("삼성전자")`);
await evaluate(`document.querySelector('[data-action="refresh-portfolio"]').click(); true;`);
await waitFor(`document.querySelector("#toast")?.textContent.includes("보유 현황 현재가를 갱신했습니다.")`, 18000);
const portfolioResult = await evaluate(`
  (() => ({
    refreshed: document.querySelector("#toast")?.textContent.includes("보유 현황 현재가를 갱신했습니다.") || false,
    hasLive: document.body.textContent.includes("LIVE"),
    rows: document.querySelectorAll("table tbody tr").length,
    text: document.querySelector("table tbody")?.textContent?.trim() || ""
  }))()
`);

await navigate("#compare/KS_005930");
await waitFor(`Boolean(document.querySelector('form[data-form="compare"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="compare"]');
    form.querySelector('[name="compare1"]').value = "KS:000660";
    form.querySelector('[name="compare2"]').value = "US:AAPL";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.querySelectorAll('.grid.grid-3.section .panel').length >= 3`, 22000);
await waitFor(`JSON.parse(document.querySelector('canvas[data-chart="multi-line"]').dataset.series).length === 3`, 22000);
const compareResult = await evaluate(`
  (() => {
    const chart = document.querySelector('canvas[data-chart="multi-line"]');
    const series = JSON.parse(chart.dataset.series);
    const pixels = chart.getContext("2d").getImageData(0, 0, chart.width, chart.height).data;
    return {
      cards: document.querySelectorAll('.grid.grid-3.section .panel').length,
      series: series.length,
      points: series.map((items) => items.length),
      nonBlankPixels: [...pixels].filter((value, index) => index % 4 === 3 && value > 0).length,
      hasPeriods: ["1M", "3M", "6M", "1Y", "3Y", "5Y"].every((label) => document.body.textContent.includes(label))
    };
  })()
`);
await evaluate(`document.querySelector('[data-action="compare-period"][data-period="5y"]').click(); true;`);
await waitFor(`document.querySelector('[data-action="compare-period"][data-period="5y"]').classList.contains("active")`);
compareResult.fiveYearSelected = true;

await navigate("#leaderboard");
await waitFor(`document.body.textContent.includes("종료 추천주 실적") && document.body.textContent.includes("현대차")`);

await navigate("#leaderboard", 390, 844);
await waitFor(`document.body.textContent.includes("종료 추천주 실적")`);

const result = await evaluate(`
  (() => {
    return {
      featureDetail: ${JSON.stringify(featureDetail)},
      portfolio: ${JSON.stringify(portfolioResult)},
      compare: ${JSON.stringify(compareResult)},
      leaderboard: {
        hasHyundai: document.body.textContent.includes("현대차")
      },
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      viewport: {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }
    };
  })()
`);

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

if (!result.featureDetail.hasCaptureInfo || !result.featureDetail.hasActions || result.featureDetail.values <= 50 || result.featureDetail.overflowX) {
  throw new Error(`Feature stock detail failed: ${JSON.stringify(result)}`);
}
if (!result.portfolio.refreshed || !result.portfolio.hasLive || result.portfolio.rows < 1) {
  throw new Error(`Portfolio refresh failed: ${JSON.stringify(result)}`);
}
if (!result.leaderboard.hasHyundai) throw new Error(`Leaderboard missing completed pick: ${JSON.stringify(result)}`);
if (result.compare.cards < 3 || result.compare.series !== 3 || result.compare.nonBlankPixels < 100 || !result.compare.hasPeriods || !result.compare.fiveYearSelected) {
  throw new Error(`Compare overlay chart failed: ${JSON.stringify(result)}`);
}
if (result.overflowX) throw new Error(`Secondary feature mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
