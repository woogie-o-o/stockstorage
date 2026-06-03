const STORE = {
  data: "woogi-stock-data-v1",
  users: "woogi-stock-users-v1",
  session: "woogi-stock-session-v1",
  theme: "woogi-stock-theme-v1"
};

const ROUTES = [
  { id: "home", label: "홈", short: "홈", icon: "⌂" },
  { id: "capture", label: "AI포착", short: "포착", icon: "◎" },
  { id: "markets", label: "실시간 시장", short: "시장", icon: "↗" },
  { id: "favorites", label: "관심종목", short: "관심", icon: "♡" },
  { id: "journal", label: "매매일지", short: "일지", icon: "▤" },
  { id: "portfolio", label: "보유 현황", short: "보유", icon: "▦" },
  { id: "compare", label: "종목 비교", short: "비교", icon: "⇄" },
  { id: "ai", label: "AI 분석", short: "AI", icon: "✦" },
  { id: "community", label: "커뮤니티", short: "커뮤", icon: "≡" },
  { id: "notices", label: "공지", short: "공지", icon: "•" },
  { id: "profile", label: "프로필", short: "내정보", icon: "○" },
  { id: "admin", label: "관리자", short: "관리", icon: "⚙" }
];

const MOBILE_ROUTES = ["home", "capture", "markets", "favorites", "journal"];
const ROUTE_IDS = new Set([...ROUTES.map((route) => route.id), "stock", "feature-stock", "index", "night-futures", "market-sentiment", "investor-flow", "fmkorea-index", "fmkorea-hot", "leaderboard", "market-analysis", "notice", "post", "journal-chart", "journal-share", "my-posts", "my-comments"]);
const DIRECT_ROUTE_ALIASES = {
  pick: "stock",
  analysis: "market-analysis"
};
const DEFAULT_ADMIN_UIDS = ["1KzEXKZMoFaYOymYyoI283AR3Y32", "v4a3ClF3FhWGXsGnZ29wyvQNSCX2", "Iw0Oyfn2SuONCkd5au9pnAUXGN52"];
const ADMIN_UIDS = new Set([...DEFAULT_ADMIN_UIDS, ...readConfiguredAdminUids()]);
const FALLBACK_PICK_SNAPSHOTS = {
  pick_samsung: { buyPrice: 292000, targetPrice: 355000, currentPrice: 347000, changeRate: 9.46 },
  pick_skhy: { buyPrice: 2180000, targetPrice: 2550000, currentPrice: 2393000, changeRate: 2.57 },
  pick_naver: { buyPrice: 210000, targetPrice: 262000, currentPrice: 259000, changeRate: 10.68 },
  pick_nvda: { buyPrice: 198, targetPrice: 246, currentPrice: 211.14, changeRate: -1.45 },
  pick_hyundai: { buyPrice: 612000, targetPrice: 730000, currentPrice: 743000, closedPrice: 723000, changeRate: 2.77 }
};
const FALLBACK_FEATURE_SNAPSHOTS = {
  feat_001: { price: 290000, currentPrice: 290000, changeRate: 2.84 },
  feat_002: { price: 132300, currentPrice: 132300, changeRate: -4.82 },
  feat_003: { price: 435.79, currentPrice: 435.79, changeRate: -0.92 }
};
const FALLBACK_INDEX_SNAPSHOTS = {
  KOSPI: { value: 8849.25, changeRate: 4.4 },
  KOSDAQ: { value: 1052.68, changeRate: -2.06 },
  "S&P500": { value: 7580.1, changeRate: 0.01 },
  NASDAQ: { value: 26972.62, changeRate: 0.2 },
  "USD/KRW": { value: 1503.13, changeRate: 0.52 },
  NASDAQ100_FUTURES: { value: 30388.25, changeRate: 0.19 },
  WTI: { value: 87.36, changeRate: -1.34 }
};
const COMPARE_PERIODS = [
  { id: "1mo", label: "1M", days: 31 },
  { id: "3mo", label: "3M", days: 92 },
  { id: "6mo", label: "6M", days: 183 },
  { id: "1y", label: "1Y", days: 366 },
  { id: "3y", label: "3Y", days: 1096 },
  { id: "5y", label: "5Y", days: 1827 }
];
const COMPARE_SERIES_COLORS = ["#10b981", "#fb923c", "#60a5fa"];
const CHART_FRAMES = [
  { id: "minute", label: "분봉" },
  { id: "day", label: "일봉" },
  { id: "week", label: "주봉" },
  { id: "month", label: "월봉" }
];
const MINUTE_INTERVALS = [
  { id: "1m", label: "1분", range: "1d" },
  { id: "5m", label: "5분", range: "5d" },
  { id: "60m", label: "60분", range: "1mo" }
];
const CHART_RANGES = [
  { id: "1d", label: "1일", points: { minute: 120, day: 1, week: 1, month: 1 } },
  { id: "1w", label: "1주", points: { minute: 240, day: 5, week: 1, month: 1 } },
  { id: "3m", label: "3달", points: { minute: 240, day: 63, week: 13, month: 3 } },
  { id: "1y", label: "1년", points: { minute: 240, day: 252, week: 52, month: 12 } },
  { id: "5y", label: "5년", points: { minute: 240, day: 1260, week: 260, month: 60 } },
  { id: "all", label: "전체", points: null }
];
const MARKET_SENTIMENT_INDICATORS = [
  { id: "vix", name: "VIX 공포지수", ticker: "^VIX", unit: "", benchmark: "20 이하 안정, 30 이상 경계", description: "옵션 가격 기반 변동성 지표로 급등 시 시장 불안 심리가 커졌다는 신호로 봅니다." },
  { id: "tnx", name: "미 10년 국채금리", ticker: "^TNX", unit: "%", benchmark: "4% 전후 부담선", description: "장기 금리 기준점입니다. 상승은 성장주 부담, 하락은 위험자산 선호 회복으로 이어지기 쉽습니다." },
  { id: "irx", name: "미 3개월 국채금리", ticker: "^IRX", unit: "%", benchmark: "단기 정책금리 민감", description: "단기 금리 압력을 보여줍니다. 10년물과 함께 장단기 금리차를 계산합니다." },
  { id: "dxy", name: "달러 인덱스", ticker: "DX-Y.NYB", unit: "", benchmark: "100 중립, 105 이상 강달러", description: "달러 강세는 신흥국 자산과 원자재에 부담, 약세는 위험자산 회복 분위기로 해석합니다." },
  { id: "copper", name: "구리", ticker: "HG=F", unit: "", benchmark: "상승: 경기민감 선호", description: "경기민감 자산입니다. 금과의 상대 강도로 위험 선호를 보조 판단합니다." },
  { id: "gold", name: "금", ticker: "GC=F", unit: "", benchmark: "상승: 방어 선호", description: "대표 안전자산입니다. 구리 대비 강해지면 방어 선호가 커졌다고 봅니다." }
];
const app = document.querySelector("#app");
const toastEl = document.querySelector("#toast");

const state = {
  data: loadData(),
  user: loadSession(),
  route: parseRoute(),
  filters: {
    captureTab: "all",
    captureSearch: "",
    captureMarket: "all",
    aiSort: "recent",
    aiScore: "",
    comparePeriod: "6mo",
    stockChartMode: "candles",
    stockChartFrame: "day",
    stockMinuteInterval: "60m",
    stockChartRange: "1y",
    stockDetailTab: "chart",
    stockQuoteTab: "materials",
    stockWorkTab: "analysis",
    indexChartFrame: "day",
    indexMinuteInterval: "60m",
    indexChartRange: "1y",
    rightPanelOpen: true,
    journalStock: "",
    journalDate: "",
    communityTab: "posts",
    marketTab: "summary",
    adminUserSearch: "",
    adminUserUid: ""
  },
  modal: null,
  discoveredStocks: new Map(),
  histories: new Map(),
  historyMeta: new Map(),
  historyBusy: new Set(),
  historyAttempted: new Set(),
  quoteBusy: new Set(),
  quoteAttempted: new Set(),
  stockExtras: new Map(),
  stockExtrasBusy: new Set(),
  stockDiscussions: new Map(),
  stockDiscussionsBusy: new Set(),
  aiBriefBusy: false,
  investorFlowBusy: false,
  fmkoreaBusy: false,
  marketSectorsBusy: false,
  marketSentimentBusy: false,
  nightFuturesBusy: false,
  scannerBusy: false,
  autoRefreshTimer: null,
  compareItems: [],
  compareBusy: false,
  portfolioBusy: false,
  pricesBusy: false,
  firebase: {
    enabled: false,
    status: "로컬 저장소",
    modules: null,
    app: null,
    auth: null,
    db: null,
    functions: null,
    storage: null
  }
};

init();

async function init() {
  document.documentElement.dataset.theme = localStorage.getItem(STORE.theme) || "light";
  window.addEventListener("hashchange", () => {
    state.route = parseRoute();
    render();
  });
  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("input", onInput);
  await initFirebase();
  render();
  await runWithTimeout(() => loadRemoteData(), 8000, "remote data load");
  await runWithTimeout(() => recordDailyAttendance(), 4000, "attendance write");
  render();
  queueMicrotask(() => refreshPrices({ silent: true }));
  queueMicrotask(() => refreshInvestorFlow({ silent: true }));
  queueMicrotask(() => refreshAiBrief({ silent: true }));
  queueMicrotask(() => refreshFmkoreaMarketData({ silent: true }));
  queueMicrotask(() => refreshMarketSectors({ silent: true }));
  queueMicrotask(() => refreshNightFutures({ silent: true }));
  queueMicrotask(() => refreshScannerFeatures({ silent: true }));
  startAutoRefresh();
}

function startAutoRefresh() {
  if (state.autoRefreshTimer) return;
  state.autoRefreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    refreshPrices({ silent: true });
    if (state.route.id === "stock" && state.route.param) {
      refreshStockQuote(state.route.param, { silent: true });
    }
    if (state.route.id === "feature-stock") {
      const feature = findFeatureStock(state.route.param);
      if (feature) refreshStockQuote(stockKey(feature), { silent: true });
    }
  }, 60000);
}

function runWithTimeout(task, ms, label) {
  let done = false;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      console.warn(`${label} timed out`);
      resolve(null);
    }, ms);
    Promise.resolve()
      .then(task)
      .then((value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        console.warn(`${label} failed`, error);
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function parseRoute() {
  if (location.hash && location.hash !== "#") {
    return parseRouteString(location.hash.slice(1));
  }
  const path = `${location.pathname.replace(/^\/+|\/+$/g, "")}${location.search || ""}`;
  return parseRouteString(path || "home");
}

function parseRouteString(value) {
  const raw = safeDecode(value);
  const queryIndex = raw.indexOf("?");
  const path = (queryIndex >= 0 ? raw.slice(0, queryIndex) : raw).replace(/^\/+|\/+$/g, "");
  const query = queryIndex >= 0 ? raw.slice(queryIndex + 1) : "";
  const [rawId = "home", ...paramParts] = path.split("/").filter(Boolean);
  const id = DIRECT_ROUTE_ALIASES[rawId] || rawId;
  const param = paramParts.join("/");
  const params = Object.fromEntries(new URLSearchParams(query));
  return { id: ROUTE_IDS.has(id) ? id : "home", param, params };
}

function safeDecode(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function navigate(id, param = "") {
  location.hash = `#${id}${param ? `/${encodeURIComponent(param)}` : ""}`;
}

function apiUrl(path, params = {}) {
  const base = String(window.WOOGI_API_BASE_URL || "").trim().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  return base ? url.toString() : `${url.pathname}${url.search}`;
}

function fetchWithTimeout(url, timeoutMs = 8000, options = {}) {
  const timeoutOptions = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? { signal: AbortSignal.timeout(timeoutMs) }
    : {};
  return fetch(url, { ...timeoutOptions, ...options });
}

function readConfiguredAdminUids() {
  const value = window.WOOGI_ADMIN_UIDS;
  if (Array.isArray(value)) return value.map((uidValue) => String(uidValue).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((uidValue) => uidValue.trim()).filter(Boolean);
  return [];
}

async function firebaseUserIsAdmin(fbUser) {
  if (!fbUser) return false;
  if (ADMIN_UIDS.has(fbUser.uid)) return true;
  try {
    const token = await fbUser.getIdTokenResult();
    return token?.claims?.admin === true;
  } catch (error) {
    console.warn("Firebase admin claim read failed", error);
    return false;
  }
}

function loadData() {
  const saved = readJson(STORE.data);
  if (!saved) {
    const seeded = makeSeedData();
    localStorage.setItem(STORE.data, JSON.stringify(seeded));
    return seeded;
  }
  const merged = mergeData(makeSeedData(), saved);
  if (JSON.stringify(merged.userDocs || {}) !== JSON.stringify(saved.userDocs || {})) {
    localStorage.setItem(STORE.data, JSON.stringify(merged));
  }
  return merged;
}

function saveData() {
  localStorage.setItem(STORE.data, JSON.stringify(state.data));
}

function kstDayKey(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${month}-${day}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadSession() {
  return readJson(STORE.session);
}

function saveSession(user) {
  if (user) localStorage.setItem(STORE.session, JSON.stringify(user));
  else localStorage.removeItem(STORE.session);
  state.user = user;
}

function mergeData(base, saved) {
  const out = { ...base, ...saved };
  for (const key of [
    "stockPicks",
    "marketFeatures",
    "announcements",
    "posts",
    "journals",
    "analyses",
    "marketAnalyses",
    "adminUsers"
  ]) {
    out[key] = Array.isArray(saved?.[key]) ? saved[key] : base[key];
  }
  out.stockPicks = out.stockPicks.map(realignFallbackPick);
  out.marketFeatures = out.marketFeatures.map(realignFallbackFeature);
  out.postComments = { ...base.postComments, ...(saved?.postComments || {}) };
  out.pickComments = { ...base.pickComments, ...(saved?.pickComments || {}) };
  out.journalComments = { ...base.journalComments, ...(saved?.journalComments || {}) };
  out.marketAnalysisComments = { ...base.marketAnalysisComments, ...(saved?.marketAnalysisComments || {}) };
  out.userDocs = Object.fromEntries(
    Object.entries({ ...base.userDocs, ...(saved?.userDocs || {}) }).map(([uidValue, doc]) => [uidValue, normalizeUserDoc(doc)])
  );
  out.aiBrief = normalizeAiBrief(saved?.aiBrief || base.aiBrief);
  const savedMarket = saved?.market || {};
  const savedIndices = Array.isArray(savedMarket.indices) ? savedMarket.indices : [];
  const savedIndicesById = new Map(savedIndices.map((index) => [index.id, index]));
  const baseIndexIds = new Set(base.market.indices.map((index) => index.id));
  out.market = {
    ...base.market,
    ...savedMarket,
    indices: [
      ...base.market.indices.map((index) => ({ ...index, ...(savedIndicesById.get(index.id) || {}) })),
      ...savedIndices.filter((index) => !baseIndexIds.has(index.id))
    ].map(realignFallbackIndex),
    sentiment: { ...base.market.sentiment, ...(savedMarket.sentiment || {}) },
    investorFlow: {
      ...base.market.investorFlow,
      ...(savedMarket.investorFlow || {}),
      kospi: { ...base.market.investorFlow.kospi, ...(savedMarket.investorFlow?.kospi || {}) },
      kosdaq: { ...base.market.investorFlow.kosdaq, ...(savedMarket.investorFlow?.kosdaq || {}) }
    },
    fmkorea: { ...base.market.fmkorea, ...(savedMarket.fmkorea || {}) },
    nightFutures: normalizeNightFutures({
      ...base.market.nightFutures,
      ...(savedMarket.nightFutures || {})
    }),
    marketSectors: {
      ...base.market.marketSectors,
      ...(savedMarket.marketSectors || {}),
      sectors: { ...base.market.marketSectors.sectors, ...(savedMarket.marketSectors?.sectors || {}) },
      breadth: {
        ...base.market.marketSectors.breadth,
        ...(savedMarket.marketSectors?.breadth || {}),
        kospi: { ...base.market.marketSectors.breadth.kospi, ...(savedMarket.marketSectors?.breadth?.kospi || {}) },
        kosdaq: { ...base.market.marketSectors.breadth.kosdaq, ...(savedMarket.marketSectors?.breadth?.kosdaq || {}) }
      }
    }
  };
  return out;
}

function normalizeAiBrief(item = {}) {
  const briefText = String(item.brief || item.summary || "").trim();
  const paragraphs = briefText.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const summary = String(item.summary || paragraphs[0] || "").trim();
  const bullets = Array.isArray(item.bullets) && item.bullets.length
    ? item.bullets.map((value) => String(value || "").trim()).filter(Boolean)
    : paragraphs.slice(1, 4);
  return {
    ...item,
    id: item.id || "latest",
    title: item.title || item.slotLabel || "AI 간단 시황",
    summary,
    brief: briefText || summary,
    bullets: bullets.length ? bullets.slice(0, 3) : [summary].filter(Boolean),
    source: item.source || (item.brief ? "ai_briefs/latest" : "로컬 seed"),
    generatedAt: item.generatedAt || item.createdAt || item.updatedAt || ""
  };
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = typeof value === "string" ? value.replace(/,/g, "") : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeNightFutures(item = {}) {
  const history = (Array.isArray(item.history) ? item.history : [])
    .map((point) => ({
      time: point?.time || point?.timestamp || point?.updatedAt || "",
      price: finiteNumberOrNull(point?.price ?? point?.close ?? point?.value),
      change: finiteNumberOrNull(point?.change),
      changeRate: finiteNumberOrNull(point?.changeRate ?? point?.rate)
    }))
    .filter((point) => Number.isFinite(point.price) && point.price > 0);
  const latest = history.at(-1) || {};
  const price = finiteNumberOrNull(item.price) ?? latest.price ?? null;
  const previousClose = finiteNumberOrNull(item.previousClose);
  const change = finiteNumberOrNull(item.change) ?? latest.change ?? (price != null && previousClose ? price - previousClose : null);
  const changeRate = finiteNumberOrNull(item.changeRate) ?? latest.changeRate ?? (change != null && previousClose ? change / previousClose * 100 : null);
  return {
    name: item.name || "KOSPI200 야간선물",
    symbol: item.symbol || "",
    source: item.source || "KIS OpenAPI",
    configured: item.configured === true,
    available: Number.isFinite(price) && price > 0,
    mode: item.mode || "not-configured",
    message: item.message || "",
    session: {
      label: item.session?.label || "18:00~05:00 KST",
      active: item.session?.active === true,
      date: item.session?.date || ""
    },
    price,
    change,
    changeRate,
    previousClose,
    updatedAt: item.updatedAt || latest.time || "",
    history
  };
}

function nightFuturesFromFirestore(items = []) {
  if (!Array.isArray(items) || !items.length) return null;
  const history = items
    .map((item) => ({
      time: item.timestamp || item.updatedAt || item.time || item.id || "",
      price: finiteNumberOrNull(item.price),
      change: finiteNumberOrNull(item.change),
      changeRate: finiteNumberOrNull(item.changeRate),
      symbol: item.symbol || ""
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0)
    .sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0));
  if (!history.length) return null;
  const latest = history.at(-1);
  return normalizeNightFutures({
    name: "KOSPI200 야간선물",
    symbol: latest.symbol || "",
    source: "Firebase night_futures_prices · KIS OpenAPI",
    configured: true,
    available: true,
    mode: "firebase-history",
    message: "Firebase night_futures_prices 수집 스냅샷",
    session: state.data?.market?.nightFutures?.session,
    price: latest.price,
    change: latest.change,
    changeRate: latest.changeRate,
    updatedAt: latest.time,
    history
  });
}

function realignFallbackPick(pick) {
  const snapshot = FALLBACK_PICK_SNAPSHOTS[pick?.id];
  if (!snapshot) return pick;
  const liveAnchor = Number(snapshot.currentPrice || snapshot.closedPrice || 0);
  const current = Number(pick.currentPrice || pick.closedPrice || 0);
  const buy = Number(pick.buyPrice || 0);
  const target = Number(pick.targetPrice || 0);
  const stale = liveAnchor > 0 && (
    [current, buy].some((value) => value > 0 && value < liveAnchor * 0.5)
    || [current, buy, target].some((value) => value > liveAnchor * 2)
    || (target > 0 && target < liveAnchor * 1.03)
  );
  return stale ? { ...pick, ...snapshot } : pick;
}

function realignFallbackFeature(feature) {
  const snapshot = FALLBACK_FEATURE_SNAPSHOTS[feature?.id];
  if (!snapshot) return feature;
  const liveAnchor = Number(snapshot.price || snapshot.currentPrice || 0);
  const price = Number(feature.price || feature.currentPrice || 0);
  return liveAnchor > 0 && price > 0 && price < liveAnchor * 0.5 ? { ...feature, ...snapshot } : feature;
}

function realignFallbackIndex(index) {
  const snapshot = FALLBACK_INDEX_SNAPSHOTS[index?.id];
  if (!snapshot || index?.source) return index;
  const anchor = Number(snapshot.value || 0);
  const value = Number(index.value || 0);
  const stale = anchor > 0 && value > 0 && (value < anchor * 0.5 || value > anchor * 1.8);
  return stale ? { ...index, ...snapshot } : index;
}

function makeSeedData() {
  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();
  const today = now.toISOString().slice(0, 10);
  return {
    stockPicks: [
      {
        id: "pick_samsung",
        ticker: "005930",
        name: "삼성전자",
        market: "KS",
        buyPrice: 292000,
        targetPrice: 355000,
        currentPrice: 347000,
        changeRate: 9.46,
        reason: "HBM 공급 회복과 메모리 가격 반등이 동시에 확인되는 구간입니다.",
        category: "대형주",
        status: "active",
        isPremium: false,
        createdAt: daysAgo(1),
        upVotes: 78,
        downVotes: 21,
        earningsDate: daysAgo(-21)
      },
      {
        id: "pick_skhy",
        ticker: "000660",
        name: "SK하이닉스",
        market: "KS",
        buyPrice: 2180000,
        targetPrice: 2550000,
        currentPrice: 2393000,
        changeRate: 2.57,
        reason: "AI 서버 수요와 HBM 믹스 개선 기대가 수급을 끌어올리고 있습니다.",
        category: "AI반도체",
        status: "active",
        isPremium: false,
        createdAt: daysAgo(2),
        upVotes: 94,
        downVotes: 18
      },
      {
        id: "pick_naver",
        ticker: "035420",
        name: "NAVER",
        market: "KS",
        buyPrice: 210000,
        targetPrice: 262000,
        currentPrice: 259000,
        changeRate: 10.68,
        reason: "커머스 수익성 회복과 AI 검색 고도화가 중기 모멘텀입니다.",
        category: "플랫폼",
        status: "active",
        isPremium: false,
        createdAt: daysAgo(4),
        upVotes: 46,
        downVotes: 25
      },
      {
        id: "pick_nvda",
        ticker: "NVDA",
        name: "NVIDIA",
        market: "US",
        buyPrice: 198,
        targetPrice: 246,
        currentPrice: 211.14,
        changeRate: -1.45,
        reason: "데이터센터 GPU 수요와 블랙웰 출하가 성장 경로를 지지합니다.",
        category: "미국성장",
        status: "active",
        isPremium: false,
        createdAt: daysAgo(5),
        upVotes: 82,
        downVotes: 30
      },
      {
        id: "pick_hyundai",
        ticker: "005380",
        name: "현대차",
        market: "KS",
        buyPrice: 612000,
        targetPrice: 730000,
        currentPrice: 743000,
        changeRate: 2.77,
        reason: "주주환원 확대와 북미 믹스 개선으로 밸류에이션 재평가가 이어졌습니다.",
        category: "완성차",
        status: "completed",
        isPremium: false,
        createdAt: daysAgo(34),
        closedAt: daysAgo(4),
        closedPrice: 723000,
        upVotes: 61,
        downVotes: 14
      }
    ],
    marketFeatures: [
      {
        id: "feat_001",
        ticker: "042700",
        name: "한미반도체",
        market: "KS",
        group: "ai_capture",
        pattern: "거래대금 급증",
        title: "HBM 장비주 거래대금 상위",
        reason: "20일 평균 대비 거래대금과 외국인 매수 강도가 동시에 확대됐습니다.",
        price: 290000,
        changeRate: 2.84,
        score: 91,
        tradingValue: 348000000000,
        volumeRatio: 3.2,
        sourceDate: daysAgo(0),
        createdAt: daysAgo(0)
      },
      {
        id: "feat_002",
        ticker: "086520",
        name: "에코프로",
        market: "KQ",
        group: "surge",
        pattern: "급등",
        title: "2차전지 반등 시도",
        reason: "낙폭 과대 구간에서 거래량이 회복되며 단기 추세 전환 후보로 포착됐습니다.",
        price: 132300,
        changeRate: -4.82,
        score: 84,
        tradingValue: 201000000000,
        volumeRatio: 2.7,
        sourceDate: daysAgo(0),
        createdAt: daysAgo(0)
      },
      {
        id: "feat_003",
        ticker: "TSLA",
        name: "Tesla",
        market: "US",
        group: "global",
        pattern: "뉴스 모멘텀",
        title: "미국 전기차 변동성 확대",
        reason: "로보택시 기대와 마진 우려가 동시에 반영되며 변동성이 커졌습니다.",
        price: 435.79,
        changeRate: -0.92,
        score: 63,
        tradingValue: 0,
        volumeRatio: 1.4,
        sourceDate: daysAgo(0),
        createdAt: daysAgo(0)
      }
    ],
    announcements: [
      {
        id: "notice_001",
        title: "우기의 주식 웹 개편 안내",
        body: "웹 브라우저에서 AI포착, 관심종목, 매매일지, 커뮤니티 흐름을 한 화면에서 볼 수 있도록 재구성했습니다.",
        isPinned: true,
        createdAt: daysAgo(0)
      },
      {
        id: "notice_002",
        title: "AI 분석 즉시 사용",
        body: "웹앱에서는 대기 화면 없이 AI 분석 캐시 조회와 재분석 진입을 사용할 수 있습니다.",
        isPinned: false,
        createdAt: daysAgo(2)
      }
    ],
    posts: [
      {
        id: "post_001",
        uid: "demo",
        nickname: "우기",
        title: "오늘 반도체 수급은 장 초반보다 마감이 더 중요해 보입니다",
        content: "거래대금은 유지되고 있는데 선물 방향이 흔들립니다. 종목별로는 HBM 장비 쪽이 상대적으로 강합니다.",
        likes: 18,
        createdAt: daysAgo(0),
        imageUrls: [],
        authorLevel: 12
      },
      {
        id: "post_002",
        uid: "demo2",
        nickname: "수급러",
        title: "자동차주는 배당보다 환율 민감도를 같이 봐야겠네요",
        content: "원화 약세가 단기 실적에는 우호적이지만 미국 판매 믹스가 꺾이는지 확인이 필요합니다.",
        likes: 9,
        createdAt: daysAgo(1),
        imageUrls: [],
        authorLevel: 7
      }
    ],
    postComments: {
      post_001: [
        {
          id: "pc_001",
          uid: "demo2",
          nickname: "수급러",
          content: "장비주 거래대금 유지되면 내일도 체크해볼 만하겠네요.",
          createdAt: daysAgo(0)
        }
      ]
    },
    journalComments: {
      journal_001: [
        {
          id: "jc_001",
          uid: "demo2",
          nickname: "수급러",
          content: "공개 일지로 보니 진입 근거가 더 선명하네요.",
          createdAt: daysAgo(0)
        }
      ]
    },
    reports: [],
    pickComments: {
      pick_samsung: [
        {
          id: "c_001",
          uid: "demo",
          nickname: "우기",
          content: "분기 실적 발표 전까지 20일선 지지 여부가 핵심입니다.",
          createdAt: daysAgo(1)
        }
      ]
    },
    journals: [
      {
        id: "journal_001",
        uid: "demo",
        nickname: "우기",
        stockName: "삼성전자",
        ticker: "005930",
        market: "KS",
        action: "매수",
        price: 73500,
        quantity: 5,
        tradeDate: today,
        note: "HBM 뉴스 이후 눌림 구간 분할 진입",
        isPublic: true,
        likes: 5,
        createdAt: daysAgo(0),
        publishedAt: daysAgo(0),
        buyPrice: 0,
        linkedBuyId: ""
      },
      {
        id: "journal_002",
        uid: "demo",
        nickname: "우기",
        stockName: "현대차",
        ticker: "005380",
        market: "KS",
        action: "매도",
        price: 236000,
        quantity: 2,
        tradeDate: today,
        note: "목표가 근접으로 일부 이익 실현",
        isPublic: false,
        likes: 0,
        createdAt: daysAgo(0),
        buyPrice: 198000,
        linkedBuyId: "journal_buy_hyundai"
      }
    ],
    analyses: [
      makeLocalAnalysis(
        {
          ticker: "005930",
          name: "삼성전자",
          market: "KS",
          currentPrice: 347000,
          changeRate: 9.46,
          reason: "HBM 공급 회복과 메모리 가격 반등"
        },
        "demo",
        daysAgo(0)
      )
    ],
    marketAnalyses: [
      {
        id: "market_001",
        title: "반도체 중심의 위험 선호 회복",
        body: "코스피는 대형 반도체 수급 회복에 힘입어 제한적 상승 흐름을 보였습니다. 환율은 높은 수준이지만 외국인 선물 매수세가 하단을 지지했습니다.",
        createdAt: daysAgo(0),
        imageUrls: []
      }
    ],
    marketAnalysisComments: {
      market_001: [
        {
          id: "mac_001",
          uid: "demo",
          nickname: "우기",
          content: "외국인 선물 수급과 환율을 같이 보면 오후 변동성 판단에 도움이 됩니다.",
          createdAt: daysAgo(0)
        }
      ]
    },
    userDocs: {},
    adminUsers: [],
    aiBrief: {
      id: "latest",
      title: "AI 장전 브리프",
      summary: "반도체와 자동차가 지수 하단을 지지하는 가운데, 2차전지는 낙폭 과대 반등 후보가 늘었습니다.",
      bullets: [
        "KOSPI는 대형주 수급 회복 여부가 장중 핵심입니다.",
        "AI 반도체 장비주는 거래대금이 유지되는 종목 중심으로 선별이 필요합니다.",
        "환율과 미국 선물 방향이 오후 변동성을 키울 수 있습니다."
      ],
      createdAt: daysAgo(0)
    },
    market: {
      indices: [
        { id: "KOSPI", name: "KOSPI", ticker: "^KS11", market: "US", value: 8849.25, changeRate: 4.4 },
        { id: "KOSDAQ", name: "KOSDAQ", ticker: "^KQ11", market: "US", value: 1052.68, changeRate: -2.06 },
        { id: "S&P500", name: "S&P 500", ticker: "^GSPC", market: "US", value: 7580.1, changeRate: 0.01 },
        { id: "NASDAQ", name: "NASDAQ", ticker: "^IXIC", market: "US", value: 26972.62, changeRate: 0.2 },
        { id: "USD/KRW", name: "USD/KRW", ticker: "KRW=X", market: "US", value: 1503.13, changeRate: 0.52 },
        { id: "NASDAQ100_FUTURES", name: "NASDAQ100 선물", ticker: "NQ=F", market: "US", value: 30388.25, changeRate: 0.19 },
        { id: "WTI", name: "WTI", ticker: "CL=F", market: "US", value: 87.36, changeRate: -1.34 }
      ],
      sentiment: {
        score: 64,
        label: "중립 우위",
        foreignFlow: 1840,
        institutionFlow: -620,
        futuresBasis: 0.31,
        source: "로컬 seed",
        indicators: []
      },
      investorFlow: {
        date: today,
        kospi: { foreign: 1840, institution: -620, retail: -1220 },
        kosdaq: { foreign: 420, institution: 95, retail: -510 }
      },
      fmkorea: {
        score: 72,
        label: "관심 확산",
        source: "로컬 seed",
        latestCount: 497,
        updatedAt: now,
        realtimeDate: today,
        realtimeMode: "seed",
        series: [
          { date: daysAgo(6).slice(0, 10), count: 278 },
          { date: daysAgo(5).slice(0, 10), count: 319 },
          { date: daysAgo(4).slice(0, 10), count: 301 },
          { date: daysAgo(3).slice(0, 10), count: 366 },
          { date: daysAgo(2).slice(0, 10), count: 421 },
          { date: daysAgo(1).slice(0, 10), count: 452 },
          { date: today, count: 497 }
        ],
        hot: [
          { ticker: "005930", name: "삼성전자", market: "KS", count: 248, postCount: 96, change: 18 },
          { ticker: "042700", name: "한미반도체", market: "KS", count: 131, postCount: 44, change: 46 },
          { ticker: "086520", name: "에코프로", market: "KQ", count: 118, postCount: 39, change: 34 }
        ]
      },
      nightFutures: {
        name: "KOSPI200 야간선물",
        symbol: "",
        source: "KIS OpenAPI",
        configured: false,
        available: false,
        mode: "not-configured",
        message: "KIS_APP_KEY/KIS_APP_SECRET 미설정",
        session: { label: "18:00~05:00 KST", active: false, date: today },
        price: null,
        change: null,
        changeRate: null,
        previousClose: null,
        updatedAt: "",
        history: []
      },
      marketSectors: {
        source: "로컬 스냅샷",
        updatedAt: "",
        basis: "업종별 시세 · ETF/ETN 제외",
        sectors: { up: [], down: [] },
        breadth: {
          kospi: { up: 0, down: 0, flat: 0, excludes: "ETF/ETN 제외" },
          kosdaq: { up: 0, down: 0, flat: 0, excludes: "ETF/ETN 제외" }
        }
      }
    }
  };
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fmtDate(value) {
  if (!value) return "";
  const normalized = typeof value === "number" && value > 0 && value < 1_000_000_000_000 ? value * 1000 : value;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(d);
}

function fmtDateTime(value) {
  if (!value) return "";
  const normalized = typeof value === "number" && value > 0 && value < 1_000_000_000_000 ? value * 1000 : value;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

function fmtNum(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

function fmtMoney(value, market = "KS") {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  if (market === "US") return `$${fmtNum(n, n < 100 ? 2 : 1)}`;
  return `${fmtNum(n, 0)}원`;
}

function fmtPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${n > 0 ? "+" : ""}${fmtNum(n, 2)}%`;
}

function changeClass(value) {
  const n = Number(value);
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "muted";
}

function stockKey(stock) {
  return `${(stock.market || "KS").toUpperCase()}_${String(stock.ticker || "").toUpperCase()}`;
}

function dataSourceLabel(item, fallback = "FALLBACK") {
  return item?.source ? item.source : fallback;
}

function dataSourceStamp(item, fallback = "임시 스냅샷") {
  if (!item?.source) return fallback;
  const at = fmtDateTime(item.marketTime);
  return at ? `${item.source} · ${at}` : item.source;
}

function dataSourceBadge(item, fallback = "FALLBACK") {
  const live = Boolean(item?.source);
  const label = fallback === "SNAPSHOT" || fallback === "FALLBACK" ? "스냅샷" : fallback;
  return `<span class="badge ${live ? "good" : ""}">${live ? "LIVE" : escapeHtml(label)}</span>`;
}

function pickReturn(pick, price = pick.currentPrice) {
  const base = Number(pick.buyPrice);
  const now = Number(price);
  if (!base || !Number.isFinite(now)) return 0;
  return ((now - base) / base) * 100;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

async function hashPassword(value) {
  const raw = String(value);
  if (crypto?.subtle) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(unescape(encodeURIComponent(raw)));
}

async function initFirebase() {
  const cfg = window.WOOGI_FIREBASE_CONFIG || readJson("WOOGI_FIREBASE_CONFIG");
  if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.appId) {
    state.firebase.status = "Firebase 미연결 · 로컬 저장소";
    return;
  }
  try {
    const [appMod, authMod, firestoreMod, functionsMod, storageMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js")
    ]);
    const firebaseApp = appMod.initializeApp(cfg);
    state.firebase = {
      enabled: true,
      status: "Firebase 연결됨",
      modules: { appMod, authMod, firestoreMod, functionsMod, storageMod },
      app: firebaseApp,
      auth: authMod.getAuth(firebaseApp),
      db: firestoreMod.getFirestore(firebaseApp),
      functions: functionsMod.getFunctions(firebaseApp, window.WOOGI_FIREBASE_REGION || "asia-northeast3"),
      storage: cfg.storageBucket ? storageMod.getStorage(firebaseApp) : null
    };
    authMod.onAuthStateChanged(state.firebase.auth, async (fbUser) => {
      if (!fbUser) {
        if (state.user?.provider === "firebase") saveSession(null);
        render();
        return;
      }
      const user = {
        uid: fbUser.uid,
        email: fbUser.email || "",
        nickname: fbUser.displayName || (fbUser.email || "사용자").split("@")[0],
        provider: "firebase",
        isAdmin: await firebaseUserIsAdmin(fbUser)
      };
      saveSession(user);
      ensureUserDoc();
      await loadRemoteUserData();
      await recordDailyAttendance();
      render();
    });
  } catch (error) {
    console.warn("Firebase init failed", error);
    state.firebase.status = "Firebase 연결 실패 · 로컬 저장소";
  }
}

function cleanFirestoreValue(value) {
  if (value == null) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  if (Array.isArray(value)) return value.map(cleanFirestoreValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanFirestoreValue(v)]));
  }
  return value;
}

async function fsCollection(path, options = {}) {
  const fb = state.firebase;
  if (!fb.enabled) return [];
  const f = fb.modules.firestoreMod;
  const ref = f.collection(fb.db, ...path.split("/"));
  let q = ref;
  try {
    const parts = [];
    if (options.where) {
      for (const item of options.where) parts.push(f.where(item[0], item[1], item[2]));
    }
    if (options.orderBy) parts.push(f.orderBy(options.orderBy, options.desc === false ? "asc" : "desc"));
    if (options.limit) parts.push(f.limit(options.limit));
    q = parts.length ? f.query(ref, ...parts) : ref;
    const snap = await f.getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...cleanFirestoreValue(doc.data()) }));
  } catch (error) {
    console.warn("Firestore collection read failed", path, error);
    return [];
  }
}

async function fsDoc(path) {
  const fb = state.firebase;
  if (!fb.enabled) return null;
  const f = fb.modules.firestoreMod;
  try {
    const snap = await f.getDoc(f.doc(fb.db, ...path.split("/")));
    return snap.exists() ? { id: snap.id, ...cleanFirestoreValue(snap.data()) } : null;
  } catch (error) {
    console.warn("Firestore doc read failed", path, error);
    return null;
  }
}

async function loadRemoteData() {
  if (!state.firebase.enabled) return;
  state.firebase.status = "Firebase 동기화 중";
  const [picks, features, notices, posts, marketAnalyses, aiBrief, publicJournals, reports, adminUsers, investorFlow, fmkoreaRealtime, fmkoreaIndex, nightFuturesPrices, userDoc] = await Promise.all([
    fsCollection("stock_picks", { orderBy: "createdAt", limit: 200 }),
    fsCollection("market_feature_stocks", { orderBy: "sourceDate", limit: 200 }),
    fsCollection("announcements", { orderBy: "createdAt", limit: 80 }),
    fsCollection("posts", { orderBy: "createdAt", limit: 80 }),
    fsCollection("market_analyses", { orderBy: "createdAt", limit: 80 }),
    fsDoc("ai_briefs/latest"),
    fsCollection("trading_journal", {
      where: [["isPublic", "==", true]],
      orderBy: "createdAt",
      limit: 80
    }),
    isAdmin() ? fsCollection("reports", { orderBy: "createdAt", limit: 200 }) : Promise.resolve([]),
    isAdmin() ? fsCollection("users", { orderBy: "createdAt", limit: 200 }) : Promise.resolve([]),
    fsCollection("market_investor_flow", { orderBy: "marketDate", limit: 1 }),
    fsDoc("fmkorea_stock_mentions_realtime/today"),
    fsCollection("fmkorea_index", { orderBy: "updatedAt", limit: 45 }),
    fsCollection("night_futures_prices", { orderBy: "timestamp", limit: 300 }),
    state.user ? fsDoc(`users/${state.user.uid}`) : null
  ]);
  const normalizedPicks = picks.map(normalizePick);
  const normalizedPosts = posts.map(normalizePost);
  if (normalizedPicks.length) state.data.stockPicks = mergeRemotePicksWithFallbackCompleted(normalizedPicks);
  if (features.length) state.data.marketFeatures = features.map(normalizeFeature);
  if (notices.length) state.data.announcements = notices.map(normalizeNotice);
  if (normalizedPosts.length) state.data.posts = normalizedPosts;
  const normalizedMarketAnalyses = marketAnalyses.map(normalizeMarketAnalysis);
  if (normalizedMarketAnalyses.length) state.data.marketAnalyses = normalizedMarketAnalyses;
  if (aiBrief) state.data.aiBrief = normalizeAiBrief(aiBrief);
  if (reports.length) state.data.reports = reports.map(normalizeReport);
  if (adminUsers.length) state.data.adminUsers = adminUsers.map(normalizeAdminUser);
  applyRemoteMarketData({
    investorFlow,
    fmkoreaRealtime,
    fmkoreaIndex,
    nightFutures: nightFuturesFromFirestore(nightFuturesPrices)
  });
  if (publicJournals.length) {
    const journals = publicJournals.map(normalizeJournal);
    const ids = new Set(journals.map((journal) => journal.id));
    state.data.journals = [...journals, ...state.data.journals.filter((journal) => !ids.has(journal.id))];
    await loadRemoteJournalComments(journals);
  }
  if (userDoc && state.user) state.data.userDocs[state.user.uid] = { ...ensureUserDoc(false), ...userDoc };
  await Promise.all([
    loadRemotePostComments(normalizedPosts),
    loadRemotePickComments(normalizedPicks),
    loadRemoteMarketAnalysisComments(normalizedMarketAnalyses)
  ]);
  await loadRemoteUserData();
  state.firebase.status = "Firebase 연결됨";
  saveData();
}

async function loadRemotePostComments(posts) {
  if (!state.firebase.enabled || !posts.length) return;
  const entries = await Promise.all(
    posts.slice(0, 40).map(async (post) => [post.id, await fsCollection(`posts/${post.id}/comments`, {
      orderBy: "createdAt",
      desc: false,
      limit: 80
    })])
  );
  entries.forEach(([postId, comments]) => {
    if (comments.length) state.data.postComments[postId] = comments.map(normalizeComment);
  });
}

async function loadRemotePickComments(picks) {
  if (!state.firebase.enabled || !picks.length) return;
  const entries = await Promise.all(
    picks.slice(0, 40).map(async (pick) => [pick.id, await fsCollection(`stock_picks/${pick.id}/comments`, {
      orderBy: "createdAt",
      desc: false,
      limit: 80
    })])
  );
  entries.forEach(([pickId, comments]) => {
    if (comments.length) state.data.pickComments[pickId] = comments.map(normalizeComment);
  });
}

async function loadRemoteJournalComments(journals) {
  if (!state.firebase.enabled || !journals.length) return;
  const entries = await Promise.all(
    journals.slice(0, 40).map(async (journal) => [journal.id, await fsCollection(`trading_journal/${journal.id}/comments`, {
      orderBy: "createdAt",
      desc: false,
      limit: 80
    })])
  );
  entries.forEach(([journalId, comments]) => {
    if (comments.length) state.data.journalComments[journalId] = comments.map(normalizeComment);
  });
}

async function loadRemoteMarketAnalysisComments(items) {
  if (!state.firebase.enabled || !items.length) return;
  const entries = await Promise.all(
    items.slice(0, 40).map(async (item) => [item.id, await fsCollection(`market_analyses/${item.id}/comments`, {
      orderBy: "createdAt",
      desc: false,
      limit: 80
    })])
  );
  entries.forEach(([id, comments]) => {
    if (comments.length) state.data.marketAnalysisComments[id] = comments.map(normalizeComment);
  });
}

async function loadRemoteUserData() {
  if (!state.firebase.enabled || !state.user) return;
  const uidValue = state.user.uid;
  const [userDoc, analyses, journals, memos, reports, blockedUsers, postAuthorFollows] = await Promise.all([
    fsDoc(`users/${uidValue}`),
    fsCollection(`users/${state.user.uid}/stock_ai_analyses`, {
      orderBy: "updatedAt",
      limit: 200
    }),
    fsCollection("trading_journal", {
      where: [["uid", "==", state.user.uid]],
      orderBy: "createdAt",
      limit: 200
    }),
    fsCollection(`users/${state.user.uid}/memos`, { limit: 500 }),
    isAdmin() ? fsCollection("reports", { orderBy: "createdAt", limit: 200 }) : Promise.resolve([]),
    fsCollection(`users/${state.user.uid}/blockedUsers`, { limit: 500 }),
    fsCollection(`users/${state.user.uid}/post_author_follows`, { limit: 500 })
  ]);
  const localDoc = ensureUserDoc(true);
  const remoteBlockedUsers = Object.fromEntries(blockedUsers.map((item) => [item.id, { createdAt: item.createdAt || new Date().toISOString() }]));
  const remoteFollows = Object.fromEntries(postAuthorFollows.map((item) => [item.id, {
    targetUid: item.targetUid || item.id,
    enabled: item.enabled !== false,
    updatedAt: item.updatedAt || new Date().toISOString()
  }]));
  if (userDoc) {
    state.data.userDocs[uidValue] = {
      ...localDoc,
      ...userDoc,
      favorites: userDoc.favorites || localDoc.favorites || [],
      favoriteStocks: { ...(localDoc.favoriteStocks || {}), ...(userDoc.favoriteStocks || {}) },
      favoriteStockIds: userDoc.favoriteStockIds || localDoc.favoriteStockIds || [],
      memos: { ...(localDoc.memos || {}), ...(userDoc.memos || {}) },
      blockedUsers: { ...(localDoc.blockedUsers || {}), ...remoteBlockedUsers },
      postAuthorFollows: { ...(localDoc.postAuthorFollows || {}), ...remoteFollows }
    };
  } else {
    localDoc.blockedUsers = { ...(localDoc.blockedUsers || {}), ...remoteBlockedUsers };
    localDoc.postAuthorFollows = { ...(localDoc.postAuthorFollows || {}), ...remoteFollows };
  }
  if (analyses.length) {
    state.data.analyses = state.data.analyses.filter((item) => item.uid !== uidValue);
    state.data.analyses.push(...analyses.map((item) => ({ ...item, uid: uidValue, analysisId: item.id })));
  }
  if (journals.length) {
    state.data.journals = state.data.journals.filter((item) => item.uid !== uidValue);
    state.data.journals.push(...journals.map(normalizeJournal));
  }
  if (memos.length) {
    const doc = ensureUserDoc(false);
    doc.memos = Object.fromEntries(memos.map((memo) => [memo.id, memo.text || ""]));
  }
  if (isAdmin()) state.data.reports = reports.map(normalizeReport);
  saveData();
}

function normalizePick(item) {
  return {
    id: item.id || uid("pick"),
    ticker: item.ticker || "",
    name: item.name || item.ticker || "",
    market: item.market || "KS",
    buyPrice: Number(item.buyPrice || 0),
    targetPrice: Number(item.targetPrice || 0),
    currentPrice: Number(item.currentPrice || item.price || 0),
    changeRate: Number(item.changeRate || 0),
    reason: item.reason || "",
    category: item.category || "일반",
    status: item.status || "active",
    isPremium: Boolean(item.isPremium),
    createdAt: item.createdAt || new Date().toISOString(),
    closedAt: item.closedAt || null,
    closedPrice: Number(item.closedPrice || 0),
    upVotes: Number(item.upVotes || 0),
    downVotes: Number(item.downVotes || 0),
    earningsDate: item.earningsDate || null,
    marketTime: item.marketTime || null,
    source: item.source || "",
    factors: item.factors || {},
    tradePlan: item.tradePlan || {},
    decision: item.decision || {}
  };
}

function mergeRemotePicksWithFallbackCompleted(remotePicks) {
  const remoteKeys = new Set(remotePicks.flatMap((pick) => [pick.id, stockKey(pick)]));
  const fallbackCompleted = makeSeedData().stockPicks
    .map(normalizePick)
    .filter((pick) => pick.status === "completed" && !remoteKeys.has(pick.id) && !remoteKeys.has(stockKey(pick)));
  return [...remotePicks, ...fallbackCompleted];
}

function normalizeFeature(item) {
  return {
    id: item.id || uid("feat"),
    ticker: item.ticker || "",
    name: item.name || item.ticker || "",
    market: item.market || "KS",
    group: item.group || "ai_capture",
    pattern: item.pattern || "",
    title: item.title || item.pattern || "특징주",
    reason: item.reason || "",
    price: Number(item.price || 0),
    changeRate: Number(item.changeRate || 0),
    score: Number(item.score || 0),
    tradingValue: Number(item.tradingValue || 0),
    volumeRatio: Number(item.volumeRatio || 0),
    sourceDate: item.sourceDate || new Date().toISOString(),
    createdAt: item.createdAt || new Date().toISOString(),
    currentPrice: Number(item.currentPrice || item.price || 0),
    marketTime: item.marketTime || null,
    source: item.source || "",
    factors: item.factors || {},
    tradePlan: item.tradePlan || {},
    decision: item.decision || {}
  };
}

function normalizeNotice(item) {
  return {
    id: item.id || uid("notice"),
    title: item.title || "",
    body: item.body || "",
    isPinned: Boolean(item.isPinned),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || null
  };
}

function normalizePost(item) {
  return {
    id: item.id || uid("post"),
    uid: item.uid || "",
    nickname: item.nickname || "익명",
    title: item.title || "",
    content: item.content || "",
    likes: Number(item.likes || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
    authorLevel: Number(item.authorLevel || 1)
  };
}

function normalizeMarketAnalysis(item) {
  return {
    id: item.id || uid("market"),
    title: item.title || "",
    body: item.body || "",
    createdAt: item.createdAt || new Date().toISOString(),
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : []
  };
}

function normalizeJournal(item) {
  return {
    id: item.id || uid("journal"),
    uid: item.uid || "",
    nickname: item.nickname || "익명",
    stockName: item.stockName || "",
    ticker: String(item.ticker || "").toUpperCase(),
    market: item.market || "KS",
    action: item.action || "매수",
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    tradeDate: item.tradeDate || new Date().toISOString().slice(0, 10),
    note: item.note || "",
    isPublic: Boolean(item.isPublic),
    likes: Number(item.likes || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    publishedAt: item.publishedAt || null,
    buyPrice: Number(item.buyPrice || 0),
    linkedBuyId: item.linkedBuyId || ""
  };
}

function normalizeComment(item) {
  return {
    id: item.id || uid("comment"),
    uid: item.uid || "",
    nickname: item.nickname || "익명",
    content: item.content || item.text || "",
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function normalizeReport(item) {
  return {
    id: item.id || uid("report"),
    target: item.target || [item.contentType, item.contentId].filter(Boolean).join(":"),
    reporterUid: item.reporterUid || "anonymous",
    reason: item.reason || "",
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function normalizeAdminUser(item) {
  const postCount = Number(item.postCount || 0);
  const commentCount = Number(item.commentCount || 0);
  const attendanceCount = Number(item.attendanceCount || 0);
  const bonusXp = Number(item.bonusXp || 0);
  const progress = levelProgress({ postCount, commentCount, attendanceCount, bonusXp });
  return {
    uid: item.uid || item.id || "",
    email: item.email || "",
    nickname: item.nickname || item.displayName || item.email?.split("@")[0] || "",
    provider: item.provider || "firebase",
    isAdmin: Boolean(item.isAdmin || ADMIN_UIDS.has(item.uid || item.id || "")),
    createdAt: item.createdAt || null,
    lastActiveAt: item.lastActiveAt || null,
    level: Number(item.level || progress.level),
    postCount,
    journalCount: Number(item.journalCount || 0),
    commentCount,
    attendanceCount,
    bonusXp,
    favoriteCount: Number(item.favoriteCount || Object.keys(item.favoriteStocks || {}).length || 0),
    blockedCount: Number(item.blockedCount || Object.keys(item.blockedUsers || {}).length || 0),
    reportCount: Number(item.reportCount || 0),
    memoCount: Number(item.memoCount || Object.keys(item.memos || {}).length || 0)
  };
}

function applyRemoteMarketData({ investorFlow = [], fmkoreaRealtime = null, fmkoreaIndex = [], marketSectors = null, nightFutures = null }) {
  const flow = investorFlow[0];
  if (flow) {
    state.data.market.investorFlow = {
      ...state.data.market.investorFlow,
      date: flow.marketDate || state.data.market.investorFlow.date,
      source: flow.source || "Firestore",
      top5: {
        kospi: {
          foreign: normalizeInvestorFlowItems(flow.kospi?.foreignTop5),
          institution: normalizeInvestorFlowItems(flow.kospi?.institutionTop5)
        },
        kosdaq: {
          foreign: normalizeInvestorFlowItems(flow.kosdaq?.foreignTop5),
          institution: normalizeInvestorFlowItems(flow.kosdaq?.institutionTop5)
        }
      }
    };
  }

  const realtimeMentions = Array.isArray(fmkoreaRealtime?.topMentions) ? fmkoreaRealtime.topMentions : [];
  if (fmkoreaRealtime) {
    state.data.market.fmkorea = {
      ...state.data.market.fmkorea,
      source: fmkoreaRealtime.source || state.data.market.fmkorea.source || "Firestore",
      updatedAt: fmkoreaRealtime.updatedAt || state.data.market.fmkorea.updatedAt || "",
      realtimeDate: fmkoreaRealtime.dateKey || state.data.market.fmkorea.realtimeDate || "",
      realtimeMode: fmkoreaRealtime.mode || state.data.market.fmkorea.realtimeMode || ""
    };
  }
  if (realtimeMentions.length) {
    const hot = realtimeMentions.slice(0, 8).map((item) => ({
      ticker: item.ticker || "",
      name: item.name || item.ticker || "",
      market: item.market || "KS",
      count: Number(item.mentionCount || 0),
      postCount: Number(item.postCount || 0)
    }));
    state.data.market.fmkorea = {
      ...state.data.market.fmkorea,
      hot,
      realtimeDate: fmkoreaRealtime.dateKey || "",
      realtimeMode: fmkoreaRealtime.mode || ""
    };
    registerFmkoreaHotStocks(hot);
  }

  if (fmkoreaIndex.length) {
    const series = fmkoreaIndex
      .map((item) => ({ date: item.date || item.id, count: Number(item.count || 0) }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const latest = series.at(-1);
    const peak = Math.max(1, ...series.map((item) => item.count));
    state.data.market.fmkorea = {
      ...state.data.market.fmkorea,
      score: Number.isFinite(Number(fmkoreaRealtime?.score)) ? Number(fmkoreaRealtime.score) : Math.round((latest.count / peak) * 100),
      label: fmkoreaRealtime?.label || `${fmtNum(latest.count)}글 · 일별 집계`,
      latestCount: Number(fmkoreaRealtime?.latestCount ?? latest.count),
      series
    };
  }

  if (marketSectors) {
    state.data.market.marketSectors = {
      ...state.data.market.marketSectors,
      ...marketSectors,
      sectors: {
        ...state.data.market.marketSectors.sectors,
        ...(marketSectors.sectors || {})
      },
      breadth: {
        ...state.data.market.marketSectors.breadth,
        ...(marketSectors.breadth || {}),
        kospi: {
          ...state.data.market.marketSectors.breadth.kospi,
          ...(marketSectors.breadth?.kospi || {})
        },
        kosdaq: {
          ...state.data.market.marketSectors.breadth.kosdaq,
          ...(marketSectors.breadth?.kosdaq || {})
        }
      }
    };
  }
  if (nightFutures) {
    state.data.market.nightFutures = normalizeNightFutures({
      ...state.data.market.nightFutures,
      ...nightFutures
    });
  }
}

function registerFmkoreaHotStocks(items = []) {
  for (const item of items) {
    if (!item.ticker) continue;
    const market = item.market || "KS";
    const key = `${market}_${item.ticker}`;
    if (getStockByKey(key)) continue;
    state.discoveredStocks.set(key, normalizeStockLike({
      id: key,
      ticker: item.ticker,
      name: item.name || item.ticker,
      market,
      reason: "펨코 HOT 종목에서 선택한 종목입니다.",
      category: "펨코 HOT"
    }));
  }
}

function normalizeInvestorFlowItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    rank: Number(item.rank || 0),
    ticker: item.ticker || item.code || "",
    name: item.name || item.ticker || item.code || "",
    quantity: Number(item.quantity || 0),
    amount: Number(item.amount || 0),
    volume: Number(item.volume || 0),
    quantityText: item.quantityText || "",
    amountText: item.amountText || "",
    volumeText: item.volumeText || ""
  }));
}

function normalizeFavoriteCollections(doc = {}) {
  const favoriteStocks = Object.fromEntries(
    Object.entries(doc.favoriteStocks || {})
      .map(([key, stock]) => {
        const normalizedStock = {
          ticker: String(stock?.ticker || "").trim().toUpperCase(),
          name: String(stock?.name || stock?.ticker || key).trim(),
          market: String(stock?.market || key.split("_")[0] || "KS").toUpperCase(),
          addedAt: stock?.addedAt || new Date().toISOString()
        };
        return [stockKey(normalizedStock), normalizedStock];
      })
      .filter(([key, stock]) => key && stock.ticker)
  );
  const favoriteStockIds = [...new Set([
    ...(Array.isArray(doc.favoriteStockIds) ? doc.favoriteStockIds : []),
    ...Object.keys(favoriteStocks)
  ])].filter((id) => favoriteStocks[id]);
  const stockKeyPattern = /^[A-Z]{2,3}_[A-Z0-9.=^-]+$/;
  const favorites = [
    ...new Set(Array.isArray(doc.favorites) ? doc.favorites : [])
  ].filter((id) => id && !stockKeyPattern.test(id) && !favoriteStocks[id]);
  return { favorites, favoriteStocks, favoriteStockIds };
}

function normalizeUserDoc(doc = {}) {
  const favorites = normalizeFavoriteCollections(doc);
  return {
    ...doc,
    ...favorites,
    memos: doc.memos || {},
    likedPosts: doc.likedPosts || {},
    likedJournals: doc.likedJournals || {},
    blockedUsers: doc.blockedUsers || {},
    postAuthorFollows: doc.postAuthorFollows || {},
    postCount: Number(doc.postCount || 0),
    commentCount: Number(doc.commentCount || 0),
    attendanceCount: Number(doc.attendanceCount || 0),
    lastAttendanceDate: doc.lastAttendanceDate || "",
    bonusXp: Number(doc.bonusXp || 0),
    level: Number(doc.level || 1)
  };
}

function ensureUserDoc(create = true) {
  if (!state.user) return null;
  if (!state.data.userDocs[state.user.uid] && create) {
    state.data.userDocs[state.user.uid] = normalizeUserDoc({
      nickname: state.user.nickname,
      favorites: [],
      favoriteStocks: {},
      favoriteStockIds: [],
      memos: {},
      likedPosts: {},
      likedJournals: {},
      blockedUsers: {},
      postAuthorFollows: {},
      postCount: 0,
      commentCount: 0,
      attendanceCount: 0,
      lastAttendanceDate: "",
      bonusXp: 0,
      level: 1,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    });
    saveData();
  }
  if (state.data.userDocs[state.user.uid]) {
    const before = JSON.stringify(state.data.userDocs[state.user.uid]);
    state.data.userDocs[state.user.uid] = normalizeUserDoc(state.data.userDocs[state.user.uid]);
    if (before !== JSON.stringify(state.data.userDocs[state.user.uid])) {
      saveData();
      if (state.user.provider === "firebase") {
        queueMicrotask(() => syncFavoritePickFirestore(state.data.userDocs[state.user.uid]?.favorites || []));
      }
    }
  }
  return state.data.userDocs[state.user.uid] || null;
}

function getUserDoc() {
  return ensureUserDoc(true);
}

function isAdmin() {
  return Boolean(state.user?.isAdmin);
}

async function syncUserDocFirestore(payload) {
  if (!state.firebase.enabled || !state.user || state.user.provider !== "firebase") return;
  const f = state.firebase.modules.firestoreMod;
  try {
    const doc = getUserDoc();
    const activityFields = ["postCount", "commentCount", "attendanceCount", "bonusXp"];
    const nextPayload = { ...payload };
    if (doc && activityFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))) {
      nextPayload.level = levelProgress(doc).level;
    }
    await f.setDoc(f.doc(state.firebase.db, "users", state.user.uid), {
      ...nextPayload,
      lastActiveAt: f.serverTimestamp()
    }, { merge: true });
    await syncPublicUserDocFirestore(nextPayload);
  } catch (error) {
    console.warn("user doc write failed", error);
    toast("Firebase 쓰기 권한 또는 설정을 확인해주세요.");
  }
}

async function syncPublicUserDocFirestore(payload = {}) {
  if (!firestoreReady() || !state.user) return;
  const publicFields = ["nickname", "postCount", "commentCount", "attendanceCount", "bonusXp", "level", "lastAttendanceDate"];
  if (!publicFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))) return;
  const f = state.firebase.modules.firestoreMod;
  const doc = getUserDoc();
  if (!doc) return;
  const progress = levelProgress(doc);
  await f.setDoc(f.doc(state.firebase.db, "user_public", state.user.uid), {
    uid: state.user.uid,
    nickname: doc.nickname || state.user.nickname || "",
    level: progress.level,
    postCount: Number(doc.postCount || 0),
    commentCount: Number(doc.commentCount || 0),
    attendanceCount: Number(doc.attendanceCount || 0),
    bonusXp: Number(doc.bonusXp || 0),
    lastAttendanceDate: doc.lastAttendanceDate || "",
    updatedAt: f.serverTimestamp()
  }, { merge: true });
}

async function recordDailyAttendance() {
  if (!state.user) return;
  const doc = getUserDoc();
  if (!doc) return;
  const todayKey = kstDayKey();
  const now = new Date().toISOString();
  doc.lastActiveAt = now;
  if (doc.lastAttendanceDate !== todayKey) {
    doc.attendanceCount = Number(doc.attendanceCount || 0) + 1;
    doc.lastAttendanceDate = todayKey;
  }
  doc.level = levelProgress(doc).level;
  saveData();
  await syncUserDocFirestore({
    attendanceCount: doc.attendanceCount,
    lastAttendanceDate: doc.lastAttendanceDate,
    level: doc.level
  });
}

function firestoreReady() {
  return Boolean(state.firebase.enabled && state.firebase.db && state.firebase.modules?.firestoreMod);
}

function canWriteFirestore() {
  return Boolean(firestoreReady() && state.user?.provider === "firebase");
}

function storageReady() {
  return Boolean(state.firebase.enabled && state.firebase.storage && state.firebase.modules?.storageMod && state.user?.provider === "firebase");
}

function toTimestamp(value) {
  const f = state.firebase.modules.firestoreMod;
  if (!value) return f.Timestamp.fromDate(new Date());
  if (typeof value?.toDate === "function") return value;
  const date = value instanceof Date ? value : new Date(value);
  return f.Timestamp.fromDate(Number.isNaN(date.getTime()) ? new Date() : date);
}

function cleanForFirestore(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(cleanForFirestore).filter((item) => item !== undefined);
  if (typeof value === "object" && typeof value.toDate !== "function") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, val]) => [key, cleanForFirestore(val)])
        .filter(([, val]) => val !== undefined)
    );
  }
  return value;
}

async function setFirestoreDoc(path, payload, { merge = true } = {}) {
  if (!firestoreReady()) return false;
  const f = state.firebase.modules.firestoreMod;
  try {
    await f.setDoc(f.doc(state.firebase.db, ...path.split("/")), cleanForFirestore(payload), { merge });
    return true;
  } catch (error) {
    console.warn("Firestore set failed", path, error);
    toast("Firebase 쓰기 권한 또는 설정을 확인해주세요.");
    return false;
  }
}

async function updateFirestoreDoc(path, payload) {
  if (!firestoreReady()) return false;
  const f = state.firebase.modules.firestoreMod;
  try {
    await f.updateDoc(f.doc(state.firebase.db, ...path.split("/")), cleanForFirestore(payload));
    return true;
  } catch (error) {
    console.warn("Firestore update failed", path, error);
    toast("Firebase 쓰기 권한 또는 설정을 확인해주세요.");
    return false;
  }
}

async function deleteFirestoreDoc(path) {
  if (!firestoreReady()) return false;
  const f = state.firebase.modules.firestoreMod;
  try {
    await f.deleteDoc(f.doc(state.firebase.db, ...path.split("/")));
    return true;
  } catch (error) {
    console.warn("Firestore delete failed", path, error);
    toast("Firebase 삭제 권한 또는 설정을 확인해주세요.");
    return false;
  }
}

async function toggleFirestoreLike(parentPath, likePath) {
  if (!firestoreReady()) return null;
  const f = state.firebase.modules.firestoreMod;
  const parentRef = f.doc(state.firebase.db, ...parentPath.split("/"));
  const likeRef = f.doc(state.firebase.db, ...likePath.split("/"));
  try {
    return await f.runTransaction(state.firebase.db, async (transaction) => {
      const [parentSnap, likeSnap] = await Promise.all([
        transaction.get(parentRef),
        transaction.get(likeRef)
      ]);
      if (!parentSnap.exists()) throw new Error("좋아요 대상이 존재하지 않습니다.");
      const likes = Number(parentSnap.data()?.likes || 0);
      if (!Number.isInteger(likes) || likes < 0) throw new Error("좋아요 카운터가 올바르지 않습니다.");
      if (likeSnap.exists()) {
        const nextLikes = Math.max(0, likes - 1);
        transaction.update(parentRef, { likes: nextLikes });
        transaction.delete(likeRef);
        return { liked: false, likes: nextLikes };
      }
      const nextLikes = likes + 1;
      transaction.update(parentRef, { likes: nextLikes });
      transaction.set(likeRef, {
        uid: state.user.uid,
        createdAt: toTimestamp(new Date())
      });
      return { liked: true, likes: nextLikes };
    });
  } catch (error) {
    console.warn("Firestore like transaction failed", parentPath, error);
    toast("Firebase 좋아요 권한 또는 설정을 확인해주세요.");
    return null;
  }
}

async function signUpLocal(email, password, nickname) {
  const accounts = readJson(STORE.users) || {};
  const normalized = email.trim().toLowerCase();
  if (accounts[normalized]) throw new Error("이미 가입된 이메일입니다.");
  const now = new Date().toISOString();
  const account = {
    uid: uid("local_user"),
    email: normalized,
    passwordHash: await hashPassword(password),
    nickname: nickname.trim() || normalized.split("@")[0],
    provider: "local",
    isAdmin: normalized.startsWith("admin@"),
    createdAt: now,
    lastActiveAt: now
  };
  accounts[normalized] = account;
  localStorage.setItem(STORE.users, JSON.stringify(accounts));
  const user = { uid: account.uid, email: account.email, nickname: account.nickname, provider: "local", isAdmin: account.isAdmin };
  saveSession(user);
  ensureUserDoc();
  await recordDailyAttendance();
  toast("회원가입이 완료되었습니다.");
}

async function signInLocal(email, password) {
  const accounts = readJson(STORE.users) || {};
  const normalized = email.trim().toLowerCase();
  const account = accounts[normalized];
  if (!account || account.passwordHash !== await hashPassword(password)) throw new Error("이메일 또는 비밀번호를 확인해주세요.");
  account.lastActiveAt = new Date().toISOString();
  accounts[normalized] = account;
  localStorage.setItem(STORE.users, JSON.stringify(accounts));
  saveSession({ uid: account.uid, email: account.email, nickname: account.nickname, provider: "local", isAdmin: account.isAdmin });
  const doc = ensureUserDoc();
  if (doc) {
    doc.lastActiveAt = account.lastActiveAt;
    saveData();
  }
  await recordDailyAttendance();
  toast("로그인되었습니다.");
}

async function signOut() {
  if (state.firebase.enabled && state.user?.provider === "firebase") {
    await state.firebase.modules.authMod.signOut(state.firebase.auth);
  }
  saveSession(null);
  toast("로그아웃되었습니다.");
  navigate("home");
}

function render() {
  const mobileNav = renderMobileNav();
  const sidePanelOpen = state.filters.rightPanelOpen !== false;
  app.innerHTML = `
    <div class="layout route-${escapeHtml(state.route.id)} ${sidePanelOpen ? "right-panel-open" : "right-panel-closed"}">
      <main class="main">
        <header class="topbar">
          <button class="btn icon mobile-only" data-action="route" data-route="home" aria-label="홈">⌂</button>
          <div class="mobile-brand"><img src="/assets/icon.png" alt="" />우기의 주식</div>
          <button class="desktop-brand" data-action="route" data-route="home" aria-label="우기의 주식 홈">
            <img src="/assets/icon.png" alt="" />
            <strong>우기의 주식</strong>
          </button>
          <nav class="desktop-top-nav" aria-label="주요 메뉴">
            ${renderDesktopTopNav()}
          </nav>
          <form class="global-search" data-form="global-search">
            <span class="search-symbol">⌕</span>
            <input name="q" value="${escapeHtml(state.filters.captureSearch)}" placeholder="종목명 또는 티커를 검색하세요" autocomplete="off" />
          </form>
          <div class="top-actions">
            <span class="top-sync-pill">자동 동기화</span>
            ${state.user ? `<button class="btn primary" data-action="route" data-route="profile">${escapeHtml(state.user.nickname)}</button>` : `<button class="btn primary" data-action="route" data-route="profile">로그인</button>`}
          </div>
        </header>
        <section class="content">${renderPage()}</section>
        ${mobileNav}
      </main>
      ${renderRightPanel(sidePanelOpen)}
      ${renderDesktopRail(sidePanelOpen)}
    </div>
    ${state.modal ? renderModal() : ""}
  `;
  afterRender();
}

function renderRightPanel(open) {
  if (!open) {
    return `<aside class="right-panel collapsed" aria-label="접힌 오른쪽 패널"></aside>`;
  }
  const favoriteStocks = state.user ? Object.values(getUserDoc().favoriteStocks || {}).slice(0, 5) : [];
  const picks = state.data.stockPicks.filter((pick) => pick.status === "active").slice(0, 4);
  const indices = state.data.market.indices.slice(0, 5);
  return `
    <aside class="right-panel" aria-label="오른쪽 패널">
      <div class="right-panel-head">
        <strong>관심</strong>
        <button class="link-button" data-action="route" data-route="favorites">관리</button>
      </div>
      <div class="right-panel-scroll">
        <section class="side-section">
          <div class="side-section-head"><h2>지수</h2><button class="link-button" data-action="route" data-route="markets">전체</button></div>
          <div class="side-list">
            ${indices.map((index) => `
              <button type="button" class="side-row" data-action="market-detail" data-ticker="${escapeHtml(index.ticker)}">
                <span class="side-avatar index">${escapeHtml(index.name.slice(0, 1))}</span>
                <span class="side-main"><strong>${escapeHtml(index.name)}</strong><small>${escapeHtml(index.ticker)}</small></span>
                <span class="side-value"><b class="${changeClass(index.changeRate)}">${fmtPct(index.changeRate)}</b></span>
              </button>
            `).join("")}
          </div>
        </section>
        <section class="side-section">
          <div class="side-section-head"><h2>관심</h2><button class="link-button" data-action="route" data-route="favorites">관리</button></div>
          <div class="side-list">
            ${favoriteStocks.length
              ? favoriteStocks.map((stock) => `
                <button type="button" class="side-row" data-action="open-stock" data-stock="${escapeHtml(stockKey(stock))}">
                  <span class="side-avatar">${escapeHtml((stock.name || stock.ticker || "관").slice(0, 1))}</span>
                  <span class="side-main"><strong>${escapeHtml(stock.name || stock.ticker)}</strong><small>${escapeHtml(stock.ticker || "")}</small></span>
                  <span class="side-value"><strong>${fmtMoney(stock.currentPrice || stock.price || stock.targetPrice, stock.market)}</strong><b class="${changeClass(stock.changeRate || pickReturn(stock))}">${fmtPct(stock.changeRate || pickReturn(stock))}</b></span>
                </button>
              `).join("")
              : `<button type="button" class="side-empty" data-action="route" data-route="${state.user ? "favorites" : "profile"}">${state.user ? "관심종목을 추가하세요" : "로그인 후 관심종목 사용"}</button>`}
          </div>
        </section>
        <section class="side-section">
          <div class="side-section-head"><h2>AI 포착</h2><button class="link-button" data-action="route" data-route="capture">목록</button></div>
          <div class="side-list">
            ${picks.map((pick) => `
              <button type="button" class="side-row" data-action="open-stock" data-stock="${escapeHtml(stockKey(pick))}">
                <span class="side-avatar ai">AI</span>
                <span class="side-main"><strong>${escapeHtml(pick.name)}</strong><small>${escapeHtml(pick.ticker)} · 목표 ${fmtMoney(pick.targetPrice, pick.market)}</small></span>
                <span class="side-value"><strong>${fmtMoney(pick.currentPrice || pick.price || pick.targetPrice, pick.market)}</strong><b class="${changeClass(pickReturn(pick))}">${fmtPct(pickReturn(pick))}</b></span>
              </button>
            `).join("")}
          </div>
        </section>
        <section class="side-section quick-grid">
          <button class="quick-tile" data-action="route" data-route="market-sentiment"><span>심리</span><b>Fear</b></button>
          <button class="quick-tile" data-action="route" data-route="investor-flow"><span>수급</span><b>Flow</b></button>
          <button class="quick-tile" data-action="route" data-route="fmkorea-index"><span>펨코</span><b>Index</b></button>
          <button class="quick-tile" data-action="route" data-route="journal"><span>일지</span><b>Log</b></button>
        </section>
      </div>
    </aside>
  `;
}

function renderDesktopTopNav() {
  return [
    ["home", "홈"],
    ["capture", "AI포착"],
    ["markets", "시장"],
    ["community", "커뮤니티"]
  ].map(([id, label]) => `
    <button class="${navActive(id) ? "active" : ""}" data-action="route" data-route="${id}">${label}</button>
  `).join("");
}

function renderDesktopRail(open) {
  const items = [
    ["portfolio", "chart", "내 투자"],
    ["favorites", "heart", "관심"],
    ["journal", "recent", "최근 본"],
    ["markets", "activity", "실시간"],
    ["compare", "compare", "비교"],
    ["ai", "sparkles", "AI"],
    ["notices", "bell", "공지"],
    ["profile", "user", "프로필"]
  ];
  if (isAdmin()) items.push(["admin", "settings", "관리자"]);
  return `
    <aside class="desktop-rail" aria-label="퀵 메뉴">
      <button class="desktop-rail-button rail-toggle ${open ? "open" : ""}" data-action="toggle-right-panel" aria-label="${open ? "관심 패널 닫기" : "관심 패널 열기"}" title="${open ? "관심 패널 닫기" : "관심 패널 열기"}"><svg aria-hidden="true"><use href="/assets/rail-icons.svg#chevrons"></use></svg></button>
      <div class="desktop-rail-menu">
        ${items.map(([route, icon, label]) => `
          <button class="desktop-rail-button ${navActive(route) ? "active" : ""}" data-action="route" data-route="${route}" aria-label="${label}" title="${label}">
            <span class="desktop-rail-icon" aria-hidden="true"><svg><use href="/assets/rail-icons.svg#${icon}"></use></svg></span>
            <span class="desktop-rail-label">${label}</span>
          </button>
        `).join("")}
      </div>
      <button class="desktop-rail-button rail-theme" data-action="theme-toggle" aria-label="테마 전환" title="테마 전환"><span class="desktop-rail-icon" aria-hidden="true"><svg><use href="/assets/rail-icons.svg#theme"></use></svg></span><span class="desktop-rail-label">테마</span></button>
    </aside>
  `;
}

function renderNav(isMobile) {
  return ROUTES.filter((route) => (isMobile ? MOBILE_ROUTES.includes(route.id) : route.id !== "admin" || isAdmin()))
    .map((route) => {
      const active = navActive(route.id) ? "active" : "";
      const count = navCount(route.id);
      return `
        <button class="nav-button ${active}" data-action="route" data-route="${route.id}">
          <span class="nav-icon">${route.icon}</span>
          <span class="nav-label">${isMobile ? route.short : route.label}</span>
          <span class="nav-count">${count}</span>
        </button>
      `;
    })
    .join("");
}

function renderMobileNav() {
  return `<nav class="mobile-nav">${renderNav(true)}</nav>`;
}

function navActive(id) {
  if (id === "capture" && ["stock", "feature-stock"].includes(state.route.id)) return true;
  if (id === "markets" && ["index", "night-futures", "market-sentiment", "investor-flow", "fmkorea-index", "fmkorea-hot"].includes(state.route.id)) return true;
  if (id === "journal" && state.route.id === "journal-chart") return true;
  if (id === "notices" && state.route.id === "notice") return true;
  return state.route.id === id;
}

function navCount(id) {
  if (id === "capture") return captureCount();
  if (id === "favorites") return state.user ? favoriteCount() : "";
  if (id === "journal") return state.user ? myJournals().length : "";
  if (id === "ai") return state.user ? myAnalyses().length : "";
  return "";
}

function renderPage() {
  switch (state.route.id) {
    case "home":
      return renderHome();
    case "capture":
      return renderCapture();
    case "stock":
      return renderStockDetail();
    case "feature-stock":
      return renderFeatureStockDetail();
    case "markets":
      return renderMarkets();
    case "market-analysis":
      return renderMarketAnalysisDetail();
    case "post":
      return renderPostDetail();
    case "journal-share":
      return renderJournalShareDetail();
    case "index":
      return renderMarketIndexDetail();
    case "night-futures":
      return renderNightFuturesDetail();
    case "market-sentiment":
      return renderMarketSentimentDetail();
    case "investor-flow":
      return renderInvestorFlowDetail();
    case "fmkorea-index":
      return renderFmkoreaIndexDetail();
    case "fmkorea-hot":
      return renderFmkoreaHotDetail();
    case "favorites":
      return renderFavorites();
    case "journal":
      return renderJournal();
    case "journal-chart":
      return renderJournalChartDetail();
    case "portfolio":
      return renderPortfolio();
    case "compare":
      return renderCompare();
    case "ai":
      return renderAi();
    case "community":
      return renderCommunity();
    case "leaderboard":
      return renderLeaderboard();
    case "my-posts":
      return renderMyPosts();
    case "my-comments":
      return renderMyComments();
    case "notices":
      return renderNotices();
    case "notice":
      return renderNoticeDetail();
    case "profile":
      return renderProfile();
    case "admin":
      return isAdmin() ? renderAdmin() : renderProfile();
    default:
      return renderHome();
  }
}

function renderPageHead(eyebrow, title, sub, action = "") {
  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">${escapeHtml(eyebrow)}</div>
        <h1>${escapeHtml(title)}</h1>
        ${sub ? `<p class="subtext">${escapeHtml(sub)}</p>` : ""}
      </div>
      ${action ? `<div class="row wrap">${action}</div>` : ""}
    </div>
  `;
}

function renderHome() {
  const activePicks = state.data.stockPicks.filter((p) => p.status === "active").slice(0, 4);
  const features = state.data.marketFeatures.slice(0, 5);
  const notices = [...state.data.announcements].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).slice(0, 3);
  const posts = [...state.data.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const favoriteStocks = state.user ? Object.values(getUserDoc().favoriteStocks || {}).slice(0, 4) : [];
  const aiBrief = normalizeAiBrief(state.data.aiBrief);
  const briefStamp = [aiBrief.source, aiBrief.generatedAt ? fmtDateTime(aiBrief.generatedAt) : ""].filter(Boolean).join(" · ");
  return `
    ${renderPageHead("오늘", "오늘의 시장", "시장 흐름과 우기의 포착 종목을 빠르게 확인하세요.")}
    <div class="dashboard-grid">
      <div class="stack">
        <div class="grid grid-3 home-index-grid">${state.data.market.indices.slice(0, 6).map(renderIndexCard).join("")}</div>
        <section class="panel">
          <div class="panel-head">
            <h2>${escapeHtml(aiBrief.title || "AI 브리프")}</h2>
            <div class="row wrap"><button class="btn" data-action="route" data-route="markets">시장 자세히</button></div>
          </div>
          <div class="panel-body">
            ${briefStamp ? `<span class="muted">${escapeHtml(briefStamp)}</span>` : ""}
            <p class="subtext section">${escapeHtml(aiBrief.summary || "")}</p>
            <div class="grid grid-3 section">
              ${(aiBrief.bullets || []).map((item) => `<div class="card"><span class="badge good">AI</span><p class="subtext">${escapeHtml(item)}</p></div>`).join("")}
            </div>
          </div>
        </section>
        <section class="grid grid-2">
          <div class="panel">
            <div class="panel-head"><h2>추천주</h2><button class="btn" data-action="route" data-route="capture">전체 보기</button></div>
            <div>${activePicks.map((pick) => renderStockListRow(pick)).join("")}</div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2>AI포착 특징주</h2><button class="btn" data-action="route" data-route="capture">필터</button></div>
            <div>${features.map(renderFeatureRow).join("")}</div>
          </div>
        </section>
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="panel-head"><h2>관심종목</h2><button class="btn" data-action="route" data-route="favorites">관리</button></div>
          <div class="panel-body stack">
            ${state.user ? (favoriteStocks.length ? favoriteStocks.map((s) => renderFavoriteMini(s)).join("") : `<div class="empty">관심종목을 등록하면 이곳에 표시됩니다.</div>`) : `<div class="empty">이메일 로그인 후 관심종목을 저장할 수 있습니다.</div>`}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>공지</h2><button class="btn" data-action="route" data-route="notices">더 보기</button></div>
          <div>${notices.map(renderNoticeRow).join("")}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>커뮤니티</h2><button class="btn" data-action="route" data-route="community">입장</button></div>
          <div>${posts.map(renderPostRow).join("")}</div>
        </section>
      </aside>
    </div>
  `;
}

function renderIndexCard(index) {
  return `
    <button class="card metric" data-action="market-detail" data-ticker="${escapeHtml(index.ticker)}">
      <div class="row-between">
        <div class="metric-label">${escapeHtml(index.name)}</div>
        ${dataSourceBadge(index, "SNAPSHOT")}
      </div>
      <div class="metric-value">${fmtNum(index.value, index.value < 100 ? 2 : 1)}</div>
      <div class="metric-foot ${changeClass(index.changeRate)}">${fmtPct(index.changeRate)}</div>
      <div class="metric-source">${escapeHtml(dataSourceStamp(index, "앱 내 임시 스냅샷"))}</div>
    </button>
  `;
}

function renderStockListRow(pick) {
  const ret = pick.status === "completed" ? pickReturn(pick, pick.closedPrice) : pickReturn(pick);
  return `
    <div class="stock-row" data-action="open-stock" data-stock="${escapeHtml(stockKey(pick))}">
      <div class="stock-title">
        <div class="min-w">
          <div class="name">${escapeHtml(pick.name)}</div>
          <div class="ticker">${escapeHtml(pick.ticker)} · ${escapeHtml(pick.market)}</div>
        </div>
        <div class="num ${changeClass(ret)}">${fmtPct(ret)}</div>
      </div>
      <div class="row-between">
        <span class="badge">${escapeHtml(pick.category)}</span>
        <span class="muted">${fmtMoney(pick.currentPrice || pick.closedPrice, pick.market)} / 목표 ${fmtMoney(pick.targetPrice, pick.market)}</span>
      </div>
      <div class="data-line">${dataSourceBadge(pick, "SNAPSHOT")}<span>${escapeHtml(dataSourceStamp(pick, "추천주 스냅샷"))}</span></div>
    </div>
  `;
}

function renderFeatureRow(item) {
  return `
    <div class="stock-row" data-action="route" data-route="feature-stock" data-param="${escapeHtml(item.id || stockKey(item))}">
      <div class="stock-title">
        <div>
          <div class="name">${escapeHtml(item.name)}</div>
          <div class="ticker">${escapeHtml(item.ticker)} · ${escapeHtml(item.pattern)}</div>
        </div>
        <div class="num ${changeClass(item.changeRate)}">${fmtPct(item.changeRate)}</div>
      </div>
      <div class="row-between">
        <span class="badge good">점수 ${fmtNum(item.score)}</span>
        <span class="muted">거래대금 ${formatTradingValue(item.tradingValue)}</span>
      </div>
      <div class="data-line">${dataSourceBadge(item, "SNAPSHOT")}<span>${escapeHtml(dataSourceStamp(item, "포착 스냅샷"))}</span></div>
    </div>
  `;
}

function renderNoticeRow(item) {
  return `
    <button type="button" class="list-row notice-row" data-action="route" data-route="notice" data-param="${escapeHtml(item.id)}">
      <div class="row-between">
        <strong>${item.isPinned ? `<span class="badge warn">고정</span> ` : ""}${escapeHtml(item.title)}</strong>
        <span class="muted">${fmtDate(item.createdAt)}</span>
      </div>
      <p class="subtext">${escapeHtml(item.body)}</p>
    </button>
  `;
}

function findNotice(id) {
  const decoded = safeDecode(id || "");
  return state.data.announcements.find((item) => item.id === decoded) || null;
}

function renderNoticeDetail() {
  const notice = findNotice(state.route.param);
  if (!notice) {
    return renderPageHead("Notice", "공지사항을 찾을 수 없습니다", "공지 목록에서 다시 선택해주세요.", `<button class="btn" data-action="route" data-route="notices">공지 목록</button>`);
  }
  const adminActions = isAdmin()
    ? `<button class="btn" data-action="modal" data-modal="notice" data-id="${escapeHtml(notice.id)}">수정</button><button class="btn danger" data-action="delete-notice" data-id="${escapeHtml(notice.id)}">삭제</button>`
    : "";
  return `
    ${renderPageHead("Notice", notice.title, `${notice.isPinned ? "고정 공지 · " : ""}${fmtDateTime(notice.createdAt)}`, `<button class="btn" data-action="route" data-route="notices">목록</button>${adminActions}`)}
    <section class="panel notice-detail">
      <div class="panel-body">
        ${notice.isPinned ? `<span class="badge warn">고정</span>` : ""}
        <p class="notice-body">${escapeHtml(notice.body)}</p>
      </div>
    </section>
  `;
}

function renderPostRow(post) {
  return `
    <div class="list-row" data-action="open-post" data-post="${escapeHtml(post.id)}">
      <strong>${escapeHtml(post.title)}</strong>
      <div class="post-meta"><span>${escapeHtml(post.nickname)}</span><span>좋아요 ${post.likes}</span><span>${fmtDateTime(post.createdAt)}</span></div>
    </div>
  `;
}

function renderFavoriteMini(stock) {
  return `
    <div class="card favorite-mini">
      <div class="row-between">
        <div>
          <div class="name">${escapeHtml(stock.name)}</div>
          <div class="ticker">${escapeHtml(stock.ticker)} · ${escapeHtml(stock.market)}</div>
        </div>
        <button class="btn" data-action="open-stock" data-stock="${escapeHtml(stockKey(stock))}">보기</button>
      </div>
    </div>
  `;
}

function renderCapture() {
  const tabs = [
    ["all", "전체"],
    ["ai_capture", "AI포착"],
    ["surge", "급등주"],
    ["value", "거래대금"],
    ["volume", "거래량"],
    ["recommended", "추천주"],
    ["completed", "종료 추천주"]
  ];
  const rows = captureRows();
  const actions = `<button class="btn" data-action="route" data-route="leaderboard">종료 실적</button><button class="btn" data-action="route" data-route="compare">종목 비교</button><button class="btn primary" data-action="route" data-route="ai">AI 분석 목록</button>`;
  return `
    ${renderPageHead("AI Capture", "AI포착과 추천주", "특징주, 급등주, 거래대금/거래량, 추천주와 종료 추천주를 탭과 필터로 봅니다.", actions)}
    <div class="panel capture-board">
      <div class="panel-head wrap">
        <div class="tabs">${tabs.map(([id, label]) => `<button class="tab ${state.filters.captureTab === id ? "active" : ""}" data-action="capture-tab" data-tab="${id}">${label}</button>`).join("")}</div>
        <div class="row wrap">
          <input class="input" style="width: 220px" data-filter="captureSearch" value="${escapeHtml(state.filters.captureSearch)}" placeholder="종목 검색" />
          <select class="select" style="width: 130px" data-filter="captureMarket">
            ${["all", "KS", "KQ", "US"].map((m) => `<option value="${m}" ${state.filters.captureMarket === m ? "selected" : ""}>${m === "all" ? "전체시장" : m}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="capture-list-head" aria-hidden="true">
        <span>순위 · 오늘 ${fmtDate(new Date())} 기준</span>
        <span>현재가</span>
        <span>등락/점수</span>
        <span>판단</span>
      </div>
      <div class="capture-ranking-list">
        ${rows.map((row, index) => renderCaptureRankRow(row, index)).join("") || `<div class="empty">조건에 맞는 종목이 없습니다.</div>`}
      </div>
    </div>
  `;
}

function captureRows() {
  const tab = state.filters.captureTab;
  const search = state.filters.captureSearch.trim().toLowerCase();
  const market = state.filters.captureMarket;
  let rows = [];
  if (["all", "recommended", "completed"].includes(tab)) {
    rows.push(...state.data.stockPicks.map((item) => ({ type: "pick", item })));
  }
  if (!["recommended", "completed"].includes(tab)) {
    rows.push(...state.data.marketFeatures.map((item) => ({ type: "feature", item })));
  }
  rows = rows.filter(({ type, item }) => {
    if (tab === "recommended" && (type !== "pick" || item.status !== "active")) return false;
    if (tab === "completed" && (type !== "pick" || item.status !== "completed")) return false;
    if (tab === "ai_capture" && item.group !== "ai_capture") return false;
    if (tab === "surge" && item.group !== "surge") return false;
    if (tab === "value" && !(Number(item.tradingValue || 0) > 100000000000)) return false;
    if (tab === "volume" && !(Number(item.volumeRatio || 0) >= 2)) return false;
    if (market !== "all" && item.market !== market) return false;
    if (search && !`${item.name} ${item.ticker} ${item.reason || ""} ${item.title || ""}`.toLowerCase().includes(search)) return false;
    return true;
  });
  return rows.sort((a, b) => {
    const scoreA = a.type === "feature" ? a.item.score : Math.abs(pickReturn(a.item));
    const scoreB = b.type === "feature" ? b.item.score : Math.abs(pickReturn(b.item));
    return scoreB - scoreA;
  });
}

function renderCaptureTableRow(row) {
  const item = row.item;
  const isPick = row.type === "pick";
  const price = isPick ? item.currentPrice || item.closedPrice : item.price;
  const change = isPick ? (item.status === "completed" ? pickReturn(item, item.closedPrice) : pickReturn(item)) : item.changeRate;
  const key = stockKey(item);
  return `
    <tr>
      <td data-label="종목"><strong>${escapeHtml(item.name)}</strong><div class="ticker">${escapeHtml(item.ticker)} · ${escapeHtml(item.market)}</div><div class="data-line compact">${dataSourceBadge(item, "SNAPSHOT")}<span>${escapeHtml(dataSourceLabel(item, "스냅샷"))}</span></div></td>
      <td data-label="구분"><span class="badge ${isPick ? "good" : "warn"}">${isPick ? (item.status === "completed" ? "종료 추천주" : "추천주") : escapeHtml(item.pattern || item.group)}</span></td>
      <td data-label="현재가" class="num">${fmtMoney(price, item.market)}</td>
      <td data-label="등락/수익" class="num ${changeClass(change)}">${fmtPct(change)}</td>
      <td data-label="판단">${isPick ? renderVoteBar(item) : renderFeatureDecisionBadges(item)}</td>
      <td data-label="손익비">${isPick ? "-" : renderFeatureRiskReward(item)}</td>
      <td data-label="근거">${escapeHtml(item.reason || item.title || "")}</td>
      <td data-label="동작"><div class="capture-actions">${isPick ? `<button class="btn primary" data-action="open-stock" data-stock="${escapeHtml(key)}">상세</button>` : `<button class="btn primary" data-action="route" data-route="feature-stock" data-param="${escapeHtml(item.id || key)}">상세</button><button class="btn" data-action="open-stock" data-stock="${escapeHtml(key)}">종목</button>`}<button class="btn" data-action="generate-ai" data-stock="${escapeHtml(key)}">AI</button></div></td>
    </tr>
  `;
}

function renderCaptureRankRow(row, index) {
  const item = row.item;
  const isPick = row.type === "pick";
  const price = isPick ? item.currentPrice || item.closedPrice || item.price : item.currentPrice || item.price;
  const change = isPick ? (item.status === "completed" ? pickReturn(item, item.closedPrice) : pickReturn(item)) : item.changeRate;
  const key = stockKey(item);
  const score = isPick ? Math.abs(pickReturn(item)) : Number(item.score || 0);
  const pattern = isPick ? (item.status === "completed" ? "종료 추천주" : "추천주") : featurePatternLabel(item.pattern) || featureGroupLabel(item.group) || item.pattern || "AI포착";
  const action = isPick
    ? `<button class="btn primary" data-action="open-stock" data-stock="${escapeHtml(key)}">보기</button>`
    : `<button class="btn primary" data-action="route" data-route="feature-stock" data-param="${escapeHtml(item.id || key)}">상세</button><button class="btn" data-action="open-stock" data-stock="${escapeHtml(key)}">종목</button>${isAdmin() ? `<button class="btn accent" data-action="promote-feature-pick" data-feature="${escapeHtml(item.id || key)}">승격</button>` : ""}`;
  const decision = isPick ? renderVoteBar(item) : renderFeatureDecisionBadges(item);
  return `
    <article class="capture-rank-row">
      <button class="capture-rank-main" type="button" data-action="${isPick ? "open-stock" : "route"}" ${isPick ? `data-stock="${escapeHtml(key)}"` : `data-route="feature-stock" data-param="${escapeHtml(item.id || key)}"`}>
        <span class="capture-rank-heart" aria-hidden="true">♥</span>
        <span class="capture-rank-index">${index + 1}</span>
        <span class="capture-rank-logo">${escapeHtml((item.name || item.ticker || "?").slice(0, 1))}</span>
        <span class="capture-rank-name">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.ticker)} · ${escapeHtml(item.market)} · ${escapeHtml(pattern)}</small>
          <em>${dataSourceBadge(item, "SNAPSHOT")} ${escapeHtml(dataSourceLabel(item, "스냅샷"))}</em>
        </span>
        <span class="capture-rank-price num">${fmtMoney(price, item.market)}</span>
        <span class="capture-rank-change ${changeClass(change)}">${fmtPct(change)}</span>
        <span class="capture-rank-score"><b>${score ? fmtNum(score, 0) : "-"}</b><small>${isPick ? "수익률" : "점수"}</small></span>
        <span class="capture-rank-reason">${escapeHtml(item.reason || item.title || "")}</span>
      </button>
      <div class="capture-rank-decision">${decision}</div>
      <div class="capture-actions">${action}<button class="btn" data-action="generate-ai" data-stock="${escapeHtml(key)}">AI</button></div>
    </article>
  `;
}

function renderFeatureStockDetail() {
  const feature = findFeatureStock(state.route.param);
  if (!feature) {
    return renderPageHead("Feature Stock", "특징주를 찾을 수 없습니다", "AI포착 목록에서 다시 선택해주세요.", `<button class="btn" data-action="route" data-route="capture">AI포착</button>`);
  }
  const key = stockKey(feature);
  const userDoc = state.user ? getUserDoc() : null;
  const favoriteStock = Boolean(userDoc?.favoriteStocks?.[key]);
  const analysis = findAnalysis(key);
  const stockChartMode = state.filters.stockChartMode === "line" ? "line" : "candles";
  const stockChartFrame = chartFrameId(state.filters.stockChartFrame);
  const stockMinuteInterval = minuteIntervalId(state.filters.stockMinuteInterval);
  const stockChartRange = chartRangeId(state.filters.stockChartRange);
  const historyCandles = applyChartRange(stockChartCandlesForFrame(feature, stockChartFrame, stockMinuteInterval), stockChartFrame, stockChartRange);
  const historyValues = chartValuesFromCandles(historyCandles);
  const chartHistoryKey = chartHistoryStoreKey(key, stockChartFrame, stockMinuteInterval);
  const historyMeta = state.historyMeta.get(chartHistoryKey) || state.historyMeta.get(key) || {};
  const historyStamp = chartMetaStamp(key, stockChartFrame, stockMinuteInterval, historyCandles.length);
  const discussion = state.stockDiscussions.get(key) || {};
  const featureHeaderActions = `<button class="btn" data-action="route" data-route="capture">AI포착</button><button class="btn" data-action="open-stock" data-stock="${escapeHtml(key)}">종목 상세</button><button class="btn ${favoriteStock ? "danger" : ""}" data-action="toggle-favorite-stock" data-stock="${escapeHtml(key)}">${favoriteStock ? "관심 해제" : "관심 등록"}</button><button class="btn accent" data-action="generate-ai" data-stock="${escapeHtml(key)}">${analysis ? "재분석" : "AI 분석"}</button>`;
  const decision = feature.decision || {};
  const factors = feature.factors || {};
  const tradePlan = feature.tradePlan || {};
  const positionGuide = tradePlan.positionGuide || {};
  const marketGate = tradePlan.marketGate || feature.marketGate || {};
  if (shouldLoadChartHistory(key, stockChartFrame, stockMinuteInterval)) {
    queueMicrotask(() => loadHistory(key, { silent: true, frame: stockChartFrame, interval: stockMinuteInterval }));
  }
  if (!feature.source && !state.quoteAttempted.has(key) && !state.quoteBusy.has(key)) {
    queueMicrotask(() => refreshStockQuote(key, { silent: true }));
  }
  if (isDomesticStock(feature) && !state.stockDiscussions.has(key) && !state.stockDiscussionsBusy.has(key)) {
    queueMicrotask(() => loadStockDiscussions(key, { silent: true }));
  }
  const mobileFeatureHeader = `
    <div class="stock-mobile-header">
      <div class="stock-mobile-toolbar">
        <button type="button" data-action="route" data-route="capture" aria-label="목록으로 돌아가기" title="목록으로 돌아가기">‹</button>
        <div class="stock-mobile-toolbar-actions">
          <button type="button" class="${favoriteStock ? "active" : ""}" data-action="toggle-favorite-stock" data-stock="${escapeHtml(key)}" aria-label="${favoriteStock ? "관심종목 해제" : "관심종목 등록"}" title="${favoriteStock ? "관심종목 해제" : "관심종목 등록"}">${favoriteStock ? "♥" : "♡"}</button>
          <button type="button" data-action="generate-ai" data-stock="${escapeHtml(key)}" aria-label="AI 분석" title="AI 분석">✦</button>
          <button type="button" data-action="route" data-route="compare" data-param="${escapeHtml(key)}" aria-label="종목 비교" title="종목 비교">⋯</button>
        </div>
      </div>
      <div class="stock-mobile-name">
        <strong>${escapeHtml(feature.name)}</strong>
        <span>${escapeHtml(feature.ticker)} · ${escapeHtml(feature.market)} · ${escapeHtml(featureTitle(feature))}</span>
      </div>
    </div>
  `;
  return `
    ${mobileFeatureHeader}
    ${renderPageHead("Feature Stock", `${feature.name} 포착 상세`, `${feature.ticker} · ${feature.market} · ${featureGroupLabel(feature.group)}`, featureHeaderActions)}
    <div class="split">
      <div class="stack">
        <section class="card stock-overview">
          <div class="detail-hero">
            <div>
              <div class="desktop-stock-name"><strong>${escapeHtml(feature.name)}</strong><span>${escapeHtml(feature.ticker)} · ${escapeHtml(feature.market)} · ${escapeHtml(featureTitle(feature))}</span></div>
              <div class="price-main num">${fmtMoney(feature.currentPrice || feature.price, feature.market)}</div>
              <div class="${changeClass(feature.changeRate)} section">${fmtPct(feature.changeRate)}</div>
              <p class="subtext">${escapeHtml(localizedFeatureReason(feature))}</p>
              <div class="data-line section">${dataSourceBadge(feature, "SNAPSHOT")}<span>${escapeHtml(dataSourceStamp(feature, "포착 스냅샷"))}</span></div>
            </div>
            <div class="detail-action-cluster">
              <div class="desktop-detail-actions">${featureHeaderActions}</div>
              <div class="row wrap"><span class="badge good">${escapeHtml(featureTitle(feature))}</span><span class="badge ${feature.market === "US" ? "warn" : "good"}">${escapeHtml(feature.market)}</span></div>
            </div>
          </div>
        </section>
        <nav class="stock-detail-tabs" aria-label="포착 종목 상세 탭">
          <button class="active" type="button" data-action="scroll-stock-section" data-target=".stock-chart-panel">차트</button>
          <button type="button" data-action="open-stock" data-stock="${escapeHtml(key)}">종목</button>
          <button type="button" data-action="generate-ai" data-stock="${escapeHtml(key)}">AI 분석</button>
          <button type="button" data-action="route" data-route="compare" data-param="${escapeHtml(key)}">비교</button>
          <button type="button" data-action="route" data-route="community">커뮤니티</button>
        </nav>
        <section class="panel stock-chart-panel">
          <div class="panel-head wrap"><div><h2>포착 차트</h2><p class="subtext">${escapeHtml(historyStamp)}</p></div><div class="row wrap"><div class="tabs compact"><button class="tab ${stockChartMode === "candles" ? "active" : ""}" data-action="stock-chart-mode" data-mode="candles">캔들</button><button class="tab ${stockChartMode === "line" ? "active" : ""}" data-action="stock-chart-mode" data-mode="line">라인</button></div></div></div>
          <div class="panel-body">
            ${renderChartFrameControls("stock", stockChartFrame, stockMinuteInterval)}
            ${stockChartMode === "candles"
              ? `<div class="stock-chart-legend"><span><i style="--swatch:#ef4444"></i>상승</span><span><i style="--swatch:#3b82f6"></i>하락</span><span><i style="--swatch:#10b981"></i>MA5</span><span><i style="--swatch:#f59e0b"></i>MA20</span><span><i style="--swatch:#8b5cf6"></i>MA60</span></div><div class="stock-chart-shell"><div class="stock-chart-selection" data-chart-selection aria-live="polite"><span data-chart-selection-date>최근</span><b class="num" data-chart-selection-price>-</b><span data-chart-selection-change>-</span></div><div class="chart-box stock-candles"><canvas data-chart="ohlc" data-points="${escapeHtml(JSON.stringify(historyCandles))}" data-market="${escapeHtml(feature.market || "KS")}" data-averages="true" tabindex="0" aria-label="${escapeHtml(feature.name)} ${chartFrameLabel(stockChartFrame, stockMinuteInterval)} 차트"></canvas></div></div>`
              : `<div class="line-chart-shell"><div class="stock-chart-selection" data-chart-selection aria-live="polite"><span data-chart-selection-date>최근</span><b class="num" data-chart-selection-price>-</b><span data-chart-selection-change>-</span></div><div class="chart-box stock-candles"><canvas data-chart="line" data-values="${historyValues.join(",")}" data-market="${escapeHtml(feature.market || "KS")}" data-color="${feature.changeRate >= 0 ? "up" : "down"}" data-line-interactive="true" tabindex="0" aria-label="${escapeHtml(feature.name)} ${chartFrameLabel(stockChartFrame, stockMinuteInterval)} 라인 차트"></canvas></div></div>`}
            ${renderChartRangeControls("stock", stockChartFrame, stockChartRange)}
          </div>
        </section>
        <section class="panel feature-decision-panel">
          <div class="panel-body">
            <div class="feature-decision-hero">
              <div>
                <span class="badge good">투자위원회 판단</span>
                <h2>${escapeHtml(decision.summary || `${featureTitle(feature)} · ${renderFeatureRiskRewardText(feature)}`)}</h2>
                <p class="subtext">${escapeHtml(decision.confirmation || "거래량과 종가 위치를 확인한 뒤 진입 여부를 판단합니다.")}</p>
              </div>
              <div class="feature-decision-score">
                <strong>${escapeHtml(decision.priority || "-")}</strong>
                <span>우선순위</span>
              </div>
            </div>
            <div class="decision-metrics">
              ${renderKpi("최종 매수 점수", factors.finalBuy != null ? `${fmtNum(factors.finalBuy, 0)}점` : `${fmtNum(feature.score, 0)}점`, "good")}
              ${renderKpi("수익 가능성", factors.profit != null ? `${fmtNum(factors.profit, 0)}점` : "-")}
              ${renderKpi("손익비", renderFeatureRiskRewardText(feature))}
              ${renderKpi("허위돌파 위험", decision.falseBreakoutRisk || riskText(factors.falseBreakoutRisk))}
              ${renderKpi("추격 위험", riskText(factors.chaseRisk || 0), factors.chaseRisk >= 65 ? "warn" : "")}
              ${renderKpi("리스크 게이트", marketGate.label || marketGate.regime || "표준 관찰", marketGate.regime === "Risk-Off" ? "warn" : "good")}
              ${renderKpi("권장 대응", tradePlan.response || "관찰 유지", "good")}
            </div>
          </div>
        </section>
        ${renderFourAxisPanel(feature)}
        <section class="panel feature-info-panel">
          <div class="panel-head"><h2>포착 정보</h2><span class="badge">${escapeHtml(feature.pattern || feature.group || "AI")}</span></div>
          <div class="panel-body stack">
            <p class="subtext">${escapeHtml(localizedFeatureReason(feature))}</p>
            <div class="grid grid-4">
              ${renderKpi("현재가", fmtMoney(feature.currentPrice || feature.price, feature.market))}
              ${renderKpi("등락률", fmtPct(feature.changeRate), changeClass(feature.changeRate))}
              ${renderKpi("거래대금", formatTradingValue(feature.tradingValue))}
              ${renderKpi("거래량 배수", feature.volumeRatio > 0 ? `${fmtNum(feature.volumeRatio, 1)}x` : "-")}
              ${renderKpi("포착 점수", fmtNum(feature.score, 0), "good")}
              ${renderKpi("RSI", factors.rsi != null ? fmtNum(factors.rsi, 1) : "-")}
              ${renderKpi("MACD 전환", factors.macdTurnUp ? "상승 전환" : "확인 중")}
              ${renderKpi("VWAP 위치", factors.aboveVwap ? "위" : "아래")}
              ${renderKpi("BB 폭 분위", factors.bbWidthRank != null ? `${fmtNum(factors.bbWidthRank, 0)}%` : "-")}
              ${renderKpi("포착일", fmtDate(feature.sourceDate || feature.createdAt))}
              ${renderKpi("현재가 출처", dataSourceLabel(feature, "스냅샷"))}
              ${tradePlan.entryPrice ? renderKpi("진입 관찰가", fmtMoney(tradePlan.entryPrice, feature.market)) : ""}
              ${tradePlan.stopPrice ? renderKpi("무효화 가격", fmtMoney(tradePlan.stopPrice, feature.market), "warn") : ""}
              ${tradePlan.targetPrice ? renderKpi("목표가", fmtMoney(tradePlan.targetPrice, feature.market), "good") : ""}
              ${tradePlan.stopPct ? renderKpi("손절폭", `${fmtNum(tradePlan.stopPct, 1)}%`, "warn") : ""}
              ${renderKpi("차트 포인트", fmtNum(historyMeta.points || historyValues.length))}
            </div>
          </div>
        </section>
        ${isDomesticStock(feature) ? renderStockDiscussionPanel(feature, key, discussion) : ""}
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="panel-head"><h2>연결 작업</h2></div>
          <div class="panel-body stack">
            <button class="btn" data-action="open-stock" data-stock="${escapeHtml(key)}">종목 상세 열기</button>
            <button class="btn" data-action="route" data-route="compare" data-param="${escapeHtml(key)}">종목 비교</button>
            <button class="btn primary" data-action="generate-ai" data-stock="${escapeHtml(key)}">${analysis ? "AI 재분석" : "AI 분석"}</button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>진입 계획</h2><span class="badge">${escapeHtml(tradePlan.riskLevel || "관찰")}</span></div>
          <div class="panel-body stack">
            <div class="source-item"><strong>관찰가</strong><p class="subtext">${tradePlan.entryPrice ? `${fmtMoney(tradePlan.entryPrice, feature.market)} 위에서 종가와 거래량을 확인합니다.` : "관찰가 산정 대기"}</p></div>
            <div class="source-item"><strong>무효화</strong><p class="subtext">${tradePlan.stopPrice ? `${fmtMoney(tradePlan.stopPrice, feature.market)} 이탈 시 시나리오를 재검토합니다.` : "무효화 가격 산정 대기"}</p></div>
            <div class="source-item"><strong>포지션 가이드</strong><p class="subtext">${positionGuide.quantity ? `${escapeHtml(positionGuide.basis || "가상 리스크 기준")} · ${fmtNum(positionGuide.quantity, 0)}주 · 노출 ${fmtMoney(positionGuide.notional, feature.market)}` : "계좌 규모 입력 전 참고용입니다."}</p>${positionGuide.sizingReason ? `<p class="subtext tiny">${escapeHtml(positionGuide.sizingReason)}</p>` : ""}</div>
            <p class="subtext">특징주는 시장 데이터 기반 포착 정보이며, 매수·매도 권유가 아닙니다.</p>
          </div>
        </section>
      </aside>
    </div>
  `;
}

function findFeatureStock(param) {
  const decoded = decodeURIComponent(param || "");
  const found = state.data.marketFeatures.find((item) => item.id === decoded || stockKey(item) === decoded || item.ticker === decoded);
  return found ? normalizeFeature(found) : null;
}

function renderFourAxisPanel(feature) {
  const axis = feature?.factors?.fourAxis;
  if (!axis || typeof axis !== "object") return "";
  const axes = ["trend", "momentum", "volatility", "volume"]
    .map((key) => axis[key])
    .filter(Boolean);
  if (!axes.length) return "";
  const cards = axes.map((item) => {
    const score = Number(item.score || 0);
    const tone = score >= 4 ? "good" : score <= 2 ? "warn" : "";
    const evidence = Array.isArray(item.evidence) ? item.evidence : [];
    return `
      <div class="axis-card ${tone}">
        <div class="axis-card-top">
          <strong>${escapeHtml(item.name || "-")}</strong>
          <span>${fmtNum(score, 1)}/5</span>
        </div>
        <b>${escapeHtml(item.verdict || item.label || "판단 대기")}</b>
        <p>${evidence.map(escapeHtml).join(" · ")}</p>
      </div>
    `;
  }).join("");
  return `
    <section class="panel four-axis-panel">
      <div class="panel-head"><h2>4축 분석</h2><span class="badge good">${axis.signalStars ? `${fmtNum(axis.signalStars, 1)}/5` : "분석"}</span></div>
      <div class="panel-body stack">
        <p class="subtext">${escapeHtml(axis.keyObservation || axis.phase || "추세, 모멘텀, 변동성, 수급을 함께 확인합니다.")}</p>
        <div class="four-axis-grid">${cards}</div>
        ${axis.riskPoint ? `<p class="subtext tiny">${escapeHtml(axis.riskPoint)}</p>` : ""}
      </div>
    </section>
  `;
}

function findStockPick(param) {
  const decoded = decodeURIComponent(param || "");
  return state.data.stockPicks.find((item) => item.id === decoded || stockKey(item) === decoded || item.ticker === decoded);
}

function isStockPick(stock) {
  return Boolean(stock?.id && findStockPick(stock.id));
}

function featureTitle(feature) {
  return featurePatternLabel(feature.pattern) || feature.title || featureGroupLabel(feature.group);
}

function featureGroupLabel(group) {
  const labels = {
    ai_capture: "AI포착",
    chart_capture: "AI포착",
    surge: "급등주",
    gainers: "급등주",
    top_trading_value: "거래대금 상위",
    volume_spike: "거래량 급증",
    high_breakout: "신고가/전고점",
    global: "글로벌 특징주"
  };
  return labels[group] || group || "특징주";
}

function featurePatternLabel(pattern) {
  const labels = {
    top_trading_value: "거래대금 상위",
    gainers: "급등주",
    trading_value_spike: "거래량/거래대금 급증",
    new_52w_high: "신고가 돌파",
    prior_high_breakout: "전고점 돌파",
    ma20_reclaim: "20일선 회복",
    prior_high_retest: "전고점 재도전",
    volume_surge_cooldown: "급등 후 재정비 구간",
    box_upper_approach: "박스권 상단 접근",
    volume_surge_pullback_tail: "급등 뒤 조정 후 반등 시도",
    volume_spike_breakout_dry_up_rise: "급등 후 재정비 구간",
    volume_spike_dry_up_pullback_support: "급등 후 재정비 구간"
  };
  return labels[pattern] || "";
}

function riskText(scoreOrLabel) {
  if (typeof scoreOrLabel === "string") return scoreOrLabel || "-";
  const score = Number(scoreOrLabel || 0);
  if (score >= 72) return "높음";
  if (score >= 48) return "확인 필요";
  if (score >= 28) return "보통";
  return "낮음";
}

function renderFeatureRiskRewardText(feature) {
  const rr = Number(feature?.tradePlan?.riskReward || feature?.factors?.riskReward || 0);
  return rr > 0 ? `${fmtNum(rr, 1)}R` : "-";
}

function renderFeatureRiskReward(feature) {
  const rr = Number(feature?.tradePlan?.riskReward || feature?.factors?.riskReward || 0);
  const stopPct = Number(feature?.tradePlan?.stopPct || 0);
  const text = rr > 0 ? `${fmtNum(rr, 1)}R` : "-";
  const detail = stopPct > 0 ? `손절 ${fmtNum(stopPct, 1)}%` : "손절 확인";
  return `<div class="decision-cell"><strong>${escapeHtml(text)}</strong><span>${escapeHtml(detail)}</span></div>`;
}

function renderFeatureDecisionBadges(feature) {
  const decision = feature.decision || {};
  const factors = feature.factors || {};
  const priority = decision.priority || "-";
  const action = feature.tradePlan?.response || decision.buyAttractiveness || "관찰";
  const risk = decision.falseBreakoutRisk || riskText(factors.falseBreakoutRisk);
  return `
    <div class="decision-cell">
      <div class="row wrap">
        <span class="badge good">${escapeHtml(priority)}등급</span>
        <span class="badge ${risk === "높음" ? "warn" : ""}">${escapeHtml(risk)}</span>
      </div>
      <span>${escapeHtml(action)}</span>
    </div>
  `;
}

function localizedFeatureReason(feature) {
  const reason = String(feature.reason || "").trim();
  if (reason) return reason;
  const parts = [`${featureTitle(feature)} 기준으로 포착된 종목입니다.`];
  if (feature.changeRate) {
    parts.push(`당일 등락률은 ${fmtPct(feature.changeRate)}입니다.`);
  }
  if (feature.tradingValue > 0) {
    parts.push(`거래대금은 ${formatTradingValue(feature.tradingValue)} 수준입니다.`);
  }
  if (feature.volumeRatio > 0) {
    parts.push(`평소 대비 거래량은 ${fmtNum(feature.volumeRatio, 1)}배로 집계됐습니다.`);
  }
  return parts.join("\n\n");
}

function renderVoteBar(item) {
  const up = Math.max(0, Number(item.upVotes || 0));
  const down = Math.max(0, Number(item.downVotes || 0));
  const total = Math.max(1, up + down);
  return `
    <div class="stack" style="gap: 6px">
      <div class="vote-bar" style="--up-vote:${up / total}fr;--down-vote:${down / total}fr"><span></span><span></span></div>
      <span class="muted">상승 ${up} · 하락 ${down}</span>
    </div>
  `;
}

function renderStockDetail() {
  const stock = getStockByKey(state.route.param);
  if (!stock) return `${renderPageHead("Stock", "종목을 찾을 수 없습니다", "AI포착 또는 관심종목에서 다시 선택해주세요.")}`;
  const key = stockKey(stock);
  const userDoc = state.user ? getUserDoc() : null;
  const favoriteStock = Boolean(userDoc?.favoriteStocks?.[key]);
  const stockPick = isStockPick(stock);
  const favoritePick = Boolean(stockPick && userDoc?.favorites?.includes(stock.id));
  const favoritePickButton = stockPick
    ? `<button class="btn ${favoritePick ? "danger" : ""}" data-action="toggle-favorite-pick" data-pick="${escapeHtml(stock.id)}">${favoritePick ? "추천 관심 해제" : "관심추천주"}</button>`
    : "";
  const mobileStockHeader = `
    <div class="stock-mobile-header">
      <div class="stock-mobile-toolbar">
        <button type="button" data-action="route" data-route="capture" aria-label="목록으로 돌아가기" title="목록으로 돌아가기">‹</button>
        <div class="stock-mobile-toolbar-actions">
          <button type="button" class="${favoriteStock ? "active" : ""}" data-action="toggle-favorite-stock" data-stock="${escapeHtml(key)}" aria-label="${favoriteStock ? "관심종목 해제" : "관심종목 등록"}" title="${favoriteStock ? "관심종목 해제" : "관심종목 등록"}">${favoriteStock ? "♥" : "♡"}</button>
          <button type="button" data-action="generate-ai" data-stock="${escapeHtml(key)}" aria-label="AI 분석" title="AI 분석">✦</button>
          <button type="button" data-action="route" data-route="compare" data-param="${escapeHtml(key)}" aria-label="종목 비교" title="종목 비교">⋯</button>
        </div>
      </div>
      <div class="stock-mobile-name">
        <strong>${escapeHtml(stock.name)}</strong>
        <span>${escapeHtml(stock.ticker)} · ${escapeHtml(stock.market)}</span>
      </div>
    </div>
  `;
  const memo = userDoc?.memos?.[key] || "";
  const analysis = findAnalysis(key);
  const comments = state.data.pickComments[stock.id] || state.data.pickComments[key] || [];
  const stockChartMode = state.filters.stockChartMode === "line" ? "line" : "candles";
  const stockChartFrame = chartFrameId(state.filters.stockChartFrame);
  const stockMinuteInterval = minuteIntervalId(state.filters.stockMinuteInterval);
  const stockChartRange = chartRangeId(state.filters.stockChartRange);
  const stockDetailTab = state.filters.stockDetailTab || "chart";
  const stockQuoteTab = state.filters.stockQuoteTab || "materials";
  const stockWorkTab = state.filters.stockWorkTab || "analysis";
  const historyCandles = applyChartRange(stockChartCandlesForFrame(stock, stockChartFrame, stockMinuteInterval), stockChartFrame, stockChartRange);
  const historyValues = chartValuesFromCandles(historyCandles);
  const chartHistoryKey = chartHistoryStoreKey(key, stockChartFrame, stockMinuteInterval);
  const historyMeta = state.historyMeta.get(chartHistoryKey) || state.historyMeta.get(key) || {};
  const historyStamp = chartMetaStamp(key, stockChartFrame, stockMinuteInterval, historyCandles.length);
  const extras = state.stockExtras.get(key) || {};
  const fundamentals = extras.fundamentals || {};
  const discussion = state.stockDiscussions.get(key) || {};
  if (shouldLoadChartHistory(key, stockChartFrame, stockMinuteInterval)) {
    queueMicrotask(() => loadHistory(key, { silent: true, frame: stockChartFrame, interval: stockMinuteInterval }));
  }
  if (!stock.source && !state.quoteAttempted.has(key) && !state.quoteBusy.has(key)) {
    queueMicrotask(() => refreshStockQuote(key, { silent: true }));
  }
  if (!state.stockExtras.has(key) && !state.stockExtrasBusy.has(key)) {
    queueMicrotask(() => loadStockExtras(key, { silent: true }));
  }
  if (isDomesticStock(stock) && !state.stockDiscussions.has(key) && !state.stockDiscussionsBusy.has(key)) {
    queueMicrotask(() => loadStockDiscussions(key, { silent: true }));
  }
  const currentPrice = Number(stock.currentPrice || stock.price || stock.closedPrice || 0);
  const quoteValueLabel = stock.tradingValue ? "거래대금" : fundamentals.marketCap ? "시가총액" : "거래대금";
  const quoteValue = stock.tradingValue ? formatTradingValue(stock.tradingValue) : fundamentals.marketCap ? formatMarketCap(fundamentals.marketCap, stock.market) : "-";
  const stockHeaderActions = `
    <button class="btn stock-icon-action" data-action="route" data-route="capture" aria-label="목록"><span>‹</span><b>목록</b></button>
    <button class="btn stock-icon-action" data-action="route" data-route="compare" data-param="${escapeHtml(key)}" aria-label="비교"><span>↔</span><b>비교</b></button>
    ${stockPick ? `<button class="btn stock-icon-action ${favoritePick ? "danger" : ""}" data-action="toggle-favorite-pick" data-pick="${escapeHtml(stock.id)}" aria-label="${favoritePick ? "관심추천주 해제" : "관심추천주"}"><span>✦</span><b>추천</b></button>` : ""}
    <button class="btn stock-icon-action ${favoriteStock ? "danger" : ""}" data-action="toggle-favorite-stock" data-stock="${escapeHtml(key)}" aria-label="${favoriteStock ? "관심 해제" : "관심 등록"}"><span>${favoriteStock ? "♥" : "♡"}</span><b>관심</b></button>
    <button class="btn stock-icon-action accent" data-action="generate-ai" data-stock="${escapeHtml(key)}" aria-label="${analysis ? "AI 재분석" : "AI 분석"}"><span>✦</span><b>AI</b></button>
  `;
  return `
    ${mobileStockHeader}
    ${renderPageHead("Stock Detail", `${stock.name}`, `${stock.ticker} · ${stock.market}`, stockHeaderActions)}
    <div class="split">
      <div class="stack">
        <section class="card stock-overview">
          <div class="detail-hero">
            <div>
              <div class="desktop-stock-name"><strong>${escapeHtml(stock.name)}</strong><span>${escapeHtml(stock.ticker)} · ${escapeHtml(stock.market)}</span></div>
              <div class="price-main num">${fmtMoney(stock.currentPrice || stock.price || stock.closedPrice, stock.market)}</div>
              <div class="${changeClass(stock.changeRate || pickReturn(stock))} section">${fmtPct(stock.changeRate || pickReturn(stock))}</div>
              <p class="subtext">${escapeHtml(stock.reason || "관심종목으로 등록한 종목입니다.")}</p>
              <div class="data-line section">${dataSourceBadge(stock, "SNAPSHOT")}<span>${escapeHtml(dataSourceStamp(stock, "추천/관심종목 스냅샷"))}</span></div>
            </div>
            <div class="detail-action-cluster">
              <div class="desktop-detail-actions">${stockHeaderActions}</div>
              <div class="row wrap"><span class="badge">${escapeHtml(stock.category || stock.pattern || "STOCK")}</span><span class="badge ${stock.market === "US" ? "warn" : "good"}">${escapeHtml(stock.market)}</span></div>
            </div>
          </div>
        </section>
        <nav class="stock-detail-tabs" aria-label="종목 상세 탭">
          <button class="${stockDetailTab === "chart" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="chart" data-target=".stock-chart-panel">차트</button>
          <button class="${stockDetailTab === "quote" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="quote" data-target=".stock-quote-panel">시세</button>
          <button class="${stockDetailTab === "mine" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="mine" data-target=".stock-work-panel">내 주식</button>
          <button class="${stockDetailTab === "info" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="info" data-target=".stock-fundamentals-panel">종목정보</button>
          <button class="${stockDetailTab === "community" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="community" data-target=".stock-discussion-panel, .stock-work-comments">커뮤니티</button>
        </nav>
        <section class="panel stock-chart-panel">
          <div class="panel-head wrap"><div><h2>차트</h2><p class="subtext">${escapeHtml(historyStamp)}</p></div><div class="row wrap"><div class="tabs compact"><button class="tab ${stockChartMode === "candles" ? "active" : ""}" data-action="stock-chart-mode" data-mode="candles">캔들</button><button class="tab ${stockChartMode === "line" ? "active" : ""}" data-action="stock-chart-mode" data-mode="line">라인</button></div></div></div>
          <div class="panel-body">
            ${renderChartFrameControls("stock", stockChartFrame, stockMinuteInterval)}
            ${stockChartMode === "candles"
              ? `<div class="stock-chart-legend"><span><i style="--swatch:#ef4444"></i>상승</span><span><i style="--swatch:#3b82f6"></i>하락</span><span><i style="--swatch:#10b981"></i>MA5</span><span><i style="--swatch:#f59e0b"></i>MA20</span><span><i style="--swatch:#8b5cf6"></i>MA60</span></div><div class="stock-chart-shell"><div class="stock-chart-selection" data-chart-selection aria-live="polite"><span data-chart-selection-date>최근</span><b class="num" data-chart-selection-price>-</b><span data-chart-selection-change>-</span></div><div class="chart-box stock-candles"><canvas data-chart="ohlc" data-points="${escapeHtml(JSON.stringify(historyCandles))}" data-market="${escapeHtml(stock.market || "KS")}" data-averages="true" tabindex="0" aria-label="${escapeHtml(stock.name)} ${chartFrameLabel(stockChartFrame, stockMinuteInterval)} 차트"></canvas></div></div>`
              : `<div class="line-chart-shell"><div class="stock-chart-selection" data-chart-selection aria-live="polite"><span data-chart-selection-date>최근</span><b class="num" data-chart-selection-price>-</b><span data-chart-selection-change>-</span></div><div class="chart-box stock-candles"><canvas data-chart="line" data-values="${historyValues.join(",")}" data-market="${escapeHtml(stock.market || "KS")}" data-color="accent" data-line-interactive="true" tabindex="0" aria-label="${escapeHtml(stock.name)} ${chartFrameLabel(stockChartFrame, stockMinuteInterval)} 라인 차트"></canvas></div></div>`}
            ${renderChartRangeControls("stock", stockChartFrame, stockChartRange)}
          </div>
        </section>
        <div class="trade-action-row">
          <button class="trade-action sell" data-action="route" data-route="compare" data-param="${escapeHtml(key)}">종목 비교</button>
          <button class="trade-action buy" data-action="generate-ai" data-stock="${escapeHtml(key)}">AI 분석</button>
        </div>
        <section class="grid grid-4">
          ${renderKpi("매수가", fmtMoney(stock.buyPrice, stock.market))}
          ${renderKpi("목표가", fmtMoney(stock.targetPrice, stock.market))}
          ${renderKpi("예상수익", fmtPct(pickReturn(stock, stock.targetPrice)), changeClass(pickReturn(stock, stock.targetPrice)))}
          ${renderKpi("현재수익", fmtPct(pickReturn(stock)), changeClass(pickReturn(stock)))}
          ${renderKpi("현재가 출처", dataSourceLabel(stock, "스냅샷"))}
          ${renderKpi("현재가 시각", stock.marketTime ? fmtDateTime(stock.marketTime) : "-")}
          ${renderKpi("차트 출처", historyMeta.source || "추정")}
          ${renderKpi("차트 포인트", fmtNum(historyMeta.points || historyValues.length))}
        </section>
      </div>
      <aside class="stock-quote-stack">
        <section class="panel stock-quote-panel">
          <div class="stock-work-tabs" aria-label="시세 패널">
            <button class="${stockQuoteTab === "quote" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="quote" data-target=".stock-quote-panel">시세</button>
            <button type="button" data-action="route" data-route="investor-flow">수급</button>
            <button class="${stockQuoteTab === "materials" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="materials" data-target=".stock-sources-panel">재료</button>
            <button class="stock-work-more" type="button" data-action="route" data-route="markets">+</button>
          </div>
          <div class="stock-quote-body">
            <div class="stock-live-price">
              <span>${escapeHtml(dataSourceLabel(stock, "스냅샷"))}</span>
              <strong class="num">${fmtMoney(currentPrice, stock.market)}</strong>
              <b class="${changeClass(stock.changeRate || pickReturn(stock))}">${fmtPct(stock.changeRate || pickReturn(stock))}</b>
              <small>${escapeHtml(dataSourceStamp(stock, "자동 동기화 대기"))}</small>
            </div>
            <div class="stock-live-grid">
              <div><span>시가</span><strong>${fmtMoney(currentPrice * 0.98, stock.market)}</strong></div>
              <div><span>고가</span><strong class="up">${fmtMoney(currentPrice * 1.04, stock.market)}</strong></div>
              <div><span>저가</span><strong class="down">${fmtMoney(currentPrice * 0.96, stock.market)}</strong></div>
              <div><span>${escapeHtml(quoteValueLabel)}</span><strong>${escapeHtml(quoteValue)}</strong></div>
            </div>
            <div class="stock-signal-list">
              <div class="stock-signal-row"><span>목표가</span><strong>${fmtMoney(stock.targetPrice, stock.market)}</strong><b class="${changeClass(pickReturn(stock, stock.targetPrice))}">${fmtPct(pickReturn(stock, stock.targetPrice))}</b></div>
              <div class="stock-signal-row"><span>매수가</span><strong>${fmtMoney(stock.buyPrice, stock.market)}</strong><b>${stock.buyPrice ? "기준가" : "-"}</b></div>
              <div class="stock-signal-row"><span>차트</span><strong>${escapeHtml(historyMeta.source || "자동 조회")}</strong><b>${fmtNum(historyMeta.points || historyValues.length)}개</b></div>
              <div class="stock-signal-row"><span>AI</span><strong>${analysis ? escapeHtml(analysis.scoreLabel || "분석 완료") : "분석 대기"}</strong><b>${analysis ? `${fmtNum(analysis.score, 0)}점` : "-"}</b></div>
            </div>
          </div>
        </section>
        <section class="panel stock-fundamentals-panel">
          <div class="panel-head"><h2>재무지표</h2><span class="muted">${state.stockExtrasBusy.has(key) ? "자동 조회 중" : "자동 동기화"}</span></div>
          <div class="panel-body grid grid-4">
            ${renderKpi("PER", formatRatio(fundamentals.per))}
            ${renderKpi("PBR", formatRatio(fundamentals.pbr))}
            ${renderKpi("선행 PER", formatRatio(fundamentals.forwardPer))}
            ${renderKpi("시가총액", formatMarketCap(fundamentals.marketCap, stock.market))}
            ${renderKpi("매출", formatMarketCap(fundamentals.revenue, stock.market))}
            ${renderKpi("영업이익", formatMarketCap(fundamentals.operatingProfit, stock.market))}
            ${renderKpi("순이익", formatMarketCap(fundamentals.netIncome, stock.market))}
            ${renderKpi("재무 출처", fundamentals.source?.includes("OpenDART") ? "DART" : (fundamentals.source || "-"))}
          </div>
        </section>
        <section class="panel stock-sources-panel">
          <div class="panel-head"><h2>뉴스/공시/근거</h2></div>
          <div class="panel-body source-list">
            ${renderStockSources(stock, analysis, extras)}
          </div>
        </section>
        ${isDomesticStock(stock) ? renderStockDiscussionPanel(stock, key, discussion) : ""}
      </aside>
      <aside class="stock-side-stack">
        <section class="panel stock-work-panel">
          <div class="stock-work-tabs" aria-label="종목 작업 패널">
            <button class="${stockWorkTab === "analysis" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="analysis" data-target=".stock-work-analysis">일반분석</button>
            <button class="${stockWorkTab === "memo" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="memo" data-target=".stock-work-memo">메모</button>
            <button class="${stockWorkTab === "comments" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="comments" data-target=".stock-work-comments">커뮤니티</button>
            <button class="stock-work-more" data-action="route" data-route="ai" type="button">+</button>
          </div>
          <div class="stock-work-body">
            <div class="stock-work-segment" aria-label="분석 유형">
              <button class="${stockWorkTab === "analysis" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="analysis" data-target=".stock-work-analysis">AI</button>
              <button class="${stockWorkTab === "memo" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="memo" data-target=".stock-work-memo">메모</button>
              <button class="${stockWorkTab === "comments" ? "active" : ""}" type="button" data-action="scroll-stock-section" data-tab="comments" data-target=".stock-work-comments">댓글</button>
            </div>
            <div class="stock-order-like">
              <div class="stock-order-row"><span>현재가</span><strong>${fmtMoney(currentPrice, stock.market)}</strong></div>
              <div class="stock-order-row"><span>목표가</span><strong>${fmtMoney(stock.targetPrice, stock.market)}</strong></div>
              <div class="stock-order-row"><span>예상수익</span><strong class="${changeClass(pickReturn(stock, stock.targetPrice))}">${fmtPct(pickReturn(stock, stock.targetPrice))}</strong></div>
              <div class="stock-order-row"><span>데이터</span><strong>${escapeHtml(dataSourceLabel(stock, "스냅샷"))}</strong></div>
            </div>
            <section class="stock-work-section stock-work-analysis">
              <div class="stock-work-section-head"><strong>AI 분석</strong><button class="link-button" data-action="route" data-route="ai">목록</button></div>
              ${analysis ? renderAnalysisSummaryCard(analysis) : `<div class="empty compact">바로 AI 분석을 생성할 수 있습니다.</div>`}
              <button class="trade-action buy stock-work-primary" data-action="generate-ai" data-stock="${escapeHtml(key)}">${analysis ? "AI 재분석" : "AI 분석"}</button>
            </section>
            <section class="stock-work-section stock-work-memo">
              <div class="stock-work-section-head"><strong>메모</strong><span class="muted">내 기록</span></div>
              <form class="form" data-form="memo">
                <input type="hidden" name="stockKey" value="${escapeHtml(key)}" />
                <textarea class="textarea" name="memo" placeholder="투자 메모">${escapeHtml(memo)}</textarea>
                <button class="btn primary" ${state.user ? "" : "disabled"}>메모 저장</button>
              </form>
            </section>
            <section class="stock-work-section stock-work-comments">
              <div class="stock-work-section-head"><strong>댓글</strong><span class="muted">${fmtNum(comments.length, 0)}개</span></div>
              <form class="form" data-form="pick-comment">
                <input type="hidden" name="target" value="${escapeHtml(stock.id || key)}" />
                <textarea class="textarea" name="content" placeholder="댓글 작성"></textarea>
                <button class="btn" ${state.user ? "" : "disabled"}>등록</button>
              </form>
              <div class="comment-list compact">${comments.slice(0, 2).map(renderComment).join("") || `<div class="empty compact">아직 댓글이 없습니다.</div>`}</div>
            </section>
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderKpi(label, value, className = "") {
  return `<div class="kpi"><span class="metric-label">${escapeHtml(label)}</span><b class="${className}">${escapeHtml(value)}</b></div>`;
}

function formatRatio(value) {
  const number = Number(value);
  return Number.isFinite(number) && number !== 0 ? number.toFixed(2) : "-";
}

function formatMarketCap(value, market = "KS") {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  if (market === "US") {
    if (number >= 1_000_000_000_000) return `$${fmtNum(number / 1_000_000_000_000, 1)}T`;
    if (number >= 1_000_000_000) return `$${fmtNum(number / 1_000_000_000, 1)}B`;
    return `$${fmtNum(number / 1_000_000, 1)}M`;
  }
  return formatTradingValue(number);
}

function renderStockSources(stock, analysis, extras = {}) {
  const items = [];
  const news = Array.isArray(extras.news) ? extras.news : [];
  const disclosures = Array.isArray(extras.disclosures) ? extras.disclosures : [];
  const feature = state.data.marketFeatures.find((f) => stockKey(f) === stockKey(stock));
  if (feature) items.push({ title: feature.title, body: feature.reason, badge: feature.pattern });
  if (news.length) {
    items.push(...news.slice(0, 5).map((item) => ({ title: item.title, body: [item.publisher, fmtDateTime(item.publishedAt)].filter(Boolean).join(" · "), badge: "뉴스", url: item.url })));
  }
  if (disclosures.length) {
    items.push(...disclosures.slice(0, 5).map((item) => ({
      title: item.title,
      body: [item.submitter, item.date, item.source].filter(Boolean).join(" · "),
      badge: "공시",
      url: item.url
    })));
  }
  if (analysis?.sourceNews?.length) {
    items.push(...analysis.sourceNews.slice(0, 3).map((n) => ({ title: n.title, body: n.publisher || n.publishedAt || "", badge: "AI 뉴스", url: n.url })));
  }
  if (analysis?.sourceDisclosures?.length) {
    items.push(...analysis.sourceDisclosures.slice(0, 3).map((n) => ({ title: n.title, body: n.submitter || n.date || "", badge: "공시" })));
  }
  if (!items.length) {
    items.push(
      { title: "시세/차트 데이터", body: "로컬 프록시 또는 Firebase Functions를 통해 Yahoo/Naver 계열 시세를 조회합니다.", badge: "시세" },
      { title: "재무지표", body: "Firebase Functions의 AI 분석 생성 시 KIS/DART/네이버 밸류에이션 스냅샷이 근거로 저장됩니다.", badge: "재무" }
    );
  }
  return items.map((item) => `
    <div class="source-item">
      <div class="row-between">${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(item.title)}</strong></a>` : `<strong>${escapeHtml(item.title)}</strong>`}<span class="badge">${escapeHtml(item.badge)}</span></div>
      <p class="subtext">${escapeHtml(item.body)}</p>
    </div>
  `).join("");
}

function isDomesticStock(stock) {
  const market = String(stock?.market || "").toUpperCase();
  return ["KS", "KQ"].includes(market) && /^\d{4,6}$/.test(String(stock?.ticker || ""));
}

function renderStockDiscussionPanel(stock, key, discussion = {}) {
  const busy = state.stockDiscussionsBusy.has(key);
  const items = Array.isArray(discussion.items) ? discussion.items : [];
  const source = discussion.source || "Naver Finance Board";
  const stamp = discussion.updatedAt ? ` · ${fmtDateTime(discussion.updatedAt)}` : "";
  const body = busy && !items.length
    ? `<div class="empty">토론방을 불러오는 중입니다.</div>`
    : (items.length
      ? items.map((item) => `
          <div class="source-item">
            <div class="row-between">
              <a href="${escapeHtml(item.mobileUrl || item.url || "#")}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(item.title || "토론방 글")}</strong></a>
              <span class="badge">토론</span>
            </div>
            <p class="subtext">${escapeHtml([item.date, item.viewCount ? `조회 ${fmtNum(item.viewCount)}` : ""].filter(Boolean).join(" · "))}</p>
          </div>
        `).join("")
      : `<div class="empty">${discussion.error ? "토론방을 불러오지 못했습니다." : "최근 토론방 글이 없습니다."}</div>`);
  return `
    <section class="panel stock-discussion-panel">
      <div class="panel-head">
        <h2>종목토론방</h2>
        <div class="row wrap"><span class="muted">${escapeHtml(source)}${escapeHtml(stamp)}</span></div>
      </div>
      <div class="panel-body source-list">${body}</div>
    </section>
  `;
}

function getStockByKey(key) {
  const decoded = decodeURIComponent(key || "");
  const all = [
    ...state.data.stockPicks,
    ...state.data.marketFeatures,
    ...state.discoveredStocks.values(),
    ...Object.values(state.user ? getUserDoc().favoriteStocks || {} : {}),
    ...state.data.journals.map((journal) => ({ ...journal, name: journal.stockName, currentPrice: journal.price }))
  ];
  const found = all.find((item) => item.id === decoded || stockKey(item) === decoded);
  if (found) return normalizeStockLike(found);
  const fallbackPick = makeSeedData().stockPicks.find((item) => item.id === decoded || stockKey(item) === decoded || item.ticker === decoded);
  if (fallbackPick) return normalizeStockLike(realignFallbackPick(normalizePick(fallbackPick)));
  return null;
}

function normalizeStockLike(item) {
  return normalizePick({
    ...item,
    id: item.id || stockKey(item),
    buyPrice: item.buyPrice || item.price || item.currentPrice || 0,
    targetPrice: item.targetPrice || Number(item.price || item.currentPrice || 0) * 1.12,
    currentPrice: item.currentPrice || item.price,
    reason: item.reason || item.title,
    category: item.category || item.pattern || item.group || "관심종목",
    status: item.status || "active"
  });
}

function getHistoryValues(stock) {
  const key = stockKey(stock);
  if (state.histories.has(key)) return state.histories.get(key).map((p) => Number(p.close || p));
  return sampleHistory(stock.currentPrice || stock.price || stock.buyPrice || 100, key);
}

function chartFrameId(value) {
  return CHART_FRAMES.some((item) => item.id === value) ? value : "day";
}

function minuteIntervalId(value) {
  return MINUTE_INTERVALS.some((item) => item.id === value) ? value : "60m";
}

function minuteIntervalConfig(value) {
  return MINUTE_INTERVALS.find((item) => item.id === minuteIntervalId(value)) || MINUTE_INTERVALS.at(-1);
}

function chartRangeId(value) {
  return CHART_RANGES.some((item) => item.id === value) ? value : "1y";
}

function chartFrameLabel(frame, interval = "60m") {
  if (frame === "minute") return `${minuteIntervalConfig(interval).label} 분봉`;
  return CHART_FRAMES.find((item) => item.id === chartFrameId(frame))?.label || "일봉";
}

function chartHistoryStoreKey(baseKey, frame = "day", interval = "60m") {
  return chartFrameId(frame) === "minute" ? `${baseKey}:minute:${minuteIntervalId(interval)}` : baseKey;
}

function chartAttemptKey(historyKey, range, interval) {
  return `${historyKey}:${range}:${interval}`;
}

function chartRequestConfig(frame = "day", interval = "60m") {
  if (chartFrameId(frame) === "minute") {
    const config = minuteIntervalConfig(interval);
    return { range: config.range, interval: config.id };
  }
  return { range: "5y", interval: "1d" };
}

function renderChartFrameControls(scope, frame, interval) {
  const action = scope === "index" ? "index-chart-frame" : "stock-chart-frame";
  const minuteAction = scope === "index" ? "index-minute-interval" : "stock-minute-interval";
  return `
    <div class="chart-period-controls">
      <div class="tabs compact chart-frame-tabs">
        ${CHART_FRAMES.map((item) => `<button class="tab ${item.id === frame ? "active" : ""}" data-action="${action}" data-frame="${item.id}">${item.label}</button>`).join("")}
      </div>
      ${frame === "minute" ? `<div class="tabs compact minute-tabs">${MINUTE_INTERVALS.map((item) => `<button class="tab ${item.id === interval ? "active" : ""}" data-action="${minuteAction}" data-interval="${item.id}">${item.label}</button>`).join("")}</div>` : ""}
    </div>
  `;
}

function renderChartRangeControls(scope, frame, range) {
  const action = scope === "index" ? "index-chart-range" : "stock-chart-range";
  return `
    <div class="chart-range-row">
      <div class="chart-range-tabs" role="tablist" aria-label="차트 기간">
        ${CHART_RANGES.map((item) => `<button type="button" class="${item.id === range ? "active" : ""}" data-action="${action}" data-range="${item.id}" role="tab" aria-selected="${item.id === range ? "true" : "false"}">${item.label}</button>`).join("")}
      </div>
      <span class="chart-range-spark" aria-hidden="true">⌁</span>
    </div>
    ${frame === "minute" ? `<button class="quote-link" type="button" data-action="${action}" data-range="1d">일별·실시간 시세 보기 ›</button>` : ""}
  `;
}

function chartRangeLimit(frame, range) {
  const selectedFrame = chartFrameId(frame);
  const config = CHART_RANGES.find((item) => item.id === chartRangeId(range));
  const limit = config?.points?.[selectedFrame];
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

function applyChartRange(candles, frame, range) {
  const normalized = normalizeJournalCandles(candles);
  const limit = chartRangeLimit(frame, range);
  return limit ? normalized.slice(-limit) : normalized;
}

function stockChartCandlesForFrame(stock, frame = "day", interval = "60m") {
  const baseKey = stockKey(stock);
  const selectedFrame = chartFrameId(frame);
  const selectedInterval = minuteIntervalId(interval);
  if (selectedFrame === "minute") {
    const loaded = state.histories.get(chartHistoryStoreKey(baseKey, selectedFrame, selectedInterval));
    if (loaded?.length) return normalizeJournalCandles(loaded);
    return estimatedIntradayCandles(stock, selectedInterval);
  }
  const daily = journalChartCandles(stock);
  if (selectedFrame === "week") return aggregateCandles(daily, "week");
  if (selectedFrame === "month") return aggregateCandles(daily, "month");
  return daily;
}

function chartValuesFromCandles(candles) {
  return candles.map((point) => Number(point.close)).filter(Number.isFinite);
}

function chartMetaStamp(baseKey, frame, interval, visiblePoints) {
  const historyKey = chartHistoryStoreKey(baseKey, frame, interval);
  const request = chartRequestConfig(frame, interval);
  const meta = state.historyMeta.get(historyKey) || (frame !== "minute" ? state.historyMeta.get(baseKey) : null);
  const label = chartFrameLabel(frame, interval);
  if (meta?.source) return `${meta.source} · ${fmtNum(visiblePoints || meta.points || 0)}개 ${label}`;
  if (state.historyBusy.has(historyKey)) return `${label} 조회 중`;
  if (state.historyAttempted.has(chartAttemptKey(historyKey, request.range, request.interval)) || state.historyAttempted.has(historyKey)) {
    return `차트 API 실패 · 로컬 추정 ${label}`;
  }
  return `로컬 추정 ${label}`;
}

function shouldLoadChartHistory(baseKey, frame, interval) {
  const historyKey = chartHistoryStoreKey(baseKey, frame, interval);
  const request = chartRequestConfig(frame, interval);
  if (state.historyBusy.has(historyKey)) return false;
  if (state.historyAttempted.has(chartAttemptKey(historyKey, request.range, request.interval)) && !state.histories.has(historyKey)) return false;
  if (chartFrameId(frame) === "minute") return !state.histories.has(historyKey);
  const loaded = state.histories.get(baseKey);
  const meta = state.historyMeta.get(baseKey);
  return !loaded?.length || (loaded.length < 500 && meta?.range !== "5y");
}

function sampleHistory(base, key) {
  const seed = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const out = [];
  let price = Number(base) || 100;
  for (let i = 0; i < 80; i += 1) {
    const wave = Math.sin((i + seed) / 7) * 0.012 + Math.cos((i + seed) / 13) * 0.008;
    price *= 1 + wave;
    out.push(Math.max(1, Math.round(price * 100) / 100));
  }
  return out;
}

function renderMarkets() {
  const m = state.data.market;
  const sentiment = m.sentiment;
  const sectorData = m.marketSectors;
  const nightFutures = normalizeNightFutures(m.nightFutures);
  const renderSectorList = (items, kind) => (items?.length
    ? items.map((item) => `
        <div class="source-item">
          <div class="row-between"><strong>${escapeHtml(item.name)}</strong><span class="${kind}">${fmtPct(item.rate)}</span></div>
        </div>
      `).join("")
    : `<div class="empty">업종 데이터를 불러오는 중입니다.</div>`);
  return `
    ${renderPageHead("Realtime Market", "실시간 시장/지수", "국내외 지수, 환율, 선물, 시장 심리, 수급, 펨코 지수를 웹 대시보드로 정리했습니다.")}
    <div class="stack">
      <div class="grid grid-3">${m.indices.map(renderIndexCard).join("")}</div>
      <div class="grid grid-3">
        ${renderMarketSentimentCard(sentiment)}
        ${renderKpiCard("외국인 수급", `${fmtNum(sentiment.foreignFlow)}억`, "KOSPI 순매수 추정", sentiment.foreignFlow >= 0 ? "up" : "down")}
        ${renderKpiCard("선물 베이시스", fmtNum(sentiment.futuresBasis, 2), "프로그램 방향성 체크", sentiment.futuresBasis >= 0 ? "up" : "down")}
      </div>
      ${renderNightFuturesPanel(nightFutures)}
      <section class="panel">
        <div class="panel-head">
          <h2>업종 등락 · 시장 폭</h2>
          <span class="badge ${state.marketSectorsBusy ? "warn" : "good"}">${state.marketSectorsBusy ? "동기화 중" : "자동 동기화"}</span>
        </div>
        <div class="panel-body stack">
          <p class="subtext">${escapeHtml(sectorData.source || "로컬 스냅샷")}${sectorData.updatedAt ? ` · ${escapeHtml(fmtDateTime(sectorData.updatedAt))}` : ""} · ${escapeHtml(sectorData.basis || "업종별 시세 · ETF/ETN 제외")}</p>
          <div class="grid grid-2">
            <div>
              <h3>상승 업종</h3>
              <div class="source-list section">${renderSectorList(sectorData.sectors.up, "up")}</div>
            </div>
            <div>
              <h3>하락 업종</h3>
              <div class="source-list section">${renderSectorList(sectorData.sectors.down, "down")}</div>
            </div>
          </div>
          <div class="table-wrap">
            <table class="responsive-table">
              <thead><tr><th>시장</th><th>상승</th><th>하락</th><th>보합</th><th>기준</th></tr></thead>
              <tbody>
                ${["kospi", "kosdaq"].map((market) => {
                  const breadth = sectorData.breadth[market];
                  return `<tr><td data-label="시장">${market.toUpperCase()}</td><td data-label="상승" class="up">${fmtNum(breadth.up)}개</td><td data-label="하락" class="down">${fmtNum(breadth.down)}개</td><td data-label="보합">${fmtNum(breadth.flat)}개</td><td data-label="기준">${escapeHtml(breadth.excludes || "ETF/ETN 제외")}</td></tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <div class="split">
        <section class="panel">
          <div class="panel-head"><h2>수급</h2><div class="row wrap"><span class="badge">${escapeHtml(m.investorFlow.date)}</span><button class="btn" data-action="route" data-route="investor-flow">마감수급 상세</button></div></div>
          <div class="panel-body">
            <p class="subtext">${escapeHtml(m.investorFlow.source || "로컬 스냅샷")}</p>
            <div class="table-wrap">
              <table class="responsive-table">
                <thead><tr><th>시장</th><th>외국인</th><th>기관</th><th>개인</th></tr></thead>
                <tbody>
                  ${["kospi", "kosdaq"].map((market) => {
                    const flow = m.investorFlow[market];
                    return `<tr><td data-label="시장">${market.toUpperCase()}</td><td data-label="외국인" class="${changeClass(flow.foreign)}">${fmtNum(flow.foreign)}억</td><td data-label="기관" class="${changeClass(flow.institution)}">${fmtNum(flow.institution)}억</td><td data-label="개인" class="${changeClass(flow.retail)}">${fmtNum(flow.retail)}억</td></tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>펨코 지수</h2><div class="row wrap"><span class="badge good">${escapeHtml(m.fmkorea.label)}</span><button class="btn" data-action="route" data-route="fmkorea-index">지수 상세</button></div></div>
          <div class="panel-body stack">
            <div class="row-between">
              <div class="ai-score" style="--score:${m.fmkorea.score}%"><span>${m.fmkorea.score}<small>관심도</small></span></div>
              <p class="subtext">커뮤니티 언급량과 종목 집중도를 함께 보는 보조 지표입니다.${m.fmkorea.latestCount ? ` 최근 집계 ${fmtNum(m.fmkorea.latestCount)}글.` : ""}${m.fmkorea.source ? ` 출처 ${escapeHtml(m.fmkorea.source)}.` : ""}</p>
            </div>
            ${m.fmkorea.hot.map((item) => `
              <div class="source-item" data-action="open-stock" data-stock="${escapeHtml(item.market || "KS")}_${escapeHtml(item.ticker)}">
                <div class="row-between"><strong>${escapeHtml(item.name)}</strong><span class="badge up">${item.postCount != null ? `${fmtNum(item.postCount)}글` : `+${item.change}`}</span></div>
                <p class="subtext">언급 ${fmtNum(item.count)}회</p>
              </div>
            `).join("")}
            <button class="btn" data-action="route" data-route="fmkorea-hot">HOT 종목 전체</button>
          </div>
        </section>
      </div>
      ${renderInvestorTop5(m.investorFlow)}
      <section class="panel">
        <div class="panel-head"><h2>시장 분석 글</h2>${isAdmin() ? `<button class="btn primary" data-action="modal" data-modal="market-analysis">시황 작성</button>` : ""}</div>
        <div>${state.data.marketAnalyses.map(renderMarketAnalysisRow).join("") || `<div class="panel-body"><div class="empty">등록된 시황 분석이 없습니다.</div></div>`}</div>
      </section>
    </div>
  `;
}

function renderMarketSentimentCard(sentiment) {
  return `
    <div class="card metric">
      <div class="row-between">
        <div class="metric-label">시장 심리</div>
        <button class="btn mini" data-action="route" data-route="market-sentiment">상세</button>
      </div>
      <div class="metric-value good">${escapeHtml(`${sentiment.score}점`)}</div>
      <div class="metric-foot">${escapeHtml(sentiment.label || "CNN Fear & Greed")}</div>
    </div>
  `;
}

function renderMarketSentimentDetail() {
  const sentiment = state.data.market.sentiment || {};
  const rawIndicators = Array.isArray(sentiment.indicators) ? sentiment.indicators : [];
  const indicators = normalizeSentimentIndicators(rawIndicators);
  const spread = sentimentIndicatorSpread(indicators);
  const copperGold = sentimentIndicatorRatio(indicators, "copper", "gold");
  if (!rawIndicators.length && !state.marketSentimentBusy) {
    queueMicrotask(() => refreshMarketSentiment({ withIndicators: true, silent: true }));
  }
  return `
    ${renderPageHead("Market Sentiment", "시장 심리 지표", `${sentiment.source || "CNN Fear & Greed"} · ${sentiment.updatedAt ? fmtDateTime(sentiment.updatedAt) : "상세 지표 대기"}`, `<button class="btn" data-action="route" data-route="markets">시장</button>`)}
    <div class="split">
      <section class="panel">
        <div class="panel-body stack">
          <div class="sentiment-hero">
            <div class="ai-score large" style="--score:${Number(sentiment.score || 0)}%"><span>${fmtNum(sentiment.score || 0, 0)}<small>Fear & Greed</small></span></div>
            <div>
              <span class="badge good">CNN 기준</span>
              <h2>${escapeHtml(sentiment.label || "시장 심리")}</h2>
              <p class="subtext">공포·탐욕 점수와 변동성, 금리, 달러, 원자재 지표를 함께 보며 위험 선호를 점검합니다.</p>
            </div>
          </div>
          <div class="grid grid-4">
            ${renderKpi("점수", `${fmtNum(sentiment.score || 0, 0)}점`, "good")}
            ${renderKpi("출처", sentiment.source || "CNN Fear & Greed")}
            ${renderKpi("장단기 금리차", spread == null ? "-" : `${fmtNum(spread, 2)}%p`, changeClass(spread))}
            ${renderKpi("구리/금 비율", copperGold == null ? "-" : fmtNum(copperGold, 4), changeClass(copperGold ? copperGold - 0.002 : 0))}
          </div>
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>요약</h2><span class="badge">${indicators.length}개 지표</span></div>
        <div class="panel-body stack">
          <p class="subtext">원본 앱의 시장 심리 상세 지표를 웹에서도 같은 프록시 시세로 확인합니다.</p>
          <div class="source-item"><div class="row-between"><strong>동기화</strong><span>${state.marketSentimentBusy ? "조회 중" : "자동"}</span></div></div>
        </div>
      </aside>
    </div>
    <section class="panel section">
      <div class="panel-head"><h2>핵심 지표</h2><span class="badge">${sentiment.updatedAt ? fmtDateTime(sentiment.updatedAt) : "로컬/실시간 혼합"}</span></div>
      <div class="panel-body source-list">
        ${indicators.map(renderSentimentIndicator).join("") || `<div class="empty">시장 심리 상세 지표를 불러오는 중입니다.</div>`}
      </div>
    </section>
  `;
}

function normalizeSentimentIndicators(items = []) {
  const byId = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
  return MARKET_SENTIMENT_INDICATORS.map((meta) => ({ ...meta, ...(byId.get(meta.id) || {}) }));
}

function renderSentimentIndicator(item) {
  const hasPrice = Number.isFinite(Number(item.price));
  const value = hasPrice ? `${fmtNum(item.price, item.unit === "%" ? 2 : (Number(item.price) > 100 ? 1 : 2))}${item.unit || ""}` : "-";
  const hasChangeRate = item.changeRate !== null && item.changeRate !== undefined && Number.isFinite(Number(item.changeRate));
  const changeRateText = hasChangeRate ? fmtPct(item.changeRate) : "-";
  const changeRateClass = hasChangeRate ? changeClass(item.changeRate) : "muted";
  return `
    <div class="source-item">
      <div class="row-between">
        <div><strong>${escapeHtml(item.name)}</strong><div class="ticker">${escapeHtml(item.ticker)}</div></div>
        <div class="num ${changeRateClass}">${escapeHtml(value)}<br /><span class="${changeRateClass}">${escapeHtml(changeRateText)}</span></div>
      </div>
      <p class="subtext">${escapeHtml(item.benchmark)} · ${escapeHtml(item.description)}</p>
      ${item.source ? `<div class="data-line compact"><span class="badge good">LIVE</span><span>${escapeHtml(item.source)}${item.marketTime ? ` · ${escapeHtml(fmtDateTime(item.marketTime))}` : ""}</span></div>` : ""}
    </div>
  `;
}

function sentimentIndicatorSpread(indicators) {
  const tenYear = Number(indicators.find((item) => item.id === "tnx")?.price);
  const threeMonth = Number(indicators.find((item) => item.id === "irx")?.price);
  return Number.isFinite(tenYear) && Number.isFinite(threeMonth) ? tenYear - threeMonth : null;
}

function sentimentIndicatorRatio(indicators, leftId, rightId) {
  const left = Number(indicators.find((item) => item.id === leftId)?.price);
  const right = Number(indicators.find((item) => item.id === rightId)?.price);
  return Number.isFinite(left) && Number.isFinite(right) && right !== 0 ? left / right : null;
}

function renderNightFuturesPanel(nightFutures = normalizeNightFutures()) {
  const values = nightFutures.history.map((point) => point.price).filter(Number.isFinite);
  const changeValue = nightFutures.changeRate ?? nightFutures.change;
  const statusClass = nightFutures.available ? changeClass(changeValue) : "muted";
  const statusLabel = nightFutures.available ? "KIS 스냅샷" : (nightFutures.configured ? "수집 대기" : "연동 대기");
  const sessionLabel = `${nightFutures.symbol || "A0----"} · 야간세션 ${nightFutures.session.label}`;
  const stamp = [
    nightFutures.source,
    nightFutures.updatedAt ? fmtDateTime(nightFutures.updatedAt) : "",
    nightFutures.session.active ? "세션 진행" : "세션 대기"
  ].filter(Boolean).join(" · ");
  return `
    <section class="panel night-futures-panel">
      <div class="panel-head">
        <h2>KOSPI200 야간선물</h2>
        <div class="row wrap">
          <span class="badge ${nightFutures.available ? "good" : "warn"}">${escapeHtml(statusLabel)}</span>
          <button class="btn" data-action="route" data-route="night-futures">상세</button>
        </div>
      </div>
      <div class="panel-body stack">
        <div class="night-futures-summary">
          <div>
            <div class="metric-label">${escapeHtml(sessionLabel)}</div>
            <div class="night-futures-price ${statusClass}">
              <span>${nightFutures.price != null ? fmtNum(nightFutures.price, 2) : "-"}</span>
              <small>pt</small>
            </div>
            <div class="metric-foot ${statusClass}">${fmtPct(nightFutures.changeRate)} · ${nightFutures.change != null ? `${fmtNum(nightFutures.change, 2)}pt` : "-"}</div>
          </div>
          <div class="night-futures-meta">
            <span class="badge ${nightFutures.session.active ? "good" : ""}">${nightFutures.session.active ? "야간장" : "정규장"}</span>
            <span class="badge">${escapeHtml(nightFutures.mode)}</span>
          </div>
        </div>
        <p class="subtext">${escapeHtml(stamp || "KIS OpenAPI")} ${nightFutures.message ? `· ${escapeHtml(nightFutures.message)}` : ""}</p>
        ${values.length >= 2
          ? `<div class="chart-box compact"><canvas data-chart="line" data-values="${values.join(",")}" data-color="accent"></canvas></div>`
          : `<div class="empty">KIS 야간선물 스냅샷 대기 중입니다.</div>`}
      </div>
    </section>
  `;
}

function renderNightFuturesDetail() {
  const nightFutures = normalizeNightFutures(state.data.market.nightFutures);
  const values = nightFutures.history.map((point) => point.price).filter(Number.isFinite);
  const statusClass = nightFutures.available ? changeClass(nightFutures.changeRate ?? nightFutures.change) : "muted";
  const actions = `<button class="btn" data-action="route" data-route="markets">시장</button>`;
  const stamp = [
    nightFutures.source,
    nightFutures.updatedAt ? fmtDateTime(nightFutures.updatedAt) : "",
    nightFutures.session.date ? `세션 ${nightFutures.session.date}` : ""
  ].filter(Boolean).join(" · ");
  return `
    ${renderPageHead("Night Futures", "KOSPI200 야간선물", `${nightFutures.symbol || "A0----"} · 야간세션 ${nightFutures.session.label}`, actions)}
    <div class="split">
      <section class="panel">
        <div class="panel-body stack">
          <div class="detail-hero">
            <div>
              <div class="metric-label">${escapeHtml(stamp || "KIS OpenAPI")}</div>
              <div class="price-main ${statusClass}">${nightFutures.price != null ? fmtNum(nightFutures.price, 2) : "-"} <span class="unit">pt</span></div>
              <div class="metric-foot ${statusClass}">${fmtPct(nightFutures.changeRate)} · ${nightFutures.change != null ? `${fmtNum(nightFutures.change, 2)}pt` : "-"}</div>
            </div>
            <div class="night-futures-meta">
              <span class="badge ${nightFutures.available ? "good" : "warn"}">${nightFutures.available ? "스냅샷 있음" : "스냅샷 대기"}</span>
              <span class="badge ${nightFutures.configured ? "good" : "warn"}">${nightFutures.configured ? "KIS 설정" : "연동 대기"}</span>
              <span class="badge ${nightFutures.session.active ? "good" : ""}">${nightFutures.session.active ? "세션 진행" : "세션 대기"}</span>
            </div>
          </div>
          ${values.length >= 2
            ? `<div class="chart-box night-futures"><canvas data-chart="line" data-values="${values.join(",")}" data-color="accent"></canvas></div>`
            : `<div class="empty">KIS 야간선물 히스토리 수집 대기 중입니다.</div>`}
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>상태</h2><span class="badge">${escapeHtml(nightFutures.mode)}</span></div>
        <div class="panel-body stack">
          <div class="source-item"><div class="row-between"><strong>단축코드</strong><span class="ticker">${escapeHtml(nightFutures.symbol || "-")}</span></div></div>
          <div class="source-item"><div class="row-between"><strong>출처</strong><span>${escapeHtml(nightFutures.source || "KIS OpenAPI")}</span></div></div>
          <div class="source-item"><div class="row-between"><strong>히스토리</strong><span>${fmtNum(values.length)}개</span></div></div>
          <p class="subtext">${escapeHtml(nightFutures.message || "KIS 야간선물 연동 상태를 확인했습니다.")}</p>
        </div>
      </aside>
    </div>
  `;
}

function renderMarketAnalysisRow(item) {
  const comments = state.data.marketAnalysisComments?.[item.id] || [];
  return `
    <div class="list-row" data-action="route" data-route="market-analysis" data-param="${escapeHtml(item.id)}">
      <div class="row-between">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="badge">${comments.length}댓글</span>
      </div>
      <p class="subtext">${escapeHtml(item.body).slice(0, 180)}</p>
      <div class="post-meta"><span>${fmtDateTime(item.createdAt)}</span>${item.imageUrls?.length ? `<span>이미지 ${item.imageUrls.length}</span>` : ""}</div>
    </div>
  `;
}

function renderMarketAnalysisDetail() {
  const id = decodeURIComponent(state.route.param || "");
  const item = state.data.marketAnalyses.find((analysis) => analysis.id === id);
  if (!item) return renderPageHead("Market Analysis", "시황 분석을 찾을 수 없습니다", "실시간 시장 화면에서 다시 선택해주세요.", `<button class="btn" data-action="route" data-route="markets">목록</button>`);
  const comments = state.data.marketAnalysisComments?.[item.id] || [];
  const actions = `<button class="btn" data-action="route" data-route="markets">목록</button>${isAdmin() ? `<button class="btn" data-action="modal" data-modal="market-analysis" data-id="${escapeHtml(item.id)}">수정</button><button class="btn danger" data-action="delete-market-analysis" data-id="${escapeHtml(item.id)}">삭제</button>` : ""}`;
  return `
    ${renderPageHead("Market Analysis", item.title, fmtDateTime(item.createdAt), actions)}
    <div class="split">
      <section class="panel">
        <div class="panel-body stack">
          <p class="analysis-body">${escapeHtml(item.body)}</p>
          ${item.imageUrls?.length ? `<div class="image-grid">${item.imageUrls.map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(url)}" alt="${escapeHtml(item.title)} 이미지" loading="lazy" /></a>`).join("")}</div>` : ""}
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>댓글</h2><span class="badge">${comments.length}개</span></div>
        <div class="panel-body stack">
          <form class="form" data-form="market-analysis-comment">
            <input type="hidden" name="analysisId" value="${escapeHtml(item.id)}" />
            <div class="row"><input class="input" name="content" placeholder="시황 의견" /><button class="btn" ${state.user ? "" : "disabled"}>등록</button></div>
          </form>
          <div class="comment-list">${comments.map((comment) => renderComment(comment, { target: `market-analysis:${item.id}:${comment.id}` })).join("") || `<div class="empty">아직 댓글이 없습니다.</div>`}</div>
        </div>
      </aside>
    </div>
  `;
}

function renderMarketIndexDetail() {
  const index = getMarketIndex(state.route.param);
  if (!index) return renderPageHead("Market Index", "지수를 찾을 수 없습니다", "실시간 시장 화면에서 다시 선택해주세요.");
  const historyKey = `index:${index.ticker}`;
  const indexChartFrame = chartFrameId(state.filters.indexChartFrame);
  const indexMinuteInterval = minuteIntervalId(state.filters.indexMinuteInterval);
  const indexChartRange = chartRangeId(state.filters.indexChartRange);
  const chartHistoryKey = chartHistoryStoreKey(historyKey, indexChartFrame, indexMinuteInterval);
  const historyCandles = applyChartRange(marketIndexCandlesForFrame(index, indexChartFrame, indexMinuteInterval), indexChartFrame, indexChartRange);
  const historyValues = chartValuesFromCandles(historyCandles);
  const historyMeta = state.historyMeta.get(chartHistoryKey) || state.historyMeta.get(historyKey) || {};
  const updatedAt = index.marketTime ? fmtDateTime(index.marketTime) : "자동 동기화 대기";
  const chartStamp = chartMetaStamp(historyKey, indexChartFrame, indexMinuteInterval, historyValues.length);
  if (shouldLoadChartHistory(historyKey, indexChartFrame, indexMinuteInterval)) {
    queueMicrotask(() => loadMarketHistory(index.ticker, { silent: true, frame: indexChartFrame, interval: indexMinuteInterval }));
  }
  return `
    ${renderPageHead("Market Index", index.name, index.ticker, `<button class="btn" data-action="route" data-route="markets">목록</button>`)}
    <div class="split">
      <div class="stack">
        <section class="card">
          <div class="detail-hero">
            <div>
              <div class="price-main num">${fmtNum(index.value, index.value < 100 ? 2 : 1)}</div>
              <div class="${changeClass(index.changeRate)} section">${fmtPct(index.changeRate)}</div>
              <p class="subtext">${escapeHtml(dataSourceStamp(index, "seed fallback · 실시간 시세가 자동 동기화됩니다."))}</p>
            </div>
            <span class="badge ${index.source ? "good" : ""}">${index.source ? "LIVE" : "FALLBACK"}</span>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>지수 차트</h2><span class="muted">${escapeHtml(chartStamp)}</span></div>
          <div class="panel-body">
            ${renderChartFrameControls("index", indexChartFrame, indexMinuteInterval)}
            <div class="line-chart-shell">
              <div class="stock-chart-selection" data-chart-selection aria-live="polite"><span data-chart-selection-date>최근</span><b class="num" data-chart-selection-price>-</b><span data-chart-selection-change>-</span></div>
              <div class="chart-box market-index-chart"><canvas data-chart="line" data-values="${historyValues.join(",")}" data-market="INDEX" data-color="accent" data-line-interactive="true" tabindex="0" aria-label="${escapeHtml(index.name)} 지수 차트"></canvas></div>
            </div>
            ${renderChartRangeControls("index", indexChartFrame, indexChartRange)}
          </div>
        </section>
      </div>
      <aside class="stack">
        <section class="grid grid-2">
          ${renderKpi("심볼", index.ticker)}
          ${renderKpi("데이터 소스", index.source || "fallback")}
          ${renderKpi("등락률", fmtPct(index.changeRate), changeClass(index.changeRate))}
          ${renderKpi("동기화 시각", updatedAt)}
          ${renderKpi("차트 소스", historyMeta.source || "추정")}
          ${renderKpi("차트 포인트", fmtNum(historyMeta.points || historyValues.length))}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>확인 기준</h2></div>
          <div class="panel-body"><p class="subtext">국내 지수는 Naver realtime과 일봉 API를 우선 사용하고, 해외 지수·환율·선물은 Yahoo Finance 응답이 가능할 때 자동 반영합니다.</p></div>
        </section>
      </aside>
    </div>
  `;
}

function getMarketIndex(ticker) {
  const decoded = decodeURIComponent(ticker || "");
  return state.data.market.indices.find((index) => index.ticker === decoded || index.id === decoded) || null;
}

function getMarketHistoryValues(index) {
  const key = `index:${index.ticker}`;
  if (state.histories.has(key)) return state.histories.get(key).map((point) => Number(point.close || point));
  return sampleHistory(index.value || 100, key);
}

function marketIndexCandlesForFrame(index, frame = "day", interval = "60m") {
  const baseKey = `index:${index.ticker}`;
  const selectedFrame = chartFrameId(frame);
  const selectedInterval = minuteIntervalId(interval);
  if (selectedFrame === "minute") {
    const loaded = state.histories.get(chartHistoryStoreKey(baseKey, selectedFrame, selectedInterval));
    if (loaded?.length) return normalizeJournalCandles(loaded);
    return estimatedIntradayCandles({ ...index, market: index.market || "US", currentPrice: index.value, price: index.value }, selectedInterval);
  }
  const loaded = state.histories.get(baseKey);
  const daily = loaded?.length
    ? normalizeJournalCandles(loaded)
    : normalizeJournalCandles(sampleHistory(index.value || 100, baseKey).map((close, date) => ({ date, close })));
  if (selectedFrame === "week") return aggregateCandles(daily, "week");
  if (selectedFrame === "month") return aggregateCandles(daily, "month");
  return daily;
}

function renderInvestorTop5(flow) {
  const top5 = flow.top5 || null;
  if (!top5) return "";
  const groups = [
    { title: "KOSPI 외국인", items: top5.kospi?.foreign || [] },
    { title: "KOSPI 기관", items: top5.kospi?.institution || [] },
    { title: "KOSDAQ 외국인", items: top5.kosdaq?.foreign || [] },
    { title: "KOSDAQ 기관", items: top5.kosdaq?.institution || [] }
  ].filter((group) => group.items.length);
  if (!groups.length) return "";
  return `
    <section class="panel">
      <div class="panel-head"><h2>마감 수급 TOP5</h2><div class="row wrap"><span class="badge">${escapeHtml(flow.date || "")}</span><button class="btn" data-action="route" data-route="investor-flow">상세</button></div></div>
      <div class="panel-body grid grid-4">
        ${groups.map((group) => `<div class="source-item"><strong>${escapeHtml(group.title)}</strong>${group.items.slice(0, 5).map((item) => `<p class="subtext">${item.rank || "-"}위 ${escapeHtml(item.name)} · ${fmtNum(item.amount / 100, 1)}억</p>`).join("")}</div>`).join("")}
      </div>
      <div class="panel-body"><p class="subtext">${escapeHtml(flow.source || "로컬 스냅샷")}</p></div>
    </section>
  `;
}

function renderInvestorFlowDetail() {
  const flow = state.data.market.investorFlow || {};
  const groups = investorFlowGroups(flow);
  const hasTop5 = groups.some((group) => group.items.length);
  const topItem = investorFlowTopItem(groups);
  if (!hasTop5 && !state.investorFlowBusy) {
    queueMicrotask(() => refreshInvestorFlow({ silent: true }));
  }
  const actions = `<button class="btn" data-action="route" data-route="markets">시장</button><button class="btn" data-action="copy-investor-flow">공유문구 복사</button>`;
  return `
    ${renderPageHead("Investor Flow", "마감 수급", `${flow.source || "finance.naver.com"} · ${flow.date || "조회 대기"}`, actions)}
    <div class="stack">
      <section class="panel">
        <div class="panel-body stack">
          <div class="grid grid-4">
            ${renderKpi("기준일", flow.date || "-", "")}
            ${renderKpi("출처", flow.source || "로컬 스냅샷", "")}
            ${renderKpi("표시 그룹", `${groups.filter((group) => group.items.length).length}개`, "good")}
            ${renderKpi("최상위 순매수", topItem ? `${topItem.name} ${formatInvestorAmount(topItem)}` : "-", "up")}
          </div>
          <p class="subtext">원본 앱의 마감수급 상세처럼 KOSPI/KOSDAQ의 외국인·기관 순매수 TOP5를 분리해 보여줍니다.</p>
        </div>
      </section>
      <section class="grid grid-2">
        ${groups.map(renderInvestorFlowGroup).join("")}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>공유 문구</h2><span class="badge">${flow.date || "대기"}</span></div>
        <div class="panel-body">
          <pre class="share-preview">${escapeHtml(buildInvestorFlowShareText(flow))}</pre>
        </div>
      </section>
    </div>
  `;
}

function investorFlowGroups(flow = {}) {
  const top5 = flow.top5 || {};
  return [
    { id: "kospi-foreign", marketId: "kospi", market: "KOSPI", actor: "외국인", items: top5.kospi?.foreign || [] },
    { id: "kospi-institution", marketId: "kospi", market: "KOSPI", actor: "기관", items: top5.kospi?.institution || [] },
    { id: "kosdaq-foreign", marketId: "kosdaq", market: "KOSDAQ", actor: "외국인", items: top5.kosdaq?.foreign || [] },
    { id: "kosdaq-institution", marketId: "kosdaq", market: "KOSDAQ", actor: "기관", items: top5.kosdaq?.institution || [] }
  ];
}

function renderInvestorFlowGroup(group) {
  return `
    <section class="panel">
      <div class="panel-head"><h2>${escapeHtml(group.market)} ${escapeHtml(group.actor)}</h2><span class="badge">${group.items.length || "대기"}개</span></div>
      <div class="table-wrap">
        <table class="responsive-table">
          <thead><tr><th>순위</th><th>종목</th><th>순매수</th><th>수량</th></tr></thead>
          <tbody>
            ${group.items.length ? group.items.slice(0, 5).map((item, index) => renderInvestorFlowRow(item, group, index)).join("") : `<tr><td colspan="4"><div class="empty">마감 수급 데이터를 불러오는 중입니다.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderInvestorFlowRow(item, group, index) {
  const market = group.marketId === "kosdaq" ? "KQ" : "KS";
  return `
    <tr data-action="open-investor-stock" data-market="${market}" data-ticker="${escapeHtml(item.ticker)}" data-name="${escapeHtml(item.name)}">
      <td data-label="순위">${item.rank || index + 1}</td>
      <td data-label="종목"><strong>${escapeHtml(item.name || "-")}</strong><div class="ticker">${escapeHtml(item.ticker || "")}</div></td>
      <td data-label="순매수" class="num ${changeClass(item.amount)}">${escapeHtml(formatInvestorAmount(item))}</td>
      <td data-label="수량">${escapeHtml(formatInvestorQuantity(item))}</td>
    </tr>
  `;
}

function investorFlowTopItem(groups) {
  return groups.flatMap((group) => group.items || [])
    .filter((item) => Number.isFinite(Number(item.amount)))
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;
}

function formatInvestorAmount(item) {
  const amount = Number(item.amount);
  if (Number.isFinite(amount) && amount !== 0) return `${fmtNum(amount / 100, 1)}억`;
  return item.amountText || "-";
}

function formatInvestorQuantity(item) {
  if (item.quantityText) return item.quantityText;
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity !== 0 ? fmtNum(quantity) : "-";
}

function buildInvestorFlowShareText(flow = state.data.market.investorFlow || {}) {
  const groups = investorFlowGroups(flow);
  const lines = [
    "주식저장소 마감수급",
    "",
    "외국인과 기관이 가장 많이 순매수한 종목을 한눈에 확인해보세요."
  ];
  if (flow.date) {
    lines.push("", `[${flow.date}]`);
  }
  groups.forEach((group) => {
    const names = group.items.map((item) => item.name).filter(Boolean).slice(0, 5).join(", ") || "-";
    lines.push(`${group.actor} 순매수 TOP5 (${group.market}): ${names}`);
  });
  lines.push("", location.origin || "https://stockstorage-13828.web.app");
  return lines.join("\n");
}

function renderFmkoreaIndexDetail() {
  const fmkorea = normalizeFmkoreaData(state.data.market.fmkorea);
  if (!fmkorea.series.length && !state.fmkoreaBusy) {
    queueMicrotask(() => refreshFmkoreaMarketData({ silent: true }));
  }
  const trend = fmkoreaTrend(fmkorea.series);
  const recent = fmkorea.series.slice(-14);
  const values = recent.map((item) => Number(item.count || 0));
  const actions = `<button class="btn" data-action="route" data-route="markets">시장</button><button class="btn" data-action="route" data-route="fmkorea-hot">HOT 종목</button><button class="btn" data-action="copy-fmkorea-index">공유문구 복사</button>`;
  return `
    ${renderPageHead("FMKorea Index", "펨코지수", `${fmkorea.source || "fmkorea.com/stock"} · ${fmkorea.updatedAt ? fmtDateTime(fmkorea.updatedAt) : "스냅샷"}`, actions)}
    <div class="stack">
      <section class="panel">
        <div class="panel-body stack">
          <div class="grid grid-4">
            ${renderKpi("관심도", `${fmtNum(fmkorea.score, 0)}점`, "good")}
            ${renderKpi("최근 글 수", `${fmtNum(fmkorea.latestCount)}글`, "up")}
            ${renderKpi("최근 추세", trend.label, trend.className)}
            ${renderKpi("데이터 일수", `${fmkorea.series.length}일`, "")}
          </div>
          <p class="subtext">원본 앱의 펨코지수처럼 공개 주식 게시판 글 수 흐름과 HOT 종목 집중도를 함께 봅니다.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>게시글 수 추이</h2><span class="badge">${recent.at(-1)?.date || fmkorea.realtimeDate || "대기"}</span></div>
        <div class="panel-body stack">
          ${values.length ? `<div class="chart-box compact"><canvas data-chart="line" data-values="${values.join(",")}"></canvas></div>` : `<div class="empty">펨코지수 추이 데이터를 불러오는 중입니다.</div>`}
          <div class="source-list">
            ${recent.slice(-7).reverse().map((item) => `
              <div class="source-item">
                <div class="row-between"><strong>${escapeHtml(item.date)}</strong><span class="badge good">${fmtNum(item.count)}글</span></div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
      ${renderFmkoreaHotPanel(fmkorea.hot, "펨코 HOT 종목", true)}
      <section class="panel">
        <div class="panel-head"><h2>공유 문구</h2><span class="badge">${fmkorea.realtimeDate || "대기"}</span></div>
        <div class="panel-body">
          <pre class="share-preview">${escapeHtml(buildFmkoreaShareText(fmkorea))}</pre>
        </div>
      </section>
    </div>
  `;
}

function renderFmkoreaHotDetail() {
  const fmkorea = normalizeFmkoreaData(state.data.market.fmkorea);
  if (!fmkorea.hot.length && !state.fmkoreaBusy) {
    queueMicrotask(() => refreshFmkoreaMarketData({ silent: true }));
  }
  const actions = `<button class="btn" data-action="route" data-route="markets">시장</button><button class="btn" data-action="route" data-route="fmkorea-index">펨코지수</button><button class="btn" data-action="copy-fmkorea-hot">공유문구 복사</button>`;
  return `
    ${renderPageHead("FMKorea HOT", "펨코 HOT 종목", `${fmkorea.source || "fmkorea.com/stock"} · ${fmkorea.realtimeDate || "실시간 스냅샷"}`, actions)}
    <div class="stack">
      <section class="panel">
        <div class="panel-body stack">
          <div class="grid grid-4">
            ${renderKpi("HOT 종목", `${fmkorea.hot.length}개`, "good")}
            ${renderKpi("최근 글 수", `${fmtNum(fmkorea.latestCount)}글`, "up")}
            ${renderKpi("집계 모드", fmkoreaModeLabel(fmkorea.realtimeMode), "")}
            ${renderKpi("출처", fmkorea.source || "로컬 seed", "")}
          </div>
          <p class="subtext">원본 앱의 펨코 HOT 종목 화면처럼 언급량과 게시글 수 기준으로 종목을 정렬하고 바로 상세 화면으로 연결합니다.</p>
        </div>
      </section>
      ${renderFmkoreaHotPanel(fmkorea.hot, "오늘 실시간 HOT", false)}
      <section class="panel">
        <div class="panel-head"><h2>공유 문구</h2><span class="badge">${fmkorea.realtimeDate || "대기"}</span></div>
        <div class="panel-body">
          <pre class="share-preview">${escapeHtml(buildFmkoreaHotShareText(fmkorea))}</pre>
        </div>
      </section>
    </div>
  `;
}

function renderFmkoreaHotPanel(items, title, compact) {
  return `
    <section class="panel">
      <div class="panel-head"><h2>${escapeHtml(title)}</h2><span class="badge">${items.length || "대기"}개</span></div>
      <div class="panel-body ${compact ? "source-list" : "stack"}">
        ${items.length ? items.map(renderFmkoreaHotRow).join("") : `<div class="empty">펨코 HOT 데이터를 불러오는 중입니다.</div>`}
      </div>
    </section>
  `;
}

function renderFmkoreaHotRow(item, index) {
  const market = item.market || "KS";
  const ticker = item.ticker || "";
  return `
    <div class="source-item" data-action="open-fmkorea-stock" data-market="${escapeHtml(market)}" data-ticker="${escapeHtml(ticker)}" data-name="${escapeHtml(item.name || ticker)}">
      <div class="row-between">
        <div><strong>${fmtNum(item.rank || index + 1, 0)}위 ${escapeHtml(item.name || ticker)}</strong><div class="ticker">${escapeHtml(ticker)} · ${escapeHtml(market)}</div></div>
        <span class="badge up">${fmtNum(item.count || item.mentionCount || 0)}회</span>
      </div>
      <p class="subtext">${escapeHtml(formatFmkoreaHotMeta(item))}</p>
    </div>
  `;
}

function normalizeFmkoreaData(raw = {}) {
  const series = (Array.isArray(raw.series) ? raw.series : [])
    .map((item) => ({ date: item.date || item.id || "", count: Number(item.count || 0) }))
    .filter((item) => item.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const hot = (Array.isArray(raw.hot) ? raw.hot : [])
    .map((item, index) => ({
      rank: Number(item.rank || index + 1),
      ticker: item.ticker || item.code || "",
      name: item.name || item.ticker || item.code || "",
      market: item.market || "KS",
      count: Number(item.count ?? item.mentionCount ?? 0),
      mentionCount: Number(item.mentionCount ?? item.count ?? 0),
      postCount: Number(item.postCount || 0),
      change: item.change
    }))
    .filter((item) => item.ticker || item.name);
  return {
    ...raw,
    score: Number(raw.score || 0),
    latestCount: Number(raw.latestCount || series.at(-1)?.count || 0),
    series,
    hot
  };
}

function fmkoreaTrend(series) {
  if (!series.length) return { label: "-", className: "" };
  const latest = Number(series.at(-1)?.count || 0);
  const previous = Number(series.at(-2)?.count || 0);
  if (!previous) return { label: "신규", className: "good" };
  const rate = ((latest - previous) / previous) * 100;
  return { label: fmtPct(rate), className: changeClass(rate) };
}

function fmkoreaModeLabel(mode) {
  if (mode === "server-scrape") return "실시간 공개 게시판";
  if (mode === "server-scrape-unavailable") return "연결 제한 · 기존 스냅샷";
  if (mode === "seed") return "로컬 seed";
  return mode || "스냅샷";
}

function formatFmkoreaHotMeta(item) {
  const parts = [];
  if (Number(item.postCount) > 0) parts.push(`게시글 ${fmtNum(item.postCount)}개`);
  if (Number(item.count || item.mentionCount) > 0) parts.push(`언급 ${fmtNum(item.count || item.mentionCount)}회`);
  if (item.change != null) parts.push(`변화 +${fmtNum(item.change)}`);
  return parts.join(" · ") || "언급 스냅샷";
}

function buildFmkoreaShareText(fmkorea = normalizeFmkoreaData(state.data.market.fmkorea)) {
  const latest = fmkorea.series.at(-1);
  return [
    "주식저장소 펨코지수",
    "",
    latest ? `[${latest.date}] 게시글 ${fmtNum(latest.count)}개` : `최근 게시글 ${fmtNum(fmkorea.latestCount)}개`,
    `관심도 ${fmtNum(fmkorea.score, 0)}점`,
    "",
    "HOT: " + (fmkorea.hot.slice(0, 5).map((item) => item.name).join(", ") || "-"),
    "",
    location.origin || "https://stockstorage-13828.web.app"
  ].join("\n");
}

function buildFmkoreaHotShareText(fmkorea = normalizeFmkoreaData(state.data.market.fmkorea)) {
  return [
    "주식저장소 펨코 HOT 종목",
    "",
    `[${fmkorea.realtimeDate || "실시간"}]`,
    ...fmkorea.hot.slice(0, 10).map((item) => `${fmtNum(item.rank, 0)}위 ${item.name} (${item.ticker}) · 언급 ${fmtNum(item.count)}회`),
    "",
    location.origin || "https://stockstorage-13828.web.app"
  ].join("\n");
}

function renderKpiCard(label, value, foot, className = "") {
  return `<div class="card metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value ${className}">${escapeHtml(value)}</div><div class="metric-foot">${escapeHtml(foot)}</div></div>`;
}

function renderListEmpty(title, detail, action = "", actionAttrs = "") {
  return `
    <div class="list-empty">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
      ${action ? (actionAttrs ? `<button type="button" ${actionAttrs}>${escapeHtml(action)}</button>` : `<span>${escapeHtml(action)}</span>`) : ""}
    </div>
  `;
}

function renderFavorites() {
  if (!state.user) return authRequired("관심종목");
  const doc = getUserDoc();
  const favoritePickIds = new Set(doc.favorites || []);
  const favoritePicks = state.data.stockPicks.filter((p) => favoritePickIds.has(p.id));
  const stocks = Object.values(doc.favoriteStocks || {});
  return `
    ${renderPageHead("Watchlist", "관심종목", "추천주 관심과 일반 관심종목을 분리해 관리하고 현재가를 확인합니다.")}
    <section class="grid grid-4 favorite-summary">
      ${renderKpi("일반 관심종목", `${fmtNum(stocks.length, 0)}개`, stocks.length ? "good" : "")}
      ${renderKpi("관심 추천주", `${fmtNum(favoritePicks.length, 0)}개`, favoritePicks.length ? "good" : "")}
      ${renderKpi("저장 분리", "정상", "good")}
      ${renderKpi("사용자", state.user.nickname || state.user.email || "-")}
    </section>
    <div class="split">
      <div class="stack">
        <section class="panel">
          <div class="panel-head"><h2>일반 관심종목</h2><span class="badge">${fmtNum(stocks.length, 0)}개</span></div>
          <div class="panel-body">
            <form class="form" data-form="favorite-stock">
              <div class="grid grid-3">
                <label class="field"><span>종목명</span><input class="input" name="name" required /></label>
                <label class="field"><span>티커</span><input class="input" name="ticker" required /></label>
                <label class="field"><span>시장</span><select class="select" name="market"><option>KS</option><option>KQ</option><option>US</option></select></label>
              </div>
              <button class="btn primary">관심종목 추가</button>
            </form>
          </div>
          <div>${stocks.map((stock) => renderFavoriteStockRow(stock)).join("") || renderListEmpty("등록한 관심종목이 없습니다.", "일반 관심종목은 추천주 관심과 따로 저장됩니다.", "직접 추가")}</div>
        </section>
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="panel-head"><h2>관심 추천주</h2><span class="badge">${fmtNum(favoritePicks.length, 0)}개</span></div>
          <div>${favoritePicks.map(renderStockListRow).join("") || renderListEmpty("관심 추천주가 없습니다", "추천주 상세에서 관심 등록을 누르면 표시됩니다.", "포착 보기", `data-action="route" data-route="capture"`)}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>검색</h2></div>
          <div class="panel-body">
            <form class="form" data-form="stock-search">
              <input class="input" name="q" placeholder="삼성전자, AAPL, 005930" />
              <button class="btn">검색</button>
            </form>
            <div id="search-results" class="stack section"></div>
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderFavoriteStockRow(stock) {
  return `
    <div class="stock-row" data-action="open-stock" data-stock="${escapeHtml(stockKey(stock))}">
      <div class="stock-title">
        <div><div class="name">${escapeHtml(stock.name)}</div><div class="ticker">${escapeHtml(stock.ticker)} · ${escapeHtml(stock.market)}</div></div>
        <button class="btn danger" data-action="remove-favorite-stock" data-stock="${escapeHtml(stockKey(stock))}">해제</button>
      </div>
      <div class="muted">추가일 ${fmtDate(stock.addedAt || new Date())}</div>
    </div>
  `;
}

function renderJournal() {
  if (!state.user) return authRequired("매매일지");
  const journals = filteredJournals();
  const pnl = journalPnl(journals);
  return `
    ${renderPageHead("Trading Journal", "매매일지", "날짜별/종목별 기록, 매수/매도, 손익, 차트, 작성/수정/삭제를 관리합니다.", `<button class="btn" data-action="route" data-route="portfolio">보유 현황</button><button class="btn primary" data-action="modal" data-modal="journal">기록 작성</button>`)}
    <div class="stack">
      <div class="grid grid-4">
        ${renderKpiCard("총 매수금", fmtMoney(pnl.buyAmount), "기록 기준", "")}
        ${renderKpiCard("총 매도금", fmtMoney(pnl.sellAmount), "기록 기준", "")}
        ${renderKpiCard("실현손익", fmtMoney(pnl.realized), "매도-연결매수가", changeClass(pnl.realized))}
        ${renderKpiCard("승률", `${fmtNum(pnl.winRate, 1)}%`, `${pnl.sellCount}건 매도`, pnl.winRate >= 50 ? "good" : "warn")}
      </div>
      <section class="panel">
        <div class="panel-head wrap">
          <h2>손익 차트</h2>
          <div class="row wrap">
            <input class="input" style="width: 150px" type="date" data-filter="journalDate" value="${escapeHtml(state.filters.journalDate)}" />
            <input class="input" style="width: 180px" data-filter="journalStock" value="${escapeHtml(state.filters.journalStock)}" placeholder="종목 필터" />
          </div>
        </div>
        <div class="panel-body"><div class="chart-box compact"><canvas data-chart="bars" data-values="${journalChartValues(journals).join(",")}"></canvas></div></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>기록</h2></div>
        ${journals.length ? `
          <div class="table-wrap">
            <table class="responsive-table">
              <thead><tr><th>날짜</th><th>종목</th><th>구분</th><th>가격</th><th>수량</th><th>손익</th><th>메모</th><th>동작</th></tr></thead>
              <tbody>${journals.map(renderJournalRow).join("")}</tbody>
            </table>
          </div>
        ` : renderListEmpty("매매일지를 작성해보세요.", "매수와 매도를 기록하면 손익 차트와 보유 현황이 자동으로 정리됩니다.", "기록 작성", `data-action="modal" data-modal="journal"`)}
      </section>
    </div>
  `;
}

function renderJournalChartDetail() {
  if (!state.user) return authRequired("매매일지 차트");
  const key = safeDecode(state.route.param);
  const stock = getStockByKey(key);
  const journals = journalsForStock(key);
  if (!stock || !journals.length) {
    return renderPageHead("Trading Journal", "매매일지 차트를 찾을 수 없습니다", "매매일지 목록에서 종목을 다시 선택해주세요.", `<button class="btn" data-action="route" data-route="journal">목록</button>`);
  }
  const historyMeta = state.historyMeta.get(key) || {};
  const candles = journalChartCandles(stock);
  const markers = journalChartMarkers(candles, journals);
  const summary = journalChartSummary(journals);
  const historyStamp = historyMeta.source
    ? `${historyMeta.source} · ${fmtNum(historyMeta.points || candles.length)}개 일봉`
    : (state.historyAttempted.has(key) ? "차트 API 실패 · 로컬 추정 일봉" : "로컬 추정 일봉");
  if (!state.histories.has(key) && !state.historyAttempted.has(key) && !state.historyBusy.has(key)) {
    queueMicrotask(() => loadHistory(key, { silent: true }));
  }
  return `
    ${renderPageHead("Trading Journal Chart", `${stock.name} 매매 차트`, `${stock.ticker} · ${stock.market} · 실제 일봉 위에 매수/매도 기록을 표시합니다.`, `<button class="btn" data-action="route" data-route="journal">목록</button><button class="btn primary" data-action="open-stock" data-stock="${escapeHtml(key)}">종목 상세</button>`)}
    <div class="stack">
      <div class="grid grid-4">
        ${renderKpiCard("평균 매수가", summary.buyQty ? fmtMoney(summary.avgBuy, stock.market) : "-", `매수 ${fmtNum(summary.buyQty, 2)}주`, "")}
        ${renderKpiCard("평균 매도가", summary.sellQty ? fmtMoney(summary.avgSell, stock.market) : "-", `매도 ${fmtNum(summary.sellQty, 2)}주`, "")}
        ${renderKpiCard("남은 수량", `${fmtNum(summary.remainingQty, 2)}주`, summary.remainingQty > 0 ? "보유 중" : "정리 완료", summary.remainingQty > 0 ? "good" : "")}
        ${renderKpiCard("실현손익", fmtMoney(summary.realized, stock.market), `${journals.length}건 기록`, changeClass(summary.realized))}
      </div>
      <section class="panel">
        <div class="panel-head wrap">
          <div><h2>6개월 일봉</h2><p class="subtext">${escapeHtml(historyStamp)}</p></div>
          <div class="journal-marker-legend"><span><i class="buy"></i>매수</span><span><i class="sell"></i>매도</span></div>
        </div>
        <div class="panel-body">
          <div class="chart-box journal-candles"><canvas data-chart="journal-candles" data-points="${escapeHtml(JSON.stringify(candles))}" data-markers="${escapeHtml(JSON.stringify(markers))}" data-market="${escapeHtml(stock.market || "KS")}"></canvas></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>거래 이벤트</h2><span class="badge">${journals.length}건</span></div>
        <div>${journals.map((journal) => `
          <div class="list-row">
            <div class="row-between">
              <div class="row wrap"><span class="badge ${journal.action === "매수" ? "up" : "down"}">${escapeHtml(journal.action)}</span><strong>${fmtMoney(journal.price, stock.market)} · ${fmtNum(journal.quantity, 2)}주</strong></div>
              <span class="muted">${fmtDate(journal.tradeDate)}</span>
            </div>
            ${journal.note ? `<p class="subtext">${escapeHtml(journal.note)}</p>` : ""}
          </div>
        `).join("")}</div>
      </section>
    </div>
  `;
}

function renderPortfolio() {
  if (!state.user) return authRequired("보유 현황");
  const groups = groupedJournals();
  const holdings = groups.filter((item) => item.remainingQty > 0);
  const closed = groups.filter((item) => item.remainingQty <= 0);
  const totalCost = holdings.reduce((sum, item) => sum + item.cost, 0);
  const totalValue = holdings.reduce((sum, item) => sum + item.value, 0);
  const unrealized = totalValue - totalCost;
  return `
    ${renderPageHead("Portfolio", "보유 현황", "매매일지를 종목별로 집계해 남은 수량, 평균단가, 평가손익을 계산합니다.", `<button class="btn primary" data-action="route" data-route="journal">매매일지</button>`)}
    <div class="grid grid-4">
      ${renderKpiCard("보유 종목", `${holdings.length}개`, "남은 수량 기준", "")}
      ${renderKpiCard("평가금액", fmtMoney(totalValue), "현재가 또는 기록가 기준", "")}
      ${renderKpiCard("매입원금", fmtMoney(totalCost), "평균단가 기준", "")}
      ${renderKpiCard("평가손익", fmtMoney(unrealized), holdings.length ? fmtPct(totalCost ? (unrealized / totalCost) * 100 : 0) : "0.00%", changeClass(unrealized))}
    </div>
    <div class="split section">
      <section class="panel">
        <div class="panel-head"><h2>보유 중</h2><span class="badge">${holdings.length}개</span></div>
        <div class="table-wrap">
          <table class="responsive-table">
            <thead><tr><th>종목</th><th>수량</th><th>평균단가</th><th>현재가</th><th>평가금액</th><th>손익</th><th>동작</th></tr></thead>
            <tbody>${holdings.map(renderPortfolioRow).join("") || `<tr><td colspan="7"><div class="empty">매수 기록이 남은 종목이 없습니다.</div></td></tr>`}</tbody>
          </table>
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>정리 완료</h2><span class="badge">${closed.length}개</span></div>
        <div>${closed.slice(0, 12).map((item) => `<div class="list-row" data-action="open-stock" data-stock="${escapeHtml(item.key)}"><strong>${escapeHtml(item.stockName)}</strong><p class="subtext">${escapeHtml(item.ticker)} · 매수 ${fmtNum(item.buyQty, 2)} / 매도 ${fmtNum(item.sellQty, 2)} · 실현 ${fmtMoney(item.realized)}</p></div>`).join("") || `<div class="panel-body"><div class="empty">정리 완료된 종목이 없습니다.</div></div>`}</div>
      </aside>
    </div>
  `;
}

function groupedJournals() {
  const groups = new Map();
  for (const journal of myJournals()) {
    const ticker = String(journal.ticker || "").trim().toUpperCase();
    if (!ticker) continue;
    const market = journal.market || "KS";
    const key = `${market}_${ticker}`;
    const item = groups.get(key) || {
      key,
      ticker,
      market,
      stockName: journal.stockName || ticker,
      buyQty: 0,
      sellQty: 0,
      buyAmount: 0,
      sellAmount: 0,
      realized: 0,
      latestTradeDate: journal.tradeDate,
      trades: 0
    };
    const qty = Number(journal.quantity || 0);
    const amount = Number(journal.price || 0) * qty;
    item.stockName = journal.stockName || item.stockName;
    item.latestTradeDate = new Date(journal.tradeDate) > new Date(item.latestTradeDate) ? journal.tradeDate : item.latestTradeDate;
    item.trades += 1;
    if (journal.action === "매수") {
      item.buyQty += qty;
      item.buyAmount += amount;
    }
    if (journal.action === "매도") {
      item.sellQty += qty;
      item.sellAmount += amount;
      if (journal.buyPrice) item.realized += (Number(journal.price || 0) - Number(journal.buyPrice || 0)) * qty;
    }
    groups.set(key, item);
  }
  return [...groups.values()].map((item) => {
    const known = state.discoveredStocks.get(item.key) || getStockByKey(item.key);
    const avgPrice = item.buyQty ? item.buyAmount / item.buyQty : 0;
    const remainingQty = Math.max(0, item.buyQty - item.sellQty);
    const currentPrice = Number(known?.currentPrice || known?.price || avgPrice || 0);
    const cost = avgPrice * remainingQty;
    const value = currentPrice * remainingQty;
    return {
      ...item,
      avgPrice,
      remainingQty,
      currentPrice,
      cost,
      value,
      unrealized: value - cost,
      source: known?.source || "",
      marketTime: known?.marketTime || null
    };
  }).sort((a, b) => Number(b.remainingQty > 0) - Number(a.remainingQty > 0) || new Date(b.latestTradeDate) - new Date(a.latestTradeDate));
}

function renderPortfolioRow(item) {
  return `
    <tr>
      <td data-label="종목"><strong>${escapeHtml(item.stockName)}</strong><div class="ticker">${escapeHtml(item.ticker)} · ${escapeHtml(item.market)}</div><div class="data-line compact">${item.source ? dataSourceBadge(item, "LIVE") : `<span class="badge">JOURNAL</span>`}<span>${escapeHtml(dataSourceStamp(item, "매매일지 가격 기준"))}</span></div></td>
      <td data-label="수량" class="num">${fmtNum(item.remainingQty, 4)}</td>
      <td data-label="평균단가" class="num">${fmtMoney(item.avgPrice, item.market)}</td>
      <td data-label="현재가" class="num">${fmtMoney(item.currentPrice, item.market)}</td>
      <td data-label="평가금액" class="num">${fmtMoney(item.value, item.market)}</td>
      <td data-label="손익" class="num ${changeClass(item.unrealized)}">${fmtMoney(item.unrealized, item.market)}<br /><span class="${changeClass(item.unrealized)}">${fmtPct(item.cost ? (item.unrealized / item.cost) * 100 : 0)}</span></td>
      <td data-label="동작"><div class="row wrap"><button class="btn" data-action="open-stock" data-stock="${escapeHtml(item.key)}">상세</button><button class="btn" data-action="route" data-route="journal-chart" data-param="${escapeHtml(item.key)}">차트</button><button class="btn" data-action="route" data-route="compare" data-param="${escapeHtml(item.key)}">비교</button></div></td>
    </tr>
  `;
}

function myJournals() {
  if (!state.user) return [];
  return state.data.journals.filter((j) => j.uid === state.user.uid);
}

function filteredJournals() {
  const stock = state.filters.journalStock.trim().toLowerCase();
  const date = state.filters.journalDate;
  return myJournals()
    .filter((j) => !stock || `${j.stockName} ${j.ticker}`.toLowerCase().includes(stock))
    .filter((j) => !date || String(j.tradeDate).slice(0, 10) === date)
    .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
}

function journalPnl(journals) {
  let buyAmount = 0;
  let sellAmount = 0;
  let realized = 0;
  let sellCount = 0;
  let wins = 0;
  for (const j of journals) {
    const amount = Number(j.price || 0) * Number(j.quantity || 0);
    if (j.action === "매도") {
      sellAmount += amount;
      const cost = Number(j.buyPrice || 0) * Number(j.quantity || 0);
      const pnl = cost ? amount - cost : 0;
      realized += pnl;
      sellCount += 1;
      if (pnl > 0) wins += 1;
    } else if (j.action === "매수") {
      buyAmount += amount;
    }
  }
  return { buyAmount, sellAmount, realized, sellCount, winRate: sellCount ? (wins / sellCount) * 100 : 0 };
}

function journalChartValues(journals) {
  return journals.slice().reverse().map((j) => {
    if (j.action !== "매도" || !j.buyPrice) return 0;
    return (Number(j.price) - Number(j.buyPrice)) * Number(j.quantity);
  });
}

function journalsForStock(key) {
  return myJournals()
    .filter((journal) => stockKey(journal) === key)
    .sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));
}

function journalChartCandles(stock) {
  const key = stockKey(stock);
  const loaded = state.histories.get(key);
  if (loaded?.length) return normalizeJournalCandles(loaded);
  const values = sampleHistory(stock.currentPrice || stock.price || stock.buyPrice || 100, key);
  const today = new Date();
  return values.map((close, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (values.length - index - 1));
    const wave = 0.006 + Math.abs(Math.sin((index + 3) / 6)) * 0.006;
    const open = index ? values[index - 1] : close * (1 - wave / 2);
    return {
      date: date.toISOString(),
      open,
      high: Math.max(open, close) * (1 + wave),
      low: Math.min(open, close) * (1 - wave),
      close
    };
  });
}

function stockChartCandles(stock) {
  return journalChartCandles(stock);
}

function aggregateCandles(candles, frame) {
  const groups = new Map();
  candles.forEach((candle, index) => {
    const date = chartDate(candle.date);
    if (Number.isNaN(date.getTime())) return;
    const groupDate = new Date(date);
    if (frame === "week") {
      const mondayOffset = (groupDate.getDay() + 6) % 7;
      groupDate.setDate(groupDate.getDate() - mondayOffset);
    } else {
      groupDate.setDate(1);
    }
    groupDate.setHours(0, 0, 0, 0);
    const groupKey = groupDate.toISOString().slice(0, 10);
    const existing = groups.get(groupKey);
    if (!existing) {
      groups.set(groupKey, {
        date: groupDate.toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        index
      });
      return;
    }
    existing.high = Math.max(existing.high, candle.high);
    existing.low = Math.min(existing.low, candle.low);
    existing.close = candle.close;
  });
  return [...groups.values()].sort((a, b) => a.index - b.index);
}

function estimatedIntradayCandles(stock, interval = "60m") {
  const key = `${stockKey(stock)}:${interval}`;
  const step = interval === "1m" ? 1 : (interval === "5m" ? 5 : 60);
  const count = interval === "1m" ? 240 : (interval === "5m" ? 120 : 90);
  const base = Number(stock.currentPrice || stock.price || stock.closedPrice || stock.buyPrice || 100) || 100;
  const changeRate = Number(stock.changeRate || pickReturn(stock) || 0);
  const seed = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const now = new Date();
  const start = new Date(now.getTime() - count * step * 60 * 1000);
  let close = base / Math.max(0.2, 1 + changeRate / 100);
  const candles = [];
  for (let index = 0; index < count; index += 1) {
    const wave = Math.sin((index + seed) / 5) * 0.0028 + Math.cos((index + seed) / 13) * 0.0017;
    const drift = (changeRate / 100) / Math.max(1, count);
    const open = close;
    close = Math.max(1, close * (1 + wave + drift));
    const wick = 0.003 + Math.abs(Math.sin((index + seed) / 9)) * 0.003;
    const date = new Date(start.getTime() + index * step * 60 * 1000);
    candles.push({
      date: date.toISOString(),
      open,
      high: Math.max(open, close) * (1 + wick),
      low: Math.min(open, close) * (1 - wick),
      close
    });
  }
  return candles;
}

function normalizeJournalCandles(points = []) {
  return points.map((point, index) => {
    const close = Number(point.close ?? point.value ?? point);
    const open = Number(point.open ?? close);
    const high = Number(point.high ?? Math.max(open, close));
    const low = Number(point.low ?? Math.min(open, close));
    const volume = Number(point.volume ?? point.quantity ?? point.tradingVolume ?? 0);
    return {
      date: point.date || point.datetime || point.timestamp || index,
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : Math.max(open, close),
      low: Number.isFinite(low) ? low : Math.min(open, close),
      close,
      volume: Number.isFinite(volume) && volume > 0 ? volume : Math.max(100, Math.abs(close - open) / Math.max(1, close) * 1000000)
    };
  }).filter((point) => [point.open, point.high, point.low, point.close].every(Number.isFinite));
}

function journalChartMarkers(candles, journals) {
  return journals.map((journal) => {
    const tradeTime = chartDate(journal.tradeDate).getTime();
    let index = -1;
    let closestDays = Infinity;
    candles.forEach((candle, candleIndex) => {
      const candleTime = chartDate(candle.date).getTime();
      const days = Math.abs(candleTime - tradeTime) / 86400000;
      if (Number.isFinite(days) && days < closestDays) {
        closestDays = days;
        index = candleIndex;
      }
    });
    return {
      index,
      action: journal.action,
      price: Number(journal.price || 0),
      quantity: Number(journal.quantity || 0),
      tradeDate: journal.tradeDate
    };
  }).filter((marker) => marker.index >= 0 && marker.index < candles.length && closestEnough(marker, candles));
}

function closestEnough(marker, candles) {
  const candleTime = chartDate(candles[marker.index]?.date).getTime();
  const tradeTime = chartDate(marker.tradeDate).getTime();
  return Number.isFinite(candleTime) && Number.isFinite(tradeTime) && Math.abs(candleTime - tradeTime) <= 5 * 86400000;
}

function journalChartSummary(journals) {
  return journals.reduce((summary, journal) => {
    const quantity = Number(journal.quantity || 0);
    const amount = Number(journal.price || 0) * quantity;
    if (journal.action === "매수") {
      summary.buyQty += quantity;
      summary.buyAmount += amount;
    }
    if (journal.action === "매도") {
      summary.sellQty += quantity;
      summary.sellAmount += amount;
      if (journal.buyPrice) summary.realized += (Number(journal.price || 0) - Number(journal.buyPrice || 0)) * quantity;
    }
    summary.remainingQty = Math.max(0, summary.buyQty - summary.sellQty);
    summary.avgBuy = summary.buyQty ? summary.buyAmount / summary.buyQty : 0;
    summary.avgSell = summary.sellQty ? summary.sellAmount / summary.sellQty : 0;
    return summary;
  }, { buyQty: 0, sellQty: 0, buyAmount: 0, sellAmount: 0, remainingQty: 0, avgBuy: 0, avgSell: 0, realized: 0 });
}

function renderJournalRow(j) {
  const pnl = j.action === "매도" && j.buyPrice ? (Number(j.price) - Number(j.buyPrice)) * Number(j.quantity) : 0;
  return `
    <tr>
      <td data-label="날짜">${fmtDate(j.tradeDate)}</td>
      <td data-label="종목"><strong>${escapeHtml(j.stockName)}</strong><div class="ticker">${escapeHtml(j.ticker)} · ${escapeHtml(j.market)}</div></td>
      <td data-label="구분"><span class="badge ${j.action === "매수" ? "up" : j.action === "매도" ? "down" : ""}">${escapeHtml(j.action)}</span></td>
      <td data-label="가격" class="num">${fmtMoney(j.price, j.market === "US" ? "US" : "KS")}</td>
      <td data-label="수량" class="num">${fmtNum(j.quantity, 2)}</td>
      <td data-label="손익" class="num ${changeClass(pnl)}">${pnl ? fmtMoney(pnl) : "-"}</td>
      <td data-label="메모">${escapeHtml(j.note)}</td>
      <td data-label="동작"><div class="row wrap"><button class="btn" data-action="route" data-route="journal-chart" data-param="${escapeHtml(stockKey(j))}">차트</button><button class="btn" data-action="modal" data-modal="journal" data-id="${escapeHtml(j.id)}">수정</button><button class="btn danger" data-action="delete-journal" data-id="${escapeHtml(j.id)}">삭제</button></div></td>
    </tr>
  `;
}

function renderAi() {
  const detailId = state.route.param;
  if (!state.user) return authRequired("AI 분석");
  if (detailId) return renderAnalysisDetail(detailId);
  const analyses = sortedAnalyses();
  return `
    ${renderPageHead("AI Analysis", "AI 분석 목록/결과", "생성, 캐시 조회, 재분석, 점수, 리스크, 근거 자료와 리포트를 바로 확인합니다.", `<button class="btn" data-action="route" data-route="capture">종목 선택</button>`)}
    <section class="panel">
      <div class="panel-head wrap">
        <h2>내 분석</h2>
        <div class="row wrap">
          <select class="select" style="width: 150px" data-filter="aiSort">
            ${[["recent", "최근순"], ["scoreHigh", "점수 높은순"], ["scoreLow", "점수 낮은순"], ["name", "종목명"]].map(([v, l]) => `<option value="${v}" ${state.filters.aiSort === v ? "selected" : ""}>${l}</option>`).join("")}
          </select>
          <select class="select" style="width: 130px" data-filter="aiScore">
            ${[["", "전체점수"], ["good", "75점 이상"], ["mid", "55~74점"], ["bad", "55점 미만"]].map(([v, l]) => `<option value="${v}" ${state.filters.aiScore === v ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="panel-body grid grid-2">${analyses.map(renderAnalysisCard).join("") || `<div class="empty">종목 상세에서 AI 분석을 생성하면 이곳에 캐시됩니다.</div>`}</div>
    </section>
  `;
}

function myAnalyses() {
  if (!state.user) return [];
  return state.data.analyses.filter((a) => a.uid === state.user.uid);
}

function sortedAnalyses() {
  let rows = myAnalyses();
  const scoreFilter = state.filters.aiScore;
  rows = rows.filter((a) => {
    const s = Number(a.score);
    if (!scoreFilter) return true;
    if (scoreFilter === "good") return s >= 75;
    if (scoreFilter === "mid") return s >= 55 && s < 75;
    return s < 55;
  });
  rows = rows.slice();
  if (state.filters.aiSort === "scoreHigh") rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  else if (state.filters.aiSort === "scoreLow") rows.sort((a, b) => Number(a.score || 0) - Number(b.score || 0));
  else if (state.filters.aiSort === "name") rows.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
  else rows.sort((a, b) => new Date(b.updatedAt || b.generatedAt || 0) - new Date(a.updatedAt || a.generatedAt || 0));
  return rows;
}

function renderAnalysisCard(a) {
  const key = a.analysisId || stockKey(a);
  return `
    <div class="card post-card">
      <div class="row-between">
        <div><h3>${escapeHtml(a.name || a.ticker)}</h3><div class="ticker">${escapeHtml(a.ticker)} · ${escapeHtml(a.market)}</div></div>
        <div class="ai-score" style="--score:${Math.max(0, Math.min(100, Number(a.score || 0)))}%"><span>${fmtNum(a.score, 0)}<small>${escapeHtml(a.scoreLabel || "점수")}</small></span></div>
      </div>
      <p class="subtext">${escapeHtml(a.summary || "")}</p>
      <div class="row wrap">
        <span class="badge good">${escapeHtml(a.theme || "테마")}</span>
        <span class="badge">${fmtDateTime(a.updatedAt || a.generatedAt)}</span>
      </div>
      <div class="row wrap">
        <button class="btn primary" data-action="route" data-route="ai" data-param="${escapeHtml(key)}">결과 보기</button>
        <button class="btn" data-action="generate-ai" data-stock="${escapeHtml(stockKey(a))}">재분석</button>
        <button class="btn danger" data-action="delete-ai" data-id="${escapeHtml(key)}">삭제</button>
      </div>
    </div>
  `;
}

function renderAnalysisSummaryCard(a) {
  return `
    <div class="stack">
      <div class="row-between">
        <div><strong>${escapeHtml(a.scoreLabel || "분석 완료")}</strong><p class="subtext">${fmtDateTime(a.updatedAt || a.generatedAt)}</p></div>
        <div class="ai-score" style="--score:${Math.max(0, Math.min(100, Number(a.score || 0)))}%"><span>${fmtNum(a.score, 0)}<small>점수</small></span></div>
      </div>
      <p class="subtext">${escapeHtml(a.summary || "")}</p>
      <button class="btn primary" data-action="route" data-route="ai" data-param="${escapeHtml(a.analysisId || stockKey(a))}">결과 보기</button>
    </div>
  `;
}

function renderCompare() {
  const base = getStockByKey(state.route.param);
  const defaultBase = base ? `${base.market}:${base.ticker}` : "";
  return `
    ${renderPageHead("Compare", "종목 비교", "최대 3개 종목의 현재가와 일봉 흐름을 같은 화면에서 비교합니다.", `<button class="btn" data-action="route" data-route="capture">AI포착</button>`)}
    <section class="panel">
      <div class="panel-head"><h2>비교 설정</h2><span class="badge">${state.compareBusy ? "조회 중" : `${state.compareItems.length}개`}</span></div>
      <div class="panel-body">
        <form class="form" data-form="compare">
          <div class="grid grid-3">
            <label class="field"><span>기준 종목</span><input class="input" name="base" value="${escapeHtml(defaultBase)}" placeholder="KS:005930 또는 AAPL" required /></label>
            <label class="field"><span>비교 1</span><input class="input" name="compare1" placeholder="KS:000660" /></label>
            <label class="field"><span>비교 2</span><input class="input" name="compare2" placeholder="US:NVDA" /></label>
          </div>
          <button class="btn primary" ${state.compareBusy ? "disabled" : ""}>비교 조회</button>
        </form>
      </div>
    </section>
    ${renderCompareOverview()}
    <div class="grid grid-3 section">
      ${state.compareItems.map(renderCompareCard).join("") || `<div class="empty">기준 종목과 비교 종목을 입력하면 서버 프록시가 현재가와 차트를 조회합니다.</div>`}
    </div>
  `;
}

function renderCompareOverview() {
  if (!state.compareItems.length) return "";
  const period = COMPARE_PERIODS.find((item) => item.id === state.filters.comparePeriod) || COMPARE_PERIODS[2];
  const series = compareChartSeries(state.compareItems, period);
  return `
    <section class="panel section">
      <div class="panel-head wrap">
        <div><h2>통합 수익률 비교</h2><p class="subtext">각 종목의 시작점을 0%로 맞춘 기간 수익률입니다.</p></div>
        <span class="badge">${escapeHtml(period.label)}</span>
      </div>
      <div class="panel-body stack">
        <div class="tabs compare-periods">
          ${COMPARE_PERIODS.map((item) => `<button class="tab ${item.id === period.id ? "active" : ""}" data-action="compare-period" data-period="${item.id}">${item.label}</button>`).join("")}
        </div>
        <div class="chart-box compare"><canvas data-chart="multi-line" data-series="${escapeHtml(JSON.stringify(series.map((item) => item.values)))}" data-colors="${escapeHtml(JSON.stringify(series.map((item) => item.color)))}"></canvas></div>
        <div class="compare-legend">
          ${series.map((item) => `
            <div class="compare-legend-item">
              <span class="compare-swatch" style="--swatch:${escapeHtml(item.color)}"></span>
              <div><strong>${escapeHtml(item.name)}</strong><p class="subtext">${escapeHtml(item.ticker)} · ${fmtPct(item.returnRate)}</p></div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function compareChartSeries(items, period) {
  return items.map((item, index) => {
    const history = compareHistoryForPeriod(item.history, period);
    const prices = history.map((point) => Number(point.close || point)).filter(Number.isFinite);
    const start = prices[0] || 1;
    const values = prices.map((price) => Math.round((((price - start) / start) * 100) * 100) / 100);
    return {
      name: item.name || item.ticker,
      ticker: item.ticker,
      color: COMPARE_SERIES_COLORS[index % COMPARE_SERIES_COLORS.length],
      values,
      returnRate: values.at(-1) || 0
    };
  }).filter((item) => item.values.length >= 2);
}

function compareHistoryForPeriod(history, period) {
  const rows = (Array.isArray(history) ? history : []).filter((point) => Number.isFinite(Number(point.close || point)));
  const dated = rows.filter((point) => Number.isFinite(Number(point.date)));
  if (dated.length !== rows.length || !dated.length) {
    const fallbackCount = Math.max(2, Math.round((period.days / 365) * 252));
    return rows.slice(-fallbackCount);
  }
  const latest = Math.max(...dated.map((point) => Number(point.date)));
  const cutoff = latest - period.days * 24 * 60 * 60;
  const filtered = dated.filter((point) => Number(point.date) >= cutoff);
  return filtered.length >= 2 ? filtered : dated.slice(-2);
}

function renderCompareCard(item) {
  const values = item.history.map((point) => Number(point.close || point)).filter(Number.isFinite);
  const start = values[0] || item.price || 1;
  const normalized = values.map((value) => Math.round(((value / start) * 100) * 100) / 100);
  const latest = values.at(-1) || item.price || 0;
  const returnRate = start ? ((latest - start) / start) * 100 : 0;
  return `
    <section class="panel">
      <div class="panel-head"><h2>${escapeHtml(item.name)}</h2><span class="badge ${item.source ? "good" : ""}">${escapeHtml(item.source || "SNAPSHOT")}</span></div>
      <div class="panel-body stack">
        <div>
          <div class="price-main num">${fmtMoney(item.price, item.market)}</div>
          <div class="${changeClass(item.changeRate)}">${fmtPct(item.changeRate)}</div>
          <p class="subtext">${escapeHtml(item.ticker)} · ${escapeHtml(item.market)} · 차트 ${escapeHtml(item.historySource || "추정")} ${fmtNum(values.length)}개</p>
        </div>
        <div class="chart-box compact"><canvas data-chart="line" data-values="${normalized.join(",")}" data-color="accent"></canvas></div>
        <div class="grid grid-2">
          ${renderKpi("기간수익률", fmtPct(returnRate), changeClass(returnRate))}
          ${renderKpi("시작값", fmtMoney(start, item.market))}
        </div>
      </div>
    </section>
  `;
}

function renderLeaderboard() {
  const completed = state.data.stockPicks.filter((pick) => pick.status === "completed");
  const completedSource = completed.length ? completed : makeSeedData().stockPicks.filter((pick) => pick.status === "completed");
  const ranked = completedSource.map((pick) => {
    const exitPrice = Number(pick.closedPrice || pick.currentPrice || pick.targetPrice || 0);
    const returnRate = Number(pick.buyPrice) ? ((exitPrice - Number(pick.buyPrice)) / Number(pick.buyPrice)) * 100 : 0;
    return { ...pick, exitPrice, returnRate };
  }).sort((a, b) => b.returnRate - a.returnRate);
  const wins = ranked.filter((pick) => pick.returnRate > 0).length;
  const avg = ranked.length ? ranked.reduce((sum, pick) => sum + pick.returnRate, 0) / ranked.length : 0;
  const best = ranked[0];
  return `
    ${renderPageHead("Leaderboard", "종료 추천주 실적", "종료된 추천주의 수익률, 승률, 평균 성과를 순위로 확인합니다.", `<button class="btn" data-action="route" data-route="capture">추천주</button>`)}
    <div class="grid grid-4">
      ${renderKpiCard("종료 추천", `${ranked.length}건`, "completed", "")}
      ${renderKpiCard("승률", ranked.length ? `${fmtNum((wins / ranked.length) * 100, 1)}%` : "0.0%", `${wins}승`, wins ? "good" : "")}
      ${renderKpiCard("평균 수익률", fmtPct(avg), "종료가 기준", changeClass(avg))}
      ${renderKpiCard("최고 수익", best ? fmtPct(best.returnRate) : "-", best ? best.name : "데이터 없음", best ? changeClass(best.returnRate) : "")}
    </div>
    <section class="panel section">
      <div class="panel-head"><h2>순위</h2></div>
      <div class="table-wrap">
        <table class="responsive-table">
          <thead><tr><th>순위</th><th>종목</th><th>매수가</th><th>종료가</th><th>수익률</th><th>종료일</th><th>동작</th></tr></thead>
          <tbody>${ranked.map((pick, index) => `
            <tr>
              <td data-label="순위">${index + 1}</td>
              <td data-label="종목"><strong>${escapeHtml(pick.name)}</strong><div class="ticker">${escapeHtml(pick.ticker)} · ${escapeHtml(pick.market)}</div></td>
              <td data-label="매수가" class="num">${fmtMoney(pick.buyPrice, pick.market)}</td>
              <td data-label="종료가" class="num">${fmtMoney(pick.exitPrice, pick.market)}</td>
              <td data-label="수익률" class="${changeClass(pick.returnRate)}">${fmtPct(pick.returnRate)}</td>
              <td data-label="종료일">${pick.closedAt ? fmtDate(pick.closedAt) : "-"}</td>
              <td data-label="동작"><button class="btn" data-action="open-stock" data-stock="${escapeHtml(stockKey(pick))}">상세</button></td>
            </tr>
          `).join("") || `<tr><td colspan="7"><div class="empty">종료된 추천주가 없습니다.</div></td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAnalysisDetail(id) {
  const a = myAnalyses().find((item) => (item.analysisId || stockKey(item)) === id);
  if (!a) return `${renderPageHead("AI Analysis", "분석 결과를 찾을 수 없습니다", "분석 목록에서 다시 선택해주세요.", `<button class="btn" data-action="route" data-route="ai">목록</button>`)}`;
  return `
    ${renderPageHead("AI Report", `${a.name || a.ticker} AI 분석`, `${a.ticker} · ${a.market}`, `<button class="btn" data-action="route" data-route="ai">목록</button><button class="btn accent" data-action="generate-ai" data-stock="${escapeHtml(stockKey(a))}">재분석</button>`)}
    <div class="split">
      <div class="stack">
        <section class="card">
          <div class="row-between">
            <div>
              <h2>종합 점수판</h2>
              <p class="subtext">${escapeHtml(a.scoreLabel || "")}</p>
            </div>
            <div class="ai-score" style="--score:${Math.max(0, Math.min(100, Number(a.score || 0)))}%"><span>${fmtNum(a.score, 0)}<small>점수</small></span></div>
          </div>
          <p class="subtext section">${escapeHtml(a.summary || "")}</p>
        </section>
        <section class="grid grid-2">
          ${renderTextPanel("핵심 재료", a.todayReason || a.theme)}
          ${renderTextPanel("실적/밸류에이션", a.fundamentals)}
          ${renderTextPanel("기술 분석", a.technical)}
          ${renderTextPanel("뉴스/모멘텀", `${a.news || ""}\n${a.momentum || ""}`)}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>시나리오</h2></div>
          <div class="panel-body grid grid-3">${renderScenario(a.scenarios?.bull, "강세")}${renderScenario(a.scenarios?.base, "기본")}${renderScenario(a.scenarios?.bear, "약세")}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>리스크 상세</h2></div>
          <div class="panel-body stack">${(a.risksDetailed || []).map(renderRisk).join("") || (a.risks || []).map((risk) => `<div class="source-item">${escapeHtml(risk)}</div>`).join("")}</div>
        </section>
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="panel-head"><h2>액션</h2></div>
          <div class="panel-body">${renderTiming(a.timing)}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>근거 자료</h2></div>
          <div class="panel-body source-list">${renderAnalysisSources(a)}</div>
        </section>
      </aside>
    </div>
  `;
}

function renderTextPanel(title, body) {
  return `<div class="card"><h3>${escapeHtml(title)}</h3><p class="subtext">${escapeHtml(body || "-")}</p></div>`;
}

function renderScenario(item, label) {
  if (!item) return `<div class="card"><h3>${label}</h3><p class="subtext">저장된 시나리오가 없습니다.</p></div>`;
  return `<div class="card"><span class="badge">${label}</span><h3 class="section">${escapeHtml(item.priceTarget || item.trigger)}</h3><p class="subtext">${escapeHtml(item.narrative || item.trigger || "")}</p></div>`;
}

function renderRisk(risk) {
  return `<div class="source-item"><div class="row wrap"><span class="badge warn">${escapeHtml(risk.category || "리스크")}</span><span class="badge">${escapeHtml(risk.severity || "")}</span></div><p class="subtext">${escapeHtml(risk.description || "")}</p><p class="subtext"><strong>대응</strong> ${escapeHtml(risk.mitigant || "")}</p></div>`;
}

function renderTiming(timing) {
  if (!timing) return `<div class="empty">타이밍 데이터가 없습니다.</div>`;
  return `<div class="stack"><span class="badge good">${escapeHtml(timing.action)}</span><p class="subtext">${escapeHtml(timing.actionReason)}</p><div class="source-item"><strong>1~2주</strong><p class="subtext">${escapeHtml(timing.shortTerm)}</p></div><div class="source-item"><strong>1~3개월</strong><p class="subtext">${escapeHtml(timing.midTerm)}</p></div></div>`;
}

function renderAnalysisSources(a) {
  const sources = [
    ...(a.sourceNews || []).map((x) => ({ ...x, badge: "뉴스" })),
    ...(a.sourceReports || []).map((x) => ({ ...x, badge: "리포트" })),
    ...(a.sourceDisclosures || []).map((x) => ({ ...x, badge: "공시" })),
    ...(a.sourceFinancials || []).map((x) => ({
      ...x,
      badge: "재무",
      title: x.title || "재무지표",
      publisher: [
        x.publisher,
        x.per != null ? `PER ${formatRatio(x.per)}` : "",
        x.pbr != null ? `PBR ${formatRatio(x.pbr)}` : ""
      ].filter(Boolean).join(" · ")
    }))
  ].slice(0, 12);
  if (!sources.length) return `<div class="empty">Cloud Function이 수집한 근거 자료가 있으면 이곳에 표시됩니다.</div>`;
  return sources.map((s) => `<div class="source-item"><div class="row-between">${s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(s.title)}</strong></a>` : `<strong>${escapeHtml(s.title)}</strong>`}<span class="badge">${escapeHtml(s.badge)}</span></div><p class="subtext">${escapeHtml([s.publisher, s.publishedAt, s.submitter].filter(Boolean).join(" · "))}</p></div>`).join("");
}

function findAnalysis(key) {
  return myAnalyses().find((a) => (a.analysisId || stockKey(a)) === key || stockKey(a) === key);
}

function renderCommunity() {
  const posts = visiblePosts();
  const blockedCount = state.user ? Object.keys(getUserDoc().blockedUsers || {}).length : 0;
  return `
    ${renderPageHead("Community", "커뮤니티", "글 상세, 수정/삭제, 댓글 관리, 작성자 팔로우와 차단 흐름을 복원했습니다.", `<button class="btn" data-action="route" data-route="leaderboard">랭킹</button>${state.user ? `<button class="btn" data-action="route" data-route="my-posts">내 글</button><button class="btn" data-action="route" data-route="my-comments">내 댓글</button>` : ""}<button class="btn primary" data-action="modal" data-modal="post">글쓰기</button>`)}
    <div class="split">
      <section class="panel">
        <div class="panel-head"><h2>게시글</h2>${blockedCount ? `<span class="badge warn">차단 숨김 ${blockedCount}</span>` : ""}</div>
        <div class="panel-body feed">${posts.map((post) => renderCommunityPost(post, { compact: true })).join("") || `<div class="empty">표시할 게시글이 없습니다.</div>`}</div>
      </section>
      <aside class="stack">
        <section class="panel">
          <div class="panel-head"><h2>내 활동</h2></div>
          <div class="panel-body stack">
            ${state.user ? renderMyActivity() : `<div class="empty">로그인 후 내 글과 내 댓글을 볼 수 있습니다.</div>`}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>공개 매매일지</h2></div>
          <div>${publicJournals().slice(0, 8).map(renderPublicJournalRow).join("") || `<div class="panel-body"><div class="empty">공개된 매매일지가 없습니다.</div></div>`}</div>
        </section>
      </aside>
    </div>
  `;
}

function visiblePosts() {
  return [...state.data.posts]
    .filter((post) => !isUidBlocked(post.uid))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findPost(id) {
  return state.data.posts.find((post) => post.id === id);
}

function commentsForPost(postId) {
  return (state.data.postComments[postId] || []).filter((comment) => !isUidBlocked(comment.uid));
}

function canEditPost(post) {
  return Boolean(state.user && post?.uid === state.user.uid);
}

function canManagePost(post) {
  return Boolean(state.user && post && (post.uid === state.user.uid || isAdmin()));
}

function hasLikedPost(postId) {
  return Boolean(state.user && getUserDoc().likedPosts?.[postId]);
}

function isUidBlocked(uidValue) {
  if (!state.user || !uidValue || uidValue === state.user.uid) return false;
  return Boolean(getUserDoc().blockedUsers?.[uidValue]);
}

function isFollowingPostAuthor(uidValue) {
  return Boolean(state.user && uidValue && getUserDoc().postAuthorFollows?.[uidValue]?.enabled);
}

function renderCommunityPost(post, options = {}) {
  const comments = commentsForPost(post.id);
  const liked = hasLikedPost(post.id);
  const own = canEditPost(post);
  const manageable = canManagePost(post);
  const compact = Boolean(options.compact);
  return `
    <article class="card post-card" data-post-id="${escapeHtml(post.id)}">
      <div class="row-between">
        <div>
          <button class="link-title" data-action="route" data-route="post" data-param="${escapeHtml(post.id)}">${escapeHtml(post.title)}</button>
          <div class="post-meta"><span>${escapeHtml(post.nickname)}</span><span>Lv.${post.authorLevel || 1}</span><span>${fmtDateTime(post.createdAt)}</span><span>댓글 ${comments.length}</span></div>
        </div>
        <div class="row actions-wrap">
          <button class="btn" data-action="route" data-route="post" data-param="${escapeHtml(post.id)}">상세</button>
          <button class="btn" data-action="like-post" data-id="${escapeHtml(post.id)}">${liked ? "좋아요 취소" : "좋아요"} ${post.likes}</button>
          ${own ? `<button class="btn" data-action="modal" data-modal="post" data-id="${escapeHtml(post.id)}">수정</button>` : ""}
          ${manageable ? `<button class="btn danger" data-action="delete-post" data-id="${escapeHtml(post.id)}">삭제</button>` : ""}
          ${state.user && post.uid !== state.user.uid ? `<button class="btn" data-action="block-user" data-uid="${escapeHtml(post.uid)}">차단</button>` : ""}
          <button class="btn danger" data-action="report" data-target="post:${escapeHtml(post.id)}">신고</button>
        </div>
      </div>
      ${renderPostBody(post)}
      ${compact ? "" : `
        <div class="comment-list">${comments.map((comment) => renderComment(comment, { target: `post-comment:${post.id}:${comment.id}`, postId: post.id, postUid: post.uid })).join("")}</div>
        <form class="form" data-form="post-comment">
          <input type="hidden" name="postId" value="${escapeHtml(post.id)}" />
          <div class="row"><input class="input" name="content" placeholder="댓글" /><button class="btn" ${state.user ? "" : "disabled"}>등록</button></div>
        </form>
      `}
    </article>
  `;
}

function renderComment(comment, options = {}) {
  const target = options.target || `comment:${comment.id}`;
  const canDeletePost = Boolean(options.postId && state.user && (comment.uid === state.user.uid || options.postUid === state.user.uid || isAdmin()));
  const canDeleteJournal = Boolean(options.journalId && state.user && (comment.uid === state.user.uid || options.journalUid === state.user.uid || isAdmin()));
  const deleteButton = canDeletePost
    ? `<button class="btn mini danger" data-action="delete-post-comment" data-post="${escapeHtml(options.postId)}" data-id="${escapeHtml(comment.id)}">삭제</button>`
    : (canDeleteJournal ? `<button class="btn mini danger" data-action="delete-journal-comment" data-journal="${escapeHtml(options.journalId)}" data-id="${escapeHtml(comment.id)}">삭제</button>` : "");
  return `<div class="comment" data-comment-id="${escapeHtml(comment.id)}"><div class="row-between"><div class="post-meta"><strong>${escapeHtml(comment.nickname)}</strong><span>${fmtDateTime(comment.createdAt)}</span></div><div class="row comment-actions">${deleteButton}${state.user && comment.uid !== state.user.uid ? `<button class="btn mini" data-action="block-user" data-uid="${escapeHtml(comment.uid)}">차단</button>` : ""}<button class="btn mini danger" data-action="report" data-target="${escapeHtml(target)}">신고</button></div></div><p class="subtext">${escapeHtml(comment.content)}</p></div>`;
}

function renderPublicJournalRow(journal) {
  const comments = commentsForJournal(journal.id);
  const liked = hasLikedJournal(journal.id);
  return `
    <div class="list-row" data-journal-id="${escapeHtml(journal.id)}">
      <div class="row-between">
        <button class="link-title small" data-action="route" data-route="journal-share" data-param="${escapeHtml(journal.id)}">${escapeHtml(journal.stockName)} ${escapeHtml(journal.action)}</button>
        <span class="badge">${comments.length}댓글</span>
      </div>
      <p class="subtext">${escapeHtml(journal.note)}</p>
      <div class="post-meta"><span>${escapeHtml(journal.nickname)}</span><span>${fmtDate(journal.tradeDate)}</span><span>좋아요 ${journal.likes || 0}</span></div>
      <div class="row actions-wrap">
        <button class="btn mini" data-action="route" data-route="journal-share" data-param="${escapeHtml(journal.id)}">상세</button>
        <button class="btn mini" data-action="like-journal" data-id="${escapeHtml(journal.id)}">${liked ? "좋아요 취소" : "좋아요"}</button>
        ${state.user && journal.uid !== state.user.uid ? `<button class="btn mini" data-action="block-user" data-uid="${escapeHtml(journal.uid)}">차단</button>` : ""}
        <button class="btn mini danger" data-action="report" data-target="journal:${escapeHtml(journal.id)}">신고</button>
      </div>
    </div>
  `;
}

function publicJournals() {
  return [...state.data.journals]
    .filter((journal) => journal.isPublic && !isUidBlocked(journal.uid))
    .sort((a, b) => new Date(b.publishedAt || b.createdAt || b.tradeDate) - new Date(a.publishedAt || a.createdAt || a.tradeDate));
}

function findJournal(id) {
  return state.data.journals.find((journal) => journal.id === id);
}

function commentsForJournal(journalId) {
  return (state.data.journalComments?.[journalId] || []).filter((comment) => !isUidBlocked(comment.uid));
}

function hasLikedJournal(journalId) {
  return Boolean(state.user && getUserDoc().likedJournals?.[journalId]);
}

function renderJournalShareDetail() {
  const journal = findJournal(state.route.param);
  if (!journal || !journal.isPublic) {
    return `
      ${renderPageHead("Shared Journal", "공개 매매일지를 찾을 수 없습니다", "삭제되었거나 비공개로 전환된 기록입니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button>`)}
      <div class="empty">커뮤니티의 공개 매매일지 목록에서 다시 선택해주세요.</div>
    `;
  }
  if (isUidBlocked(journal.uid)) {
    return `
      ${renderPageHead("Shared Journal", "차단한 작성자의 매매일지입니다", "차단 목록에 있는 작성자의 공개 일지는 숨깁니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button>`)}
      <div class="empty">차단 설정을 해제하면 다시 볼 수 있습니다.</div>
    `;
  }
  const comments = commentsForJournal(journal.id);
  const pnl = journal.action === "매도" && journal.buyPrice ? (Number(journal.price) - Number(journal.buyPrice)) * Number(journal.quantity) : 0;
  const liked = hasLikedJournal(journal.id);
  return `
    ${renderPageHead("Shared Journal", `${journal.stockName} ${journal.action}`, `${journal.nickname} · ${fmtDate(journal.tradeDate)}`, `<button class="btn" data-action="route" data-route="community">커뮤니티</button><button class="btn" data-action="route" data-route="journal">내 일지</button>`)}
    <div class="split">
      <section class="panel">
        <div class="panel-body stack">
          <div class="grid grid-4">
            ${renderKpiCard("종목", `${journal.ticker} · ${journal.market}`, journal.stockName, "")}
            ${renderKpiCard("가격", fmtMoney(journal.price, journal.market), "기록가", "")}
            ${renderKpiCard("수량", fmtNum(journal.quantity, 4), journal.action, "")}
            ${renderKpiCard("손익", pnl ? fmtMoney(pnl, journal.market) : "-", journal.buyPrice ? "연결 매수가 기준" : "매수가 미연결", changeClass(pnl))}
          </div>
          <p class="post-body">${escapeHtml(journal.note || "메모가 없습니다.")}</p>
          <div class="row actions-wrap">
            <button class="btn" data-action="like-journal" data-id="${escapeHtml(journal.id)}">${liked ? "좋아요 취소" : "좋아요"} ${journal.likes || 0}</button>
            ${state.user && journal.uid !== state.user.uid ? `<button class="btn" data-action="block-user" data-uid="${escapeHtml(journal.uid)}">작성자 차단</button>` : ""}
            <button class="btn danger" data-action="report" data-target="journal:${escapeHtml(journal.id)}">신고</button>
            <button class="btn" data-action="open-stock" data-stock="${escapeHtml(`${journal.market}_${journal.ticker}`)}">종목 상세</button>
          </div>
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>댓글</h2><span class="badge">${comments.length}개</span></div>
        <div class="panel-body stack">
          <form class="form" data-form="journal-comment">
            <input type="hidden" name="journalId" value="${escapeHtml(journal.id)}" />
            <div class="row"><input class="input" name="content" placeholder="공개 일지 의견" /><button class="btn primary" ${state.user ? "" : "disabled"}>등록</button></div>
          </form>
          <div class="comment-list">${comments.map((comment) => renderComment(comment, { target: `journal-comment:${journal.id}:${comment.id}`, journalId: journal.id, journalUid: journal.uid })).join("") || `<div class="empty">아직 댓글이 없습니다.</div>`}</div>
        </div>
      </aside>
    </div>
  `;
}

function renderMyActivity() {
  const myPosts = state.data.posts.filter((p) => p.uid === state.user.uid);
  const myComments = Object.entries(state.data.postComments).flatMap(([postId, comments]) => comments.filter((c) => c.uid === state.user.uid).map((c) => ({ ...c, postId })));
  return `
    <div class="source-item"><strong>내 글</strong><p class="subtext">${myPosts.length}개</p></div>
    <div class="source-item"><strong>내 댓글</strong><p class="subtext">${myComments.length}개</p></div>
    <div class="row actions-wrap"><button class="btn" data-action="route" data-route="my-posts">내 글 관리</button><button class="btn" data-action="route" data-route="my-comments">내 댓글 관리</button></div>
    <button class="btn" data-action="route" data-route="profile">프로필 보기</button>
  `;
}

function renderPostBody(post) {
  const body = post.content ? `<p class="post-body">${escapeHtml(post.content)}</p>` : "";
  const images = (post.imageUrls || []).map((url) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(post.title)} 첨부 이미지" loading="lazy" />`).join("");
  return `${body}${images ? `<div class="image-grid post-images">${images}</div>` : ""}`;
}

function renderPostDetail() {
  const post = findPost(state.route.param);
  if (!post) {
    return `
      ${renderPageHead("Community", "게시글을 찾을 수 없습니다", "삭제되었거나 아직 동기화되지 않은 글입니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button>`)}
      <div class="empty">목록으로 돌아가 다른 글을 확인해주세요.</div>
    `;
  }
  const hidden = isUidBlocked(post.uid);
  if (hidden && !canManagePost(post)) {
    return `
      ${renderPageHead("Community", "차단한 작성자의 글입니다", "차단 목록에 있는 작성자의 글은 기본적으로 숨깁니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button>`)}
      <div class="empty">차단을 해제하려면 프로필의 로컬 데이터를 조정하거나 Firebase 사용자 설정을 확인해주세요.</div>
    `;
  }
  const comments = commentsForPost(post.id);
  const own = canEditPost(post);
  const manageable = canManagePost(post);
  const liked = hasLikedPost(post.id);
  const following = isFollowingPostAuthor(post.uid);
  const authorActions = state.user && post.uid !== state.user.uid
    ? `<button class="btn" data-action="toggle-post-author-follow" data-uid="${escapeHtml(post.uid)}">${following ? "팔로우 해제" : "작성자 팔로우"}</button><button class="btn" data-action="block-user" data-uid="${escapeHtml(post.uid)}">작성자 차단</button>`
    : "";
  return `
    ${renderPageHead("Community", post.title, `${post.nickname} · Lv.${post.authorLevel || 1} · ${fmtDateTime(post.createdAt)}`, `<button class="btn" data-action="route" data-route="community">목록</button>`)}
    <article class="panel post-detail" data-post-id="${escapeHtml(post.id)}">
      <div class="panel-body stack">
        <div class="row actions-wrap">
          <button class="btn" data-action="like-post" data-id="${escapeHtml(post.id)}">${liked ? "좋아요 취소" : "좋아요"} ${post.likes}</button>
          ${authorActions}
          ${own ? `<button class="btn" data-action="modal" data-modal="post" data-id="${escapeHtml(post.id)}">수정</button>` : ""}
          ${manageable ? `<button class="btn danger" data-action="delete-post" data-id="${escapeHtml(post.id)}">삭제</button>` : ""}
          ${state.user && post.uid !== state.user.uid ? `<button class="btn danger" data-action="report" data-target="post:${escapeHtml(post.id)}">신고</button>` : ""}
        </div>
        ${renderPostBody(post)}
      </div>
    </article>
    <section class="panel section">
      <div class="panel-head"><h2>댓글</h2><span class="badge">${comments.length}개</span></div>
      <div class="panel-body stack">
        <div class="comment-list">${comments.map((comment) => renderComment(comment, { target: `post-comment:${post.id}:${comment.id}`, postId: post.id, postUid: post.uid })).join("") || `<div class="empty">첫 댓글을 남겨보세요.</div>`}</div>
        <form class="form" data-form="post-comment">
          <input type="hidden" name="postId" value="${escapeHtml(post.id)}" />
          <div class="row"><input class="input" name="content" placeholder="댓글" /><button class="btn primary" ${state.user ? "" : "disabled"}>등록</button></div>
        </form>
      </div>
    </section>
  `;
}

function renderMyPosts() {
  if (!state.user) return authRequired("내 글");
  const posts = [...state.data.posts]
    .filter((post) => post.uid === state.user.uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    ${renderPageHead("Community", "내 작성 글", "작성한 커뮤니티 글을 열람, 수정, 삭제합니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button><button class="btn primary" data-action="modal" data-modal="post">글쓰기</button>`)}
    <section class="panel">
      <div class="panel-head"><h2>내 글</h2><span class="badge">${posts.length}개</span></div>
      <div>${posts.map((post) => `<div class="list-row"><div class="row-between"><button class="link-title small" data-action="route" data-route="post" data-param="${escapeHtml(post.id)}">${escapeHtml(post.title)}</button><div class="row actions-wrap"><button class="btn mini" data-action="modal" data-modal="post" data-id="${escapeHtml(post.id)}">수정</button><button class="btn mini danger" data-action="delete-post" data-id="${escapeHtml(post.id)}">삭제</button></div></div><p class="subtext">${escapeHtml(post.content)}</p><span class="muted">${fmtDateTime(post.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 글이 없습니다.</div></div>`}</div>
    </section>
  `;
}

function renderMyComments() {
  if (!state.user) return authRequired("내 댓글");
  const postComments = Object.entries(state.data.postComments)
    .flatMap(([postId, comments]) => comments.filter((comment) => comment.uid === state.user.uid).map((comment) => ({ ...comment, postId, post: findPost(postId) })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pickComments = Object.entries(state.data.pickComments)
    .flatMap(([pickId, comments]) => comments.filter((comment) => comment.uid === state.user.uid).map((comment) => ({ ...comment, pickId, pick: state.data.stockPicks.find((pick) => pick.id === pickId) })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const journalComments = Object.entries(state.data.journalComments || {})
    .flatMap(([journalId, comments]) => comments.filter((comment) => comment.uid === state.user.uid).map((comment) => ({ ...comment, journalId, journal: findJournal(journalId) })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    ${renderPageHead("Community", "내 댓글", "커뮤니티, 공개 매매일지, 추천주에 남긴 댓글을 모아봅니다.", `<button class="btn" data-action="route" data-route="community">커뮤니티</button>`)}
    <div class="grid grid-3">
      <section class="panel">
        <div class="panel-head"><h2>커뮤니티 댓글</h2><span class="badge">${postComments.length}개</span></div>
        <div>${postComments.map((comment) => `<div class="list-row"><div class="row-between"><button class="link-title small" data-action="route" data-route="post" data-param="${escapeHtml(comment.postId)}">${escapeHtml(comment.post?.title || "삭제된 게시글")}</button><button class="btn mini danger" data-action="delete-post-comment" data-post="${escapeHtml(comment.postId)}" data-id="${escapeHtml(comment.id)}">삭제</button></div><p class="subtext">${escapeHtml(comment.content)}</p><span class="muted">${fmtDateTime(comment.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 커뮤니티 댓글이 없습니다.</div></div>`}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>매매일지 댓글</h2><span class="badge">${journalComments.length}개</span></div>
        <div>${journalComments.map((comment) => `<div class="list-row"><div class="row-between"><button class="link-title small" data-action="route" data-route="journal-share" data-param="${escapeHtml(comment.journalId)}">${escapeHtml(comment.journal ? `${comment.journal.stockName} ${comment.journal.action}` : "삭제된 매매일지")}</button><button class="btn mini danger" data-action="delete-journal-comment" data-journal="${escapeHtml(comment.journalId)}" data-id="${escapeHtml(comment.id)}">삭제</button></div><p class="subtext">${escapeHtml(comment.content)}</p><span class="muted">${fmtDateTime(comment.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 매매일지 댓글이 없습니다.</div></div>`}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>추천주 댓글</h2><span class="badge">${pickComments.length}개</span></div>
        <div>${pickComments.map((comment) => `<div class="list-row"><div class="row-between">${comment.pick ? `<button class="link-title small" data-action="route" data-route="stock" data-param="${escapeHtml(stockKey(comment.pick))}">${escapeHtml(comment.pick.name)} ${escapeHtml(comment.pick.ticker)}</button>` : `<strong>삭제된 추천주</strong>`}<span class="muted">${fmtDateTime(comment.createdAt)}</span></div><p class="subtext">${escapeHtml(comment.content)}</p></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 추천주 댓글이 없습니다.</div></div>`}</div>
      </section>
    </div>
  `;
}

function renderNotices() {
  const notices = [...state.data.announcements].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.createdAt) - new Date(a.createdAt));
  return `
    ${renderPageHead("Notice", "공지사항", "서비스 공지와 변경 사항을 확인합니다.", isAdmin() ? `<button class="btn primary" data-action="modal" data-modal="notice">공지 작성</button>` : "")}
    <section class="panel"><div>${notices.map(renderNoticeRow).join("")}</div></section>
  `;
}

function renderProfile() {
  if (!state.user) {
    return `
      ${renderPageHead("Account", "이메일 로그인", "간편 로그인 없이 이메일 회원가입/로그인만 제공합니다.")}
      <div class="grid grid-2 profile-auth-grid">
        <section class="panel">
          <div class="panel-head"><h2>로그인</h2></div>
          <div class="panel-body">
            <form class="form" data-form="login">
              <label class="field"><span>이메일</span><input class="input" type="email" name="email" required /></label>
              <label class="field"><span>비밀번호</span><input class="input" type="password" name="password" required /></label>
              <button class="btn primary">로그인</button>
            </form>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>회원가입</h2></div>
          <div class="panel-body">
            <form class="form" data-form="signup">
              <label class="field"><span>닉네임</span><input class="input" name="nickname" required /></label>
              <label class="field"><span>이메일</span><input class="input" type="email" name="email" required /></label>
              <label class="field"><span>비밀번호</span><input class="input" type="password" name="password" minlength="6" required /></label>
              <button class="btn primary">가입</button>
            </form>
          </div>
        </section>
      </div>
    `;
  }
  const doc = getUserDoc();
  const progress = levelProgress(doc);
  const myPosts = state.data.posts.filter((post) => post.uid === state.user.uid);
  const myComments = Object.entries(state.data.postComments)
    .flatMap(([postId, comments]) => comments.filter((comment) => comment.uid === state.user.uid).map((comment) => ({ ...comment, postId })));
  return `
    ${renderPageHead("Profile", "프로필", `${state.user.email} · ${state.user.provider}`, `<button class="btn" data-action="route" data-route="portfolio">보유 현황</button><button class="btn" data-action="route" data-route="my-posts">내 글</button><button class="btn" data-action="route" data-route="my-comments">내 댓글</button><button class="btn" data-action="logout">로그아웃</button>`)}
    <div class="grid grid-3 profile-summary-grid">
      ${renderKpiCard("레벨", `Lv.${progress.level}`, `${progress.score} XP`, "good")}
      ${renderKpiCard("게시글", `${doc.postCount || 0}개`, "공개 일지 포함", "")}
      ${renderKpiCard("댓글", `${doc.commentCount || 0}개`, "커뮤니티 활동", "")}
    </div>
    <div class="split section profile-control-split">
      <section class="panel">
        <div class="panel-head"><h2>닉네임</h2></div>
        <div class="panel-body">
          <form class="form" data-form="nickname">
            <input class="input" name="nickname" value="${escapeHtml(doc.nickname || state.user.nickname)}" />
            <button class="btn primary">저장</button>
          </form>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>관리</h2></div>
        <div class="panel-body stack">
          <button class="btn" data-action="export-data">로컬 데이터 내보내기</button>
          ${isAdmin() ? `<button class="btn primary" data-action="route" data-route="admin">관리자 화면</button>` : ""}
        </div>
      </section>
    </div>
    <div class="grid grid-2 section">
      <section class="panel">
        <div class="panel-head"><h2>내 글</h2><button class="btn mini" data-action="route" data-route="my-posts">${myPosts.length}개</button></div>
        <div>${myPosts.slice(0, 8).map((post) => `<div class="list-row"><button class="link-title small" data-action="route" data-route="post" data-param="${escapeHtml(post.id)}">${escapeHtml(post.title)}</button><p class="subtext">${escapeHtml(post.content)}</p><span class="muted">${fmtDateTime(post.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 글이 없습니다.</div></div>`}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>내 댓글</h2><button class="btn mini" data-action="route" data-route="my-comments">${myComments.length}개</button></div>
        <div>${myComments.slice(0, 8).map((comment) => `<div class="list-row"><button class="link-title small" data-action="route" data-route="post" data-param="${escapeHtml(comment.postId)}">${escapeHtml(findPost(comment.postId)?.title || "삭제된 게시글")}</button><p class="subtext">${escapeHtml(comment.content)}</p><span class="muted">${fmtDateTime(comment.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">작성한 댓글이 없습니다.</div></div>`}</div>
      </section>
    </div>
  `;
}

function levelProgress(doc) {
  const score = (doc.postCount || 0) * 3 + (doc.commentCount || 0) + (doc.attendanceCount || 0) + (doc.bonusXp || 0);
  const thresholds = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 595, 675, 760, 850, 945, 1045];
  let level = 1;
  thresholds.forEach((t, i) => {
    if (score >= t) level = i + 1;
  });
  return { score, level };
}

function renderAdmin() {
  const reports = state.data.reports || [];
  const users = adminUserList();
  const summary = adminUserSummary(users);
  return `
    ${renderPageHead("Admin", "관리자", "추천주, 공지, 신고, 회원 활동 흐름을 웹에서 관리합니다.")}
    <div class="grid grid-4">
      ${renderKpiCard("추천주", `${state.data.stockPicks.length}개`, "stock_picks", "")}
      ${renderKpiCard("게시글", `${state.data.posts.length}개`, "posts", "")}
      ${renderKpiCard("회원", `${summary.total}명`, `오늘 +${summary.today}`, "")}
      ${renderKpiCard("신고", `${reports.length}개`, "reports", reports.length ? "warn" : "")}
    </div>
    <div class="grid grid-2 section">
      <section class="panel">
        <div class="panel-head"><h2>추천주 추가</h2></div>
        <div class="panel-body">${renderPickForm()}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>공지 작성</h2></div>
        <div class="panel-body">${renderNoticeForm()}</div>
      </section>
    </div>
    ${renderAdminUsersPanel(users, summary)}
    <section class="panel section">
      <div class="panel-head"><h2>신고함</h2><span class="badge ${reports.length ? "warn" : ""}">${reports.length}개</span></div>
      <div>${reports.map((report) => `<div class="list-row"><div class="row-between"><strong>${escapeHtml(report.target || "대상 미상")}</strong><button class="btn mini danger" data-action="delete-report" data-id="${escapeHtml(report.id)}">삭제</button></div><p class="subtext">신고자 ${escapeHtml(report.reporterUid)}${report.targetUid ? ` · 대상 ${escapeHtml(report.targetUid)}` : ""}${report.contentType ? ` · ${escapeHtml(report.contentType)}` : ""}${report.reason ? ` · ${escapeHtml(report.reason)}` : ""}</p><span class="muted">${fmtDateTime(report.createdAt)}</span></div>`).join("") || `<div class="panel-body"><div class="empty">접수된 신고가 없습니다.</div></div>`}</div>
    </section>
  `;
}

function adminUserList() {
  const accounts = Object.values(readJson(STORE.users) || {});
  const localUsers = accounts.map((account) => {
    const doc = normalizeUserDoc(state.data.userDocs?.[account.uid] || {});
    const postCount = Number(doc.postCount || state.data.posts.filter((post) => post.uid === account.uid).length || 0);
    const journalCount = state.data.journals.filter((journal) => journal.uid === account.uid).length;
    const reportCount = (state.data.reports || []).filter((report) => report.targetUid === account.uid).length;
    const favoriteCountValue = Object.keys(doc.favoriteStocks || {}).length;
    return normalizeAdminUser({
      ...doc,
      uid: account.uid,
      email: account.email,
      nickname: doc.nickname || account.nickname,
      provider: account.provider || "local",
      isAdmin: account.isAdmin,
      createdAt: account.createdAt || doc.createdAt,
      lastActiveAt: account.lastActiveAt || doc.lastActiveAt,
      postCount,
      journalCount,
      reportCount,
      favoriteCount: favoriteCountValue,
      blockedCount: Object.keys(doc.blockedUsers || {}).length,
      memoCount: Object.keys(doc.memos || {}).length
    });
  });
  const remoteUsers = (state.data.adminUsers || []).map(normalizeAdminUser);
  const byUid = new Map();
  [...remoteUsers, ...localUsers].forEach((user) => {
    if (!user.uid) return;
    byUid.set(user.uid, { ...(byUid.get(user.uid) || {}), ...user });
  });
  return [...byUid.values()]
    .sort((a, b) => new Date(b.createdAt || b.lastActiveAt || 0) - new Date(a.createdAt || a.lastActiveAt || 0));
}

function adminUserSummary(users) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: users.length,
    today: users.filter((user) => String(user.createdAt || "").slice(0, 10) === today).length,
    admin: users.filter((user) => user.isAdmin).length
  };
}

function filteredAdminUsers(users) {
  const q = state.filters.adminUserSearch.trim().toLowerCase();
  if (!q) return users;
  return users.filter((user) => `${user.uid} ${user.email} ${user.nickname} ${user.provider}`.toLowerCase().includes(q));
}

function renderAdminUsersPanel(users, summary) {
  const visibleUsers = filteredAdminUsers(users);
  const selectedUid = state.filters.adminUserUid || visibleUsers[0]?.uid || "";
  const selected = users.find((user) => user.uid === selectedUid) || visibleUsers[0] || null;
  return `
    <section class="panel section">
      <div class="panel-head wrap">
        <div><h2>회원 관리</h2><p class="subtext">원본 관리자 유저 목록처럼 가입자, 활동 수, 레벨, 신고 상태를 확인합니다.</p></div>
        <div class="row wrap"><span class="badge">전체 ${summary.total}</span><span class="badge good">오늘 +${summary.today}</span><span class="badge">관리자 ${summary.admin}</span></div>
      </div>
      <div class="panel-body">
        <input class="input" data-filter="adminUserSearch" value="${escapeHtml(state.filters.adminUserSearch)}" placeholder="닉네임, 이메일, UID 검색" />
      </div>
      <div class="split admin-users">
        <div class="stack admin-user-list">
          ${visibleUsers.slice(0, 80).map((user) => renderAdminUserRow(user, selected?.uid === user.uid)).join("") || `<div class="panel-body"><div class="empty">검색 결과가 없습니다.</div></div>`}
        </div>
        <aside class="panel admin-user-detail">
          ${selected ? renderAdminUserDetail(selected) : `<div class="panel-body"><div class="empty">표시할 회원이 없습니다.</div></div>`}
        </aside>
      </div>
    </section>
  `;
}

function renderAdminUserRow(user, selected) {
  return `
    <div class="list-row ${selected ? "selected" : ""}" data-action="inspect-admin-user" data-uid="${escapeHtml(user.uid)}">
      <div class="row-between">
        <div>
          <strong>${escapeHtml(user.nickname || "(닉네임 없음)")}</strong>
          <p class="subtext">${escapeHtml(user.email || user.uid)} · ${escapeHtml(user.provider)}</p>
        </div>
        <span class="badge ${user.isAdmin ? "good" : ""}">${user.isAdmin ? "관리자" : `Lv.${user.level}`}</span>
      </div>
      <div class="post-meta"><span>글/일지 ${fmtNum(user.postCount + Number(user.journalCount || 0))}</span><span>댓글 ${fmtNum(user.commentCount)}</span><span>가입 ${fmtDate(user.createdAt) || "-"}</span></div>
    </div>
  `;
}

function renderAdminUserDetail(user) {
  const activityScore = (user.postCount || 0) * 3 + (user.commentCount || 0) + (user.attendanceCount || 0) + (user.bonusXp || 0);
  return `
    <div class="panel-head"><h2>회원 상세</h2><span class="badge">${escapeHtml(user.uid)}</span></div>
    <div class="panel-body stack">
      <div class="grid grid-3">
        ${renderKpiCard("레벨", `Lv.${user.level}`, `${fmtNum(activityScore)} XP`, "good")}
        ${renderKpiCard("글/일지", `${fmtNum(user.postCount + Number(user.journalCount || 0))}개`, `글 ${fmtNum(user.postCount)} · 일지 ${fmtNum(user.journalCount || 0)}`, "")}
        ${renderKpiCard("댓글", `${fmtNum(user.commentCount)}개`, "커뮤니티 활동", "")}
      </div>
      <div class="source-item"><strong>기본 정보</strong><p class="subtext">닉네임 ${escapeHtml(user.nickname || "-")} · 이메일 ${escapeHtml(user.email || "-")} · 제공자 ${escapeHtml(user.provider || "-")}</p></div>
      <div class="source-item"><strong>활동 상태</strong><p class="subtext">가입 ${escapeHtml(fmtDateTime(user.createdAt) || "-")} · 최근 접속 ${escapeHtml(fmtDateTime(user.lastActiveAt) || "-")} · 신고 대상 ${fmtNum(user.reportCount || 0)}건</p></div>
      <div class="grid grid-3">
        ${renderKpiCard("관심", `${fmtNum(user.favoriteCount || 0)}개`, "favoriteStocks", "")}
        ${renderKpiCard("메모", `${fmtNum(user.memoCount || 0)}개`, "memos", "")}
        ${renderKpiCard("차단", `${fmtNum(user.blockedCount || 0)}명`, "blockedUsers", user.blockedCount ? "warn" : "")}
      </div>
    </div>
  `;
}

function renderPickForm() {
  return `
    <form class="form" data-form="admin-pick">
      <div class="grid grid-2"><input class="input" name="name" placeholder="종목명" required /><input class="input" name="ticker" placeholder="티커" required /></div>
      <div class="grid grid-3"><select class="select" name="market"><option>KS</option><option>KQ</option><option>US</option></select><input class="input" name="buyPrice" type="number" placeholder="매수가" /><input class="input" name="targetPrice" type="number" placeholder="목표가" /></div>
      <textarea class="textarea" name="reason" placeholder="추천 근거"></textarea>
      <button class="btn primary">추가</button>
    </form>
  `;
}

function renderNoticeForm(id = "") {
  const notice = id ? findNotice(id) : null;
  return `
    <form class="form" data-form="notice">
      <input type="hidden" name="id" value="${escapeHtml(id || "")}" />
      <input class="input" name="title" placeholder="제목" value="${escapeHtml(notice?.title || "")}" required />
      <textarea class="textarea" name="body" placeholder="내용" required>${escapeHtml(notice?.body || "")}</textarea>
      <label class="row"><input type="checkbox" name="isPinned" ${notice?.isPinned ? "checked" : ""} /> 고정</label>
      <button class="btn primary">${notice ? "수정" : "저장"}</button>
    </form>
  `;
}

function renderMarketAnalysisForm(id = "") {
  const item = id ? state.data.marketAnalyses.find((analysis) => analysis.id === id) : null;
  return `
    <form class="form" data-form="market-analysis">
      <input type="hidden" name="id" value="${escapeHtml(id || "")}" />
      <label class="field"><span>제목</span><input class="input" name="title" value="${escapeHtml(item?.title || "")}" required /></label>
      <label class="field"><span>본문</span><textarea class="textarea" name="body" required>${escapeHtml(item?.body || "")}</textarea></label>
      <label class="field"><span>이미지 URL</span><textarea class="textarea" name="imageUrls" placeholder="이미지 URL을 줄바꿈으로 입력">${escapeHtml((item?.imageUrls || []).join("\n"))}</textarea></label>
      <label class="field"><span>이미지 첨부</span><input class="input" type="file" name="imageFiles" accept="image/*" multiple /></label>
      <p class="subtext">Firebase Storage가 연결되면 업로드 URL로 저장하고, 로컬 검증 환경에서는 작은 이미지 data URL로 첨부합니다.</p>
      <button class="btn primary">저장</button>
    </form>
  `;
}

function authRequired(title) {
  const previewMap = {
    "관심종목": {
      kpis: ["일반 관심종목", "관심 추천주", "가격 알림"],
      rows: [["삼성전자", "005930 · KS", "관심 대기"], ["SK하이닉스", "000660 · KS", "추천주 분리"], ["NAVER", "035420 · KS", "가격 추적"]]
    },
    "매매일지": {
      kpis: ["매수/매도 기록", "손익 차트", "공개 공유"],
      rows: [["삼성전자 매수", "분할 진입 메모", "기록"], ["현대차 매도", "일부 이익 실현", "손익"], ["일별 차트", "실현손익 흐름", "분석"]]
    },
    "매매일지 차트": {
      kpis: ["기간별 손익", "종목 필터", "실현손익"],
      rows: [["매수 마커", "일봉 위 진입 구간", "차트"], ["매도 마커", "실현 구간 표시", "손익"], ["메모", "판단 근거 확인", "기록"]]
    },
    "보유 현황": {
      kpis: ["평가금액", "수익률", "종목별 메모"],
      rows: [["평가손익", "현재가 기반 집계", "대기"], ["평균단가", "매매일지 자동 계산", "집계"], ["종목 메모", "보유 이유 확인", "기록"]]
    },
    "AI 분석": {
      kpis: ["근거 리포트", "DART 재무", "차트 판단"],
      rows: [["CANSLIM 점수", "성장·수급·차트 축", "분석"], ["DART 요약", "재무 데이터 연결", "근거"], ["차트 포인트", "추세/거래대금 판단", "리포트"]]
    },
    "내 글": {
      kpis: ["작성글", "댓글", "활동 기록"],
      rows: [["커뮤니티 글", "내 작성글 모아보기", "기록"], ["댓글", "참여 흐름 확인", "활동"], ["좋아요", "반응 추적", "알림"]]
    },
    "내 댓글": {
      kpis: ["커뮤니티 댓글", "일지 댓글", "추천주 댓글"],
      rows: [["토론 댓글", "종목 의견 확인", "활동"], ["일지 댓글", "공개 매매일지 반응", "기록"], ["추천주 댓글", "포착 종목 의견", "참여"]]
    }
  };
  const preview = previewMap[title] || {
    kpis: ["개인 기록", "동기화", "내 데이터"],
    rows: [["내 데이터", "로그인 후 안전하게 표시", "대기"], ["동기화", "Firebase UID 기준 저장", "준비"], ["기능 흐름", "로컬 계정으로도 검증", "확인"]]
  };
  return `
    ${renderPageHead(title, `${title} 기능은 로그인이 필요합니다`, "이메일 로그인 또는 회원가입 후 사용할 수 있습니다.", `<button class="btn primary" data-action="route" data-route="profile">로그인</button>`)}
    <section class="panel auth-gate">
      <div class="panel-body">
        <div class="auth-gate-main">
          <span class="side-avatar ai">ID</span>
          <div>
            <strong>내 데이터로만 표시됩니다</strong>
            <p class="subtext">로그인하면 Firebase UID 기준으로 저장된 ${escapeHtml(title)} 데이터만 불러옵니다. 로컬 계정으로도 기능 흐름을 검증할 수 있습니다.</p>
          </div>
          <button class="btn primary" data-action="route" data-route="profile">로그인</button>
        </div>
        <div class="auth-gate-preview">
          ${preview.kpis.map((item) => `<div><span>${escapeHtml(item)}</span><b>대기</b></div>`).join("")}
        </div>
        <div class="auth-gate-board">
          <div class="auth-gate-board-head"><strong>${escapeHtml(title)} 미리보기</strong><span>로그인 후 실제 데이터로 전환</span></div>
          <div class="auth-gate-list">
            ${preview.rows.map(([name, meta, badge]) => `
              <button type="button" class="auth-gate-row" data-action="route" data-route="profile">
                <span class="side-avatar">${escapeHtml(name.slice(0, 1))}</span>
                <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(meta)}</small></span>
                <b>${escapeHtml(badge)}</b>
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function favoriteCount() {
  const doc = getUserDoc();
  return Object.keys(doc.favoriteStocks || {}).length;
}

function favoritePickCount() {
  const doc = getUserDoc();
  return (doc.favorites || []).filter((id) => state.data.stockPicks.some((pick) => pick.id === id)).length;
}

function pruneStockKeyFromFavoritePicks(doc, key) {
  const before = Array.isArray(doc.favorites) ? doc.favorites : [];
  doc.favorites = before.filter((id) => id !== key);
  return doc.favorites.length !== before.length;
}

function captureCount() {
  const activePicks = state.data.stockPicks.filter((pick) => pick.status === "active").length;
  return activePicks + state.data.marketFeatures.length;
}

function formatTradingValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  if (n >= 1000000000000) return `${fmtNum(n / 1000000000000, 1)}조`;
  if (n >= 100000000) return `${fmtNum(n / 100000000, 0)}억`;
  return fmtNum(n);
}

function renderModal() {
  const modal = state.modal || {};
  let body = "";
  if (modal.type === "journal") body = renderJournalModal(modal.id);
  if (modal.type === "post") body = renderPostModal(modal.id);
  if (modal.type === "notice") body = renderNoticeForm(modal.id);
  if (modal.type === "market-analysis") body = renderMarketAnalysisForm(modal.id);
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" data-modal-surface>
        <div class="modal-head"><h2>${escapeHtml(modalTitle(modal.type, modal.id))}</h2><button class="btn icon" data-action="close-modal">X</button></div>
        <div class="modal-body">${body}</div>
      </div>
    </div>
  `;
}

function modalTitle(type, id = "") {
  if (type === "post" && id) return "글 수정";
  if (type === "notice" && id) return "공지 수정";
  return { journal: "매매일지", post: "글쓰기", notice: "공지", "market-analysis": "시황 분석" }[type] || "입력";
}

function renderJournalModal(id) {
  const j = id ? state.data.journals.find((item) => item.id === id) : null;
  return `
    <form class="form" data-form="journal">
      <input type="hidden" name="id" value="${escapeHtml(id || "")}" />
      <div class="grid grid-2"><label class="field"><span>종목명</span><input class="input" name="stockName" value="${escapeHtml(j?.stockName || "")}" required /></label><label class="field"><span>티커</span><input class="input" name="ticker" value="${escapeHtml(j?.ticker || "")}" required /></label></div>
      <div class="grid grid-3"><label class="field"><span>시장</span><select class="select" name="market">${["KS", "KQ", "US"].map((m) => `<option ${j?.market === m ? "selected" : ""}>${m}</option>`).join("")}</select></label><label class="field"><span>구분</span><select class="select" name="action">${["매수", "매도", "기타"].map((m) => `<option ${j?.action === m ? "selected" : ""}>${m}</option>`).join("")}</select></label><label class="field"><span>일자</span><input class="input" type="date" name="tradeDate" value="${escapeHtml(String(j?.tradeDate || new Date().toISOString()).slice(0, 10))}" /></label></div>
      <div class="grid grid-3"><label class="field"><span>가격</span><input class="input" type="number" name="price" value="${escapeHtml(j?.price || "")}" required /></label><label class="field"><span>수량</span><input class="input" type="number" step="0.0001" name="quantity" value="${escapeHtml(j?.quantity || "")}" required /></label><label class="field"><span>연결 매수가</span><input class="input" type="number" name="buyPrice" value="${escapeHtml(j?.buyPrice || "")}" /></label></div>
      <label class="field"><span>메모</span><textarea class="textarea" name="note">${escapeHtml(j?.note || "")}</textarea></label>
      <label class="row"><input type="checkbox" name="isPublic" ${j?.isPublic ? "checked" : ""} /> 공개</label>
      <button class="btn primary">저장</button>
    </form>
  `;
}

function renderPostModal(id = "") {
  const post = id ? findPost(id) : null;
  return `
    <form class="form" data-form="post">
      <input type="hidden" name="id" value="${escapeHtml(id || "")}" />
      <input class="input" name="title" placeholder="제목" value="${escapeHtml(post?.title || "")}" required />
      <textarea class="textarea" name="content" placeholder="내용" required>${escapeHtml(post?.content || "")}</textarea>
      <label class="field"><span>이미지 첨부</span><input class="input" type="file" name="imageFiles" accept="image/*" multiple /></label>
      <p class="subtext">이미지는 최대 5장까지 첨부됩니다. 기존 이미지 URL은 본문 Markdown 이미지 또는 저장된 첨부 이미지로 유지됩니다.</p>
      <button class="btn primary" ${state.user ? "" : "disabled"}>${post ? "저장" : "등록"}</button>
    </form>
  `;
}

async function onClick(event) {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "close-modal" && actionEl.classList.contains("modal-backdrop") && event.target !== actionEl) {
    return;
  }
  if (actionEl.closest("[data-modal-surface]") && action !== "close-modal") {
    event.stopPropagation();
  }
  if (action === "route") navigate(actionEl.dataset.route, actionEl.dataset.param || "");
  if (action === "scroll-stock-section") scrollStockSection(actionEl);
  if (action === "theme-toggle") toggleTheme();
  if (action === "toggle-right-panel") {
    state.filters.rightPanelOpen = state.filters.rightPanelOpen === false;
    render();
  }
  if (action === "logout") await signOut();
  if (action === "capture-tab") {
    state.filters.captureTab = actionEl.dataset.tab;
    render();
  }
  if (action === "open-stock") await openStock(actionEl.dataset.stock);
  if (action === "open-investor-stock") await openInvestorFlowStock(actionEl.dataset);
  if (action === "open-fmkorea-stock") await openFmkoreaHotStock(actionEl.dataset);
  if (action === "market-detail") navigate("index", actionEl.dataset.ticker);
  if (action === "toggle-favorite-pick") await toggleFavoritePick(actionEl.dataset.pick);
  if (action === "toggle-favorite-stock") await toggleFavoriteStock(actionEl.dataset.stock);
  if (action === "remove-favorite-stock") await removeFavoriteStock(actionEl.dataset.stock);
  if (action === "promote-feature-pick") await promoteFeatureToPick(actionEl.dataset.feature);
  if (action === "generate-ai") await generateAnalysis(actionEl.dataset.stock);
  if (action === "delete-ai") await deleteAnalysis(actionEl.dataset.id);
  if (action === "delete-journal") await deleteJournal(actionEl.dataset.id);
  if (action === "delete-market-analysis") await deleteMarketAnalysis(actionEl.dataset.id);
  if (action === "delete-post") await deletePost(actionEl.dataset.id);
  if (action === "delete-post-comment") await deletePostComment(actionEl.dataset.post, actionEl.dataset.id);
  if (action === "delete-journal-comment") await deleteJournalComment(actionEl.dataset.journal, actionEl.dataset.id);
  if (action === "toggle-post-author-follow") await togglePostAuthorFollow(actionEl.dataset.uid);
  if (action === "block-user") await blockUser(actionEl.dataset.uid);
  if (action === "inspect-admin-user") {
    state.filters.adminUserUid = actionEl.dataset.uid || "";
    render();
  }
  if (action === "modal") {
    state.modal = { type: actionEl.dataset.modal, id: actionEl.dataset.id || "" };
    render();
  }
  if (action === "close-modal") {
    state.modal = null;
    render();
  }
  if (action === "like-post") await likePost(actionEl.dataset.id);
  if (action === "like-journal") await likeJournal(actionEl.dataset.id);
  if (action === "report") await reportContent(actionEl.dataset.target);
  if (action === "delete-report") await deleteReport(actionEl.dataset.id);
  if (action === "delete-notice") await deleteNotice(actionEl.dataset.id);
  if (action === "refresh-prices") await refreshPrices();
  if (action === "refresh-brief") await refreshAiBrief();
  if (action === "refresh-fmkorea") await refreshFmkoreaMarketData();
  if (action === "refresh-market-sectors") await refreshMarketSectors();
  if (action === "refresh-night-futures") await refreshNightFutures();
  if (action === "refresh-scanner") await refreshScannerFeatures({ silent: false });
  if (action === "refresh-market-sentiment") await refreshMarketSentiment({ withIndicators: true, silent: false });
  if (action === "refresh-investor-flow") await refreshInvestorFlow({ silent: false });
  if (action === "copy-investor-flow") await copyInvestorFlowShareText();
  if (action === "copy-fmkorea-index") await copyFmkoreaShareText("index");
  if (action === "copy-fmkorea-hot") await copyFmkoreaShareText("hot");
  if (action === "compare-period") {
    state.filters.comparePeriod = actionEl.dataset.period || "6mo";
    render();
  }
  if (action === "stock-chart-mode") {
    state.filters.stockChartMode = actionEl.dataset.mode === "line" ? "line" : "candles";
    render();
  }
  if (action === "stock-chart-frame") {
    state.filters.stockChartFrame = chartFrameId(actionEl.dataset.frame);
    render();
  }
  if (action === "stock-minute-interval") {
    state.filters.stockMinuteInterval = minuteIntervalId(actionEl.dataset.interval);
    state.filters.stockChartFrame = "minute";
    render();
  }
  if (action === "stock-chart-range") {
    state.filters.stockChartRange = chartRangeId(actionEl.dataset.range);
    render();
  }
  if (action === "index-chart-frame") {
    state.filters.indexChartFrame = chartFrameId(actionEl.dataset.frame);
    render();
  }
  if (action === "index-minute-interval") {
    state.filters.indexMinuteInterval = minuteIntervalId(actionEl.dataset.interval);
    state.filters.indexChartFrame = "minute";
    render();
  }
  if (action === "index-chart-range") {
    state.filters.indexChartRange = chartRangeId(actionEl.dataset.range);
    render();
  }
  if (action === "refresh-portfolio") await refreshPortfolioQuotes();
  if (action === "load-history") await loadHistory(actionEl.dataset.stock, { frame: actionEl.dataset.frame, interval: actionEl.dataset.interval });
  if (action === "load-stock-extras") await loadStockExtras(actionEl.dataset.stock);
  if (action === "load-discussions") await loadStockDiscussions(actionEl.dataset.stock);
  if (action === "load-index-history") await loadMarketHistory(actionEl.dataset.ticker, { frame: actionEl.dataset.frame, interval: actionEl.dataset.interval });
  if (action === "export-data") exportData();
}

async function onSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const type = form.dataset.form;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    if (type === "login") await handleLogin(data);
    if (type === "signup") await handleSignup(data);
    if (type === "nickname") await handleNickname(data);
    if (type === "favorite-stock") await addFavoriteStock(data);
    if (type === "stock-search") await handleStockSearch(data, form);
    if (type === "memo") await saveMemo(data);
    if (type === "pick-comment") await addPickComment(data);
    if (type === "journal") await saveJournal(data, form);
    if (type === "journal-comment") await addJournalComment(data, form);
    if (type === "post") await savePost(data, form);
    if (type === "post-comment") await addPostComment(data, form);
    if (type === "market-analysis") await saveMarketAnalysis(data, form);
    if (type === "market-analysis-comment") await addMarketAnalysisComment(data, form);
    if (type === "notice") await saveNotice(data, form);
    if (type === "admin-pick") await saveAdminPick(data, form);
    if (type === "global-search") await handleGlobalSearch(data);
    if (type === "compare") await handleCompare(data);
  } catch (error) {
    toast(error.message || "처리 중 오류가 발생했습니다.");
  }
}

function onInput(event) {
  const input = event.target.closest("[data-filter]");
  if (!input) return;
  state.filters[input.dataset.filter] = input.value;
  render();
}

function scrollStockSection(button) {
  const target = button?.dataset?.target;
  if (!target) return;
  const container = button.closest(".stock-detail-tabs, .stock-work-tabs, .stock-work-segment");
  if (container) {
    container.querySelectorAll("button.active").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const tab = button.dataset.tab || "";
    if (tab && container.classList.contains("stock-detail-tabs")) state.filters.stockDetailTab = tab;
    if (tab && container.getAttribute("aria-label") === "시세 패널") state.filters.stockQuoteTab = tab;
    if (tab && container.getAttribute("aria-label") === "종목 작업 패널") state.filters.stockWorkTab = tab;
    if (tab && container.classList.contains("stock-work-segment")) state.filters.stockWorkTab = tab;
  }
  const section = document.querySelector(target);
  if (!section) {
    toast("해당 섹션을 준비 중입니다.");
    return;
  }
  section.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
  section.classList.add("section-focus");
  window.setTimeout(() => section.classList.remove("section-focus"), 900);
}

async function handleLogin(data) {
  if (state.firebase.enabled) {
    try {
      const auth = state.firebase.modules.authMod;
      const result = await auth.signInWithEmailAndPassword(state.firebase.auth, data.email, data.password);
      saveSession({
        uid: result.user.uid,
        email: result.user.email || data.email,
        nickname: (result.user.email || data.email).split("@")[0],
        provider: "firebase",
        isAdmin: await firebaseUserIsAdmin(result.user)
      });
      await loadRemoteUserData();
      await recordDailyAttendance();
      toast("Firebase 로그인 완료");
      render();
      return;
    } catch (error) {
      console.warn(error);
      toast("Firebase 로그인 실패, 로컬 계정으로 확인합니다.");
    }
  }
  await signInLocal(data.email, data.password);
  render();
}

async function handleSignup(data) {
  if (state.firebase.enabled) {
    try {
      const auth = state.firebase.modules.authMod;
      const result = await runWithTimeout(
        () => auth.createUserWithEmailAndPassword(state.firebase.auth, data.email, data.password),
        6000,
        "firebase signup"
      );
      if (!result?.user) throw new Error("Firebase 회원가입 응답 지연");
      const user = {
        uid: result.user.uid,
        email: result.user.email || data.email,
        nickname: data.nickname,
        provider: "firebase",
        isAdmin: await firebaseUserIsAdmin(result.user)
      };
      saveSession(user);
      ensureUserDoc();
      await syncUserDocFirestore({ nickname: data.nickname, createdAt: state.firebase.modules.firestoreMod.serverTimestamp() });
      await recordDailyAttendance();
      toast("Firebase 회원가입 완료");
      render();
      return;
    } catch (error) {
      console.warn(error);
      toast("Firebase 회원가입 실패, 로컬 계정으로 생성합니다.");
    }
  }
  await signUpLocal(data.email, data.password, data.nickname);
  render();
}

async function handleNickname(data) {
  if (!state.user) return;
  const doc = getUserDoc();
  doc.nickname = data.nickname.trim() || state.user.nickname;
  state.user.nickname = doc.nickname;
  saveSession(state.user);
  saveData();
  await syncUserDocFirestore({ nickname: doc.nickname });
  toast("닉네임이 저장되었습니다.");
  render();
}

async function addFavoriteStock(data) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const stock = {
    ticker: data.ticker.trim().toUpperCase(),
    name: data.name.trim(),
    market: data.market,
    addedAt: new Date().toISOString()
  };
  const doc = getUserDoc();
  const key = stockKey(stock);
  doc.favoriteStocks[key] = stock;
  doc.favoriteStockIds = [key, ...(doc.favoriteStockIds || []).filter((id) => id !== key)];
  const prunedFavorites = pruneStockKeyFromFavoritePicks(doc, key);
  saveData();
  await syncFavoriteStockFirestore(key, stock, false);
  if (prunedFavorites) await syncFavoritePickFirestore(doc.favorites);
  toast("관심종목에 추가했습니다.");
  render();
}

async function toggleFavoritePick(pickId) {
  if (!state.user) {
    toast("로그인 후 사용할 수 있습니다.");
    navigate("profile");
    return;
  }
  const pick = findStockPick(pickId);
  if (!pick?.id) return;
  const doc = getUserDoc();
  doc.favorites = Array.isArray(doc.favorites) ? doc.favorites : [];
  if (doc.favorites.includes(pick.id)) {
    doc.favorites = doc.favorites.filter((id) => id !== pick.id);
    toast("관심추천주에서 해제했습니다.");
  } else {
    doc.favorites = [pick.id, ...doc.favorites.filter((id) => id !== pick.id)];
    toast("관심추천주에 등록했습니다.");
  }
  saveData();
  await syncFavoritePickFirestore(doc.favorites);
  render();
}

async function toggleFavoriteStock(key) {
  if (!state.user) {
    toast("로그인 후 사용할 수 있습니다.");
    navigate("profile");
    return;
  }
  const stock = getStockByKey(key);
  if (!stock) return;
  const doc = getUserDoc();
  const prunedFavorites = pruneStockKeyFromFavoritePicks(doc, key);
  if (doc.favoriteStocks[key]) {
    delete doc.favoriteStocks[key];
    doc.favoriteStockIds = (doc.favoriteStockIds || []).filter((id) => id !== key);
    await syncFavoriteStockFirestore(key, stock, true);
    toast("관심종목에서 해제했습니다.");
  } else {
    doc.favoriteStocks[key] = {
      ticker: stock.ticker,
      name: stock.name,
      market: stock.market,
      addedAt: new Date().toISOString()
    };
    doc.favoriteStockIds = [key, ...(doc.favoriteStockIds || []).filter((id) => id !== key)];
    await syncFavoriteStockFirestore(key, doc.favoriteStocks[key], false);
    toast("관심종목에 등록했습니다.");
  }
  saveData();
  if (prunedFavorites) await syncFavoritePickFirestore(doc.favorites);
  render();
}

async function removeFavoriteStock(key) {
  await toggleFavoriteStock(key);
}

async function syncFavoritePickFirestore(favorites) {
  await syncUserDocFirestore({ favorites: Array.isArray(favorites) ? favorites : [] });
}

async function syncFavoriteStockFirestore(key, stock, remove) {
  if (!state.firebase.enabled || !state.user || state.user.provider !== "firebase") return;
  const f = state.firebase.modules.firestoreMod;
  const ref = f.doc(state.firebase.db, "users", state.user.uid);
  try {
    if (remove) {
      await f.updateDoc(ref, {
        [`favoriteStocks.${key}`]: f.deleteField(),
        favoriteStockIds: f.arrayRemove(key),
        lastActiveAt: f.serverTimestamp()
      });
    } else {
      await f.setDoc(ref, {
        favoriteStocks: { [key]: stock },
        favoriteStockIds: f.arrayUnion(key),
        lastActiveAt: f.serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.warn("favorite write failed", error);
  }
}

async function handleStockSearch(data, form) {
  const q = String(data.q || "").trim();
  if (!q) return;
  const box = form.parentElement.querySelector("#search-results");
  box.innerHTML = `<div class="empty">검색 중...</div>`;
  const items = await searchStocks(q);
  box.innerHTML = items.map((item) => `
    <div class="source-item">
      <div class="row-between"><div><strong>${escapeHtml(item.name)}</strong><div class="ticker">${escapeHtml(item.ticker)} · ${escapeHtml(item.market)}</div></div><button class="btn" data-action="open-stock" data-stock="${escapeHtml(stockKey(item))}">열기</button></div>
    </div>
  `).join("") || `<div class="empty">검색 결과가 없습니다.</div>`;
}

async function searchStocks(q) {
  const localItems = localStockSearch(q);
  const fallback = () => rememberStocks(localItems);
  const localExact = localItems.length && /[가-힣]|^\d{5,6}$/.test(String(q || "").trim());
  if (localExact) return fallback();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(localItems.length ? 5000 : 18000) }
      : {};
    const res = await fetch(apiUrl("/api/search", { q }), options);
    if (!res.ok) throw new Error("search failed");
    const data = await res.json();
    const items = rememberStocks(data.items || []);
    return items.length ? items : fallback();
  } catch {
    return fallback();
  }
}

function localStockSearch(q) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return [];
  const seed = makeSeedData();
  const source = [
    ...state.data.stockPicks,
    ...state.data.marketFeatures,
    ...seed.stockPicks,
    ...seed.marketFeatures,
    ...state.discoveredStocks.values()
  ];
  const byKey = new Map();
  source.forEach((item) => {
    const stock = normalizeStockLike(item);
    const haystack = `${stock.name} ${stock.ticker} ${stock.market}`.toLowerCase();
    if (haystack.includes(needle)) byKey.set(stockKey(stock), stock);
  });
  return [...byKey.values()].slice(0, 10);
}

function rememberStocks(items) {
  return items.map((item) => {
    const stock = normalizeStockLike(item);
    state.discoveredStocks.set(stockKey(stock), stock);
    return stock;
  });
}

async function handleGlobalSearch(data) {
  const raw = String(data.q || "").trim();
  if (!raw) return;
  const q = raw.toLowerCase();
  state.filters.captureSearch = q;
  const seed = makeSeedData();
  const stock = [
    ...state.data.stockPicks,
    ...state.data.marketFeatures,
    ...seed.stockPicks,
    ...seed.marketFeatures,
    ...state.discoveredStocks.values()
  ]
    .find((item) => `${item.name} ${item.ticker}`.toLowerCase().includes(q));
  if (stock) {
    await openStock(stockKey(stock));
    return;
  }
  const [found] = await searchStocks(raw);
  if (found) await openStock(stockKey(found));
  else {
    toast("검색 결과가 없어 AI포착 목록으로 이동합니다.");
    navigate("capture");
  }
}

async function openStock(key) {
  const stock = getStockByKey(key);
  if (stock && !stock.source && !state.quoteBusy.has(key)) {
    await refreshStockQuote(key, { silent: true });
  }
  navigate("stock", key);
}

async function openInvestorFlowStock(dataset = {}) {
  const market = dataset.market || "KS";
  const ticker = dataset.ticker || "";
  const name = dataset.name || ticker;
  const key = `${market}_${ticker}`;
  if (ticker && !getStockByKey(key)) {
    rememberStocks([{
      id: key,
      market,
      ticker,
      name,
      category: "마감 수급",
      reason: "마감 수급 TOP5에서 선택한 종목입니다."
    }]);
  }
  await openStock(key);
}

async function openFmkoreaHotStock(dataset = {}) {
  const market = dataset.market || "KS";
  const ticker = dataset.ticker || "";
  const name = dataset.name || ticker;
  const key = `${market}_${ticker}`;
  if (ticker && !getStockByKey(key)) {
    rememberStocks([{
      id: key,
      market,
      ticker,
      name,
      category: "펨코 HOT",
      reason: "펨코 HOT 종목에서 선택한 종목입니다."
    }]);
  }
  await openStock(key);
}

async function copyInvestorFlowShareText() {
  const text = buildInvestorFlowShareText();
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(text);
    toast("마감 수급 공유 문구를 복사했습니다.");
  } catch {
    toast("브라우저 권한 때문에 복사하지 못했습니다. 공유 문구 영역에서 직접 선택할 수 있습니다.");
  }
}

async function copyFmkoreaShareText(type) {
  const fmkorea = normalizeFmkoreaData(state.data.market.fmkorea);
  const text = type === "hot" ? buildFmkoreaHotShareText(fmkorea) : buildFmkoreaShareText(fmkorea);
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(text);
    toast(type === "hot" ? "펨코 HOT 공유 문구를 복사했습니다." : "펨코지수 공유 문구를 복사했습니다.");
  } catch {
    toast("브라우저 권한 때문에 복사하지 못했습니다. 공유 문구 영역에서 직접 선택할 수 있습니다.");
  }
}

async function handleCompare(data) {
  const rawItems = [data.base, data.compare1, data.compare2]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!rawItems.length) return;
  state.compareBusy = true;
  render();
  try {
    const rows = [];
    for (const raw of rawItems) {
      const stock = await resolveStockInput(raw);
      if (!stock) continue;
      const key = stockKey(stock);
      state.discoveredStocks.set(key, normalizeStockLike(stock));
      const [quote, historyResult] = await Promise.allSettled([
        fetchQuote(stock),
        fetch(apiUrl("/api/history", { ticker: stock.ticker, market: stock.market, range: "5y", interval: "1d" })).then((res) => {
          if (!res.ok) throw new Error("history failed");
          return res.json();
        })
      ]);
      const quoteData = quote.status === "fulfilled" ? quote.value : null;
      if (quoteData) {
        stock.currentPrice = quoteData.price;
        stock.price = quoteData.price;
        stock.changeRate = quoteData.changeRate;
        stock.marketTime = quoteData.marketTime || null;
        stock.source = quoteData.source || "";
        applyStockPatch(key, stock);
      }
      const historyData = historyResult.status === "fulfilled" ? historyResult.value : null;
      const history = historyData?.points?.length ? historyData.points : getHistoryValues(stock).map((close, index) => ({ date: index, close }));
      if (historyData?.points?.length) {
        state.histories.set(key, historyData.points);
        state.historyMeta.set(key, { source: historyData.source || "API", updatedAt: new Date().toISOString(), points: historyData.points.length });
      }
      rows.push({
        ...normalizeStockLike(stock),
        price: quoteData?.price || stock.currentPrice || stock.price || 0,
        changeRate: quoteData?.changeRate ?? stock.changeRate ?? 0,
        source: quoteData?.source || stock.source || "",
        history,
        historySource: historyData?.source || state.historyMeta.get(key)?.source || "추정"
      });
    }
    state.compareItems = rows;
    toast(rows.length ? "종목 비교 데이터를 조회했습니다." : "비교할 종목을 찾지 못했습니다.");
  } finally {
    state.compareBusy = false;
    render();
  }
}

async function resolveStockInput(raw) {
  const cleaned = raw.trim();
  const explicit = cleaned.match(/^([A-Za-z]{1,3})[:_\s-]+(.+)$/);
  const market = explicit ? explicit[1].toUpperCase() : "";
  const query = explicit ? explicit[2].trim() : cleaned;
  const normalizedMarket = ["KS", "KQ", "US"].includes(market) ? market : "";
  const knownKey = normalizedMarket ? `${normalizedMarket}_${query.toUpperCase()}` : "";
  const known = knownKey ? getStockByKey(knownKey) : getStockByKey(query);
  if (known) return known;
  const items = await searchStocks(query);
  return (normalizedMarket ? items.find((item) => item.market === normalizedMarket) : items[0]) || null;
}

async function refreshPortfolioQuotes() {
  if (!state.user || state.portfolioBusy) return;
  state.portfolioBusy = true;
  render();
  try {
    const groups = groupedJournals();
    await Promise.all(groups.map(async (group) => {
      const stock = normalizeStockLike({
        id: group.key,
        ticker: group.ticker,
        name: group.stockName,
        market: group.market,
        currentPrice: group.currentPrice
      });
      state.discoveredStocks.set(group.key, stock);
      const quote = await fetchQuote(stock);
      if (!quote) return;
      stock.currentPrice = quote.price;
      stock.price = quote.price;
      stock.changeRate = quote.changeRate;
      stock.marketTime = quote.marketTime || null;
      stock.source = quote.source || "";
      applyStockPatch(group.key, stock);
    }));
    toast("보유 현황 현재가를 갱신했습니다.");
  } finally {
    state.portfolioBusy = false;
    render();
  }
}

async function refreshStockQuote(key, { silent = false } = {}) {
  const stock = getStockByKey(key);
  if (!stock || state.quoteBusy.has(key)) return;
  state.quoteBusy.add(key);
  state.quoteAttempted.add(key);
  try {
    const quote = await fetchQuote(stock);
    if (!quote) throw new Error("quote failed");
    stock.currentPrice = quote.price;
    stock.price = quote.price;
    stock.changeRate = quote.changeRate;
    stock.marketTime = quote.marketTime || null;
    stock.source = quote.source || "";
    applyStockPatch(key, stock);
    if (!silent) toast(`현재가를 갱신했습니다.${quote.source ? ` (${quote.source})` : ""}`);
  } catch {
    if (!silent) toast("현재가 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.quoteBusy.delete(key);
  }
  render();
}

function applyStockPatch(key, patch) {
  const pools = [
    state.data.stockPicks,
    state.data.marketFeatures,
    [...state.discoveredStocks.values()],
    Object.values(state.user ? getUserDoc().favoriteStocks || {} : {})
  ];
  pools.flat().forEach((item) => {
    if (item.id === key || stockKey(item) === key) Object.assign(item, patch);
  });
}

async function saveMemo(data) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const doc = getUserDoc();
  doc.memos[data.stockKey] = data.memo || "";
  saveData();
  if (canWriteFirestore()) {
    const f = state.firebase.modules.firestoreMod;
    await f.setDoc(f.doc(state.firebase.db, "users", state.user.uid, "memos", data.stockKey), {
      text: data.memo || "",
      updatedAt: f.serverTimestamp()
    }, { merge: true });
  }
  toast("메모가 저장되었습니다.");
}

async function addPickComment(data) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const content = String(data.content || "").trim();
  if (!content) return;
  state.data.pickComments[data.target] = state.data.pickComments[data.target] || [];
  const comment = {
    id: uid("comment"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    content,
    createdAt: new Date().toISOString()
  };
  state.data.pickComments[data.target].unshift(comment);
  const doc = getUserDoc();
  doc.commentCount = Number(doc.commentCount || 0) + 1;
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`stock_picks/${data.target}/comments/${comment.id}`, {
      uid: comment.uid,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await setFirestoreDoc(`users/${state.user.uid}/myComments/${comment.id}`, {
      pickId: data.target,
      text: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await syncUserDocFirestore({ commentCount: doc.commentCount });
  }
  toast("댓글이 등록되었습니다.");
  render();
}

async function saveJournal(data) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const existing = data.id ? state.data.journals.find((j) => j.id === data.id) : null;
  const item = {
    id: existing?.id || uid("journal"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    stockName: data.stockName,
    ticker: data.ticker.trim().toUpperCase(),
    market: data.market,
    action: data.action,
    price: Number(data.price || 0),
    quantity: Number(data.quantity || 0),
    tradeDate: data.tradeDate || new Date().toISOString().slice(0, 10),
    note: data.note || "",
    isPublic: Boolean(data.isPublic),
    likes: existing?.likes || 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
    publishedAt: data.isPublic ? (existing?.publishedAt || new Date().toISOString()) : null,
    buyPrice: Number(data.buyPrice || 0),
    linkedBuyId: existing?.linkedBuyId || ""
  };
  if (existing) Object.assign(existing, item);
  else state.data.journals.unshift(item);
  const doc = getUserDoc();
  doc.bonusXp = Number(doc.bonusXp || 0) + (existing ? 0 : 5);
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`trading_journal/${item.id}`, {
      uid: item.uid,
      nickname: item.nickname,
      stockName: item.stockName,
      ticker: item.ticker,
      market: item.market,
      action: item.action,
      price: item.price,
      quantity: item.quantity,
      tradeDate: toTimestamp(item.tradeDate),
      note: item.note,
      isPublic: item.isPublic,
      likes: item.likes,
      createdAt: toTimestamp(item.createdAt),
      publishedAt: item.publishedAt ? toTimestamp(item.publishedAt) : null,
      buyPrice: item.buyPrice,
      linkedBuyId: item.linkedBuyId
    });
    await syncUserDocFirestore({ bonusXp: doc.bonusXp });
  }
  state.modal = null;
  toast("매매일지가 저장되었습니다.");
  render();
}

async function addJournalComment(data, form) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const journal = findJournal(data.journalId);
  if (!journal || !journal.isPublic) throw new Error("공개 매매일지를 찾을 수 없습니다.");
  const content = String(data.content || "").trim();
  if (!content) return;
  state.data.journalComments[journal.id] = state.data.journalComments[journal.id] || [];
  const comment = {
    id: uid("comment"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    content,
    createdAt: new Date().toISOString()
  };
  state.data.journalComments[journal.id].push(comment);
  const doc = getUserDoc();
  doc.commentCount = Number(doc.commentCount || 0) + 1;
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`trading_journal/${journal.id}/comments/${comment.id}`, {
      uid: comment.uid,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await setFirestoreDoc(`users/${state.user.uid}/myJournalComments/${comment.id}`, {
      journalId: journal.id,
      text: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await syncUserDocFirestore({ commentCount: doc.commentCount });
  }
  form?.reset();
  toast("댓글이 등록되었습니다.");
  render();
}

async function deleteJournalComment(journalId, commentId) {
  const journal = findJournal(journalId);
  const comments = state.data.journalComments?.[journalId] || [];
  const comment = comments.find((item) => item.id === commentId);
  if (!comment) return;
  const canDelete = Boolean(state.user && (comment.uid === state.user.uid || journal?.uid === state.user.uid || isAdmin()));
  if (!canDelete) throw new Error("댓글 삭제 권한이 없습니다.");
  state.data.journalComments[journalId] = comments.filter((item) => item.id !== commentId);
  const doc = state.data.userDocs[comment.uid];
  if (doc) doc.commentCount = Math.max(0, Number(doc.commentCount || 0) - 1);
  saveData();
  if (canWriteFirestore()) {
    await deleteFirestoreDoc(`trading_journal/${journalId}/comments/${commentId}`);
    if (comment.uid) await deleteFirestoreDoc(`users/${comment.uid}/myJournalComments/${commentId}`);
    if (comment.uid === state.user?.uid) await syncUserDocFirestore({ commentCount: doc?.commentCount || 0 });
  }
  toast("댓글을 삭제했습니다.");
  render();
}

async function deleteJournal(id) {
  state.data.journals = state.data.journals.filter((j) => j.id !== id);
  delete state.data.journalComments[id];
  saveData();
  if (canWriteFirestore()) await deleteFirestoreDoc(`trading_journal/${id}`);
  toast("매매일지를 삭제했습니다.");
  render();
}

function extractImageUrlsFromPostContent(content) {
  return [...String(content || "").matchAll(/!\[[^\]]*]\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .slice(0, 5);
}

function imageFilesFromForm(form) {
  if (!form) return [];
  const input = form.querySelector('input[type="file"][name="imageFiles"]');
  return input?.files ? [...input.files].filter((file) => file.type.startsWith("image/")).slice(0, 5) : [];
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function safeStorageName(name) {
  return String(name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

async function uploadImageFiles(form, folder, ownerId) {
  const files = imageFilesFromForm(form);
  if (!files.length) return [];
  if (storageReady()) {
    const storageMod = state.firebase.modules.storageMod;
    const urls = [];
    for (const [index, file] of files.entries()) {
      const path = `${folder}/${ownerId || "anonymous"}/${Date.now()}_${index}_${safeStorageName(file.name)}`;
      const ref = storageMod.ref(state.firebase.storage, path);
      const snap = await storageMod.uploadBytes(ref, file, { contentType: file.type || "image/jpeg" });
      urls.push(await storageMod.getDownloadURL(snap.ref));
    }
    return urls;
  }
  const urls = [];
  for (const file of files) {
    if (file.size > 900000) throw new Error("로컬 이미지 첨부는 900KB 이하만 지원합니다. 운영에서는 Firebase Storage를 설정해주세요.");
    urls.push(await fileToDataUrl(file));
  }
  return urls;
}

function uniqueImageUrls(urls) {
  return [...new Set(urls.map((url) => String(url || "").trim()).filter(Boolean))].slice(0, 10);
}

async function savePost(data, form) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const title = String(data.title || "").trim();
  const content = String(data.content || "").trim();
  if (!title || !content) return;
  const existing = data.id ? findPost(data.id) : null;
  const uploadedUrls = await uploadImageFiles(form, "posts", state.user.uid);
  if (existing) {
    if (!canEditPost(existing)) throw new Error("작성자만 글을 수정할 수 있습니다.");
    existing.title = title;
    existing.content = content;
    existing.imageUrls = uniqueImageUrls([...(existing.imageUrls || []), ...extractImageUrlsFromPostContent(content), ...uploadedUrls]);
    saveData();
    if (canWriteFirestore()) {
      await updateFirestoreDoc(`posts/${existing.id}`, {
        title: existing.title,
        content: existing.content,
        imageUrls: existing.imageUrls
      });
    }
    state.modal = null;
    toast("글이 수정되었습니다.");
    navigate("post", existing.id);
    render();
    return;
  }
  const post = {
    id: uid("post"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    title,
    content,
    likes: 0,
    createdAt: new Date().toISOString(),
    imageUrls: uniqueImageUrls([...extractImageUrlsFromPostContent(content), ...uploadedUrls]),
    authorLevel: levelProgress(getUserDoc()).level
  };
  state.data.posts.unshift(post);
  const doc = getUserDoc();
  doc.postCount = Number(doc.postCount || 0) + 1;
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`posts/${post.id}`, {
      uid: post.uid,
      nickname: post.nickname,
      title: post.title,
      content: post.content,
      likes: post.likes,
      createdAt: toTimestamp(post.createdAt),
      imageUrls: post.imageUrls,
      authorLevel: post.authorLevel
    });
    await syncUserDocFirestore({ postCount: doc.postCount });
  }
  state.modal = null;
  toast("글이 등록되었습니다.");
  render();
}

async function addPostComment(data, form) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const content = String(data.content || "").trim();
  if (!content) return;
  state.data.postComments[data.postId] = state.data.postComments[data.postId] || [];
  const comment = {
    id: uid("comment"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    content,
    createdAt: new Date().toISOString()
  };
  state.data.postComments[data.postId].push(comment);
  const doc = getUserDoc();
  doc.commentCount = Number(doc.commentCount || 0) + 1;
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`posts/${data.postId}/comments/${comment.id}`, {
      uid: comment.uid,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await setFirestoreDoc(`users/${state.user.uid}/myPostComments/${comment.id}`, {
      postId: data.postId,
      text: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await syncUserDocFirestore({ commentCount: doc.commentCount });
  }
  form.reset();
  toast("댓글이 등록되었습니다.");
  render();
}

async function saveMarketAnalysis(data, form) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  const title = String(data.title || "").trim();
  const body = String(data.body || "").trim();
  if (!title || !body) return;
  const uploadedUrls = await uploadImageFiles(form, "market_analyses", state.user?.uid || "admin");
  const imageUrls = uniqueImageUrls(String(data.imageUrls || "")
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .concat(uploadedUrls));
  const existing = data.id ? state.data.marketAnalyses.find((item) => item.id === data.id) : null;
  const item = normalizeMarketAnalysis({
    id: existing?.id || uid("market"),
    title,
    body,
    imageUrls,
    createdAt: existing?.createdAt || new Date().toISOString()
  });
  if (existing) Object.assign(existing, item);
  else state.data.marketAnalyses.unshift(item);
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`market_analyses/${item.id}`, {
      title: item.title,
      body: item.body,
      imageUrls: item.imageUrls,
      createdAt: toTimestamp(item.createdAt)
    });
  }
  state.modal = null;
  toast("시황 분석이 저장되었습니다.");
  navigate("market-analysis", item.id);
  render();
  form?.reset();
}

async function deleteMarketAnalysis(id) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  state.data.marketAnalyses = state.data.marketAnalyses.filter((item) => item.id !== id);
  delete state.data.marketAnalysisComments[id];
  saveData();
  if (canWriteFirestore()) await deleteFirestoreDoc(`market_analyses/${id}`);
  toast("시황 분석을 삭제했습니다.");
  navigate("markets");
  render();
}

async function addMarketAnalysisComment(data, form) {
  if (!state.user) throw new Error("로그인이 필요합니다.");
  const content = String(data.content || "").trim();
  if (!content) return;
  const analysisId = data.analysisId;
  state.data.marketAnalysisComments[analysisId] = state.data.marketAnalysisComments[analysisId] || [];
  const comment = {
    id: uid("comment"),
    uid: state.user.uid,
    nickname: state.user.nickname,
    content,
    createdAt: new Date().toISOString()
  };
  state.data.marketAnalysisComments[analysisId].push(comment);
  const doc = getUserDoc();
  doc.commentCount = Number(doc.commentCount || 0) + 1;
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`market_analyses/${analysisId}/comments/${comment.id}`, {
      uid: comment.uid,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await setFirestoreDoc(`users/${state.user.uid}/myPostComments/${comment.id}`, {
      analysisId,
      text: comment.content,
      createdAt: toTimestamp(comment.createdAt)
    });
    await syncUserDocFirestore({ commentCount: doc.commentCount });
  }
  form.reset();
  toast("댓글이 등록되었습니다.");
  render();
}

async function likePost(id) {
  if (!state.user) {
    toast("로그인 후 좋아요를 사용할 수 있습니다.");
    navigate("profile");
    return;
  }
  const post = state.data.posts.find((p) => p.id === id);
  if (!post) return;
  const doc = getUserDoc();
  doc.likedPosts = doc.likedPosts || {};
  const wasLiked = Boolean(doc.likedPosts[id]);
  const canUseRemoteLike = canWriteFirestore();
  const remote = canUseRemoteLike
    ? await toggleFirestoreLike(`posts/${id}`, `posts/${id}/likes/${state.user.uid}`)
    : null;
  if (canUseRemoteLike && !remote) return;
  const liked = remote ? remote.liked : !wasLiked;
  if (!liked) {
    delete doc.likedPosts[id];
    post.likes = remote ? remote.likes : Math.max(0, Number(post.likes || 0) - 1);
  } else {
    doc.likedPosts[id] = { createdAt: new Date().toISOString() };
    post.likes = remote ? remote.likes : Number(post.likes || 0) + 1;
  }
  saveData();
  render();
}

async function likeJournal(id) {
  if (!state.user) {
    toast("로그인 후 좋아요를 사용할 수 있습니다.");
    navigate("profile");
    return;
  }
  const journal = findJournal(id);
  if (!journal || !journal.isPublic) return;
  const doc = getUserDoc();
  doc.likedJournals = doc.likedJournals || {};
  const wasLiked = Boolean(doc.likedJournals[id]);
  const canUseRemoteLike = canWriteFirestore();
  const remote = canUseRemoteLike
    ? await toggleFirestoreLike(`trading_journal/${id}`, `trading_journal/${id}/likes/${state.user.uid}`)
    : null;
  if (canUseRemoteLike && !remote) return;
  const liked = remote ? remote.liked : !wasLiked;
  if (!liked) {
    delete doc.likedJournals[id];
    journal.likes = remote ? remote.likes : Math.max(0, Number(journal.likes || 0) - 1);
  } else {
    doc.likedJournals[id] = { createdAt: new Date().toISOString() };
    journal.likes = remote ? remote.likes : Number(journal.likes || 0) + 1;
  }
  saveData();
  render();
}

async function deletePost(id) {
  const post = findPost(id);
  if (!post) return;
  if (!canManagePost(post)) throw new Error("삭제 권한이 없습니다.");
  const comments = state.data.postComments[id] || [];
  state.data.posts = state.data.posts.filter((item) => item.id !== id);
  delete state.data.postComments[id];
  const authorDoc = state.data.userDocs[post.uid];
  if (authorDoc) {
    authorDoc.postCount = Math.max(0, Number(authorDoc.postCount || 0) - 1);
  }
  for (const comment of comments) {
    const commentDoc = state.data.userDocs[comment.uid];
    if (commentDoc) commentDoc.commentCount = Math.max(0, Number(commentDoc.commentCount || 0) - 1);
  }
  saveData();
  if (canWriteFirestore()) {
    await Promise.all(comments.map((comment) => Promise.all([
      deleteFirestoreDoc(`posts/${id}/comments/${comment.id}`),
      comment.uid ? deleteFirestoreDoc(`users/${comment.uid}/myPostComments/${comment.id}`) : Promise.resolve(false)
    ])));
    await deleteFirestoreDoc(`posts/${id}`);
    if (post.uid === state.user?.uid) await syncUserDocFirestore({ postCount: authorDoc?.postCount || 0 });
  }
  toast("게시글을 삭제했습니다.");
  if (state.route.id === "post" && state.route.param === id) navigate("community");
  else render();
}

async function deletePostComment(postId, commentId) {
  const post = findPost(postId);
  const comments = state.data.postComments[postId] || [];
  const comment = comments.find((item) => item.id === commentId);
  if (!comment) return;
  const canDelete = Boolean(state.user && (comment.uid === state.user.uid || post?.uid === state.user.uid || isAdmin()));
  if (!canDelete) throw new Error("댓글 삭제 권한이 없습니다.");
  state.data.postComments[postId] = comments.filter((item) => item.id !== commentId);
  const doc = state.data.userDocs[comment.uid];
  if (doc) doc.commentCount = Math.max(0, Number(doc.commentCount || 0) - 1);
  saveData();
  if (canWriteFirestore()) {
    await deleteFirestoreDoc(`posts/${postId}/comments/${commentId}`);
    if (comment.uid) await deleteFirestoreDoc(`users/${comment.uid}/myPostComments/${commentId}`);
    if (comment.uid === state.user?.uid) await syncUserDocFirestore({ commentCount: doc?.commentCount || 0 });
  }
  toast("댓글을 삭제했습니다.");
  render();
}

async function togglePostAuthorFollow(targetUid) {
  if (!state.user) {
    toast("로그인 후 작성자를 팔로우할 수 있습니다.");
    navigate("profile");
    return;
  }
  if (!targetUid || targetUid === state.user.uid) return;
  const doc = getUserDoc();
  doc.postAuthorFollows = doc.postAuthorFollows || {};
  const enabled = !doc.postAuthorFollows[targetUid]?.enabled;
  doc.postAuthorFollows[targetUid] = {
    targetUid,
    enabled,
    updatedAt: new Date().toISOString()
  };
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`users/${state.user.uid}/post_author_follows/${targetUid}`, {
      targetUid,
      enabled,
      updatedAt: toTimestamp(new Date())
    });
  }
  toast(enabled ? "작성자를 팔로우했습니다." : "작성자 팔로우를 해제했습니다.");
  render();
}

async function blockUser(targetUid) {
  if (!state.user) {
    toast("로그인 후 차단할 수 있습니다.");
    navigate("profile");
    return;
  }
  if (!targetUid || targetUid === state.user.uid) return;
  const doc = getUserDoc();
  doc.blockedUsers = doc.blockedUsers || {};
  doc.blockedUsers[targetUid] = { createdAt: new Date().toISOString() };
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`users/${state.user.uid}/blockedUsers/${targetUid}`, {
      createdAt: toTimestamp(new Date())
    });
  }
  toast("작성자를 차단했습니다.");
  if (state.route.id === "post" && findPost(state.route.param)?.uid === targetUid) navigate("community");
  else if (state.route.id === "journal-share" && findJournal(state.route.param)?.uid === targetUid) navigate("community");
  else render();
}

function resolveReportTarget(target) {
  const [type, firstId, secondId] = String(target || "").split(":");
  if (type === "post") {
    const post = findPost(firstId);
    return { contentType: "post", contentId: firstId, targetUid: post?.uid || "" };
  }
  if (type === "post-comment") {
    const comment = (state.data.postComments[firstId] || []).find((item) => item.id === secondId);
    return { contentType: "comment", contentId: secondId, targetUid: comment?.uid || "" };
  }
  if (type === "journal") {
    const journal = state.data.journals.find((item) => item.id === firstId);
    return { contentType: "journal", contentId: firstId, targetUid: journal?.uid || "" };
  }
  if (type === "journal-comment") {
    const comment = (state.data.journalComments?.[firstId] || []).find((item) => item.id === secondId);
    return { contentType: "comment", contentId: secondId, targetUid: comment?.uid || "" };
  }
  return { contentType: type || "unknown", contentId: firstId || "", targetUid: "" };
}

async function reportContent(target) {
  if (!state.user) {
    toast("로그인 후 신고할 수 있습니다.");
    navigate("profile");
    return;
  }
  state.data.reports = state.data.reports || [];
  const resolved = resolveReportTarget(target);
  const report = {
    id: uid("report"),
    target,
    reporterUid: state.user.uid,
    targetUid: resolved.targetUid,
    contentType: resolved.contentType,
    contentId: resolved.contentId,
    reason: "웹앱 신고",
    createdAt: new Date().toISOString()
  };
  state.data.reports.push(report);
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`reports/${report.id}`, {
      ...report,
      createdAt: toTimestamp(report.createdAt)
    });
  }
  toast("신고가 접수되었습니다.");
}

async function deleteReport(id) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  state.data.reports = (state.data.reports || []).filter((report) => report.id !== id);
  saveData();
  if (canWriteFirestore()) await deleteFirestoreDoc(`reports/${id}`);
  toast("신고를 삭제했습니다.");
  render();
}

async function saveNotice(data) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  const id = String(data.id || "").trim();
  const existing = id ? findNotice(id) : null;
  if (id && !existing) throw new Error("수정할 공지를 찾을 수 없습니다.");
  const notice = {
    id: existing?.id || uid("notice"),
    title: String(data.title || "").trim(),
    body: String(data.body || "").trim(),
    isPinned: Boolean(data.isPinned),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: existing ? new Date().toISOString() : undefined
  };
  if (!notice.title || !notice.body) throw new Error("제목과 내용을 입력해주세요.");
  if (existing) {
    Object.assign(existing, notice);
  } else {
    state.data.announcements.unshift(notice);
  }
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`announcements/${notice.id}`, {
      title: notice.title,
      body: notice.body,
      isPinned: notice.isPinned,
      createdAt: toTimestamp(notice.createdAt),
      updatedAt: notice.updatedAt ? toTimestamp(notice.updatedAt) : undefined
    });
  }
  state.modal = null;
  toast(existing ? "공지가 수정되었습니다." : "공지가 저장되었습니다.");
  navigate("notice", notice.id);
}

async function deleteNotice(id) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  const notice = findNotice(id);
  if (!notice) throw new Error("삭제할 공지를 찾을 수 없습니다.");
  state.data.announcements = state.data.announcements.filter((item) => item.id !== notice.id);
  saveData();
  if (canWriteFirestore()) await deleteFirestoreDoc(`announcements/${notice.id}`);
  toast("공지를 삭제했습니다.");
  navigate("notices");
}

async function saveAdminPick(data) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  const buyPrice = Number(data.buyPrice || 0);
  const pick = normalizePick({
    id: uid("pick"),
    name: data.name,
    ticker: data.ticker.trim().toUpperCase(),
    market: data.market,
    buyPrice,
    targetPrice: Number(data.targetPrice || buyPrice * 1.12),
    currentPrice: buyPrice,
    reason: data.reason,
    category: "관리자",
    status: "active",
    createdAt: new Date().toISOString()
  });
  state.data.stockPicks.unshift(pick);
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`stock_picks/${pick.id}`, {
      ticker: pick.ticker,
      name: pick.name,
      buyPrice: pick.buyPrice,
      targetPrice: pick.targetPrice,
      reason: pick.reason,
      category: pick.category,
      market: pick.market,
      isPremium: pick.isPremium,
      createdAt: toTimestamp(pick.createdAt),
      currentPrice: pick.currentPrice,
      status: pick.status,
      upVotes: pick.upVotes,
      downVotes: pick.downVotes
    });
  }
  toast("추천주가 추가되었습니다.");
  render();
}

async function promoteFeatureToPick(featureId) {
  if (!isAdmin()) throw new Error("관리자 권한이 필요합니다.");
  const feature = findFeatureStock(featureId);
  if (!feature) throw new Error("승격할 AI포착 종목을 찾을 수 없습니다.");
  const key = stockKey(feature);
  const existing = state.data.stockPicks.find((pick) => stockKey(pick) === key && pick.status !== "completed");
  if (existing) {
    toast("이미 추천주로 등록된 종목입니다.");
    navigate("stock", stockKey(existing));
    return;
  }
  const currentPrice = Number(feature.currentPrice || feature.price || 0);
  const tradePlan = feature.tradePlan || {};
  const entryPrice = Number(tradePlan.entryPrice || currentPrice || 0);
  const targetPrice = Number(tradePlan.targetPrice || (entryPrice ? entryPrice * 1.12 : currentPrice * 1.12) || 0);
  const pick = normalizePick({
    id: uid("pick"),
    ticker: String(feature.ticker || "").trim().toUpperCase(),
    name: feature.name,
    market: feature.market,
    buyPrice: entryPrice,
    targetPrice,
    currentPrice,
    changeRate: feature.changeRate,
    reason: feature.reason || feature.title || "AI포착에서 추천주로 승격",
    category: `AI포착 승격 · ${featureTitle(feature)}`,
    status: "active",
    createdAt: new Date().toISOString(),
    source: feature.source || "AI Capture",
    factors: feature.factors || {},
    tradePlan: feature.tradePlan || {},
    decision: feature.decision || {}
  });
  state.data.stockPicks.unshift(pick);
  saveData();
  if (canWriteFirestore()) {
    await setFirestoreDoc(`stock_picks/${pick.id}`, {
      ticker: pick.ticker,
      name: pick.name,
      buyPrice: pick.buyPrice,
      targetPrice: pick.targetPrice,
      reason: pick.reason,
      category: pick.category,
      market: pick.market,
      isPremium: pick.isPremium,
      createdAt: toTimestamp(pick.createdAt),
      currentPrice: pick.currentPrice,
      changeRate: pick.changeRate,
      status: pick.status,
      upVotes: pick.upVotes,
      downVotes: pick.downVotes,
      source: pick.source,
      factors: pick.factors,
      tradePlan: pick.tradePlan,
      decision: pick.decision
    });
  }
  toast("AI포착 종목을 추천주로 승격했습니다.");
  navigate("stock", key);
}

async function generateAnalysis(key) {
  if (!state.user) {
    toast("로그인 후 AI 분석을 사용할 수 있습니다.");
    navigate("profile");
    return;
  }
  const stock = getStockByKey(key);
  if (!stock) {
    toast("종목을 찾을 수 없습니다.");
    return;
  }
  toast("AI 분석을 생성합니다.");
  const analysisKey = stockKey(stock);
  const currentExtras = await ensureStockExtras(analysisKey);
  if (state.firebase.enabled) {
    try {
      const fn = state.firebase.modules.functionsMod.httpsCallable(state.firebase.functions, "generateStockAiAnalysis");
      const history = getHistoryValues(stock).map((close, idx) => ({ date: String(idx), open: close, high: close * 1.01, low: close * 0.99, close }));
      const res = await fn({
        stock: { ticker: stock.ticker, name: stock.name, market: stock.market },
        price: { currentPrice: stock.currentPrice || stock.price, changeRate: stock.changeRate || 0 },
        fundamentals: currentExtras.fundamentals || {},
        candles: history,
        news: currentExtras.news || [],
        disclosures: currentExtras.disclosures || []
      });
      const payload = { ...cleanFirestoreValue(res.data || {}), uid: state.user.uid, analysisId: stockKey(stock), ticker: stock.ticker, name: stock.name, market: stock.market, updatedAt: new Date().toISOString() };
      upsertAnalysis(payload);
      saveData();
      await setFirestoreDoc(`users/${state.user.uid}/stock_ai_analyses/${payload.analysisId}`, {
        ...payload,
        generatedAt: payload.generatedAt ? toTimestamp(payload.generatedAt) : toTimestamp(payload.updatedAt),
        updatedAt: toTimestamp(payload.updatedAt)
      });
      toast("Firebase AI 분석 결과를 저장했습니다.");
      navigate("ai", payload.analysisId);
      return;
    } catch (error) {
      console.warn("AI callable failed", error);
      toast("Cloud Function 호출 실패, 로컬 분석으로 대체합니다.");
    }
  }
  const analysis = makeLocalAnalysis(stock, state.user.uid, new Date().toISOString(), currentExtras);
  upsertAnalysis(analysis);
  saveData();
  navigate("ai", analysis.analysisId);
}

async function ensureStockExtras(key) {
  if (!state.stockExtras.has(key)) await loadStockExtras(key, { silent: true });
  const startedAt = Date.now();
  while (state.stockExtrasBusy.has(key) && Date.now() - startedAt < 12000) {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (!state.stockExtras.has(key)) await loadStockExtras(key, { silent: true });
  if (!stockExtrasComplete(state.stockExtras.get(key))) {
    const stock = getStockByKey(key);
    if (stock) state.stockExtras.set(key, await fetchStockExtrasSnapshot(stock, state.stockExtras.get(key) || {}));
  }
  return state.stockExtras.get(key) || {};
}

function upsertAnalysis(analysis) {
  const id = analysis.analysisId || stockKey(analysis);
  const idx = state.data.analyses.findIndex((item) => item.uid === analysis.uid && (item.analysisId || stockKey(item)) === id);
  if (idx >= 0) state.data.analyses[idx] = { ...state.data.analyses[idx], ...analysis };
  else state.data.analyses.unshift(analysis);
}

async function deleteAnalysis(id) {
  if (!state.user) return;
  state.data.analyses = state.data.analyses.filter((item) => !(item.uid === state.user.uid && (item.analysisId || stockKey(item)) === id));
  saveData();
  await deleteFirestoreDoc(`users/${state.user.uid}/stock_ai_analyses/${id}`);
  toast("AI 분석 캐시를 삭제했습니다.");
  render();
}

function makeLocalAnalysis(stock, uidValue = "demo", date = new Date().toISOString(), extras = {}) {
  const price = Number(stock.currentPrice || stock.price || stock.buyPrice || 0);
  const target = Number(stock.targetPrice || price * 1.12);
  const upside = price ? ((target - price) / price) * 100 : 0;
  const momentum = Number(stock.changeRate || 0);
  const score = Math.max(28, Math.min(92, 58 + upside * 0.7 + momentum * 2));
  const label = score >= 75 ? "우호" : score >= 55 ? "중립" : "주의";
  const sector = stock.category || stock.pattern || (stock.market === "US" ? "글로벌 주식" : "국내 주식");
  const fundamentals = extras.fundamentals || {};
  const newsItems = Array.isArray(extras.news) ? extras.news.slice(0, 5) : [];
  const hasFundamentals = ["per", "pbr", "forwardPer", "marketCap", "revenue", "operatingProfit", "netIncome"].some((key) => Number.isFinite(Number(fundamentals[key])) && Number(fundamentals[key]) > 0);
  const dartFinancialText = Number(fundamentals.revenue || 0) > 0
    ? ` DART 재무제표 기준 매출 ${fmtMoney(fundamentals.revenue, stock.market)}, 영업이익 ${fmtMoney(fundamentals.operatingProfit || 0, stock.market)}, 순이익 ${fmtMoney(fundamentals.netIncome || 0, stock.market)}도 함께 반영했습니다.`
    : "";
  const fundamentalsText = hasFundamentals
    ? [
        `현재 가격 ${fmtMoney(price, stock.market)} 기준 목표가 ${fmtMoney(target, stock.market)}까지의 여력은 ${fmtPct(upside)}입니다.`,
        `PER ${formatRatio(fundamentals.per)}, PBR ${formatRatio(fundamentals.pbr)}, 선행 PER ${formatRatio(fundamentals.forwardPer)}, 시가총액 ${formatMarketCap(fundamentals.marketCap, stock.market)}를 함께 확인했습니다.${dartFinancialText}`,
        fundamentals.source ? `출처는 ${fundamentals.source}입니다.` : ""
      ].filter(Boolean).join(" ")
    : `현재 가격 ${fmtMoney(price, stock.market)} 기준 목표가 ${fmtMoney(target, stock.market)}까지의 여력이 핵심입니다. 공개 재무 API가 제한되면 재무지표는 Functions 또는 서버 프록시 연결 후 채워집니다.`;
  const newsText = newsItems.length
    ? `최근 근거 뉴스 ${newsItems.length}건을 반영했습니다. ${newsItems.slice(0, 2).map((item) => item.title).join(" / ")}`
    : "뉴스/공시 근거는 서버 뉴스 프록시 또는 Cloud Function 분석 결과가 있으면 표시됩니다.";
  return {
    uid: uidValue,
    analysisId: stockKey(stock),
    ticker: stock.ticker,
    name: stock.name,
    market: stock.market,
    score: Math.round(score),
    scoreLabel: `${label} · 목표 대비 여력 ${fmtPct(upside)}`,
    theme: sector,
    sector,
    summary: `${stock.name}은 현재가 대비 목표가 여력이 ${fmtPct(upside)}로 계산됩니다. 최근 등락률은 ${fmtPct(momentum)}이며, ${newsItems.length ? "실제 뉴스 근거와" : "뉴스 재료와"} 거래 흐름을 함께 확인해야 합니다.\n\n대기 단계 없이 생성된 로컬 분석이며 Firebase Functions가 연결되면 원본 AI 리포트 스키마로 교체됩니다.`,
    todayReason: stock.reason || "최근 수급과 가격 흐름을 중심으로 단기 관심이 형성됐습니다.",
    fundamentals: fundamentalsText,
    technical: `샘플 차트 기준 단기 추세는 ${momentum >= 0 ? "상승 우위" : "조정"}입니다. 가격이 20일 추정선 위에 머무는지 확인이 필요합니다.`,
    news: newsText,
    momentum: `등락률 ${fmtPct(momentum)}와 목표여력 ${fmtPct(upside)}를 반영하면 단기 모멘텀은 ${label} 구간입니다.`,
    peerPerAverage: hasFundamentals ? `현재 PER ${formatRatio(fundamentals.per)}` : "동종업계 평균 PER은 실데이터 연결 후 자동 산출",
    themePeers: [stock.name, "동종업계", "시장대표주"],
    risks: ["시장 변동성 확대", "실적 컨센서스 하향", "거래대금 둔화"],
    sections: [
      { title: "CAN SLIM 체크", body: "C/A/N/S/L/I/M 항목 중 현재는 가격 모멘텀과 수급 확인이 우선입니다." },
      { title: "확인할 것", body: "거래대금 유지, 20일선 지지, 실적 발표 일정, 관련 뉴스 강도를 확인합니다." }
    ],
    catalysts: [
      { title: stock.reason || "수급 변화", kind: "수급", impact: momentum >= 0 ? "긍정" : "중립", timeline: "단기", confidence: "보통", detail: "가격과 거래대금이 함께 움직이는지 확인하는 흐름입니다." }
    ],
    valuation: {
      perVerdict: "확인필요",
      pbrVerdict: "확인필요",
      forwardPer: formatRatio(fundamentals.forwardPer),
      sectorAveragePer: "실데이터 연결 후 산출",
      peerComparison: [],
      reasoning: hasFundamentals ? fundamentalsText : "Firebase Functions 연결 시 KIS/DART/네이버 밸류에이션 데이터를 기반으로 상세 판단을 저장합니다."
    },
    technicalDetail: {
      maPosition: "단기 추정선 중심 확인",
      rsiVerdict: "과열 여부 추가 확인",
      bollingerVerdict: "변동성 확대 여부 확인",
      support: fmtMoney(price * 0.94, stock.market),
      resistance: fmtMoney(price * 1.08, stock.market),
      pattern: momentum >= 0 ? "반등 지속 후보" : "눌림 확인 후보",
      reasoning: "현 구간은 가격보다 거래대금 유지 여부가 중요합니다."
    },
    scenarios: {
      bull: { trigger: "거래대금 동반 돌파", priceTarget: fmtPct(Math.max(6, upside)), probability: 0.32, narrative: "주요 저항선을 거래대금과 함께 넘으면 단기 추세가 강화될 수 있습니다." },
      base: { trigger: "박스권 등락", priceTarget: "보합권", probability: 0.45, narrative: "추가 재료 전까지는 20일선 부근의 등락을 기본 시나리오로 봅니다." },
      bear: { trigger: "수급 이탈", priceTarget: fmtPct(-6), probability: 0.23, narrative: "거래대금이 줄고 지지선이 깨지면 리스크 관리가 우선입니다." }
    },
    risksDetailed: [
      { category: "시장", severity: "보통", probability: "보통", description: "지수 변동성이 커지면 개별 종목의 좋은 재료도 희석될 수 있습니다.", mitigant: "지수와 환율, 선물 방향을 함께 확인합니다." },
      { category: "수급", severity: "보통", probability: "보통", description: "단기 급등 후 거래대금이 급감하면 추세 지속성이 약해집니다.", mitigant: "전일 대비 거래대금과 외국인/기관 수급 변화를 확인합니다." }
    ],
    timing: {
      shortTerm: "1~2주는 거래대금 유지와 지지선 확인이 핵심입니다.",
      midTerm: "1~3개월은 실적 발표와 업종 멀티플 변화가 방향을 결정합니다.",
      action: score >= 75 ? "관망" : "판단보류",
      actionReason: "단정적 매수/매도보다 가격, 거래대금, 실적 근거가 동시에 맞는지 확인하는 구간입니다."
    },
    sourceNews: newsItems,
    sourceReports: [],
    sourceDisclosures: Array.isArray(extras.disclosures) ? extras.disclosures.slice(0, 6) : [],
    sourceFinancials: hasFundamentals ? [{
      title: `${stock.name} 재무지표`,
      publisher: fundamentals.source || "서버 프록시",
      publishedAt: date,
      per: fundamentals.per,
      pbr: fundamentals.pbr,
      forwardPer: fundamentals.forwardPer,
      marketCap: fundamentals.marketCap,
      revenue: fundamentals.revenue,
      operatingProfit: fundamentals.operatingProfit,
      netIncome: fundamentals.netIncome,
      fiscalYear: fundamentals.fiscalYear
    }] : [],
    sourceEpsTimeline: [],
    generatedAt: date,
    updatedAt: date,
    analysisPrice: price
  };
}

async function refreshPrices({ silent = false } = {}) {
  if (state.pricesBusy) return;
  state.pricesBusy = true;
  render();
  const targets = [
    ...state.data.stockPicks,
    ...state.data.marketFeatures,
    ...state.discoveredStocks.values(),
    ...Object.values(state.user ? getUserDoc().favoriteStocks || {} : {})
  ].slice(0, 36);
  await Promise.all([
    ...targets.map(async (stock) => {
      const quote = await fetchQuote(stock);
      if (quote) {
        stock.currentPrice = quote.price;
        stock.price = quote.price;
        stock.changeRate = quote.changeRate;
        stock.marketTime = quote.marketTime || null;
        stock.source = quote.source || "";
        if (stock.id && FALLBACK_PICK_SNAPSHOTS[stock.id]) Object.assign(stock, realignFallbackPick(stock));
        if (stock.id && FALLBACK_FEATURE_SNAPSHOTS[stock.id]) Object.assign(stock, realignFallbackFeature(stock));
      }
    }),
    ...state.data.market.indices.map(async (index) => {
      const quote = await fetchQuote(index);
      if (quote) {
        index.value = quote.price;
        index.changeRate = quote.changeRate;
        index.marketTime = quote.marketTime || null;
        index.source = quote.source || "";
      }
    }),
    refreshMarketSentiment()
  ]);
  state.pricesBusy = false;
  saveData();
  if (!silent) toast("시세와 시장 지수를 갱신했습니다.");
  render();
}

async function refreshMarketSentiment({ withIndicators = false, silent = true } = {}) {
  if (withIndicators && state.marketSentimentBusy) return;
  if (withIndicators) {
    state.marketSentimentBusy = true;
    if (!silent) render();
  }
  try {
    const res = await fetch(apiUrl("/api/sentiment"));
    if (res.ok) {
      const sentiment = await res.json();
      state.data.market.sentiment.score = Math.round(Number(sentiment.score || state.data.market.sentiment.score));
      state.data.market.sentiment.label = fearGreedLabel(sentiment.rating, state.data.market.sentiment.score);
      state.data.market.sentiment.source = sentiment.source || "CNN Fear & Greed";
    }
    if (withIndicators) {
      const indicators = await loadMarketSentimentIndicators();
      if (indicators.length) {
        state.data.market.sentiment.indicators = indicators;
        state.data.market.sentiment.updatedAt = new Date().toISOString();
      }
    }
    saveData();
    if (withIndicators && !silent) toast("시장 심리 지표를 갱신했습니다.");
  } catch {
    // Keep existing fallback.
    if (withIndicators && !silent) toast("시장 심리 지표 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    if (withIndicators) {
      state.marketSentimentBusy = false;
      render();
    }
  }
}

async function loadMarketSentimentIndicators() {
  const existing = normalizeSentimentIndicators(state.data.market.sentiment.indicators);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const results = await Promise.allSettled(
    MARKET_SENTIMENT_INDICATORS.map(async (meta) => {
      const quote = await fetchQuote({ ticker: meta.ticker, market: "US" });
      return {
        ...meta,
        price: quote?.price ?? existingById.get(meta.id)?.price ?? null,
        changeRate: quote?.changeRate ?? existingById.get(meta.id)?.changeRate ?? null,
        source: quote?.source || existingById.get(meta.id)?.source || "",
        marketTime: quote?.marketTime || existingById.get(meta.id)?.marketTime || null
      };
    })
  );
  return results.map((result, index) => (
    result.status === "fulfilled"
      ? result.value
      : { ...MARKET_SENTIMENT_INDICATORS[index], ...(existingById.get(MARKET_SENTIMENT_INDICATORS[index].id) || {}) }
  ));
}

async function refreshInvestorFlow({ silent = false } = {}) {
  if (state.investorFlowBusy) return;
  state.investorFlowBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(18000) }
      : {};
    const res = await fetch(apiUrl("/api/investor-flow"), options);
    if (!res.ok) return;
    const flow = await res.json();
    applyRemoteMarketData({ investorFlow: [flow] });
    saveData();
    if (!silent) toast("마감 수급 TOP5를 갱신했습니다.");
  } catch {
    // Keep Firestore or seed flow data.
  } finally {
    state.investorFlowBusy = false;
    render();
  }
}

async function refreshAiBrief({ silent = false } = {}) {
  if (state.aiBriefBusy) return;
  state.aiBriefBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(22000) }
      : {};
    const res = await fetch(apiUrl("/api/market-brief"), options);
    if (!res.ok) throw new Error("market brief failed");
    state.data.aiBrief = normalizeAiBrief(await res.json());
    saveData();
    if (!silent) toast("AI 시장 브리프를 갱신했습니다.");
  } catch {
    if (!silent) toast("AI 시장 브리프 API 연결 실패로 기존 브리프를 유지합니다.");
  } finally {
    state.aiBriefBusy = false;
    render();
  }
}

async function refreshFmkoreaMarketData({ silent = false } = {}) {
  if (state.fmkoreaBusy) return;
  state.fmkoreaBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(18000) }
      : {};
    const res = await fetch(apiUrl("/api/fmkorea"), options);
    if (!res.ok) throw new Error("fmkorea failed");
    const payload = await res.json();
    if (payload.available === false) {
      state.data.market.fmkorea = {
        ...state.data.market.fmkorea,
        source: `${payload.source || "fmkorea.com/stock"} · 연결 제한, 기존 스냅샷`,
        updatedAt: payload.updatedAt || "",
        realtimeMode: payload.mode || "server-scrape-unavailable"
      };
    } else {
      applyRemoteMarketData({
        fmkoreaRealtime: payload,
        fmkoreaIndex: Array.isArray(payload.series) ? payload.series : []
      });
    }
    saveData();
    if (!silent) toast(payload.available === false ? "펨코 공개 게시판 제한으로 기존 스냅샷을 유지합니다." : "펨코 HOT 종목과 지수를 갱신했습니다.");
  } catch {
    if (!silent) toast("펨코 공개 게시판 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.fmkoreaBusy = false;
    render();
  }
}

async function refreshMarketSectors({ silent = false } = {}) {
  if (state.marketSectorsBusy) return;
  state.marketSectorsBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(22000) }
      : {};
    const res = await fetch(apiUrl("/api/market-sectors"), options);
    if (!res.ok) throw new Error("market sectors failed");
    applyRemoteMarketData({ marketSectors: await res.json() });
    saveData();
    if (!silent) toast("업종 등락과 시장 폭을 갱신했습니다.");
  } catch {
    if (!silent) toast("업종 등락 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.marketSectorsBusy = false;
    render();
  }
}

async function refreshNightFutures({ silent = false } = {}) {
  if (state.nightFuturesBusy) return;
  state.nightFuturesBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(8000) }
      : {};
    const res = await fetch(apiUrl("/api/night-futures"), options);
    if (!res.ok) throw new Error("night futures failed");
    applyRemoteMarketData({ nightFutures: await res.json() });
    saveData();
    if (!silent) toast("KOSPI200 야간선물 상태를 갱신했습니다.");
  } catch {
    if (!silent) toast("야간선물 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.nightFuturesBusy = false;
    render();
  }
}

async function refreshScannerFeatures({ silent = false } = {}) {
  if (state.scannerBusy) return;
  state.scannerBusy = true;
  if (!silent) render();
  try {
    const options = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? { signal: AbortSignal.timeout(32000) }
      : {};
    const res = await fetch(apiUrl("/api/scanner", { market: "ALL", limit: "24", universe: "36" }), options);
    if (!res.ok) throw new Error("scanner failed");
    const payload = await res.json();
    const features = Array.isArray(payload.items) ? payload.items.map(normalizeFeature) : [];
    if (features.length) {
      state.data.marketFeatures = features;
      saveData();
    }
    if (!silent) toast(`실시간 스캐너 후보 ${features.length}개를 갱신했습니다.`);
  } catch {
    if (!silent) toast("스캐너 API 연결 실패로 기존 후보를 유지합니다.");
  } finally {
    state.scannerBusy = false;
    render();
  }
}

function fearGreedLabel(rating, score) {
  const normalized = String(rating || "").toLowerCase();
  if (normalized.includes("extreme fear")) return "극단적 공포";
  if (normalized.includes("fear")) return "공포";
  if (normalized.includes("extreme greed")) return "극단적 탐욕";
  if (normalized.includes("greed")) return "탐욕";
  if (Number(score) >= 65) return "탐욕 우위";
  if (Number(score) <= 35) return "공포 우위";
  return "중립";
}

async function fetchQuote(stock) {
  try {
    const res = await fetch(apiUrl("/api/quote", { ticker: stock.ticker, market: stock.market || "US" }));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadHistory(key, { silent = false, frame: frameOption = "day", interval: intervalOption = "60m" } = {}) {
  const stock = getStockByKey(key);
  if (!stock) return;
  const frame = chartFrameId(frameOption);
  const interval = frame === "minute" ? minuteIntervalId(intervalOption) : "1d";
  const request = chartRequestConfig(frame, interval);
  const baseKey = stockKey(stock);
  const historyKey = chartHistoryStoreKey(baseKey, frame, interval);
  const attemptKey = chartAttemptKey(historyKey, request.range, request.interval);
  if (state.historyBusy.has(historyKey)) return;
  state.historyBusy.add(historyKey);
  state.historyAttempted.add(historyKey);
  state.historyAttempted.add(attemptKey);
  render();
  try {
    const res = await fetch(apiUrl("/api/history", { ticker: stock.ticker, market: stock.market, range: request.range, interval: request.interval }));
    if (!res.ok) throw new Error("history failed");
    const data = await res.json();
    if (data.points?.length) {
      state.histories.set(historyKey, data.points);
      state.historyMeta.set(historyKey, {
        source: data.source || "API",
        updatedAt: new Date().toISOString(),
        points: data.points.length,
        range: request.range,
        interval: request.interval,
        frame
      });
    }
    if (!silent) toast(`${chartFrameLabel(frame, interval)} 차트를 갱신했습니다.${data.source ? ` (${data.source})` : ""}`);
  } catch {
    if (!silent) toast(`${chartFrameLabel(frame, interval)} API 연결 실패로 로컬 추정 차트를 유지합니다.`);
  } finally {
    state.historyBusy.delete(historyKey);
  }
  render();
}

async function loadStockExtras(key, { silent = false } = {}) {
  const stock = getStockByKey(key);
  if (!stock || state.stockExtrasBusy.has(key)) return;
  state.stockExtrasBusy.add(key);
  render();
  const existing = state.stockExtras.get(key) || {};
  try {
    state.stockExtras.set(key, await fetchStockExtrasSnapshot(stock, existing));
    if (!silent) toast("재무·뉴스를 갱신했습니다.");
  } catch {
    if (!silent) toast("재무·뉴스 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.stockExtrasBusy.delete(key);
    render();
  }
}

async function loadStockDiscussions(key, { silent = false } = {}) {
  const stock = getStockByKey(key);
  if (!stock || !isDomesticStock(stock) || state.stockDiscussionsBusy.has(key)) return;
  state.stockDiscussionsBusy.add(key);
  render();
  const existing = state.stockDiscussions.get(key) || {};
  try {
    const res = await fetch(apiUrl("/api/discussions", { ticker: stock.ticker, market: stock.market || "KS" }));
    if (!res.ok) throw new Error("discussion failed");
    const payload = await res.json();
    state.stockDiscussions.set(key, {
      items: Array.isArray(payload.items) ? payload.items : [],
      source: payload.source || "Naver Finance Board",
      updatedAt: new Date().toISOString()
    });
    if (!silent) toast("종목토론방을 갱신했습니다.");
  } catch {
    state.stockDiscussions.set(key, {
      items: Array.isArray(existing.items) ? existing.items : [],
      source: existing.source || "Naver Finance Board",
      updatedAt: existing.updatedAt || new Date().toISOString(),
      error: true
    });
    if (!silent) toast("종목토론방 API 연결 실패로 기존 값을 유지합니다.");
  } finally {
    state.stockDiscussionsBusy.delete(key);
    render();
  }
}

async function fetchStockExtrasSnapshot(stock, existing = {}) {
  let fundamentals = existing.fundamentals || {};
  let news = existing.news || [];
  let disclosures = existing.disclosures || [];
  const [fundamentalsResult, newsResult, disclosuresResult] = await Promise.allSettled([
    fetchWithTimeout(apiUrl("/api/fundamentals", { ticker: stock.ticker, market: stock.market || "US" }), 8000),
    fetchWithTimeout(apiUrl("/api/news", { ticker: stock.ticker, market: stock.market || "US", name: stock.name || stock.ticker }), 8000),
    isDomesticStock(stock)
      ? fetchWithTimeout(apiUrl("/api/disclosures", { ticker: stock.ticker, market: stock.market || "KS" }), 8000)
      : Promise.resolve(null)
  ]);
  if (fundamentalsResult.status === "fulfilled" && fundamentalsResult.value.ok) {
    fundamentals = await fundamentalsResult.value.json();
  }
  if (newsResult.status === "fulfilled" && newsResult.value.ok) {
    const payload = await newsResult.value.json();
    news = Array.isArray(payload.items) ? payload.items : [];
  }
  if (disclosuresResult.status === "fulfilled" && disclosuresResult.value?.ok) {
    const payload = await disclosuresResult.value.json();
    disclosures = Array.isArray(payload.items) ? payload.items : [];
  }
  return { fundamentals, news, disclosures, updatedAt: new Date().toISOString() };
}

function stockExtrasComplete(extras = {}) {
  return Number(extras.fundamentals?.per || 0) > 0 &&
    Number(extras.fundamentals?.pbr || 0) > 0 &&
    Array.isArray(extras.news) &&
    extras.news.length > 0;
}

async function loadMarketHistory(ticker, { silent = false, frame: frameOption = "day", interval: intervalOption = "60m" } = {}) {
  const index = getMarketIndex(ticker);
  if (!index) return;
  const historyKey = `index:${index.ticker}`;
  const frame = chartFrameId(frameOption);
  const interval = frame === "minute" ? minuteIntervalId(intervalOption) : "1d";
  const request = chartRequestConfig(frame, interval);
  const storeKey = chartHistoryStoreKey(historyKey, frame, interval);
  const attemptKey = chartAttemptKey(storeKey, request.range, request.interval);
  if (state.historyBusy.has(storeKey)) return;
  state.historyBusy.add(storeKey);
  state.historyAttempted.add(storeKey);
  state.historyAttempted.add(attemptKey);
  render();
  try {
    const res = await fetch(apiUrl("/api/history", { ticker: index.ticker, market: index.market || "US", range: request.range, interval: request.interval }));
    if (!res.ok) throw new Error("history failed");
    const data = await res.json();
    if (data.points?.length) {
      state.histories.set(storeKey, data.points);
      state.historyMeta.set(storeKey, {
        source: data.source || "API",
        updatedAt: new Date().toISOString(),
        points: data.points.length,
        range: request.range,
        interval: request.interval,
        frame
      });
    }
    if (!silent) toast(`지수 ${chartFrameLabel(frame, interval)} 차트를 갱신했습니다.${data.source ? ` (${data.source})` : ""}`);
  } catch {
    if (!silent) toast(`지수 ${chartFrameLabel(frame, interval)} API 연결 실패로 로컬 추정 차트를 유지합니다.`);
  } finally {
    state.historyBusy.delete(storeKey);
  }
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `woogi-stock-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(STORE.theme, next);
}

function afterRender() {
  document.querySelectorAll("canvas[data-chart='line']").forEach((canvas) => {
    const values = String(canvas.dataset.values || "").split(",").map(Number).filter(Number.isFinite);
    const options = { market: canvas.dataset.market || "" };
    drawLine(canvas, values, canvas.dataset.color || "accent", options);
    if (canvas.dataset.lineInteractive === "true") bindLineChartInteraction(canvas, values, canvas.dataset.color || "accent", options);
  });
  document.querySelectorAll("canvas[data-chart='bars']").forEach((canvas) => {
    const values = String(canvas.dataset.values || "").split(",").map(Number).filter(Number.isFinite);
    drawBars(canvas, values);
  });
  document.querySelectorAll("canvas[data-chart='multi-line']").forEach((canvas) => {
    const series = JSON.parse(canvas.dataset.series || "[]");
    const colors = JSON.parse(canvas.dataset.colors || "[]");
    drawMultiLine(canvas, series, colors);
  });
  document.querySelectorAll("canvas[data-chart='journal-candles']").forEach((canvas) => {
    const points = JSON.parse(canvas.dataset.points || "[]");
    const markers = JSON.parse(canvas.dataset.markers || "[]");
    drawJournalCandles(canvas, points, markers, { market: canvas.dataset.market || "" });
  });
  document.querySelectorAll("canvas[data-chart='ohlc']").forEach((canvas) => {
    const points = JSON.parse(canvas.dataset.points || "[]");
    const options = { movingAverages: canvas.dataset.averages === "true", volume: true, tooltip: true, market: canvas.dataset.market || "" };
    drawJournalCandles(canvas, points, [], options);
    bindStockChartInteraction(canvas, points, options);
  });
}

function drawLine(canvas, values, colorKey = "accent", options = {}) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = cssVar("--line");
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  if (values.length < 2) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const point = (v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 20) - 10;
    return [x, y];
  };
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  const color = chartColor(colorKey);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(16,185,129,0)");
  ctx.beginPath();
  values.forEach((v, i) => {
    const [x, y] = point(v, i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  const selectedIndex = Number(options.selectedIndex);
  if (Number.isInteger(selectedIndex) && values[selectedIndex] != null) {
    const [x, y] = point(values[selectedIndex], selectedIndex);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = cssVar("--weak");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, h - 10);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cssVar("--surface");
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function chartColor(colorKey) {
  if (colorKey === "up") return cssVar("--up");
  if (colorKey === "down") return cssVar("--down");
  if (colorKey === "accent") return cssVar("--accent");
  return cssVar("--accent-2");
}

function bindLineChartInteraction(canvas, values, colorKey, options = {}) {
  if (values.length < 2) return;
  updateLineChartSelection(canvas, values, values.length - 1, options);
  if (canvas.dataset.interactionBound === "true") return;
  canvas.dataset.interactionBound = "true";

  const selectFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    const localX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const index = Math.min(values.length - 1, Math.max(0, Math.round(localX / Math.max(1, rect.width) * (values.length - 1))));
    canvas.dataset.selectedIndex = String(index);
    drawLine(canvas, values, colorKey, { ...options, selectedIndex: index });
    updateLineChartSelection(canvas, values, index, options);
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    selectFromPointer(event);
    window.requestAnimationFrame(() => canvas.blur());
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || event.buttons) selectFromPointer(event);
  });
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse") return;
    delete canvas.dataset.selectedIndex;
    drawLine(canvas, values, colorKey, options);
    updateLineChartSelection(canvas, values, values.length - 1, options);
  });
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const fallback = values.length - 1;
    const current = Number.isInteger(Number(canvas.dataset.selectedIndex)) ? Number(canvas.dataset.selectedIndex) : fallback;
    const index = Math.min(values.length - 1, Math.max(0, current + (event.key === "ArrowLeft" ? -1 : 1)));
    canvas.dataset.selectedIndex = String(index);
    drawLine(canvas, values, colorKey, { ...options, selectedIndex: index });
    updateLineChartSelection(canvas, values, index, options);
  });
}

function updateLineChartSelection(canvas, values, index, options = {}) {
  const selection = canvas.closest(".line-chart-shell")?.querySelector("[data-chart-selection]");
  if (!selection || values[index] == null) return;
  const previous = values[Math.max(0, index - 1)];
  const changeRate = previous ? (values[index] - previous) / previous * 100 : 0;
  const changeNode = selection.querySelector("[data-chart-selection-change]");
  selection.querySelector("[data-chart-selection-date]").textContent = index === values.length - 1 ? "최근" : `${index + 1}/${values.length}`;
  selection.querySelector("[data-chart-selection-price]").textContent = compactChartPrice(values[index], options.market || canvas.dataset.market || "");
  changeNode.textContent = fmtPct(changeRate);
  changeNode.className = changeClass(changeRate);
}

function drawBars(canvas, values) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));
  const zero = h / 2;
  ctx.strokeStyle = cssVar("--line");
  ctx.beginPath();
  ctx.moveTo(0, zero);
  ctx.lineTo(w, zero);
  ctx.stroke();
  const gap = 4;
  const bw = Math.max(8, (w - gap * values.length) / Math.max(1, values.length));
  values.forEach((value, i) => {
    const x = i * (bw + gap);
    const barH = Math.abs(value) / max * (h / 2 - 8);
    ctx.fillStyle = value >= 0 ? cssVar("--up") : cssVar("--down");
    ctx.fillRect(x, value >= 0 ? zero - barH : zero, bw, barH);
  });
}

function drawMultiLine(canvas, series, colors) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const left = 42;
  const right = 8;
  const top = 10;
  const bottom = 12;
  const chartW = Math.max(1, w - left - right);
  const chartH = Math.max(1, h - top - bottom);
  const all = series.flat().map(Number).filter(Number.isFinite);
  ctx.clearRect(0, 0, w, h);
  if (!all.length) return;
  const rawMin = Math.min(...all, 0);
  const rawMax = Math.max(...all, 0);
  const pad = Math.max(1, (rawMax - rawMin) * 0.1);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const span = Math.max(1, max - min);
  const toY = (value) => top + chartH - ((value - min) / span) * chartH;
  ctx.font = '10px "Pretendard", sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i += 1) {
    const value = max - (span * i / 4);
    const y = top + (chartH * i / 4);
    ctx.strokeStyle = cssVar("--line");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(w - right, y);
    ctx.stroke();
    ctx.fillStyle = cssVar("--muted");
    ctx.fillText(`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`, left - 6, y);
  }
  const zeroY = toY(0);
  ctx.strokeStyle = cssVar("--weak");
  ctx.beginPath();
  ctx.moveTo(left, zeroY);
  ctx.lineTo(w - right, zeroY);
  ctx.stroke();
  series.forEach((values, seriesIndex) => {
    const finiteValues = values.map(Number).filter(Number.isFinite);
    if (finiteValues.length < 2) return;
    ctx.beginPath();
    finiteValues.forEach((value, index) => {
      const x = left + (index / (finiteValues.length - 1)) * chartW;
      const y = toY(value);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors[seriesIndex] || COMPARE_SERIES_COLORS[seriesIndex % COMPARE_SERIES_COLORS.length];
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  });
}

function drawJournalCandles(canvas, points, markers, options = {}) {
  const candles = normalizeJournalCandles(points);
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const market = options.market || canvas.dataset.market || "";
  const left = isDomesticMarket(market) ? 76 : 58;
  const right = 8;
  const top = 18;
  const bottom = 26;
  const chartW = Math.max(1, w - left - right);
  const fullChartH = Math.max(1, h - top - bottom);
  const volumeH = options.volume ? Math.min(58, Math.max(38, fullChartH * 0.18)) : 0;
  const volumeGap = options.volume ? 12 : 0;
  const chartH = Math.max(1, fullChartH - volumeH - volumeGap);
  ctx.clearRect(0, 0, w, h);
  if (!candles.length) return;
  const rawMin = Math.min(...candles.map((point) => point.low));
  const rawMax = Math.max(...candles.map((point) => point.high));
  const padding = Math.max(1, (rawMax - rawMin) * 0.12);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const span = Math.max(1, max - min);
  const slot = chartW / candles.length;
  const bodyW = Math.max(1, Math.min(7, slot * 0.64));
  const toY = (value) => top + chartH - ((Number(value) - min) / span) * chartH;
  const toX = (index) => left + slot * (index + 0.5);

  ctx.font = '10px "Pretendard", sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let index = 0; index <= 4; index += 1) {
    const value = max - span * index / 4;
    const y = top + chartH * index / 4;
    ctx.strokeStyle = cssVar("--line");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(w - right, y);
    ctx.stroke();
    ctx.fillStyle = cssVar("--muted");
    ctx.fillText(compactChartPrice(value, market), left - 6, y);
  }

  candles.forEach((candle, index) => {
    const x = toX(index);
    const color = candle.close >= candle.open ? cssVar("--up") : cssVar("--down");
    const openY = toY(candle.open);
    const closeY = toY(candle.close);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, toY(candle.high));
    ctx.lineTo(x, toY(candle.low));
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x - bodyW / 2, Math.min(openY, closeY), bodyW, Math.max(1, Math.abs(closeY - openY)));
  });

  if (options.volume) {
    const volumeTop = top + chartH + volumeGap;
    const maxVolume = Math.max(1, ...candles.map((candle) => Number(candle.volume || 0)));
    candles.forEach((candle, index) => {
      const x = toX(index);
      const color = candle.close >= candle.open ? cssVar("--up") : cssVar("--down");
      const barH = Math.max(1, Number(candle.volume || 0) / maxVolume * volumeH);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.34;
      ctx.fillRect(x - bodyW / 2, volumeTop + volumeH - barH, bodyW, barH);
      ctx.globalAlpha = 1;
    });
  }

  if (options.movingAverages) {
    drawCandleMovingAverage(ctx, candles, 5, "#10b981", toX, toY);
    drawCandleMovingAverage(ctx, candles, 20, "#f59e0b", toX, toY);
    drawCandleMovingAverage(ctx, candles, 60, "#8b5cf6", toX, toY);
  }

  markers.forEach((marker) => {
    const candle = candles[marker.index];
    if (!candle) return;
    const isBuy = marker.action === "매수";
    const x = toX(marker.index);
    const y = isBuy ? Math.min(h - bottom - 9, toY(candle.low) + 13) : Math.max(top + 9, toY(candle.high) - 13);
    const color = isBuy ? cssVar("--up") : cssVar("--down");
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isBuy) {
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x - 6, y + 4);
      ctx.lineTo(x + 6, y + 4);
    } else {
      ctx.moveTo(x, y + 7);
      ctx.lineTo(x - 6, y - 4);
      ctx.lineTo(x + 6, y - 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 10px "Pretendard", sans-serif';
    ctx.textAlign = marker.index > candles.length - 10 ? "right" : "left";
    ctx.textBaseline = "middle";
    ctx.fillText(marker.action, x + (marker.index > candles.length - 10 ? -8 : 8), y);
  });

  const first = candles[0];
  const last = candles[candles.length - 1];
  ctx.font = '10px "Pretendard", sans-serif';
  ctx.fillStyle = cssVar("--muted");
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(fmtChartDate(first.date), left, h);
  ctx.textAlign = "right";
  ctx.fillText(fmtChartDate(last.date), w - right, h);

  const selectedIndex = Number(options.selectedIndex);
  if (Number.isInteger(selectedIndex) && candles[selectedIndex]) {
    const candle = candles[selectedIndex];
    const x = toX(selectedIndex);
    const y = toY(candle.close);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = cssVar("--weak");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + chartH + (options.volume ? volumeGap + volumeH : 0));
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = candle.close >= candle.open ? cssVar("--up") : cssVar("--down");
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cssVar("--surface");
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    if (options.tooltip) {
      drawCandleTooltip(ctx, candle, candles[Math.max(0, selectedIndex - 1)], x, top, w, market);
    }
  }
}

function drawCandleTooltip(ctx, candle, previous, x, top, width, market = "") {
  const tooltipW = isDomesticMarket(market) ? 210 : 188;
  const tooltipH = 154;
  const tooltipX = Math.min(Math.max(24, x + 14), width - tooltipW - 14);
  const tooltipY = top + 18;
  const changeRate = previous?.close ? (candle.close - previous.close) / previous.close * 100 : 0;
  ctx.save();
  ctx.fillStyle = cssVar("--surface-2");
  ctx.strokeStyle = cssVar("--line");
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 16);
  else ctx.rect(tooltipX, tooltipY, tooltipW, tooltipH);
  ctx.fill();
  ctx.stroke();
  ctx.font = '700 13px "Pretendard", sans-serif';
  ctx.fillStyle = cssVar("--text");
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(fmtChartFullDate(candle.date), tooltipX + 18, tooltipY + 18);
  const rows = [
    ["시작", compactChartPrice(candle.open, market)],
    ["마지막", compactChartPrice(candle.close, market)],
    ["최고", compactChartPrice(candle.high, market)],
    ["최저", compactChartPrice(candle.low, market)],
    ["거래량", compactVolume(candle.volume)],
    ["등락률", fmtPct(changeRate)]
  ];
  ctx.font = '12px "Pretendard", sans-serif';
  rows.forEach((row, index) => {
    const y = tooltipY + 44 + index * 18;
    ctx.fillStyle = cssVar("--muted");
    ctx.textAlign = "left";
    ctx.fillText(row[0], tooltipX + 18, y);
    ctx.fillStyle = index === rows.length - 1 ? cssVar(changeRate >= 0 ? "--up" : "--down") : cssVar("--text");
    ctx.textAlign = "right";
    ctx.fillText(row[1], tooltipX + tooltipW - 18, y);
  });
  ctx.restore();
}

function bindStockChartInteraction(canvas, points, options) {
  const candles = normalizeJournalCandles(points);
  if (!candles.length) return;
  updateStockChartSelection(canvas, candles, candles.length - 1);
  if (canvas.dataset.interactionBound === "true") return;
  canvas.dataset.interactionBound = "true";
  let drag = null;
  let pinchDistance = null;

  const viewport = () => stockChartViewport(canvas, candles.length);
  const redraw = (selectedIndex = null) => {
    const view = viewport();
    const visible = candles.slice(view.start, view.end);
    const localIndex = Number.isInteger(selectedIndex) ? selectedIndex - view.start : null;
    drawJournalCandles(canvas, visible, [], {
      ...options,
      selectedIndex: Number.isInteger(localIndex) && localIndex >= 0 && localIndex < visible.length ? localIndex : null
    });
    const activeIndex = Number.isInteger(selectedIndex) ? selectedIndex : view.end - 1;
    updateStockChartSelection(canvas, candles, activeIndex);
  };

  const selectFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    const left = isDomesticMarket(options.market || canvas.dataset.market || "") ? 76 : 58;
    const right = 8;
    const chartW = Math.max(1, rect.width - left - right);
    const view = viewport();
    const visibleLength = Math.max(1, view.end - view.start);
    const slot = chartW / visibleLength;
    const localX = Math.min(chartW - 0.01, Math.max(0, event.clientX - rect.left - left));
    const index = Math.min(view.end - 1, Math.max(view.start, view.start + Math.floor(localX / slot)));
    canvas.dataset.selectedIndex = String(index);
    redraw(index);
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    drag = { x: event.clientX, start: viewport().start, end: viewport().end, moved: false };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || !event.buttons) {
      if (event.pointerType === "mouse") selectFromPointer(event);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const viewLength = drag.end - drag.start;
    const shift = Math.round((drag.x - event.clientX) / Math.max(1, rect.width) * viewLength);
    if (Math.abs(event.clientX - drag.x) < 5) return;
    drag.moved = true;
    setStockChartViewport(canvas, drag.start + shift, drag.end + shift, candles.length);
    redraw();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!drag?.moved) selectFromPointer(event);
    drag = null;
    canvas.releasePointerCapture?.(event.pointerId);
    window.requestAnimationFrame(() => canvas.blur());
  });
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse" || drag) return;
    delete canvas.dataset.selectedIndex;
    redraw();
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const anchor = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width)));
    zoomStockChart(canvas, candles.length, event.deltaY < 0 ? "in" : "out", anchor);
    redraw();
  }, { passive: false });
  canvas.addEventListener("dblclick", (event) => {
    event.preventDefault();
    zoomStockChart(canvas, candles.length, "reset");
    redraw();
  });
  canvas.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 2) return;
    pinchDistance = touchDistance(event.touches);
  }, { passive: true });
  canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 2 || !pinchDistance) return;
    event.preventDefault();
    const nextDistance = touchDistance(event.touches);
    if (Math.abs(nextDistance - pinchDistance) < 12) return;
    zoomStockChart(canvas, candles.length, nextDistance > pinchDistance ? "in" : "out", 0.5);
    pinchDistance = nextDistance;
    redraw();
  }, { passive: false });
  canvas.addEventListener("touchend", () => {
    pinchDistance = null;
  }, { passive: true });
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const view = viewport();
    const fallback = view.end - 1;
    const current = Number.isInteger(Number(canvas.dataset.selectedIndex)) ? Number(canvas.dataset.selectedIndex) : fallback;
    const index = Math.min(view.end - 1, Math.max(view.start, current + (event.key === "ArrowLeft" ? -1 : 1)));
    canvas.dataset.selectedIndex = String(index);
    redraw(index);
  });
}

function touchDistance(touches) {
  const [first, second] = touches;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function stockChartViewport(canvas, length) {
  const start = Number(canvas.dataset.viewStart);
  const end = Number(canvas.dataset.viewEnd);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start || end > length) {
    return { start: 0, end: length };
  }
  return { start, end };
}

function setStockChartViewport(canvas, start, end, length) {
  const size = Math.min(length, Math.max(20, Math.round(end - start)));
  const nextStart = Math.max(0, Math.min(length - size, Math.round(start)));
  canvas.dataset.viewStart = String(nextStart);
  canvas.dataset.viewEnd = String(nextStart + size);
}

function zoomStockChart(canvas, length, direction, anchor = 0.5) {
  if (direction === "reset") {
    delete canvas.dataset.viewStart;
    delete canvas.dataset.viewEnd;
    return;
  }
  const view = stockChartViewport(canvas, length);
  const size = view.end - view.start;
  const nextSize = direction === "in" ? Math.max(20, Math.round(size * 0.72)) : Math.min(length, Math.round(size * 1.38));
  const anchorIndex = view.start + size * anchor;
  setStockChartViewport(canvas, anchorIndex - nextSize * anchor, anchorIndex + nextSize * (1 - anchor), length);
}

function updateStockChartSelection(canvas, candles, index) {
  const selection = canvas.closest(".stock-chart-shell")?.querySelector("[data-chart-selection]");
  const candle = candles[index];
  if (!selection || !candle) return;
  const previous = candles[Math.max(0, index - 1)];
  const changeRate = previous?.close ? (candle.close - previous.close) / previous.close * 100 : 0;
  const changeNode = selection.querySelector("[data-chart-selection-change]");
  selection.querySelector("[data-chart-selection-date]").textContent = fmtChartDate(candle.date);
  selection.querySelector("[data-chart-selection-price]").textContent = compactChartPrice(candle.close, canvas.dataset.market || "");
  changeNode.textContent = fmtPct(changeRate);
  changeNode.className = changeClass(changeRate);
}

function drawCandleMovingAverage(ctx, candles, period, color, toX, toY) {
  if (candles.length < period) return;
  let sum = 0;
  let started = false;
  ctx.beginPath();
  candles.forEach((candle, index) => {
    sum += candle.close;
    if (index >= period) sum -= candles[index - period].close;
    if (index < period - 1) return;
    const x = toX(index);
    const y = toY(sum / period);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (!started) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function compactChartPrice(value, market = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (isDomesticMarket(market)) return `${fmtNum(number, 0)}원`;
  if (String(market).toUpperCase() === "US") return `$${fmtNum(number, Math.abs(number) < 100 ? 2 : 1)}`;
  return fmtNum(number, Math.abs(number) < 100 ? 2 : 1);
}

function isDomesticMarket(market) {
  return ["KS", "KQ", "KR", "KOSPI", "KOSDAQ"].includes(String(market || "").toUpperCase());
}

function compactVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  if (number >= 100000000) return `${fmtNum(number / 100000000, 1)}억`;
  if (number >= 10000) return `${fmtNum(number / 10000, 1)}만`;
  return fmtNum(number, 0);
}

function fmtChartDate(value) {
  const date = chartDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function fmtChartFullDate(value) {
  const date = chartDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function chartDate(value) {
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(number) && String(value).trim() !== "") {
    return new Date(Math.abs(number) < 1000000000000 ? number * 1000 : number);
  }
  return new Date(value);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
