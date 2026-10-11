# stash-tiles-web

Stash 折叠磁贴覆写（Web 探针）— ChatGPT / Gemini / Claude / Spotify

> 先 Web 版：ChatGPT 用 `chatgpt-web.js`（`api.openai.com/compliance/cookie_requirements` 判 `unsupported_country`），后续可切 Web+App 双探针。

## Stash 一键安装

Stash → 覆写 → 从 URL 安装，粘贴：

主线路（Fastly CDN，国内可直连）：
```
https://fastly.jsdelivr.net/gh/RiverFlowsInUUU/stash-tiles-web@main/mi-tiles-web.stoverride
```

备用（jsDelivr / GitHub Raw）：
```
https://cdn.jsdelivr.net/gh/RiverFlowsInUUU/stash-tiles-web@main/mi-tiles-web.stoverride
https://raw.githubusercontent.com/RiverFlowsInUUU/stash-tiles-web/main/mi-tiles-web.stoverride
```

## 原理

- 覆写定义 4 个 `collapsed: true` 磁贴，`script-providers` 轮询对应官网判断可用性。
- 图标与检测脚本复用官方源（`StashNetworks/misc` + `pengyanai/misc`），本仓库只做聚合。
