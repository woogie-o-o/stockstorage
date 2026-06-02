const port = process.env.CDP_PORT || "9223";
const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const qaStamp = Date.now().toString(36);
const email = `admin@market-${qaStamp}.woogi.local`;
const password = "qa-market-password-2026";
const title = `QA 시황 ${qaStamp}`;
const editedTitle = `${title} 수정`;
const comment = `QA 시황 댓글 ${qaStamp}`;

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${appUrl}/#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for market analysis check");

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

async function waitFor(expression, timeoutMs = 12000) {
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
    form.querySelector('[name="nickname"]').value = "MarketAdmin";
    form.querySelector('[name="email"]').value = ${JSON.stringify(email)};
    form.querySelector('[name="password"]').value = ${JSON.stringify(password)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(email)}) && Boolean(document.querySelector('[data-route="admin"]'))`);

await navigate("#markets");
await waitFor(`document.body.textContent.includes("시장 분석 글") && document.body.textContent.includes("반도체 중심")`);
await evaluate(`document.querySelector('[data-route="market-analysis"][data-param="market_001"]').click(); true;`);
await waitFor(`location.hash === "#market-analysis/market_001" && document.body.textContent.includes("외국인 선물 수급")`);

await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="market-analysis-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(comment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).marketAnalysisComments.market_001.some((item) => item.content === ${JSON.stringify(comment)})`);

await navigate("#markets");
await evaluate(`document.querySelector('[data-action="modal"][data-modal="market-analysis"]').click(); true;`);
await waitFor(`Boolean(document.querySelector('form[data-form="market-analysis"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="market-analysis"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(title)};
    form.querySelector('[name="body"]').value = "QA 시황 본문\\n수급과 환율을 같이 확인합니다.";
    form.querySelector('[name="imageUrls"]').value = "https://example.com/woogi-market.png";
    const file = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#2563eb"/></svg>'],
      'qa-market.svg',
      { type: 'image/svg+xml' }
    );
    const transfer = new DataTransfer();
    transfer.items.add(file);
    form.querySelector('[name="imageFiles"]').files = transfer.files;
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`location.hash.startsWith("#market-analysis/") && document.body.textContent.includes(${JSON.stringify(title)})`);
const createdId = await evaluate(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).marketAnalyses.find((item) => item.title === ${JSON.stringify(title)}).id`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).marketAnalyses.find((item) => item.id === ${JSON.stringify(createdId)}).imageUrls.some((url) => url.startsWith("data:image/svg+xml"))`);
const createdHadImageUpload = await evaluate(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).marketAnalyses.find((item) => item.id === ${JSON.stringify(createdId)}).imageUrls.some((url) => url.startsWith("data:image/svg+xml"))`);

await evaluate(`document.querySelector('[data-action="modal"][data-modal="market-analysis"]').click(); true;`);
await waitFor(`Boolean(document.querySelector('form[data-form="market-analysis"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="market-analysis"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(editedTitle)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(editedTitle)})`);

await evaluate(`document.querySelector('[data-action="delete-market-analysis"][data-id="${createdId}"]').click(); true;`);
await waitFor(`location.hash === "#markets" && !JSON.parse(localStorage.getItem("woogi-stock-data-v1")).marketAnalyses.some((item) => item.id === ${JSON.stringify(createdId)})`);

await navigate("#market-analysis/market_001", 390, 844);
await waitFor(`document.body.textContent.includes("시황 분석")`);

const result = await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    return {
      email: session.email,
      isAdmin: session.isAdmin,
      seedCommentAdded: data.marketAnalysisComments.market_001.some((item) => item.content === ${JSON.stringify(comment)}),
      createdDeleted: !data.marketAnalyses.some((item) => item.id === ${JSON.stringify(createdId)}),
      createdHadImageUpload: ${JSON.stringify(createdHadImageUpload)},
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

if (!result.isAdmin || result.email !== email) throw new Error(`Admin setup failed: ${JSON.stringify(result)}`);
if (!result.seedCommentAdded || !result.createdDeleted) throw new Error(`Market analysis flow failed: ${JSON.stringify(result)}`);
if (!result.createdHadImageUpload) throw new Error(`Market analysis image upload failed: ${JSON.stringify(result)}`);
if (result.overflowX) throw new Error(`Market analysis mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
