import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildDeterministicAnalysis,
  buildOpenAIPrompt,
  extractOutputText,
  parseJsonText,
  mergeAnalysis
} = require("../functions/analysis.js");

const input = {
  stock: { ticker: "005930", name: "삼성전자", market: "KS" },
  price: { currentPrice: 347000, targetPrice: 355000, changeRate: 9.46 },
  fundamentals: { per: 28.17, pbr: 4.85, forwardPer: 8.09, marketCap: 2037400000000000, source: "Naver Finance" },
  news: [{ title: "삼성전자 테스트 뉴스", publisher: "QA News", url: "https://example.com/news" }],
  disclosures: [{ title: "삼성전자 테스트 공시", date: "2026.06.01", submitter: "KOSCOM", url: "https://example.com/disclosure" }]
};

const analysis = buildDeterministicAnalysis(input, "2026-06-01T00:00:00.000Z");
if (analysis.analysisId !== "KS_005930") throw new Error(`bad analysisId: ${analysis.analysisId}`);
if (!analysis.sourceNews.length || !analysis.sourceDisclosures.length || !analysis.sourceFinancials.length) throw new Error("sources missing");
if (!analysis.scenarios?.bull || !analysis.risksDetailed?.length) throw new Error("schema sections missing");

const prompt = buildOpenAIPrompt(input, analysis);
if (!prompt.includes("Return strict JSON only") || !prompt.includes("삼성전자")) throw new Error("prompt missing required content");

const responseText = extractOutputText({
  output: [{ content: [{ type: "output_text", text: "```json\n{\"score\":81,\"summary\":\"AI\"}\n```" }] }]
});
const parsed = parseJsonText(responseText);
if (parsed?.score !== 81) throw new Error("OpenAI JSON parse helper failed");

const merged = mergeAnalysis(analysis, parsed);
if (merged.analysisId !== "KS_005930" || merged.score !== 81 || merged.name !== "삼성전자") {
  throw new Error("merge helper failed");
}

console.log(JSON.stringify({ analysisId: analysis.analysisId, score: analysis.score, sources: analysis.sourceNews.length + analysis.sourceDisclosures.length + analysis.sourceFinancials.length }, null, 2));
