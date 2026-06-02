const appUrl = process.env.WOOGI_APP_URL || "http://127.0.0.1:8019";

function assert(condition, message, data) {
  if (!condition) throw new Error(`${message}: ${JSON.stringify(data)}`);
}

async function request(path, method = "GET") {
  const response = await fetch(`${appUrl}${path}`, {
    method,
    signal: AbortSignal.timeout(5000)
  });
  return {
    path,
    method,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: method === "HEAD" ? "" : await response.text()
  };
}

const [root, health, healthHead, config, configHead] = await Promise.all([
  request("/"),
  request("/healthz"),
  request("/healthz", "HEAD"),
  request("/config.local.js"),
  request("/config.local.js", "HEAD")
]);

for (const response of [root, health, healthHead, config, configHead]) {
  assert(response.status === 200, "server contract status failed", response);
  assert(response.headers["x-content-type-options"] === "nosniff", "nosniff header missing", response);
  assert(response.headers["x-frame-options"] === "DENY", "frame header missing", response);
  assert(response.headers["referrer-policy"] === "strict-origin-when-cross-origin", "referrer header missing", response);
  assert(response.headers["permissions-policy"] === "camera=(), microphone=(), geolocation=()", "permissions header missing", response);
  const csp = response.headers["content-security-policy"] || "";
  assert(csp.includes("default-src 'self'"), "CSP default-src missing", response);
  assert(csp.includes("script-src 'self' https://www.gstatic.com"), "CSP script-src missing", response);
  assert(csp.includes("object-src 'none'"), "CSP object-src missing", response);
  assert(csp.includes("frame-ancestors 'none'"), "CSP frame-ancestors missing", response);
  assert(csp.includes("connect-src 'self' https: wss:"), "CSP connect-src missing", response);
}
for (const response of [health, healthHead, config, configHead]) {
  assert(response.headers["cache-control"] === "no-store", "dynamic response cache policy missing", response);
}
assert(JSON.parse(health.body).ok === true, "health payload failed", health);
assert(config.body.includes("window.WOOGI_FIREBASE_CONFIG"), "browser config payload failed", config);

console.log("server HTTP contract checks passed");
