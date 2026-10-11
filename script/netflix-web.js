async function request(method, params) {
  return new Promise((resolve) => {
    const httpMethod = $httpClient[method.toLowerCase()];
    httpMethod(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function checkTitle(id) {
  const { error, response, data } = await request("GET", {
    url: `https://www.netflix.com/title/${id}`,
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (error || !response) {
    return "";
  }

  const headers = response.headers || {};
  // Stash 可能用不同大小写暴露该头，兼容一下
  let url = headers["X-Originating-Url"] || headers["x-originating-url"] || "";
  if (!url && response.url) url = response.url;
  if (!url) {
    return "";
  }
  const loc = url.split("/")[3] || "";
  if (loc === "title") {
    return "us";
  }
  return loc.split("-")[0];
}

async function main() {
  // 70143836: 完整库测试片；80197526: 自制剧测试片
  var country = await checkTitle(70143836);
  if (country) {
    $done({
      content: `Available (${country.toUpperCase()})`,
      backgroundColor: "#E50914",
    });
    return;
  }

  var country = await checkTitle(80197526);
  if (country) {
    $done({
      content: `Originals Only (${country.toUpperCase()})`,
      backgroundColor: "#E50914",
    });
    return;
  }

  $done({ content: "Not Available", backgroundColor: "" });
}

(async () => {
  main()
    .then((_) => {})
    .catch((_) => {
      $done({});
    });
})();
