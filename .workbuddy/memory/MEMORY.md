# 项目长期记忆 — sociology-map（社会人 新闻站）

## news-validate.js 运行须知（重要，2026-07-28 更新）
- 直接用 `node news-validate.js` 会报 `navigator is not defined`；只补 navigator 后又报 `window.matchMedia is not a function`（HTML 内联脚本已新增 matchMedia 调用）。
- 解决：用临时副本，在 `sandbox.globalThis = sandbox;` 之后注入全套桩再运行、跑完删除（不要改项目原文件）：
  - `sandbox.navigator = {userAgent,language,platform,maxTouchPoints:0,standalone:false,serviceWorker:undefined}` + `sandbox.window.navigator`
  - `sandbox.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}})` + `sandbox.window.matchMedia`
  - `localStorage/sessionStorage`（getItem 返回 null）、`location`（href/search/hash/pathname）桩
- HTML 若再新增浏览器 API，报错会逐个暴露，按同样方式补桩即可。

## 失效/禁用节点 id（写入 theories/lensId 前务必避开）
- 当前 311 节点集中确认缺失：`social_work`、`social_governance`、`social_comparison`、`consumption`、`aging`、`econ_incentive`、`modernity`、`fertility`、`population`、`psy_loneliness`（以及历史上被禁的 `urbanization` 等）。
- 可用替代：`social_capital`、`family`、`work`、`alienation`、`urban`、`econ_welfare`(福利经济学)、`institutionalism`(新制度主义)、`technology`(科技社会学)、`econ_industrial_org`(产业组织)、`late_modern`、`econ_veblen`。
- 校验前用 `_node_map.json` 的 `.map` 子对象批量核对 id 是否∈节点集。
- 文案质检：AI 生成长中文文案偶发混入外文词（曾出现 первый/precisely），入库后跑一次非中文字符扫描。

## 新闻数据契约
- 数据文件 `news-data.js`：`var NEWS_DATA = { 'YYYY-MM-DD': [15 items] }`，每个日期恰好 15 条。
- S7：最多保留 7 个日期，入库新日期时须修剪最旧日期。
- 镜像目录：`D:/Users/wtianyi/ctrip-claw/`，每次更新同步 news-data.js + news-review-log.json。
- S9 前沿研究：嵌套在 interpretation.research 内，fromNode 必须∈节点集；仅 best-effort，不强制。
