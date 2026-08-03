---
name: shehui-ren-iterate
description: 「社会人」社会学知识图谱站点（shehui-ren.com）的迭代工作流。任何涉及 /Users/wangtianyi/shehui-ren 或 sociology-map.html、news-data.js、sw.js、feature-manifest.html 的改动、发版、新闻更新任务，都必须先加载本技能。涵盖开工前 Gitee 同步检查、版本三处同步规范、Netlify 部署与 403 兜底、新闻数据契约。关键词：社会人、shehui-ren、知识图谱、sociology-map、每日新闻、Netlify 部署、bump 缓存。
agent_created: true
---

# 社会人 · 站点迭代工作流

单文件 HTML + Canvas 力导向知识图谱 + 每日新闻页，Netlify 托管 shehui-ren.com，
源码在 Gitee `no-works-yet/shehui-ren`。用户在**公司 Windows + 家里 Mac 两台机器**上交替改动。

## 0. 开工前必做：同步检查（不可跳过）

用户明确要求：**每次执行任务之前，都要先确认这个文件夹已连接 Gitee 并更新到最新。**

```bash
cd /Users/wangtianyi/shehui-ren && node sync.js
```

脚本会依次检查：是否 git 仓库 → origin 是否 Gitee → 分支是否有 upstream → fetch →
报告落后/领先/未提交改动。退出码：`0` 可以开工 / `1` 需人工处理 / `2` 环境问题。

- 工作区干净且落后远程 → 脚本自动 `git pull --rebase`
- 有本地改动又落后远程 → **不自动动**，提示 stash → pull --rebase → stash pop
- 只报告不改动用 `node sync.js --check`
- 用户手动跑：Mac 双击 `sync.command`，Windows 双击 `sync.bat`

改完一轮记得 `git commit` + `git push`，否则另一台机器拿不到。

## 1. 版本号三处必须同步

改了 **HTML / CSS** 就必须同时更新这三处，否则手机端 PWA 会一直吃旧缓存：

| 位置 | 改法 |
|------|------|
| `sw.js` | `const CACHE = 'shehui-ren-vN'` → N+1 |
| `feature-manifest.html` | 顶部 `<span class="version-badge">v1.XX · YYYY-MM-DD</span>` + 底部更新日志表格加一行 |
| `README.md` | 「当前版本」那行 + 底部版本历史表 |

只改 README / 部署脚本 / 文档 → **不需要** bump 缓存。

功能版本号与缓存版本号是两套：v1.29 ↔ 缓存 v11（不对应，各自递增）。

> **`feature-manifest.html` 也是改造沟通主文件**（用户 2026-08-03 明确）：每次网站有内容更新，先把改动整理进此文件；后续改造讨论、需求反馈、改动记录**优先通过此文件交流**，而非只在聊天里口述。底部「更新日志」表每次改动在表头追加一行（日期/版本/改动内容/涉及模块）。

## 2. 代码结构要点（sociology-map.html，~350KB）

- 节点 311 个，schema 16 字段 `{id,name,en,cat,era,disc,sublabel,color,r,x,y,vx,vy,baseX,baseY,year,data}`
- `cat ∈ {thinker, theory, concept, topic}`，`disc ∈ {soc, econ, psy}`
- **连线不是单一 EDGES 数组**，分三张表：`EXTRA_CONCEPT_LINKS`(~1017) / `CONCEPT_LINKS`(~1028) /
  `THINKER_LINKS`(~1089)，运行时在 `edges = []`(~2895 / ~2976) 处组装。写校验脚本别只 grep EDGES。
- 快速体检节点重复：
  ```bash
  node -e "const s=require('fs').readFileSync('sociology-map.html','utf8');
  const ids=[...s.matchAll(/\{\s*id:\s*'([a-z0-9_]+)'\s*,\s*name:/g)].map(m=>m[1]);
  const c={};ids.forEach(i=>c[i]=(c[i]||0)+1);
  console.log(ids.length, JSON.stringify(Object.entries(c).filter(([k,v])=>v>1)));"
  ```
- 历史 `rationalization` 重名 bug 已修复（拆为 `rationalization_theory` / `rationalization_concept`）。

## 3. 部署

**发布前必须先出预览、用户验收通过后再上线**（用户 2026-08-03 明确要求，作为长期准则）。

