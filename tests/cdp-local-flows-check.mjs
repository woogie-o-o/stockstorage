const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `qa-${qaStamp}@woogi.local`;
const password = "qa-password-2026";
const nickname = `QA${qaStamp}`;

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP local flow check");

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

function textSummaryExpression() {
  return `
    (() => {
      const text = document.querySelector("main")?.textContent.replace(/\\s+/g, " ").trim() || "";
      return {
        hash: location.hash,
        title: document.querySelector("main h1")?.textContent?.trim() || "",
        text,
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
await navigate("#profile");
await evaluate(`
  (() => {
    localStorage.clear();
    sessionStorage.clear();
    return true;
  })()
`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector("main"))`);
await navigate("#profile");
await evaluate(`
  (() => {
    const logout = document.querySelector('[data-action="logout"]');
    if (logout) logout.click();
    return true;
  })()
`);
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
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)}) && document.body.textContent.includes("프로필")`, 18000);

await navigate("#journal");
await waitFor(`
  (() => {
    const mainText = document.querySelector("main")?.textContent || "";
    return mainText.includes("매매일지를 작성해보세요.")
      && !mainText.includes("HBM 뉴스 이후 눌림 구간 분할 진입")
      && !mainText.includes("목표가 근접으로 일부 이익 실현")
      && !mainText.includes("현대차");
  })()
`);

await navigate("#portfolio");
await waitFor(`
  (() => {
    const mainText = document.querySelector("main")?.textContent || "";
    return mainText.includes("매수 기록이 남은 종목이 없습니다.")
      && !mainText.includes("HBM 뉴스 이후 눌림 구간 분할 진입")
      && !mainText.includes("목표가 근접으로 일부 이익 실현")
      && !mainText.includes("현대차");
  })()
`);

await navigate("#ai");
await waitFor(`
  (() => {
    const mainText = document.querySelector("main")?.textContent || "";
    return mainText.includes("종목 상세에서 AI 분석을 생성하면 이곳에 캐시됩니다.")
      && !mainText.includes("목표 대비 여력")
      && !mainText.includes("HBM 공급 회복");
  })()
`);

await navigate("#favorites");
await waitFor(`
  (() => {
    const mainText = document.querySelector("main")?.textContent || "";
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return mainText.includes("등록한 관심종목이 없습니다.")
      && mainText.includes("추천주 상세에서 관심 등록을 누르면 표시됩니다.")
      && Object.keys(doc.favoriteStocks || {}).length === 0
      && (doc.favorites || []).length === 0;
  })()
`);

await navigate("#stock/KS_005930");
await waitFor(`document.body.textContent.includes("삼성전자") && Boolean(document.querySelector('[data-action="toggle-favorite-stock"]'))`);
await evaluate(`
  (() => {
    document.querySelector('[data-action="toggle-favorite-stock"][data-stock="KS_005930"]').click();
    return true;
  })()
`);
await waitFor(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return Boolean(doc.favoriteStocks.KS_005930) && !doc.favorites.includes("pick_samsung");
  })()
`);
await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    doc.favorites = ["KS_005930", ...(doc.favorites || [])];
    localStorage.setItem("woogi-stock-data-v1", JSON.stringify(data));
    return true;
  })()
`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector("main"))`);
await navigate("#favorites");
await waitFor(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return Boolean(doc.favoriteStocks.KS_005930) && !doc.favorites.includes("KS_005930");
  })()
`);
await navigate("#stock/KS_005930");
await waitFor(`document.body.textContent.includes("삼성전자") && Boolean(document.querySelector('[data-action="toggle-favorite-pick"][data-pick="pick_samsung"]'))`);
await evaluate(`
  (() => {
    document.querySelector('[data-action="toggle-favorite-pick"][data-pick="pick_samsung"]').click();
    return true;
  })()
`);
await waitFor(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return Boolean(doc.favoriteStocks.KS_005930) && doc.favorites.includes("pick_samsung");
  })()
`);

const memoText = `QA memo ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="memo"]');
    form.querySelector('[name="memo"]').value = ${JSON.stringify(memoText)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].memos.KS_005930 === ${JSON.stringify(memoText)}`);

const pickComment = `QA pick comment ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="pick-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(pickComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(pickComment)})`);

await navigate("#favorites");
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="favorite-stock"]');
    form.querySelector('[name="name"]').value = "QA Tesla";
    form.querySelector('[name="ticker"]').value = "TSLA";
    form.querySelector('[name="market"]').value = "US";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes("QA Tesla") && JSON.stringify(JSON.parse(localStorage.getItem("woogi-stock-data-v1"))).includes("US_TSLA")`);

await navigate("#journal");
await evaluate(`
  (() => {
    document.querySelector('[data-action="modal"][data-modal="journal"]').click();
    return true;
  })()
