import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const files = [
  "index.html",
  "manifest.json",
  "config.example.js",
  "Dockerfile",
  ".dockerignore",
  "firebase.json",
  "firebase/firestore.rules",
  "firebase/firestore.indexes.json",
  "firebase/storage.rules",
  "functions/index.js",
  "functions/analysis.js",
  "functions/nightFutures.js",
  "functions/package.json",
  "functions/README.md",
  "scanner_engine.py",
  "server.py",
  "src/app.js",
  "src/styles.css",
  "tests/cdp-ai-check.mjs",
  "tests/cdp-market-source-check.mjs",
  "tests/cdp-deep-link-check.mjs",
  "tests/cdp-local-flows-check.mjs",
  "tests/cdp-admin-auth-search-check.mjs",
  "tests/cdp-discovered-search-check.mjs",
  "tests/cdp-market-analysis-check.mjs",
  "tests/cdp-community-detail-check.mjs",
  "tests/cdp-journal-share-check.mjs",
  "tests/cdp-journal-chart-check.mjs",
  "tests/cdp-secondary-features-check.mjs",
  "tests/cdp-run-all.mjs",
  "tests/local-regression-check.mjs",
  "tests/final-regression-check.mjs",
  "tests/firestore-like-integrity-check.mjs",
  "tests/firestore-write-schema-check.mjs",
  "tests/firestore-user-schema-check.mjs",
  "tests/functions-analysis-check.mjs",
  "tests/functions-night-futures-check.mjs",
  "tests/functions-provider-config-check.mjs",
  "tests/fmkorea-parser-check.py",
  "tests/server-log-message-check.py",
  "tests/server-browser-config-check.py",
  "tests/server-security-headers-check.py",
  "tests/dart-financials-check.py",
  "tests/scanner-engine-check.py",
  "tests/server-http-contract-check.mjs",
  "tests/night-futures-normalize-check.mjs",
  "tests/naver-market-sectors-parser-check.py",
  "tests/deployment-check.mjs",
  "tests/production-readiness-env-check.mjs",
  "tests/production-readiness-check.mjs",
  "tests/api-smoke-check.mjs",
  "assets/icon.png",
  "assets/fonts/Pretendard-Regular.ttf"
];

for (const file of files) {
  if (!existsSync(join(root, file))) {
    throw new Error(`missing required file: ${file}`);
  }
}

const app = read("src/app.js");
const css = read("src/styles.css");
const html = read("index.html");
const readme = read("README.md");
const firebaseConfig = JSON.parse(read("firebase.json"));
const firestoreRules = read("firebase/firestore.rules");
const firestoreIndexes = JSON.parse(read("firebase/firestore.indexes.json"));
const storageRules = read("firebase/storage.rules");
const functionsIndex = read("functions/index.js");
const functionsAnalysis = read("functions/analysis.js");