1) 出预览（**不影响线上** shehui-ren.com，生成独立草稿 URL，不发布到生产域）：
```bash
node deploy-netlify.js --staging
```
   终端打印 `预览地址（发给用户验收）: https://xxxx.netlify.app`。把该链接发用户，
   用户在手机/电脑验收；如需调整，改完再 `--staging` 一次生成新预览（旧草稿 URL 失效）。

2) 用户确认无误后，正式发布到生产域：
```bash
node deploy-netlify.js        # 不带 --staging → 生产部署
```
   不带 `--staging` 时走生产部署；Netlify 额度耗尽自动草稿+restore 兜底上线。

- 脚本按 `process.platform` 自动探测 node 与 netlify-cli，一般无需配置；
  特殊路径用 `WB_NODE` / `WB_NETLIFY` 覆盖。
- 令牌：环境变量 `NETLIFY_AUTH_TOKEN` > 仓库根 `.netlify_token`（已 gitignore，切勿提交）。
- **Netlify 额度耗尽会让生产部署返回 403** `Account credit usage exceeded`。脚本内置兜底：
  `deploy --prod` 失败 → 草稿 `deploy --json` 取 deploy_id →
  `POST /api/v1/sites/{siteId}/deploys/{deployId}/restore` 发布为生产。restore 走回滚通道不被拦。
- Site ID：`1c681e5b-9d1b-4a63-bf84-6a79e4a62cd2`
- 干跑验证路径探测（不会真部署）：`NETLIFY_AUTH_TOKEN=dummy node deploy-netlify.js`
- **安全：`.netlifyignore` 已排除 `.netlify_token`/`.gitee_token`/`.workbuddy/`/`_*.js`/`sync.*`/`deploy-netlify.js` 等**，
  即便令牌文件在目录内也不会随发布上传；仍建议部署时把 `.netlify_token` 临时移出、改走环境变量 `NETLIFY_AUTH_TOKEN`。
- 首次在新机器上：`cd ~/.workbuddy/binaries/node/workspace && npm install netlify-cli`

## 4. 新闻数据契约

- `news-data.js`：`var NEWS_DATA = { 'YYYY-MM-DD': [ 15 条 ] }`，每个日期**恰好 15 条**
- **S7 上限**：最多保留 7 个日期，入新日期必须修剪最旧的
- 每条 `interpretation.theories` / `lensId` 里的节点 id **必须存在于 311 节点集**，
  写入前用 `_node_map.json` 的 `.map` 子对象核对
- 已确认**不存在**的 id（别用）：`social_work` `social_governance` `social_comparison`
  `consumption` `aging` `econ_incentive` `modernity` `fertility` `population` `psy_loneliness` `urbanization`
- 可用替代：`social_capital` `family` `work` `alienation` `urban` `econ_welfare`
  `institutionalism` `technology` `econ_industrial_org` `late_modern` `econ_veblen`
- 入库后跑一次非中文字符扫描（AI 生成长文案偶发混入 `первый` / `precisely` 之类外文词）
- 审核规范见 `NEWS_REVIEW_STANDARD.md`，审核留痕写 `news-review-log.json`

### news-validate.js 的坑

直接 `node news-validate.js` 会报 `navigator is not defined`，补完又报 `window.matchMedia is not a function`。
**解法：复制一份临时副本**，在 `sandbox.globalThis = sandbox;` 之后注入桩，跑完删除副本（别改原文件）：

- `sandbox.navigator = {userAgent, language, platform, maxTouchPoints:0, standalone:false, serviceWorker:undefined}` + 同步挂到 `sandbox.window.navigator`
- `sandbox.matchMedia = () => ({matches:false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}})` + `sandbox.window.matchMedia`
- `localStorage` / `sessionStorage`（`getItem` 返回 null）、`location`（href/search/hash/pathname）

HTML 若新增浏览器 API，报错会逐个暴露，按同样方式补桩。

## 5. 收尾清单

1. `node sync.js` 确认没落后（开工前）
2. 改代码
3. 改了 HTML/CSS → bump `sw.js` 缓存 + 同步 `feature-manifest.html` + README
4. `node deploy-netlify.js` 发布
5. `git add -A && git commit && git push`（否则另一台机器丢改动）
6. 写工作区记忆 `.workbuddy/memory/YYYY-MM-DD.md`
