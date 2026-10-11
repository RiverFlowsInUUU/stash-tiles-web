async function request(method, params) {
  return new Promise((resolve, reject) => {
    const httpMethod = $httpClient[method.toLowerCase()];
    httpMethod(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

function httpStatus(response) {
  return (response && (response.status || response.statusCode)) || 0;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 轻量探针：Gemini REST API（返回 400 API_KEY_INVALID = 出口能连通 Google AI）
// 被墙地区会返回 403 SERVICE_DISABLED / 地域错误，而非 400
async function checkLight() {
  const { error, response, data } = await request("GET", {
    url: "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDummyProbeOnly",
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if ((error && !response) || !response) {
    return { state: "retry", msg: "Network Error" };
  }
  const status = httpStatus(response);
  const body = (data || "").toLowerCase();
  // 地域封锁信号（Google API 在受限地区返回 403 + service_disabled / location）
  if (
    status === 403 ||
    body.includes("service_disabled") ||
    body.includes("location") ||
    body.includes("not available") ||
    body.includes("unsupported") ||
    body.includes("unavailable in your region")
  ) {
    // 403 且带 API_KEY_INVALID 不算墙（key 本来就是假的）；纯 403 才判墙
    if (body.includes("api_key_invalid") && status !== 403) {
      return { state: "ok", msg: "Available" };
    }
    if (status === 403 && !body.includes("api_key_invalid")) {
      return { state: "blocked", msg: "Not Available" };
    }
    if (body.includes("api_key_invalid")) {
      return { state: "ok", msg: "Available" };
    }
    return { state: "blocked", msg: "Not Available" };
  }
  // 400 + API_KEY_INVALID = 连通正常（预期结果）
  if (status === 400 && body.includes("api_key_invalid")) {
    return { state: "ok", msg: "Available" };
  }
  if (status === 200) {
    return { state: "ok", msg: "Available" };
  }
  return { state: "retry", msg: `Error (${status})` };
}

// 回退：gemini.google.com 首页 HTML（带完整浏览器头 + 超时容忍）
async function checkWeb() {
  const { error, response, data } = await request("GET", {
    url: "https://gemini.google.com",
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    },
  });
  if ((error && !response) || !response) {
    return { ok: false, msg: "Network Error" };
  }
  const body = (data || "").toLowerCase();
  if (
    body.includes("not available in your country") ||
    body.includes("unsupported country") ||
    body.includes("unavailable in your region")
  ) {
    return { ok: false, msg: "Not Available" };
  }
  if (body.includes("gemini")) {
    return { ok: true };
  }
  return { ok: false, msg: "Unknown" };
}

async function main() {
  const light = await checkLight();
  if (light.state === "ok") {
    $done({ content: "Available", backgroundColor: "#7E83FF" });
    return;
  }
  if (light.state === "blocked") {
    $done({ content: light.msg, backgroundColor: "" });
    return;
  }
  const web = await checkWeb();
  if (web.ok) {
    $done({ content: "Available", backgroundColor: "#7E83FF" });
    return;
  }
  $done({ content: web.msg, backgroundColor: "" });
}

(async () => {
  main()
    .then((_) => {})
    .catch((_) => {
      $done({});
    });
})();
