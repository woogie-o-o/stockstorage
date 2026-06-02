const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

async function get(path) {
  const res = await fetch(`${appUrl}${path}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
  return await res.json();
}

function assert(condition, message, data) {
  if (!condition) throw new Error(`${message}: ${JSON.stringify(data)}`);
}

const [
  samsungQuote,
  kospiHistory,
  samsungFundamentals,
  samsungNews,
  samsungDisclosures,
  samsungDiscussions,
  sentiment,
  investorFlow,
  aaplSearch,
  aaplQuote,
  aaplHistory
] = await Promise.all([
  get("/api/quote?ticker=005930&market=KS"),
  get("/api/history?ticker=%5EKS11&market=US&range=2y&interval=1d"),
  get("/api/fundamentals?ticker=005930&market=KS"),
  get("/api/news?ticker=005930&market=KS&name=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90"),
  get("/api/disclosures?ticker=005930&market=KS"),
  get("/api/discussions?ticker=005930&market=KS"),
  get("/api/sentiment"),
  get("/api/investor-flow"),
  get("/api/search?q=AAPL"),
  get("/api/quote?ticker=AAPL&market=US"),
  get("/api/history?ticker=AAPL&market=US&range=6mo&interval=1d")
]);
const marketBrief = await get("/api/market-brief");
const fmkorea = await get("/api/fmkorea");
const marketSectors = await get("/api/market-sectors");
const nightFutures = await get("/api/night-futures");
const samsungFiveYearHistory = await get("/api/history?ticker=005930&market=KS&range=5y&interval=1d");

assert(Number(samsungQuote.price) > 0 && samsungQuote.source === "Naver Finance", "Samsung quote failed", samsungQuote);
assert(kospiHistory.points?.length > 100 && kospiHistory.source === "Naver Finance", "KOSPI history failed", kospiHistory);
assert(Number(samsungFundamentals.per) > 0 && Number(samsungFundamentals.pbr) > 0, "Samsung fundamentals failed", samsungFundamentals);
assert(samsungNews.items?.length >= 1, "Samsung news failed", samsungNews);
assert(samsungDisclosures.source === "Naver Finance Notice" && samsungDisclosures.items?.length >= 1, "Samsung disclosures failed", samsungDisclosures);
assert(samsungDiscussions.source === "Naver Finance Board" && samsungDiscussions.items?.length >= 1, "Samsung discussions failed", samsungDiscussions);
assert(Number(sentiment.score) >= 0 && sentiment.source === "CNN Fear & Greed", "Market sentiment failed", sentiment);
assert(investorFlow.source === "finance.naver.com", "Investor flow source failed", investorFlow);
assert(investorFlow.kospi?.foreignTop5?.length >= 1 || investorFlow.kosdaq?.foreignTop5?.length >= 1, "Investor flow top5 failed", investorFlow);
assert(aaplSearch.items?.some((item) => item.ticker === "AAPL" && item.market === "US"), "AAPL search failed", aaplSearch);
assert(Number(aaplQuote.price) > 0 && aaplQuote.source, "AAPL quote failed", aaplQuote);
assert(aaplHistory.points?.length > 100 && aaplHistory.source, "AAPL history failed", aaplHistory);
assert(marketBrief.source === "서버 시장 브리프" && marketBrief.summary && marketBrief.bullets?.length >= 1, "Market brief failed", marketBrief);
assert(fmkorea.source === "fmkorea.com/stock" && typeof fmkorea.available === "boolean", "FMKorea scrape schema failed", fmkorea);
assert(marketSectors.source === "finance.naver.com", "Market sectors source failed", marketSectors);
assert(marketSectors.sectors?.up?.length >= 1 && marketSectors.sectors?.down?.length >= 1, "Market sectors scrape failed", marketSectors);
assert(Number(marketSectors.breadth?.kospi?.up) >= 0 && Number(marketSectors.breadth?.kosdaq?.down) >= 0, "Market breadth failed", marketSectors);
assert(nightFutures.source === "KIS OpenAPI" && /^A0\d{4}$/.test(nightFutures.symbol), "Night futures schema failed", nightFutures);
assert(typeof nightFutures.configured === "boolean" && typeof nightFutures.available === "boolean" && Array.isArray(nightFutures.history), "Night futures availability schema failed", nightFutures);
assert(!JSON.stringify(nightFutures).includes("appSecret") && !JSON.stringify(nightFutures).includes("appKey"), "Night futures response leaks secret field names", nightFutures);
assert(samsungFiveYearHistory.source === "Naver Finance" && samsungFiveYearHistory.points?.length > 1000, "Samsung five year history failed", samsungFiveYearHistory);
if (fmkorea.available) {
  assert(Number(fmkorea.latestCount) > 0 && fmkorea.series?.length >= 1, "FMKorea scrape data failed", fmkorea);
}

console.log(JSON.stringify({
  samsung: {
    price: samsungQuote.price,
    source: samsungQuote.source,
    per: samsungFundamentals.per,
    pbr: samsungFundamentals.pbr,
    news: samsungNews.items.length,
    disclosures: {
      count: samsungDisclosures.items.length,
      firstTitle: samsungDisclosures.items[0]?.title || ""
    },
    discussions: {
      count: samsungDiscussions.items.length,
      firstTitle: samsungDiscussions.items[0]?.title || ""
    }
  },
  kospiHistory: {
    source: kospiHistory.source,
    points: kospiHistory.points.length
  },
  samsungFiveYearHistory: {
    source: samsungFiveYearHistory.source,
    points: samsungFiveYearHistory.points.length
  },
  sentiment: {
    score: sentiment.score,
    source: sentiment.source
  },
  investorFlow: {
    marketDate: investorFlow.marketDate,
    kospiForeignTop5: investorFlow.kospi?.foreignTop5?.length || 0,
    kosdaqForeignTop5: investorFlow.kosdaq?.foreignTop5?.length || 0
  },
  marketBrief: {
    title: marketBrief.title,
    source: marketBrief.source,
    bullets: marketBrief.bullets.length
  },
  fmkorea: {
    source: fmkorea.source,
    available: fmkorea.available,
    latestCount: fmkorea.latestCount,
    hotMentions: fmkorea.topMentions?.length || 0,
    pagesScraped: fmkorea.pagesScraped
  },
  marketSectors: {
    source: marketSectors.source,
    up: marketSectors.sectors.up,
    down: marketSectors.sectors.down,
    breadth: marketSectors.breadth
  },
  nightFutures: {
    source: nightFutures.source,
    symbol: nightFutures.symbol,
    configured: nightFutures.configured,
    available: nightFutures.available,
    mode: nightFutures.mode
  },
  aapl: {
    search: aaplSearch.items[0],
    price: aaplQuote.price,
    quoteSource: aaplQuote.source,
    historySource: aaplHistory.source,
    historyPoints: aaplHistory.points.length
  }
}, null, 2));
