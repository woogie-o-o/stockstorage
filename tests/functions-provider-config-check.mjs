import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(root, "functions/index.js"), "utf8");

function assert(condition, message, data = {}) {
  if (!condition) throw new Error(`${message}: ${JSON.stringify(data)}`);
}

const expectedSecrets = ["OPENAI_API_KEY", "DART_API_KEY", "KIS_APP_KEY", "KIS_APP_SECRET"];
for (const secret of expectedSecrets) {
  assert(
    source.includes(`const ${secret} = defineSecret("${secret}")`),
    "secret definition missing",
    { secret }
  );
}

const exportMatch = source.match(/exports\.getMarketProviderConfig\s*=\s*onCall\(\s*\{([\s\S]*?)\}\s*,\s*async\s*\(\)\s*=>\s*\(\{([\s\S]*?)\}\)\s*\);/);
assert(exportMatch, "getMarketProviderConfig export not found");

const options = exportMatch[1].replace(/\s+/g, " ");
const body = exportMatch[2];
for (const secret of expectedSecrets) {
  assert(options.includes(secret), "provider config secret not declared in callable options", { secret });
}

const expectedFields = {
  openAiConfigured: "OPENAI_API_KEY",
  dartConfigured: "DART_API_KEY",
  kisConfigured: "KIS_APP_KEY"
};

for (const [field, secret] of Object.entries(expectedFields)) {
  assert(
    body.includes(`${field}: Boolean(${secret}.value()`),
    "provider config field does not reduce secret to boolean",
    { field, secret }
  );
}

assert(
  body.includes("KIS_APP_KEY.value() && KIS_APP_SECRET.value()"),
  "KIS provider status must require both KIS secrets"
);

const valueRefs = [...body.matchAll(/[A-Z_]+\.value\(\)/g)].map((match) => match[0]);
for (const ref of valueRefs) {
  assert(
    body.includes(`Boolean(${ref}`) || body.includes(`&& ${ref}`),
    "provider config may expose a raw secret value",
    { ref }
  );
}

assert(body.includes('source: "Firebase Functions secrets"'), "provider config source label missing");

console.log(JSON.stringify({
  export: "getMarketProviderConfig",
  secrets: expectedSecrets.length,
  fields: Object.keys(expectedFields).length,
  exposesRawValues: false
}, null, 2));
