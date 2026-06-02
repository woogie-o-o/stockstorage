import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const rules = read("firebase/firestore.rules");
const app = read("src/app.js");

for (const token of [
  "function validString(value, maxSize)",
  "function validRequiredString(value, maxSize)",
  "function validNumber(value)",
  "function validImageUrls(value)",
  "function validCommentDocument()",
  "function validPostDocument()",
  "function validPostEdit()",
  "function validJournalDocument()",
  "function validJournalEdit()",
  "function validReportDocument(reportId)",
  "request.resource.data.keys().hasAll([\"uid\", \"nickname\", \"title\", \"content\", \"likes\", \"createdAt\", \"imageUrls\", \"authorLevel\"])",
  "request.resource.data.keys().hasOnly([\"uid\", \"nickname\", \"title\", \"content\", \"likes\", \"createdAt\", \"imageUrls\", \"authorLevel\"])",
  "request.resource.data.diff(resource.data).affectedKeys().hasOnly([\"title\", \"content\", \"imageUrls\"])",
  "request.resource.data.keys().hasAll([\"uid\", \"nickname\", \"stockName\", \"ticker\", \"market\", \"action\", \"price\", \"quantity\", \"tradeDate\", \"note\", \"isPublic\", \"likes\", \"createdAt\", \"publishedAt\", \"buyPrice\", \"linkedBuyId\"])",
  "request.resource.data.keys().hasOnly([\"uid\", \"nickname\", \"stockName\", \"ticker\", \"market\", \"action\", \"price\", \"quantity\", \"tradeDate\", \"note\", \"isPublic\", \"likes\", \"createdAt\", \"publishedAt\", \"buyPrice\", \"linkedBuyId\"])",
  "request.resource.data.keys().hasAll([\"id\", \"target\", \"reporterUid\", \"targetUid\", \"contentType\", \"contentId\", \"reason\", \"createdAt\"])",
  "request.resource.data.id == reportId",
  "request.resource.data.reporterUid == request.auth.uid",
  "allow create: if validPostDocument();",
  "allow create: if validJournalDocument();",
  "allow create: if validReportDocument(reportId);",
  "validPostEdit())",
  "validJournalEdit())"
]) {
  if (!rules.includes(token)) throw new Error(`Firestore write schema rule missing: ${token}`);
}

const commentCreateMatches = rules.match(/allow create: if validCommentDocument\(\)/g) || [];
if (commentCreateMatches.length < 4) {
  throw new Error(`expected schema-checked comment creates in all public comment collections, found ${commentCreateMatches.length}`);
}

for (const stale of [
  "allow create: if createsOwnDocument();",
  "allow create: if signedIn() && request.resource.data.reporterUid == request.auth.uid;",
  "allow create: if createsOwnDocument() && initializesLikeCounter();",
  "((resource.data.uid == request.auth.uid || isAdmin()) && preservesOwnerUid() && preservesLikeCounter())"
]) {
  if (rules.includes(stale)) throw new Error(`stale broad Firestore write rule remains: ${stale}`);
}

for (const token of [
  "await updateFirestoreDoc(`posts/${existing.id}`,",
  "title: existing.title",
  "content: existing.content",
  "imageUrls: existing.imageUrls",
  "await setFirestoreDoc(`posts/${post.id}`,",
  "authorLevel: post.authorLevel",
  "await setFirestoreDoc(`trading_journal/${item.id}`,",
  "publishedAt: item.publishedAt ? toTimestamp(item.publishedAt) : null",
  "await setFirestoreDoc(`reports/${report.id}`,",
  "...report",
  "createdAt: toTimestamp(report.createdAt)"
]) {
  if (!app.includes(token)) throw new Error(`client write payload no longer matches schema guard: ${token}`);
}

console.log("firestore write schema checks passed");
