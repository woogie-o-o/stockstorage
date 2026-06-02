import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const rules = read("firebase/firestore.rules");
const app = read("src/app.js");

for (const token of [
  "function initializesLikeCounter()",
  "request.resource.data.likes == 0",
  "function preservesLikeCounter()",
  "function preservesOwnerUid()",
  "request.resource.data.uid == resource.data.uid",
  "function createsPostLike(postId, uid)",
  "function deletesPostLike(postId, uid)",
  "function createsJournalLike(journalId, uid)",
  "function deletesJournalLike(journalId, uid)",
  "existsAfter(/databases/$(database)/documents/posts/$(postId)/likes/$(request.auth.uid))",
  "!existsAfter(/databases/$(database)/documents/posts/$(postId)/likes/$(request.auth.uid))",
  "existsAfter(/databases/$(database)/documents/trading_journal/$(journalId)/likes/$(request.auth.uid))",
  "!existsAfter(/databases/$(database)/documents/trading_journal/$(journalId)/likes/$(request.auth.uid))",
  "getAfter(/databases/$(database)/documents/posts/$(postId)).data.likes",
  "getAfter(/databases/$(database)/documents/trading_journal/$(journalId)).data.likes",
  "allow create: if validPostDocument();",
  "allow create: if validJournalDocument();",
  "((resource.data.uid == request.auth.uid || isAdmin()) && preservesOwnerUid() && preservesLikeCounter() && validPostEdit())",
  "((resource.data.uid == request.auth.uid || isAdmin()) && preservesOwnerUid() && preservesLikeCounter() && validJournalEdit())",
  "allow create: if createsPostLike(postId, uid);",
  "allow delete: if deletesPostLike(postId, uid);",
  "allow create: if createsJournalLike(journalId, uid) && parentJournalPublic(journalId);",
  "allow delete: if deletesJournalLike(journalId, uid) && parentJournalPublic(journalId);"
]) {
  if (!rules.includes(token)) throw new Error(`Firestore like integrity rule missing: ${token}`);
}

for (const token of [
  "async function toggleFirestoreLike(parentPath, likePath)",
  "f.runTransaction(state.firebase.db",
  "transaction.get(parentRef)",
  "transaction.get(likeRef)",
  "transaction.update(parentRef, { likes: nextLikes })",
  "transaction.delete(likeRef)",
  "transaction.set(likeRef",
  "await toggleFirestoreLike(`posts/${id}`, `posts/${id}/likes/${state.user.uid}`)",
  "await toggleFirestoreLike(`trading_journal/${id}`, `trading_journal/${id}/likes/${state.user.uid}`)"
]) {
  if (!app.includes(token)) throw new Error(`Firestore like transaction client missing: ${token}`);
}

for (const stale of [
  "updateFirestoreDoc(`posts/${id}`, { likes: f.increment",
  "updateFirestoreDoc(`trading_journal/${id}`, { likes: f.increment"
]) {
  if (app.includes(stale)) throw new Error(`stale non-atomic like write remains: ${stale}`);
}

console.log("firestore like integrity checks passed");
