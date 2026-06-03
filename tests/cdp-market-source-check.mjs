const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#home`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP market check");

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

async function waitFor(expression, timeoutMs = 9000) {
  const startedAt = Date.now();
  let lastValue;
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(expression, { awaitPromise: true });
    if (lastValue) return lastValue;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}`);
}

async function navigate(hash, width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 760
  });
  await send("Page.navigate", { url: `${appUrl}/${hash}` });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

function pageSummaryExpression() {
  return `
    (() => {
      const main = document.querySelector("main");
      const text = main ? main.textContent.replace(/\\s+/g, " ").trim() : "";
      const lineCanvas = document.querySelector("canvas[data-chart='line']");
      const candleCanvas = document.querySelector("canvas[data-chart='ohlc']");
      const lineValues = String(lineCanvas?.dataset?.values || "").split(",").filter(Boolean);
      const candleValues = JSON.parse(candleCanvas?.dataset?.points || "[]");
      return {
        hash: location.hash,
        title: document.querySelector("main h1")?.textContent?.trim() || "",
        text,
        liveBadges: [...document.querySelectorAll(".badge")].filter((el) => el.textContent.includes("LIVE")).length,
        snapshotBadges: [...document.querySelectorAll(".badge")].filter((el) => el.textContent.includes("SNAPSHOT")).length,
        sourceItems: document.querySelectorAll(".source-list .source-item").length,
        investorFlowRows: document.querySelectorAll('[data-action="open-investor-stock"]').length,
        fmkoreaRows: document.querySelectorAll('[data-action="open-fmkorea-stock"]').length,
        chartValues: candleValues.length || lineValues.length,
        chartType: candleCanvas ? "ohlc" : (lineCanvas ? "line" : ""),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        viewport: {
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }
      };
    })()
  `;
}

await send("Runtime.enable");
await send("Page.enable");

await navigate("#home", 1440, 900);
await waitFor(`document.body.textContent.includes("Naver Finance") && document.body.textContent.includes("LIVE")`);
await waitFor(`document.body.textContent.includes("AI 시장 브리프") && document.body.textContent.includes("서버 시장 브리프")`, 22000);
const home = await evaluate(pageSummaryExpression());

await navigate("#markets", 1440, 900);
await waitFor(`document.body.textContent.includes("마감 수급 TOP5") && document.body.textContent.includes("finance.naver.com")`);
await waitFor(`document.body.textContent.includes("펨코 지수") && document.body.textContent.includes("fmkorea.com/stock")`, 18000);
await waitFor(`document.body.textContent.includes("업종 등락 · 시장 폭") && document.body.textContent.includes("ETF/ETN 제외") && document.querySelectorAll(".source-list .source-item").length >= 4`, 22000);
await waitFor(`document.body.textContent.includes("KOSPI200 야간선물") && document.body.textContent.includes("KIS OpenAPI") && document.body.textContent.includes("수집 대기")`, 12000);
const markets = await evaluate(pageSummaryExpression());

await navigate("#fmkorea-index", 1440, 900);
await waitFor(`document.body.textContent.includes("펨코지수") && document.body.textContent.includes("게시글 수 추이") && document.body.textContent.includes("펨코 HOT 종목") && document.querySelector("canvas[data-chart='line']")?.dataset.values.split(",").filter(Boolean).length >= 3`, 12000);
const fmkoreaIndexDesktop = await evaluate(pageSummaryExpression());

await navigate("#fmkorea-hot", 1440, 900);
await waitFor(`document.body.textContent.includes("펨코 HOT 종목") && document.body.textContent.includes("오늘 실시간 HOT") && document.querySelectorAll('[data-action="open-fmkorea-stock"]').length >= 3`, 12000);
const fmkoreaHotDesktop = await evaluate(pageSummaryExpression());

await navigate("#investor-flow", 1440, 900);
await waitFor(`document.body.textContent.includes("마감 수급") && document.body.textContent.includes("KOSPI 외국인") && document.body.textContent.includes("KOSDAQ 기관") && document.body.textContent.includes("공유 문구") && document.querySelectorAll('[data-action="open-investor-stock"]').length >= 4`, 18000);
const investorFlowDesktop = await evaluate(pageSummaryExpression());

await navigate("#market-sentiment", 1440, 900);
await waitFor(`document.body.textContent.includes("시장 심리 지표") && document.body.textContent.includes("VIX 공포지수") && document.body.textContent.includes("미 10년 국채금리") && document.body.textContent.includes("달러 인덱스") && document.querySelectorAll(".source-list .source-item").length >= 6`, 12000);
const marketSentimentDesktop = await evaluate(pageSummaryExpression());

await navigate("#night-futures", 1440, 900);
await waitFor(`document.body.textContent.includes("KOSPI200 야간선물") && document.body.textContent.includes("KIS OpenAPI") && document.body.textContent.includes("A0")`, 12000);
const nightDesktop = await evaluate(pageSummaryExpression());

await navigate(`#index/${encodeURIComponent("^KS11")}`, 1440, 900);
await waitFor(`document.body.textContent.includes("KOSPI") && document.body.textContent.includes("Naver Finance") && document.querySelector("canvas[data-chart='line']")?.dataset.values.split(",").length > 100`, 22000);
const indexDetail = await evaluate(pageSummaryExpression());

