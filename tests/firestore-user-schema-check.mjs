import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");
const rules = read("firebase/firestore.rules");
const app = read("src/app.js");

for (const token of [
  "function validPublicUserDocument(uid)",
  "function validUserMemoDocument()",
  "function validUserPickCommentIndex()",
  "function validUserJournalCommentIndex()",
  "function validUserPostCommentIndex()",
  "function validBlockedUserDocument()",
  "function validPostAuthorFollowDocument(targetUid)",
  "function validUserAnalysisDocument(uid, analysisId)",
  "request.resource.data.keys().hasAll([\"uid\", \"nickname\", \"level\", \"postCount\", \"commentCount\", \"attendanceCount\", \"bonusXp\", \"lastAttendanceDate\", \"updatedAt\"])",
  "request.resource.data.uid == uid",
  "request.resource.data.targetUid == targetUid",
  "request.resource.data.analysisId == analysisId",
  "match /memos/{stockKey}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validUserMemoDocument();",
  "match /myComments/{commentId}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validUserPickCommentIndex();",
  "match /myJournalComments/{commentId}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validUserJournalCommentIndex();",
  "match /myPostComments/{commentId}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validUserPostCommentIndex();",
  "match /blockedUsers/{targetUid}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validBlockedUserDocument();",
  "match /post_author_follows/{targetUid}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validPostAuthorFollowDocument(targetUid);",
  "match /stock_ai_analyses/{analysisId}",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validUserAnalysisDocument(uid, analysisId);",
  "allow read, write: if isAdmin();",
  "allow create, update: if (isOwner(uid) || isAdmin()) && validPublicUserDocument(uid);"
]) {
  if (!rules.includes(token)) throw new Error(`Firestore user schema rule missing: ${token}`);
}

for (const stale of [
  "allow read, write: if isOwner(uid) || isAdmin();",
  "allow create, update: if isOwner(uid) || isAdmin();\n      allow delete: if isAdmin();\n    }\n\n    match /user_public/{uid}"
]) {
  if (rules.includes(stale)) throw new Error(`stale broad user/public rule remains: ${stale}`);
}

for (const token of [
  "lastAttendanceDate: doc.lastAttendanceDate || \"\"",
  "await f.setDoc(f.doc(state.firebase.db, \"users\", state.user.uid, \"memos\", data.stockKey)",
  "await setFirestoreDoc(`users/${state.user.uid}/myComments/${comment.id}`,",
  "await setFirestoreDoc(`users/${state.user.uid}/myJournalComments/${comment.id}`,",
  "await setFirestoreDoc(`users/${state.user.uid}/myPostComments/${comment.id}`,",
  "await setFirestoreDoc(`users/${state.user.uid}/post_author_follows/${targetUid}`,",
  "await setFirestoreDoc(`users/${state.user.uid}/blockedUsers/${targetUid}`,",
  "await setFirestoreDoc(`users/${state.user.uid}/stock_ai_analyses/${payload.analysisId}`,"
]) {
  if (!app.includes(token)) throw new Error(`client user write payload no longer matches schema guard: ${token}`);
}

console.log("firestore user schema checks passed");
