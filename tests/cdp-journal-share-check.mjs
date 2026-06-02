const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `journal-share-${qaStamp}@woogi.local`;
const password = "qa-password-2026";
const nickname = `일지${qaStamp}`;

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP journal share check");

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

async function waitFor(expression, timeoutMs = 7000) {
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
    form.querySelector('[name="nickname"]').value = ${JSON.stringify(nickname)};
    form.querySelector('[name="email"]').value = ${JSON.stringify(email)};
    form.querySelector('[name="password"]').value = ${JSON.stringify(password)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)})`);

await navigate("#community", 1440, 900);
await waitFor(`document.body.textContent.includes("공개 매매일지") && document.body.textContent.includes("삼성전자 매수")`);
await evaluate(`document.querySelector('[data-action="route"][data-route="journal-share"][data-param="journal_001"]').click(); true;`);
await waitFor(`location.hash === "#journal-share/journal_001" && document.body.textContent.includes("삼성전자 매수")`);

await evaluate(`document.querySelector('[data-action="like-journal"][data-id="journal_001"]').click(); true;`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].likedJournals.journal_001`);

const deletedComment = `QA journal delete ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="journal-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(deletedComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(deletedComment)})`);
const deletedCommentId = await evaluate(`
  JSON.parse(localStorage.getItem("woogi-stock-data-v1")).journalComments.journal_001.find((item) => item.content === ${JSON.stringify(deletedComment)}).id
`);
await evaluate(`document.querySelector('[data-action="delete-journal-comment"][data-id="${deletedCommentId}"]').click(); true;`);
await waitFor(`!JSON.parse(localStorage.getItem("woogi-stock-data-v1")).journalComments.journal_001.some((item) => item.id === ${JSON.stringify(deletedCommentId)})`);

const keptComment = `QA journal kept ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="journal-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(keptComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(keptComment)})`);

await navigate("#my-comments", 390, 844);
await waitFor(`document.body.textContent.includes("매매일지 댓글") && document.body.textContent.includes(${JSON.stringify(keptComment)})`);

await navigate("#journal-share/journal_001", 1280, 900);
await evaluate(`document.querySelector('[data-action="block-user"][data-uid="demo"]').click(); true;`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].blockedUsers.demo`);
await waitFor(`location.hash === "#community" && !document.body.textContent.includes("HBM 뉴스 이후 눌림 구간 분할 진입")`);

const result = await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return {
      email: session.email,
      likedJournal: Boolean(doc.likedJournals.journal_001),
      deletedCommentGone: !data.journalComments.journal_001.some((item) => item.id === ${JSON.stringify(deletedCommentId)}),
      keptCommentExists: data.journalComments.journal_001.some((item) => item.content === ${JSON.stringify(keptComment)}),
      blockedDemo: Boolean(doc.blockedUsers.demo),
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

if (result.email !== email) throw new Error(`Signup/session failed: ${JSON.stringify(result)}`);
if (!result.likedJournal || !result.deletedCommentGone || !result.keptCommentExists) {
  throw new Error(`Journal share flows failed: ${JSON.stringify(result)}`);
}
if (!result.blockedDemo) throw new Error(`Journal author block failed: ${JSON.stringify(result)}`);
if (result.overflowX) throw new Error(`Journal share mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
