async function request(method, params) {
  return new Promise((resolve, reject) => {
    const httpMethod = $httpClient[method.toLowerCase()];
    httpMethod(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 出口地区：chatgpt.com 走 Cloudflare，/cdn-cgi/trace 返回 loc=XX（与服务看到的出口一致）
async function fetchCountry() {
  try {
    const { error, response, data } = await request("GET", {
      url: "https://chatgpt.com/cdn-cgi/trace",
      headers: { "User-Agent": UA, Accept: "text/plain" },
    });
    if (error || !data) return "";
    const m = (data || "").match(/loc=([A-Za-z]{2})/);
    return m ? m[1].toUpperCase() : "";
  } catch (_) {
    return "";
  }
}

async function main() {
  const { error, response, data } = await request("GET", {
    url: "https://api.openai.com/compliance/cookie_requirements",
    headers: {
      Origin: "https://platform.openai.com",
      Referer: "https://platform.openai.com/",
      Accept: "*/*",
      "User-Agent": UA,
    },
  });

  if ((error && !response) || !response) {
    $done({ content: "Network Error", backgroundColor: "" });
    return;
  }

  if ((data || "").toLowerCase().includes("unsupported_country")) {
    $done({ content: "Unsupported Country", backgroundColor: "" });
    return;
  }

  const cc = await fetchCountry();
  $done({
    content: cc ? `Available (${cc})` : "Available",
    backgroundColor: "#88A788",
  });
}

(async () => {
  main()
    .then((_) => {})
    .catch((_) => {
      $done({});
    });
})();
