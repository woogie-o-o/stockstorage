const port = process.env.CDP_PORT || "9223";
const baseAppUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";
const appUrl = process.env.WOOGI_FLOW_APP_URL || baseAppUrl.replace("//127.0.0.1:", "//localhost:");
const flowUrl = `${appUrl.replace(/\/$/, "")}/?firebase=off`;
const qaStamp = Date.now().toString(36);
const email = `community-${qaStamp}@woogi.local`;
const password = "qa-password-2026";
const nickname = `커뮤${qaStamp}`;

const existingTargets = await fetch(`http://127.0.0.1:${port}/json/list`).then((res) => res.json()).catch(() => []);
await Promise.all(existingTargets
  .filter((target) => String(target.url || "").includes("?firebase=off"))
  .map((target) => fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => null)));

const page = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${flowUrl}#profile`)}`,
  { method: "PUT" }
).then((res) => res.json());
if (!page) throw new Error("No Chrome page target found for CDP community detail check");

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
  await send("Page.navigate", { url: `${flowUrl}${hash}` });
  await waitFor(`Boolean(document.querySelector("main"))`);
}

await send("Runtime.enable");
await send("Page.enable");
await navigate("#profile");
await evaluate(`localStorage.clear();`);
await send("Page.reload", { ignoreCache: true });
await waitFor(`Boolean(document.querySelector("main"))`);
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
await evaluate(`document.querySelector('[data-action="modal"][data-modal="post"]').click(); true;`);
await waitFor(`Boolean(document.querySelector('form[data-form="post"]'))`);
const postTitle = `QA detail post ${qaStamp}`;
const postBody = `QA detail body ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="post"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(postTitle)};
    form.querySelector('[name="content"]').value = ${JSON.stringify(postBody)};
    const file = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#10b981"/></svg>'],
      'qa-post.svg',
      { type: 'image/svg+xml' }
    );
    const transfer = new DataTransfer();
    transfer.items.add(file);
    form.querySelector('[name="imageFiles"]').files = transfer.files;
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(postTitle)})`);
const postId = await evaluate(`
  JSON.parse(localStorage.getItem("woogi-stock-data-v1")).posts.find((item) => item.title === ${JSON.stringify(postTitle)}).id
`);
await waitFor(`Boolean(JSON.parse(localStorage.getItem("woogi-stock-data-v1")).posts.find((item) => item.id === ${JSON.stringify(postId)})?.imageUrls?.some((url) => url.startsWith("data:image/svg+xml")))`);
const hadImageAttachment = await evaluate(`
  JSON.parse(localStorage.getItem("woogi-stock-data-v1")).posts.find((item) => item.id === ${JSON.stringify(postId)}).imageUrls.some((url) => url.startsWith("data:image/svg+xml"))
`);

await evaluate(`
  (() => {
    const article = document.querySelector(\`article[data-post-id="${postId}"]\`);
    article.querySelector('[data-action="route"][data-route="post"]').click();
    return true;
  })()
`);
await waitFor(`location.hash === ${JSON.stringify(`#post/${postId}`)}`);

const deletedComment = `QA delete comment ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="post-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(deletedComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(deletedComment)})`);
const deletedCommentId = await evaluate(`
  JSON.parse(localStorage.getItem("woogi-stock-data-v1")).postComments[${JSON.stringify(postId)}].find((item) => item.content === ${JSON.stringify(deletedComment)}).id
`);
await evaluate(`
  document.querySelector('[data-action="delete-post-comment"][data-id="${deletedCommentId}"]').click();
  true;
`);
await waitFor(`!JSON.parse(localStorage.getItem("woogi-stock-data-v1")).postComments[${JSON.stringify(postId)}].some((item) => item.id === ${JSON.stringify(deletedCommentId)})`);

const keptComment = `QA kept comment ${qaStamp}`;
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="post-comment"]');
    form.querySelector('[name="content"]').value = ${JSON.stringify(keptComment)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(keptComment)})`);

const editedTitle = `QA edited post ${qaStamp}`;
const editedBody = `QA edited body ${qaStamp}`;
await evaluate(`document.querySelector('[data-action="modal"][data-modal="post"][data-id="${postId}"]').click(); true;`);
await waitFor(`Boolean(document.querySelector('form[data-form="post"] input[name="id"][value="${postId}"]'))`);
await evaluate(`
  (() => {
    const form = document.querySelector('form[data-form="post"]');
    form.querySelector('[name="title"]').value = ${JSON.stringify(editedTitle)};
    form.querySelector('[name="content"]').value = ${JSON.stringify(editedBody)};
    form.requestSubmit();
    return true;
  })()
`);
await waitFor(`document.body.textContent.includes(${JSON.stringify(editedTitle)}) && document.body.textContent.includes(${JSON.stringify(editedBody)})`);

await navigate("#my-posts", 390, 844);
await waitFor(`document.body.textContent.includes(${JSON.stringify(editedTitle)})`);
await navigate("#my-comments", 390, 844);
await waitFor(`document.body.textContent.includes(${JSON.stringify(keptComment)})`);

await navigate("#post/post_001", 1280, 900);
await waitFor(`document.body.textContent.includes("오늘 반도체 수급")`);
await evaluate(`document.querySelector('[data-action="toggle-post-author-follow"][data-uid="demo"]').click(); true;`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].postAuthorFollows.demo.enabled === true`);
await evaluate(`document.querySelector('[data-action="block-user"][data-uid="demo"]').click(); true;`);
await waitFor(`JSON.parse(localStorage.getItem("woogi-stock-data-v1")).userDocs[JSON.parse(localStorage.getItem("woogi-stock-session-v1")).uid].blockedUsers.demo`);
await waitFor(`location.hash === "#community" && !document.body.textContent.includes("오늘 반도체 수급은 장 초반보다 마감이 더 중요해 보입니다")`);

await navigate(`#post/${postId}`, 1280, 900);
await waitFor(`document.body.textContent.includes(${JSON.stringify(editedTitle)})`);
await evaluate(`document.querySelector('[data-action="delete-post"][data-id="${postId}"]').click(); true;`);
await waitFor(`!JSON.parse(localStorage.getItem("woogi-stock-data-v1")).posts.some((item) => item.id === ${JSON.stringify(postId)})`);

const result = await evaluate(`
  (() => {
    const session = JSON.parse(localStorage.getItem("woogi-stock-session-v1"));
    const data = JSON.parse(localStorage.getItem("woogi-stock-data-v1"));
    const doc = data.userDocs[session.uid];
    return {
      email: session.email,
      postDeleted: !data.posts.some((item) => item.id === ${JSON.stringify(postId)}),
      commentDeleted: !(data.postComments[${JSON.stringify(postId)}] || []).some((item) => item.id === ${JSON.stringify(deletedCommentId)}),
      keptCommentRemovedWithPost: !data.postComments[${JSON.stringify(postId)}],
      followsDemo: doc.postAuthorFollows.demo?.enabled === true,
      blockedDemo: Boolean(doc.blockedUsers.demo),
      hadImageAttachment: ${JSON.stringify(hadImageAttachment)},
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
if (!result.postDeleted || !result.commentDeleted || !result.keptCommentRemovedWithPost) {
  throw new Error(`Post/comment manage flows failed: ${JSON.stringify(result)}`);
}
if (!result.followsDemo || !result.blockedDemo) {
  throw new Error(`Follow/block flows failed: ${JSON.stringify(result)}`);
}
if (!result.hadImageAttachment) throw new Error(`Post image attachment failed: ${JSON.stringify(result)}`);
if (result.overflowX) throw new Error(`Community detail mobile overflow: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result, null, 2));