await navigate("#stock/KS_005930", 1440, 900);
await waitFor(`document.body.textContent.includes("삼성전자") && document.body.textContent.includes("현재가 출처") && document.body.textContent.includes("Naver Finance") && JSON.parse(document.querySelector("canvas[data-chart='ohlc']")?.dataset.points || "[]").length > 100`, 22000);
await waitFor(`document.body.textContent.includes("뉴스/공시/근거") && (document.body.textContent.includes("OpenDART") || document.body.textContent.includes("Naver Finance Notice"))`, 12000);
await waitFor(`document.body.textContent.includes("종목토론방") && document.body.textContent.includes("Naver Finance Board")`, 12000);
const stockDesktop = await evaluate(pageSummaryExpression());
const stockCandle = await evaluate(`
  (() => {
    const chart = document.querySelector("canvas[data-chart='ohlc']");
    const pixels = chart.getContext("2d").getImageData(0, 0, chart.width, chart.height).data;
    return {
      points: JSON.parse(chart.dataset.points || "[]").length,
      nonBlankPixels: [...pixels].filter((value, index) => index % 4 === 3 && value > 0).length,
      hasMovingAverages: ["MA5", "MA20", "MA60"].every((label) => document.body.textContent.includes(label))
    };
  })()
`);
await evaluate(`document.querySelector('[data-action="stock-chart-mode"][data-mode="line"]').click(); true;`);
await waitFor(`document.querySelector("canvas[data-chart='line']")?.dataset.values.split(",").length > 100`);
const stockLineValues = await evaluate(`document.querySelector("canvas[data-chart='line']").dataset.values.split(",").length`);
await evaluate(`document.querySelector('[data-action="stock-chart-mode"][data-mode="candles"]').click(); true;`);
await waitFor(`JSON.parse(document.querySelector("canvas[data-chart='ohlc']")?.dataset.points || "[]").length > 100`);

await navigate("#stock/KS_005930", 900, 1000);
await waitFor(`document.body.textContent.includes("삼성전자") && JSON.parse(document.querySelector("canvas[data-chart='ohlc']")?.dataset.points || "[]").length > 100`, 22000);
const stockTablet = await evaluate(pageSummaryExpression());

await navigate("#capture", 390, 844);
await waitFor(`document.body.textContent.includes("AI포착과 추천주")`);
const captureMobile = await evaluate(pageSummaryExpression());

await navigate("#night-futures", 390, 844);
await waitFor(`document.body.textContent.includes("KOSPI200 야간선물") && document.body.textContent.includes("KIS OpenAPI")`);
const nightMobile = await evaluate(pageSummaryExpression());

await navigate("#market-sentiment", 390, 844);
await waitFor(`document.body.textContent.includes("시장 심리 지표") && document.querySelectorAll(".source-list .source-item").length >= 6`, 12000);
const marketSentimentMobile = await evaluate(pageSummaryExpression());

await navigate("#investor-flow", 390, 844);
await waitFor(`document.body.textContent.includes("마감 수급") && document.querySelectorAll('[data-action="open-investor-stock"]').length >= 4`, 12000);
const investorFlowMobile = await evaluate(pageSummaryExpression());

await navigate("#fmkorea-hot", 390, 844);
await waitFor(`document.body.textContent.includes("펨코 HOT 종목") && document.querySelectorAll('[data-action="open-fmkorea-stock"]').length >= 3`, 12000);
const fmkoreaHotMobile = await evaluate(pageSummaryExpression());

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

