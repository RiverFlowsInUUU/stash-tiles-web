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

async function fetchCountry() {
  try {
    const { error, response, data } = await request("GET", {
      url: "https://claude.ai/cdn-cgi/trace",
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
    url: "https://claude.ai",
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if ((error && !response) || !response) {
    $done({ content: "Network Error", backgroundColor: "" });
    return;
  }

  const body = (data || "").toLowerCase();
  if (
    body.includes("not available in your country") ||
    body.includes("unsupported country") ||
    body.includes("unavailable in your region")
  ) {
    $done({ content: "Not Available", backgroundColor: "" });
    return;
  }

  if (body.includes("claude")) {
    const cc = await fetchCountry();
    $done({
      content: cc ? `Available (${cc})` : "Available",
      backgroundColor: "#D4A373",
    });
    return;
  }

  $done({ content: "Unknown", backgroundColor: "" });
}

(async () => {
  main()
    .then((_) => {})
    .catch((_) => {
      $done({});
    });
})();