`);
await waitFor(`Boolean(document.querySelector('form[data-form="journal"]'))`);
const journalNote = `QA journal note ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="journal"]');
    form.querySelector('[name="stockName"]').value = "QA삼성";
    form.querySelector('[name="ticker"]').value = "005930";
    form.querySelector('[name="market"]').value = "KS";
    form.querySelector('[name="action"]').value = "매수";
    form.querySelector('[name="tradeDate"]').value = "2026-05-31";
    form.querySelector('[name="price"]').value = "317000";
    form.querySelector('[name="quantity"]').value = "1";
    form.querySelector('[name="note"]').value = ${JSON.stringify(journalNote)};
    form.querySelector('[name="isPublic"]').checked = true;
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(journalNote)})`);

const journalEdited = `QA journal edited ${qaStamp}`;
await evaluate(`
  (() => {
    const rows = [...document.querySelectorAll("tbody tr")];
    const row = rows.find((item) => item.textContent.includes(${JSON.stringify(journalNote)}));
    row.querySelector('[data-action="modal"][data-modal="journal"]').click();
    return true;
  })()
`);
await waitFor(`Boolean(document.querySelector('form[data-form="journal"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="journal"]');
    form.querySelector('[name="note"]').value = ${JSON.stringify(journalEdited)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(journalEdited)})`);

await evaluate(`
  (() => {
    const rows = [...document.querySelectorAll("tbody tr")];
    const row = rows.find((item) => item.textContent.includes(${JSON.stringify(journalEdited)}));
    row.querySelector('[data-action="delete-journal"]').click();
    return true;
  })()
`);
await waitFor(`!document.body.textContent.includes(${JSON.stringify(journalEdited)})`);

await navigate("#community", 1440, 900);
await evaluate(`
  (() => {
    document.querySelector('[data-action="modal"][data-modal="post"]').click();
    return true;
  })()
`);
await waitFor(`Boolean(document.querySelector('form[data-form="post"]'))`);
const postTitle = `QA post ${qaStamp}`;
const postBody = `QA community body ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="post"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(postTitle)};
    form.querySelector('[name="content"]').value = ${JSON.stringify(postBody)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(postTitle)})`);

const postComment = `QA post comment ${qaStamp}`;
await evaluate(`
  (() => {
    const article = [...document.querySelectorAll("article")].find((item) => item.textContent.includes(${JSON.stringify(postTitle)}));
    const form = article.querySelector('form[data-form="post-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(postComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(postComment)})`);

await evaluate(`
  (() => {
    const article = [...document.querySelectorAll("article")].find((item) => item.textContent.includes(${JSON.stringify(postTitle)}));
    article.querySelector('[data-action="like-post"]').click();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).posts.some((item) => item.title === ${JSON.stringify(postTitle)} && item.likes >= 1)`);

await evaluate(`
  (() => {
    const article = [...document.querySelectorAll("article")].find((item) => item.textContent.includes(${JSON.stringify(postTitle)}));
    article.querySelector('[data-action="report"]').click();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).reports.some((item) => item.target && item.target.startsWith("post:"))`);

await navigate("#profile", 390, 844);
await waitFor(`document.body.textContent.includes("내 글") && document.body.textContent.includes(${JSON.stringify(postTitle)}) && document.body.textContent.includes(${JSON.stringify(postComment)})`);

const result = await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    const summary = ${textSummaryExpression()};
    return {
      email: session.email,
      favoriteKeys: Object.keys(doc.favoriteStocks || {}),
      memo: doc.memos.KS_005930,
      postCount: doc.postCount,
      commentCount: doc.commentCount,
      attendanceCount: doc.attendanceCount,
      lastAttendanceDate: doc.lastAttendanceDate,
      reports: data.reports.length,
      hasPost: data.posts.some((item) => item.title === ${JSON.stringify(postTitle)}),
      hasPostComment: Object.values(data.postComments).flat().some((item) => item.content === ${JSON.stringify(postComment)}),
      hasPickComment: Object.values(data.pickComments).flat().some((item) => item.content === ${JSON.stringify(pickComment)}),
      journalDeleted: !data.journals.some((item) => item.note === ${JSON.stringify(journalEdited)}),
      overflowX: summary.overflowX,
      viewport: summary.viewport
    };
  })()
`);

socket.close();
await fetch(`http://127.0.0.1:${port}/json/close/${page.id}`);

if (result.email !== email) throw new Error(`Signup/session failed: ${JSON.stringify(result)}`);
if (!result.favoriteKeys.includes("KS_005930") || !result.favoriteKeys.includes("US_TSLA")) {
  throw new Error(`Favorites failed: ${JSON.stringify(result)}`);
}
if (result.memo !== memoText) throw new Error(`Memo failed: ${JSON.stringify(result)}`);
if (!result.hasPickComment || !result.hasPost || !result.hasPostComment) {
  throw new Error(`Community/comment flows failed: ${JSON.stringify(result)}`);
}
if (result.postCount < 1 || result.commentCount < 2 || result.reports < 1) {
  throw new Error(`Counters/report failed: ${JSON.stringify(result)}`);
}
if (result.attendanceCount < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(result.lastAttendanceDate || "")) {
  throw new Error(`Attendance tracking failed: ${JSON.stringify(result)}`);
}
if (!result.journalDeleted) throw new Error(`Journal create/edit/delete failed: ${JSON.stringify(result)}`);
if (result.overflowX) throw new Error(`Profile mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