const checks = { home, markets, fmkoreaIndexDesktop, fmkoreaHotDesktop, investorFlowDesktop, marketSentimentDesktop, nightDesktop, indexDetail, stockDesktop, stockTablet, captureMobile, nightMobile, marketSentimentMobile, investorFlowMobile, fmkoreaHotMobile };
if (home.liveBadges < 2 || !home.text.includes("Naver Finance")) {
  throw new Error(`Home did not show live data sources: ${JSON.stringify(home)}`);
}
if (!home.text.includes("AI 시장 브리프") || !home.text.includes("서버 시장 브리프")) {
  throw new Error(`Home did not show refreshed server market brief: ${JSON.stringify(home)}`);
}
if (!markets.text.includes("마감 수급 TOP5") || !markets.text.includes("finance.naver.com")) {
  throw new Error(`Markets did not show Naver investor flow data: ${JSON.stringify(markets)}`);
}
if (!markets.text.includes("펨코 지수") || !markets.text.includes("fmkorea.com/stock")) {
  throw new Error(`Markets did not show scraped FMKorea data: ${JSON.stringify(markets)}`);
}
if (!fmkoreaIndexDesktop.text.includes("게시글 수 추이") || !fmkoreaIndexDesktop.text.includes("펨코 HOT 종목") || fmkoreaIndexDesktop.chartValues < 3) {
  throw new Error(`FMKorea index detail did not show trend chart and HOT summary: ${JSON.stringify(fmkoreaIndexDesktop)}`);
}
if (!fmkoreaHotDesktop.text.includes("오늘 실시간 HOT") || !fmkoreaHotDesktop.text.includes("공유 문구") || fmkoreaHotDesktop.fmkoreaRows < 3) {
  throw new Error(`FMKorea HOT detail did not show stock rows and share text: ${JSON.stringify(fmkoreaHotDesktop)}`);
}
if (!markets.text.includes("업종 등락 · 시장 폭") || !markets.text.includes("ETF/ETN 제외") || markets.sourceItems < 4) {
  throw new Error(`Markets did not show Naver sector and breadth data: ${JSON.stringify(markets)}`);
}
if (!markets.text.includes("KOSPI200 야간선물") || !markets.text.includes("KIS OpenAPI")) {
  throw new Error(`Markets did not show KOSPI200 night futures status: ${JSON.stringify(markets)}`);
}
if (!investorFlowDesktop.text.includes("KOSPI 외국인") || !investorFlowDesktop.text.includes("KOSDAQ 기관") || !investorFlowDesktop.text.includes("공유 문구") || investorFlowDesktop.investorFlowRows < 4) {
  throw new Error(`Investor flow detail did not show original top5 groups: ${JSON.stringify(investorFlowDesktop)}`);
}
if (!marketSentimentDesktop.text.includes("VIX 공포지수") || !marketSentimentDesktop.text.includes("미 10년 국채금리") || !marketSentimentDesktop.text.includes("달러 인덱스") || marketSentimentDesktop.sourceItems < 6) {
  throw new Error(`Market sentiment detail did not show original indicator set: ${JSON.stringify(marketSentimentDesktop)}`);
}
if (!nightDesktop.text.includes("KOSPI200 야간선물") || !nightDesktop.text.includes("KIS OpenAPI") || !nightDesktop.text.includes("A0")) {
  throw new Error(`Night futures detail did not show KIS status and symbol: ${JSON.stringify(nightDesktop)}`);
}
if (!indexDetail.text.includes("Naver Finance") || indexDetail.chartValues < 100) {
  throw new Error(`Index detail did not show real Naver chart data: ${JSON.stringify(indexDetail)}`);
}
if (!stockDesktop.text.includes("현재가 출처") || !stockDesktop.text.includes("Naver Finance") || stockDesktop.chartValues < 100) {
  throw new Error(`Stock detail did not show real quote/chart sources: ${JSON.stringify(stockDesktop)}`);
}
if (stockDesktop.chartType !== "ohlc" || stockCandle.points < 100 || stockCandle.nonBlankPixels < 100 || !stockCandle.hasMovingAverages || stockLineValues < 100) {
  throw new Error(`Stock detail OHLC/line toggle failed: ${JSON.stringify({ stockDesktop, stockCandle, stockLineValues })}`);
}
if (!stockDesktop.text.includes("종목토론방") || !stockDesktop.text.includes("Naver Finance Board")) {
  throw new Error(`Stock detail did not show Naver discussion board source: ${JSON.stringify(stockDesktop)}`);
}
if (!stockDesktop.text.includes("뉴스/공시/근거") || (!stockDesktop.text.includes("OpenDART") && !stockDesktop.text.includes("Naver Finance Notice"))) {
  throw new Error(`Stock detail did not show Naver disclosure source: ${JSON.stringify(stockDesktop)}`);
}
for (const [name, result] of Object.entries(checks)) {
  if (result.overflowX) throw new Error(`${name} has horizontal overflow: ${JSON.stringify(result)}`);
}

