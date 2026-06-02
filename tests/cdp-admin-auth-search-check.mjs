const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `admin@${qaStamp}.woogi.local`;
const password = "qa-admin-password-2026";
const nickname = `Admin${qaStamp}`;
const pickName = `QA Admin Pick ${qaStamp}`;
const noticeTitle = `QA Notice ${qaStamp}`;

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP admin check");

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

async function waitFor(expression, timeoutMs = 8000) {
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
await waitFor(`Boolean(document.querySelector("main"))`);
await navigate("#profile");
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
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)}) && Boolean(document.querySelector('[data-route="admin"]'))`);

await navigate("#community");
await waitFor(`Boolean(document.querySelector("article [data-action='report']"))`);
const reportCountBefore = await evaluate(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).reports.length`);
await evaluate(`
  (() => {
    document.querySelector("article [data-action='report']").click();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).reports.length > ${reportCountBefore}`);
const reportId = await evaluate(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).reports.at(-1).id`);

await navigate("#admin");
await waitFor(`document.body.textContent.includes("관리자") && Boolean(document.querySelector('form[data-form="admin-pick"]'))`);
const adminUid = await evaluate(`JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid`);
await waitFor(`document.body.textContent.includes("회원 관리") && document.body.textContent.includes(${JSON.stringify(email)})`);
await evaluate(`
  (() => {
    const input = document.querySelector('[data-filter="adminUserSearch"]');
    input.value = ${JSON.stringify(email)};
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)}) && Boolean(document.querySelector('[data-action="inspect-admin-user"][data-uid="${adminUid}"]'))`);
await evaluate(`document.querySelector('[data-action="inspect-admin-user"][data-uid="${adminUid}"]').click(); true;`);
await waitFor(`document.body.textContent.includes("회원 상세") && document.body.textContent.includes(${JSON.stringify(adminUid)})`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="admin-pick"]');
    form.querySelector('[name="name"]').value = ${JSON.stringify(pickName)};
    form.querySelector('[name="ticker"]').value = "QAPICK";
    form.querySelector('[name="market"]').value = "US";
    form.querySelector('[name="buyPrice"]').value = "10";
    form.querySelector('[name="targetPrice"]').value = "12";
    form.querySelector('[name="reason"]').value = "QA admin pick";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).stockPicks.some((item) => item.name === ${JSON.stringify(pickName)})`);

await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="notice"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(noticeTitle)};
    form.querySelector('[name="body"]').value = "QA notice body";
    form.querySelector('[name="isPinned"]').checked = true;
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).announcements.some((item) => item.title === ${JSON.stringify(noticeTitle)} && item.isPinned)`);

await waitFor(`Boolean(document.querySelector('[data-action="delete-report"][data-id="${reportId}"]'))`);
await evaluate(`
  (() => {
    document.querySelector('[data-action="delete-report"][data-id="${reportId}"]').click();
    return true;
  })()
`);
await waitFor(`!JSON.parse(localStorage.getItem("woogi-stock-data-v1")).reports.some((item) => item.id === ${JSON.stringify(reportId)})`);

await navigate("#home");
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="global-search"]');
    form.querySelector('[name="q"]').value = "삼성전자";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`location.hash === "#stock/KS_005930"`);
await waitFor(`Boolean(document.querySelector('[data-action="toggle-favorite-stock"][data-stock="KS_005930"]'))`);
await evaluate(`document.querySelector('[data-action="toggle-favorite-stock"][data-stock="KS_005930"]').click(); true;`);
await waitFor(`document.body.textContent.includes("관심 해제")`);

await navigate("#favorites");
await waitFor(`Boolean(document.querySelector('[data-action="remove-favorite-stock"][data-stock="KS_005930"]'))`);
await evaluate(`document.querySelector('[data-action="remove-favorite-stock"][data-stock="KS_005930"]').click(); true;`);
await waitFor(`!JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].favoriteStocks.KS_005930`);
await waitFor(`!document.querySelector('[data-action="remove-favorite-stock"][data-stock="KS_005930"]') && Boolean(document.querySelector('form[data-form="stock-search"]'))`);

await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="stock-search"]');
    form.querySelector('[name="q"]').value = "005930";
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.querySelector("#search-results")?.textContent.includes("삼성전자")`);
await evaluate(`
  (() => {
    document.querySelector('#search-results [data-action="open-stock"][data-stock="KS_005930"]').click();
    return true;
  })()
`);
await waitFor(`location.hash === "#stock/KS_005930"`);

await navigate("#profile");
await evaluate(`document.querySelector('[data-action="logout"]').click(); true;`);
await waitFor(`!localStorage.getItem("woogi-stock-session-v1")`);
await navigate("#profile");
await waitFor(`Boolean(document.querySelector('form[data-form="login"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="login"]');
    form.querySelector('[name="email"]').value = ${JSON.stringify(email)};
    form.querySelector('[name="password"]').value = ${JSON.stringify(password)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)}) && Boolean(document.querySelector('[data-route="admin"]'))`);

await navigate("#admin", 390, 844);
await waitFor(`document.body.textContent.includes("관리자")`);

const result = await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return {
      email: session.email,
      isAdmin: session.isAdmin,
      hasPick: data.stockPicks.some((item) => item.name === ${JSON.stringify(pickName)}),
      hasPinnedNotice: data.announcements.some((item) => item.title === ${JSON.stringify(noticeTitle)} && item.isPinned),
      reportsDeleted: !data.reports.some((item) => item.id === ${JSON.stringify(reportId)}),
      favoriteRemoved: !doc.favoriteStocks.KS_005930,
      adminUserVisible: document.body.textContent.includes("회원 관리") && document.body.textContent.includes(${JSON.stringify(email)}),
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

if (result.email !== email || !result.isAdmin) throw new Error(`Admin re-login failed: ${JSON.stringify(result)}`);
if (!result.hasPick || !result.hasPinnedNotice) throw new Error(`Admin create flows failed: ${JSON.stringify(result)}`);
if (!result.reportsDeleted) throw new Error(`Admin report delete failed: ${JSON.stringify(result)}`);
if (!result.favoriteRemoved) throw new Error(`Favorite remove failed: ${JSON.stringify(result)}`);
if (!result.adminUserVisible) throw new Error(`Admin user management failed: ${JSON.stringify(result)}`);
if (result.overflowX) throw new Error(`Admin mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
