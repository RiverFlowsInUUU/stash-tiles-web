async function request(method, params) {
  return new Promise((resolve) => {
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

// 出口地区：经由同一代理出口查询（与 Gemini 看到的出口一致），失败则返回空
async function fetchCountry() {
  try {
    const { error, response, data } = await request("GET", {
      url: "https://ipinfo.io/country",
      headers: { "User-Agent": UA, Accept: "text/plain" },
    });
    if (error || !data) return "";
    const cc = (data || "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(cc) ? cc : "";
  } catch (_) {
    return "";
  }
}

// 主探针：Gemini REST API。Google 在受限地区返回 400 FAILED_PRECONDITION
// "User location is not supported for the API use"，而不是 API_KEY_INVALID。
// 注意：官方首页 HTML 在被墙地区也返回 200 同样外壳（拦截在客户端 JS），
// 所以首页只能做辅助，不能作为 Available 的依据。
async function checkAPI() {
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

  // 受限地区信号（任一命中即判墙）
  if (
    body.includes("failed_precondition") ||
    body.includes("user location is not supported") ||
    body.includes("not supported for the api") ||
    body.includes("service_disabled") ||
    body.includes("unavailable in your region") ||
    (status === 403 && !body.includes("api_key_invalid"))
  ) {
    return { state: "blocked", msg: "Not Available" };
  }
  // 400 + API_KEY_INVALID = 出口能连通 Google AI（假 key 预期结果）
  if (status === 400 && body.includes("api_key_invalid")) {
    return { state: "ok", msg: "Available" };
  }
  if (status === 200) {
    return { state: "ok", msg: "Available" };
  }
  return { state: "retry", msg: `Error (${status})` };
}

// 辅助探针：首页只用于确认“墙”（出现地域关键词），绝不单独判 Available
async function checkWebBlocked() {
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
    return { blocked: false, reachable: false };
  }
  const body = (data || "").toLowerCase();
  if (
    body.includes("not available in your country") ||
    body.includes("unsupported country") ||
    body.includes("unavailable in your region")
  ) {
    return { blocked: true, reachable: true };
  }
  return { blocked: false, reachable: true };
}

async function main() {
  const api = await checkAPI();
  if (api.state === "ok") {
    const cc = await fetchCountry();
    $done({
      content: cc ? `Available (${cc})` : "Available",
      backgroundColor: "#7E83FF",
    });
    return;
  }
  if (api.state === "blocked") {
    $done({ content: api.msg, backgroundColor: "" });
    return;
  }
  // API 不确定（抖动/非预期状态码）→ 看首页有没有明确的墙，有墙才判墙，
  // 否则如实报 Error/Unknown，不再默认 Available（避免误报）
  const web = await checkWebBlocked();
  if (web.blocked) {
    $done({ content: "Not Available", backgroundColor: "" });
    return;
  }
  if (!web.reachable) {
    $done({ content: "Network Error", backgroundColor: "" });
    return;
  }
  $done({ content: api.msg || "Unknown", backgroundColor: "" });
}

(async () => {
  main()
    .then((_) => {})
    .catch((_) => {
      $done({});
    });
})();