console.log(JSON.stringify({
  home: {
    liveBadges: home.liveBadges,
    snapshotBadges: home.snapshotBadges,
    hasNaver: home.text.includes("Naver Finance"),
    hasMarketBrief: home.text.includes("AI 시장 브리프") && home.text.includes("서버 시장 브리프")
  },
  markets: {
    title: markets.title,
    hasInvestorFlow: markets.text.includes("마감 수급 TOP5") && markets.text.includes("finance.naver.com"),
    hasFmkorea: markets.text.includes("펨코 지수") && markets.text.includes("fmkorea.com/stock"),
    hasSectorBreadth: markets.text.includes("업종 등락 · 시장 폭") && markets.text.includes("ETF/ETN 제외"),
    hasNightFutures: markets.text.includes("KOSPI200 야간선물") && markets.text.includes("KIS OpenAPI")
  },
  fmkoreaIndexDesktop: {
    title: fmkoreaIndexDesktop.title,
    chartValues: fmkoreaIndexDesktop.chartValues,
    hasTrend: fmkoreaIndexDesktop.text.includes("게시글 수 추이"),
    viewport: fmkoreaIndexDesktop.viewport
  },
  fmkoreaHotDesktop: {
    title: fmkoreaHotDesktop.title,
    rows: fmkoreaHotDesktop.fmkoreaRows,
    hasShare: fmkoreaHotDesktop.text.includes("공유 문구"),
    viewport: fmkoreaHotDesktop.viewport
  },
  investorFlowDesktop: {
    title: investorFlowDesktop.title,
    rows: investorFlowDesktop.investorFlowRows,
    hasGroups: investorFlowDesktop.text.includes("KOSPI 외국인") && investorFlowDesktop.text.includes("KOSDAQ 기관"),
    viewport: investorFlowDesktop.viewport
  },
  marketSentimentDesktop: {
    title: marketSentimentDesktop.title,
    sourceItems: marketSentimentDesktop.sourceItems,
    hasOriginalIndicators: marketSentimentDesktop.text.includes("VIX 공포지수") && marketSentimentDesktop.text.includes("미 10년 국채금리") && marketSentimentDesktop.text.includes("달러 인덱스"),
    viewport: marketSentimentDesktop.viewport
  },
  nightDesktop: {
    title: nightDesktop.title,
    hasKis: nightDesktop.text.includes("KIS OpenAPI"),
    viewport: nightDesktop.viewport
  },
  indexDetail: {
    title: indexDetail.title,
    chartValues: indexDetail.chartValues,
    hasNaver: indexDetail.text.includes("Naver Finance")
  },
  stockDesktop: {
    title: stockDesktop.title,
    chartValues: stockDesktop.chartValues,
    chartType: stockDesktop.chartType,
    candlePixels: stockCandle.nonBlankPixels,
    hasMovingAverages: stockCandle.hasMovingAverages,
    lineValues: stockLineValues,
    hasQuoteSource: stockDesktop.text.includes("현재가 출처") && stockDesktop.text.includes("Naver Finance"),
    hasDisclosure: stockDesktop.text.includes("뉴스/공시/근거") && (stockDesktop.text.includes("OpenDART") || stockDesktop.text.includes("Naver Finance Notice")),
    hasDiscussion: stockDesktop.text.includes("종목토론방") && stockDesktop.text.includes("Naver Finance Board")
  },
  stockTablet: stockTablet.viewport,
  captureMobile: captureMobile.viewport,
  marketSentimentMobile: marketSentimentMobile.viewport,
  investorFlowMobile: investorFlowMobile.viewport,
  fmkoreaHotMobile: fmkoreaHotMobile.viewport
}, null, 2));