const literalActions = [
  ...new Set([...app.matchAll(/data-action=\"([^\"]+)\"/g)].map((match) => match[1]).filter((action) => !action.includes("$")))
].sort();
const handledActions = [
  ...new Set([...app.matchAll(/action === \"([^\"]+)\"/g)].map((match) => match[1]))
].sort();
const missingActionHandlers = literalActions.filter((action) => !handledActions.includes(action));
if (missingActionHandlers.length) {
  throw new Error(`unhandled literal data-action(s): ${missingActionHandlers.join(", ")}`);
}

for (const text of [app, css, html, readme]) {
  for (const banned of [
    "google_mobile_ads",
    "AdMob",
    "Rewarded",
    "rewardAd",
    "FirebaseMessaging",
    "flutter_local_notifications",
    "GoogleSignIn",
    "signInWithGoogle",
    "signInWithKakao",
    "if (!state.user) return state.data.analyses.filter((a) => a.uid === \"demo\")",
    "signInWithApple",
    "KakaoSdk",
    "AppTrackingTransparency"
  ]) {
    if (text.includes(banned)) {
      throw new Error(`banned integration remains: ${banned}`);
    }
  }
}

for (const route of [
  "home",
  "capture",
  "stock",
  "feature-stock",
  "notice",
  "post",
  "journal-share",
  "index",
  "night-futures",
  "market-sentiment",
  "investor-flow",
  "fmkorea-index",
  "fmkorea-hot",
  "markets",
  "favorites",
  "journal",
  "journal-chart",
  "portfolio",
  "compare",
  "ai",
  "community",
  "my-posts",
  "my-comments",
  "notices",
  "profile",
  "admin"
]) {
  if (!app.includes(`"${route}"`)) {
    throw new Error(`route missing: ${route}`);
  }
}

for (const flow of [
  "DIRECT_ROUTE_ALIASES",
  "parseRouteString",
  "pick: \"stock\"",
  "analysis: \"market-analysis\"",
  "stock_picks",
  "stock_picks/${data.target}/comments/${comment.id}",
  "market_feature_stocks",
  "renderFeatureStockDetail",
  "localizedFeatureReason",
  "포착 상세",
  "market_analyses",
  "market_analyses/${analysisId}/comments/${comment.id}",
  "market_investor_flow",
  "fmkorea_stock_mentions_realtime/today",
  "fmkorea_index",
  "night_futures_prices",
  "announcements",
  "posts",
  "posts/${post.id}/comments",
  "posts/${data.postId}/comments/${comment.id}",
  "firebase-storage.js",
  "storageReady",
  "uploadBytes",
  "getDownloadURL",
  "imageFiles",
  "delete-post",
  "delete-post-comment",
  "post_author_follows",
  "blockedUsers",
  "users/${state.user.uid}/post_author_follows/${targetUid}",
  "users/${state.user.uid}/blockedUsers/${targetUid}",
  "recordDailyAttendance",
  "lastAttendanceDate",
  "user_public",
  "syncPublicUserDocFirestore",
  "WOOGI_ADMIN_UIDS",
  "WOOGI_API_BASE_URL",
  "apiUrl",
  "getIdTokenResult",
  "stock_picks/${pick.id}/comments",
  "delete-report",
  "reports/${report.id}",
  "fsCollection(\"users\"",
  "inspect-admin-user",
  "adminUserSearch",
  "trading_journal/${item.id}",
  "trading_journal/${journal.id}/comments/${comment.id}",
  "trading_journal/${id}/likes/${state.user.uid}",
  "users/${state.user.uid}/myJournalComments/${comment.id}",
  "like-journal",
  "delete-journal-comment",
  "ai_briefs/latest",
  "stock_ai_analyses",
  "stock_ai_analyses/${id}",
  "users/${state.user.uid}/stock_ai_analyses/${payload.analysisId}",
  "generateStockAiAnalysis",
  "recordNightFuturesPrice",
  "getKospiNightFutures",
  "getKisNightFuturesConfig",
  "최근 근거 뉴스",
  "sourceFinancials",
  "favoriteStocks",
  "pruneStockKeyFromFavoritePicks",
  "memos",
  "api.finance.naver.com/siseJson.naver",
  "polling.finance.naver.com/api/realtime/domestic/index",
  "stooq.com/q/l",
  "api.nasdaq.com/api/quote",
  "/api/sentiment",
  "/api/investor-flow",
  "/api/market-brief",
  "/api/fmkorea",
  "/api/market-sectors",
  "/api/night-futures",
  "/api/fundamentals",
  "/api/news",
  "/api/disclosures",
  "/api/discussions",
  "/api/scanner",
  "/healthz",
  "normalizeAiBrief",
  "refreshAiBrief",
  "refreshFmkoreaMarketData",
  "renderFmkoreaIndexDetail",
  "renderFmkoreaHotDetail",
  "open-fmkorea-stock",
  "copy-fmkorea-hot",
  "refreshMarketSectors",
  "fmkorea.com/stock",
  "업종 등락 · 시장 폭",
  "AI 시장 브리프",
  "서버 시장 브리프",
  "refreshInvestorFlow",
  "renderInvestorFlowDetail",
  "refresh-investor-flow",
  "open-investor-stock",
  "공유문구 복사",
  "stockDiscussions",
  "refreshScannerFeatures",
  "loadStockDiscussions",
  "renderStockDiscussionPanel",
  "Naver Finance Notice",
  "Naver Finance Board",
  "load-stock-extras",
  "load-index-history",
  "NASDAQ100 선물",
  "KOSPI200 야간선물",
  "nightFutures",
  "refreshNightFutures",
  "get_night_futures_symbol",
  "Firebase night_futures_prices",
  "MARKET_SENTIMENT_INDICATORS",
  "renderMarketSentimentDetail",
  "refresh-market-sentiment",
  "VIX 공포지수",
  "달러 인덱스",
  "통합 수익률 비교",
  "drawMultiLine",
  "range: \"5y\"",
  "history_range_days",
  "groupedJournals",
  "journalChartMarkers",
  "drawJournalCandles",
  "매수/매도 기록",
  "stockChartMode",
  "stock-chart-mode",
  "data-chart=\"ohlc\"",
  "drawCandleMovingAverage",
  "MA60",
  "zoomStockChart",
  "touchDistance",
  "pinchDistance",
  "promoteFeatureToPick",
  "promote-feature-pick",
  "AI포착 승격",
  "deleteNotice",
  "delete-notice",
  "공지 수정",
  "handleCompare",
  "종료 추천주 실적"
]) {
  if (!app.includes(flow) && !read("server.py").includes(flow) && !readme.includes(flow)) {
    throw new Error(`data flow missing: ${flow}`);
  }
}

if (firebaseConfig.firestore?.rules !== "firebase/firestore.rules") {
  throw new Error("Firebase Firestore rules path missing");
}

if (firebaseConfig.firestore?.indexes !== "firebase/firestore.indexes.json") {
  throw new Error("Firebase Firestore indexes path missing");
}

if (firebaseConfig.storage?.rules !== "firebase/storage.rules") {
  throw new Error("Firebase Storage rules path missing");
}

if (firebaseConfig.functions?.source !== "functions" || firebaseConfig.functions?.runtime !== "nodejs22") {
  throw new Error("Firebase Functions source/runtime missing");
}

for (const uid of ["1KzEXKZMoFaYOymYyoI283AR3Y32", "v4a3ClF3FhWGXsGnZ29wyvQNSCX2"]) {
  if (!firestoreRules.includes(uid) || !storageRules.includes(uid) || !app.includes(uid)) {
    throw new Error(`admin uid not consistently configured: ${uid}`);
  }
}

for (const token of [
  "request.auth.token.admin == true",
  "match /posts/{postId}",
  "match /trading_journal/{journalId}",
  "match /market_analyses/{analysisId}",
  "match /users/{uid}",
  "match /user_public/{uid}",
  "postLikeCounterDelta(postId)",
  "journalLikeCounterDelta(journalId)",
  "preservesOwnerUid()",
  "createsOwnLike(uid)",
  "request.resource.data.keys().hasOnly([\"uid\", \"createdAt\"])",
  "request.resource.data.uid == request.auth.uid",
  "request.resource.data.createdAt is timestamp",
  "request.resource.data.likes == resource.data.likes + 1",
  "request.resource.data.likes == resource.data.likes - 1",
  "!exists(/databases/$(database)/documents/posts/$(postId)/likes/$(request.auth.uid))",
  "existsAfter(/databases/$(database)/documents/posts/$(postId)/likes/$(request.auth.uid))",
  "exists(/databases/$(database)/documents/trading_journal/$(journalId)/likes/$(request.auth.uid))",
  "!existsAfter(/databases/$(database)/documents/trading_journal/$(journalId)/likes/$(request.auth.uid))"
]) {
  if (!firestoreRules.includes(token)) throw new Error(`Firestore rule missing: ${token}`);
}

for (const token of [
  "match /night_futures_prices/{priceId}",
  "allow read: if true;",
  "allow write: if isAdmin();"
]) {
  if (!firestoreRules.includes(token)) throw new Error(`Night futures Firestore rule missing: ${token}`);
}

if (firestoreRules.includes("updatesOnly([\"likes\"])")) {
  throw new Error("Firestore like counter allows arbitrary likes-only updates");
}

for (const token of [
  "match /posts/{ownerId}/{fileName}",
  "match /market_analyses/{ownerId}/{fileName}",
  "request.resource.contentType.matches('image/.*')"
]) {
  if (!storageRules.includes(token)) throw new Error(`Storage rule missing: ${token}`);
}

for (const token of [
  "exports.generateStockAiAnalysis",
  "exports.recordNightFuturesPrice",
  "exports.getKospiNightFutures",
  "exports.getKisNightFuturesConfig",
  "exports.getMarketProviderConfig",
  "onCall",
  "onSchedule",
  "OPENAI_API_KEY",
  "DART_API_KEY",
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "https://api.openai.com/v1/responses",
  "night_futures_prices",
  "buildDeterministicAnalysis",
  "mergeAnalysis"
]) {
  if (!functionsIndex.includes(token) && !functionsAnalysis.includes(token)) {
    throw new Error(`Functions implementation missing: ${token}`);
  }
}

const indexKeys = firestoreIndexes.indexes.map((index) => `${index.collectionGroup}:${index.fields.map((field) => field.fieldPath).join(",")}`);
for (const key of ["trading_journal:isPublic,createdAt", "trading_journal:uid,createdAt"]) {
  if (!indexKeys.includes(key)) throw new Error(`Firestore index missing: ${key}`);
}

if (!css.includes("@media (max-width: 1180px)") || !css.includes("@media (max-width: 760px)")) {
  throw new Error("responsive breakpoints missing");
}

if (!html.includes("우기의 주식")) {
  throw new Error("service name missing from HTML");
}

if (/fetch\(\s*([`'"])\/api\//.test(app)) {
  throw new Error("direct /api fetch remains; use apiUrl() for deployable API base config");
}

const dockerfile = read("Dockerfile");
for (const token of ["ENV WOOGI_HOST=0.0.0.0", "ENV PORT=8080", "COPY --chown=appuser:appuser", "USER appuser", "EXPOSE 8080"]) {
  if (!dockerfile.includes(token)) throw new Error(`Cloud Run Dockerfile missing: ${token}`);
}

const readiness = read("tests/production-readiness-check.mjs");
for (const token of [
  "WOOGI_STRICT_READINESS",
  "config.local.js",
  "WOOGI_FIREBASE_API_KEY",
  "WOOGI_APP_URL",
  "getMarketProviderConfig",
  "/healthz",
  "next actions",
  "firebase",
  "docker"
]) {
  if (!readiness.includes(token)) throw new Error(`production readiness check missing: ${token}`);
}

const localRegression = read("tests/local-regression-check.mjs");
for (const token of ["--live", "--strict", "production-readiness-check.mjs"]) {
  if (!localRegression.includes(token)) throw new Error(`local regression check missing: ${token}`);
}

const finalRegression = read("tests/final-regression-check.mjs");
for (const token of ["preflight", "/healthz", "CDP_PORT", "--skip-cdp", "--strict", "--remote-debugging-port=9223", "local-regression-check.mjs", "cdp-run-all.mjs"]) {
  if (!finalRegression.includes(token)) throw new Error(`final regression check missing: ${token}`);
}

const deepLinkCheck = read("tests/cdp-deep-link-check.mjs");
for (const token of [
  "/pick/pick_samsung",
  "makeSeedData().stockPicks.find",
  "realignFallbackPick(normalizePick(fallbackPick))"
]) {
  if (!app.includes(token) && !deepLinkCheck.includes(token)) {
    throw new Error(`legacy pick alias fallback missing: ${token}`);
  }
}

console.log("static checks passed");
