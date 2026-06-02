const DEFAULT_MODEL = "gpt-5.4";

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value) {
  const n = numberValue(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function ratio(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : "-";
}

function money(value, market = "US") {
  const n = numberValue(value);
  if (market === "KS" || market === "KQ") return `${Math.round(n).toLocaleString("ko-KR")}원`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function normalizeStock(data = {}) {
  const stock = data.stock || {};
  return {
    ticker: String(stock.ticker || data.ticker || "").toUpperCase(),
    name: String(stock.name || data.name || stock.ticker || data.ticker || "Unknown"),
    market: String(stock.market || data.market || "US").toUpperCase()
  };
}

function normalizeNews(news) {
  return Array.isArray(news) ? news.slice(0, 5).map((item) => ({
    title: String(item.title || "뉴스"),
    publisher: String(item.publisher || item.source || ""),
    publishedAt: item.publishedAt || item.date || "",
    url: item.url || ""
  })) : [];
}

function normalizeFundamentals(fundamentals = {}) {
  return {
    per: fundamentals.per,
    pbr: fundamentals.pbr,
    forwardPer: fundamentals.forwardPer,
    marketCap: fundamentals.marketCap,
    source: fundamentals.source || ""
  };
}

function normalizeDisclosures(disclosures) {
  return Array.isArray(disclosures) ? disclosures.slice(0, 6).map((item) => ({
    title: String(item.title || "공시"),
    date: item.date || item.publishedAt || "",
    submitter: String(item.submitter || item.publisher || ""),
    receiptNo: String(item.receiptNo || item.id || ""),
    url: item.url || "",
    source: String(item.source || "Naver Finance Notice")
  })) : [];
}

function buildDeterministicAnalysis(data = {}, generatedAt = new Date().toISOString()) {
  const stock = normalizeStock(data);
  const price = data.price || {};
  const currentPrice = numberValue(price.currentPrice || data.currentPrice);
  const targetPrice = numberValue(price.targetPrice || data.targetPrice, currentPrice ? currentPrice * 1.08 : 0);
  const changeRate = numberValue(price.changeRate || data.changeRate);
  const upside = currentPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const score = Math.round(clamp(58 + upside * 0.7 + changeRate * 1.8, 28, 92));
  const label = score >= 75 ? "우호" : score >= 55 ? "중립" : "주의";
  const fundamentals = normalizeFundamentals(data.fundamentals || {});
  const hasFinancials = ["per", "pbr", "forwardPer", "marketCap"].some((key) => numberValue(fundamentals[key]) > 0);
  const news = normalizeNews(data.news);
  const disclosures = normalizeDisclosures(data.disclosures);
  const sourceFinancials = hasFinancials ? [{
    title: `${stock.name} 재무지표`,
    publisher: fundamentals.source || "Firebase Function input",
    publishedAt: generatedAt,
    per: fundamentals.per,
    pbr: fundamentals.pbr,
    forwardPer: fundamentals.forwardPer,
    marketCap: fundamentals.marketCap
  }] : [];
  return {
    analysisId: `${stock.market}_${stock.ticker}`,
    ticker: stock.ticker,
    name: stock.name,
    market: stock.market,
    score,
    scoreLabel: `${label} · 목표 대비 여력 ${pct(upside)}`,
    theme: stock.market === "US" ? "글로벌 주식" : "국내 주식",
    sector: stock.market === "US" ? "글로벌 주식" : "국내 주식",
    summary: `${stock.name}은 현재가 ${money(currentPrice, stock.market)} 기준 목표 대비 여력 ${pct(upside)}와 최근 등락률 ${pct(changeRate)}를 함께 확인해야 합니다.`,
    todayReason: news[0]?.title || "가격, 거래대금, 재무 근거를 함께 확인하는 구간입니다.",
    fundamentals: hasFinancials
      ? `PER ${ratio(fundamentals.per)}, PBR ${ratio(fundamentals.pbr)}, 선행 PER ${ratio(fundamentals.forwardPer)}를 확인했습니다.`
      : "재무지표 입력이 제한되어 가격과 뉴스 근거를 우선 반영했습니다.",
    technical: changeRate >= 0 ? "단기 가격 흐름은 우호적이나 거래대금 유지가 필요합니다." : "단기 조정 흐름이 있어 지지선 확인이 필요합니다.",
    news: news.length || disclosures.length
      ? [
          news.length ? `최근 근거 뉴스 ${news.length}건을 반영했습니다.` : "",
          disclosures.length ? `최근 공시 ${disclosures.length}건도 함께 확인했습니다.` : "",
          [...news.slice(0, 1), ...disclosures.slice(0, 1)].map((item) => item.title).join(" / ")
        ].filter(Boolean).join(" ")
      : "전달된 뉴스/공시 근거가 없어 가격과 재무 입력을 우선 반영했습니다.",
    momentum: `등락률 ${pct(changeRate)}와 목표여력 ${pct(upside)} 기준 모멘텀은 ${label} 구간입니다.`,
    peerPerAverage: hasFinancials ? `현재 PER ${ratio(fundamentals.per)}` : "동종업계 평균 PER은 추가 데이터 연결 후 산출",
    themePeers: [stock.name, "동종업계", "시장대표주"],
    risks: ["시장 변동성", "실적 추정 하향", "거래대금 둔화"],
    sections: [
      { title: "CAN SLIM 체크", body: "현재 입력값 기준으로 가격 모멘텀, 재무 밸류에이션, 뉴스 촉매를 함께 확인했습니다." },
      { title: "확인할 것", body: "거래대금 유지, 주요 이동평균 지지, 실적 발표 일정, 관련 뉴스 강도를 확인합니다." }
    ],
    catalysts: [{
      title: news[0]?.title || "수급 변화",
      kind: news.length ? "뉴스" : "수급",
      impact: changeRate >= 0 ? "긍정" : "중립",
      timeline: "단기",
      confidence: "보통",
      detail: "가격과 거래대금이 근거와 함께 움직이는지 확인합니다."
    }],
    valuation: {
      perVerdict: hasFinancials ? "확인" : "확인필요",
      pbrVerdict: hasFinancials ? "확인" : "확인필요",
      forwardPer: ratio(fundamentals.forwardPer),
      sectorAveragePer: "추가 데이터 연결 후 산출",
      peerComparison: [],
      reasoning: hasFinancials ? `입력 재무 데이터 출처는 ${fundamentals.source || "Function input"}입니다.` : "DART/KIS/OpenAI 보강 전 기본 입력값으로 분석했습니다."
    },
    technicalDetail: {
      maPosition: "단기 추세 확인",
      rsiVerdict: "추가 확인",
      bollingerVerdict: "추가 확인",
      support: money(currentPrice * 0.94, stock.market),
      resistance: money(currentPrice * 1.08, stock.market),
      pattern: changeRate >= 0 ? "반등 지속 후보" : "눌림 확인 후보",
      reasoning: "캔들 입력은 가격 흐름 참고 자료로만 사용했습니다."
    },
    scenarios: {
      bull: { trigger: "거래대금 동반 돌파", priceTarget: pct(Math.max(6, upside)), probability: 0.32, narrative: "저항선을 거래대금과 함께 넘으면 추세가 강화될 수 있습니다." },
      base: { trigger: "박스권 등락", priceTarget: "보합권", probability: 0.45, narrative: "추가 재료 전까지는 지지선 부근 등락을 기본 시나리오로 봅니다." },
      bear: { trigger: "수급 이탈", priceTarget: pct(-6), probability: 0.23, narrative: "지지선이 깨지면 리스크 관리가 우선입니다." }
    },
    risksDetailed: [
      { category: "시장", severity: "보통", probability: "보통", description: "지수 변동성이 커지면 개별 종목 재료가 희석될 수 있습니다.", mitigant: "지수, 환율, 선물 방향을 함께 확인합니다." },
      { category: "수급", severity: "보통", probability: "보통", description: "거래대금이 줄면 추세 지속성이 약해질 수 있습니다.", mitigant: "전일 대비 거래대금과 외국인/기관 수급을 확인합니다." }
    ],
    timing: {
      shortTerm: "1~2주는 거래대금 유지와 지지선 확인이 핵심입니다.",
      midTerm: "1~3개월은 실적 발표와 업종 멀티플 변화가 방향을 결정합니다.",
      action: score >= 75 ? "관망" : "판단보류",
      actionReason: "단정적 매수/매도보다 가격, 거래대금, 실적 근거가 동시에 맞는지 확인하는 구간입니다."
    },
    sourceNews: news,
    sourceReports: [],
    sourceDisclosures: disclosures,
    sourceFinancials,
    sourceEpsTimeline: [],
    generatedAt,
    updatedAt: generatedAt,
    analysisPrice: currentPrice
  };
}

function buildOpenAIPrompt(data, fallback) {
  return [
    "Return strict JSON only. Match the provided stock analysis schema.",
    "Keep Korean user-facing text. Do not provide direct buy or sell orders.",
    "Preserve sourceNews, sourceDisclosures, and sourceFinancials arrays from the input when useful.",
    JSON.stringify({ input: data, fallback }, null, 2)
  ].join("\n");
}

function extractOutputText(response) {
  if (!response || !Array.isArray(response.output)) return "";
  return response.output.flatMap((item) => item.content || [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function parseJsonText(text) {
  const trimmed = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function mergeAnalysis(fallback, generated) {
  if (!generated || typeof generated !== "object") return fallback;
  return {
    ...fallback,
    ...generated,
    analysisId: fallback.analysisId,
    ticker: fallback.ticker,
    name: fallback.name,
    market: fallback.market,
    sourceNews: Array.isArray(generated.sourceNews) ? generated.sourceNews : fallback.sourceNews,
    sourceDisclosures: Array.isArray(generated.sourceDisclosures) ? generated.sourceDisclosures : fallback.sourceDisclosures,
    sourceFinancials: Array.isArray(generated.sourceFinancials) ? generated.sourceFinancials : fallback.sourceFinancials,
    updatedAt: fallback.updatedAt,
    generatedAt: fallback.generatedAt
  };
}

module.exports = {
  DEFAULT_MODEL,
  buildDeterministicAnalysis,
  buildOpenAIPrompt,
  extractOutputText,
  parseJsonText,
  mergeAnalysis
};
